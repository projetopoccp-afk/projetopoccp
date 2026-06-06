import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type KickTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
};

type KickUser = {
  user_id?: number | string;
  id?: number | string;
  streamer_id?: number | string;
  name?: string;
  username?: string;
  slug?: string;
  email?: string;
};

type KickUsersResponse = {
  data?: KickUser[] | KickUser;
  user?: KickUser;
};

function getSiteUrl(request: NextRequest) {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL;

  if (configuredUrl) {
    return configuredUrl.startsWith("http")
      ? configuredUrl.replace(/\/$/, "")
      : `https://${configuredUrl.replace(/\/$/, "")}`;
  }

  return request.nextUrl.origin;
}

function getKickRedirectUri(request: NextRequest) {
  return (
    process.env.KICK_REDIRECT_URI ||
    `${getSiteUrl(request)}/api/auth/kick/callback`
  );
}

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function createSupabaseServiceClient() {
  return createClient(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

function cleanOAuthCookies(response: NextResponse) {
  response.cookies.set("cardpoc_kick_oauth_state", "", {
    path: "/",
    maxAge: 0,
  });
  response.cookies.set("cardpoc_kick_oauth_code_verifier", "", {
    path: "/",
    maxAge: 0,
  });
  response.cookies.set("cardpoc_kick_oauth_user_id", "", {
    path: "/",
    maxAge: 0,
  });
  response.cookies.set("cardpoc_kick_oauth_return_to", "", {
    path: "/",
    maxAge: 0,
  });
}

function getSafeReturnTo(request: NextRequest) {
  const storedReturnTo = request.cookies.get("cardpoc_kick_oauth_return_to")?.value;

  if (!storedReturnTo) return "/";
  if (!storedReturnTo.startsWith("/")) return "/";
  if (storedReturnTo.startsWith("//")) return "/";

  return storedReturnTo;
}

function redirectBack(
  request: NextRequest,
  status: "success" | "error",
  reason?: string,
) {
  const url = new URL(getSafeReturnTo(request), getSiteUrl(request));
  url.searchParams.set("kick_link", status);

  if (reason) {
    url.searchParams.set("reason", reason);
  }

  const response = NextResponse.redirect(url);
  cleanOAuthCookies(response);

  return response;
}

function pickKickUser(payload: KickUsersResponse): KickUser | null {
  if (Array.isArray(payload.data)) return payload.data[0] || null;
  if (payload.data && !Array.isArray(payload.data)) return payload.data;
  if (payload.user) return payload.user;

  return null;
}

function getKickUserId(user: KickUser) {
  return user.user_id ?? user.id ?? user.streamer_id;
}

function getKickUsername(user: KickUser) {
  return user.username ?? user.name ?? user.slug;
}

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code");
    const returnedState = request.nextUrl.searchParams.get("state");
    const error = request.nextUrl.searchParams.get("error");

    if (error) {
      return redirectBack(request, "error", error);
    }

    const storedState = request.cookies.get("cardpoc_kick_oauth_state")?.value;
    const codeVerifier = request.cookies.get(
      "cardpoc_kick_oauth_code_verifier"
    )?.value;
    const userId = request.cookies.get("cardpoc_kick_oauth_user_id")?.value;

    if (!code || !returnedState || !storedState || !codeVerifier || !userId) {
      return redirectBack(request, "error", "missing_oauth_state");
    }

    if (returnedState !== storedState) {
      return redirectBack(request, "error", "invalid_oauth_state");
    }

    const tokenResponse = await fetch("https://id.kick.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: getRequiredEnv("KICK_CLIENT_ID"),
        client_secret: getRequiredEnv("KICK_CLIENT_SECRET"),
        redirect_uri: getKickRedirectUri(request),
        code,
        code_verifier: codeVerifier,
      }),
    });

    const tokenPayload = (await tokenResponse.json().catch(() => ({}))) as KickTokenResponse;

    if (!tokenResponse.ok || !tokenPayload.access_token) {
      console.error("Kick token error:", tokenPayload);
      return redirectBack(request, "error", "kick_token_exchange_failed");
    }

    const userResponse = await fetch("https://api.kick.com/public/v1/users", {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${tokenPayload.access_token}`,
      },
    });

    const userPayload = (await userResponse.json().catch(() => ({}))) as KickUsersResponse;

    if (!userResponse.ok) {
      console.error("Kick user fetch error:", userPayload);
      return redirectBack(request, "error", "kick_user_fetch_failed");
    }

    const kickUser = pickKickUser(userPayload);
    const kickUserId = kickUser ? getKickUserId(kickUser) : null;
    const kickUsername = kickUser ? getKickUsername(kickUser) : null;

    if (!kickUserId || !kickUsername) {
      console.error("Kick user payload without required identity:", userPayload);
      return redirectBack(request, "error", "kick_user_identity_missing");
    }

    const expiresAt = tokenPayload.expires_in
      ? new Date(Date.now() + tokenPayload.expires_in * 1000).toISOString()
      : null;

    const scopes = tokenPayload.scope
      ? tokenPayload.scope.split(" ").filter(Boolean)
      : ["user:read", "channel:read", "events:subscribe"];

    const supabase = createSupabaseServiceClient();
    const { error: upsertError } = await supabase
      .from("user_social_accounts")
      .upsert(
        {
          user_id: userId,
          platform: "kick",
          platform_user_id: String(kickUserId),
          platform_username: String(kickUsername),
          access_token: tokenPayload.access_token,
          refresh_token: tokenPayload.refresh_token ?? null,
          token_expires_at: expiresAt,
          scopes,
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,platform",
        }
      );

    if (upsertError) {
      console.error("Supabase social account upsert error:", upsertError);
      return redirectBack(request, "error", "database_save_failed");
    }

    return redirectBack(request, "success");
  } catch (error) {
    console.error("Kick OAuth callback error:", error);
    return redirectBack(request, "error", "kick_oauth_callback_failed");
  }
}
