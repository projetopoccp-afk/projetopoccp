import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TwitchTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string[] | string;
  token_type?: string;
  error?: string;
  message?: string;
};

type TwitchUser = {
  id?: string;
  login?: string;
  display_name?: string;
  email?: string;
};

type TwitchUsersResponse = {
  data?: TwitchUser[];
};

type TwitchSubscriptionResponse = {
  data?: Array<{
    id?: string;
    status?: string;
    type?: string;
    version?: string;
  }>;
  message?: string;
  error?: string;
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

function getTwitchRedirectUri(request: NextRequest) {
  return (
    process.env.TWITCH_REDIRECT_URI ||
    `${getSiteUrl(request)}/api/auth/twitch/callback`
  );
}

function getTwitchWebhookUrl(request: NextRequest) {
  return `${getSiteUrl(request)}/api/twitch/webhook`;
}

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function getOptionalEnv(name: string) {
  return process.env[name] || null;
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
    },
  );
}

function cleanOAuthCookies(response: NextResponse) {
  response.cookies.set("cardpoc_twitch_oauth_state", "", {
    path: "/",
    maxAge: 0,
  });
  response.cookies.set("cardpoc_twitch_oauth_code_verifier", "", {
    path: "/",
    maxAge: 0,
  });
  response.cookies.set("cardpoc_twitch_oauth_user_id", "", {
    path: "/",
    maxAge: 0,
  });
  response.cookies.set("cardpoc_twitch_oauth_return_to", "", {
    path: "/",
    maxAge: 0,
  });
}

function getSafeReturnTo(request: NextRequest) {
  const storedReturnTo = request.cookies.get(
    "cardpoc_twitch_oauth_return_to",
  )?.value;

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
  url.searchParams.set("twitch_link", status);

  if (reason) {
    url.searchParams.set("reason", reason);
  }

  const response = NextResponse.redirect(url);
  cleanOAuthCookies(response);

  return response;
}

function getScopes(scope: TwitchTokenResponse["scope"]) {
  if (Array.isArray(scope)) return scope.filter(Boolean);

  if (typeof scope === "string") {
    return scope.split(" ").filter(Boolean);
  }

  return ["user:read:email", "user:read:chat", "user:bot", "channel:bot"];
}

async function getTwitchAppAccessToken() {
  const response = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: getRequiredEnv("TWITCH_CLIENT_ID"),
      client_secret: getRequiredEnv("TWITCH_CLIENT_SECRET"),
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as TwitchTokenResponse;

  if (!response.ok || !payload.access_token) {
    console.error("Twitch app token error:", payload);
    return null;
  }

  return payload.access_token;
}

async function subscribeTwitchChatForAccount(params: {
  request: NextRequest;
  broadcasterUserId: string;
}) {
  const webhookSecret = getOptionalEnv("TWITCH_WEBHOOK_SECRET");

  if (!webhookSecret) {
    console.error("Missing TWITCH_WEBHOOK_SECRET. Twitch chat subscription skipped.");
    return;
  }

  const appAccessToken = await getTwitchAppAccessToken();

  if (!appAccessToken) return;

  const response = await fetch("https://api.twitch.tv/helix/eventsub/subscriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${appAccessToken}`,
      "Client-Id": getRequiredEnv("TWITCH_CLIENT_ID"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "channel.chat.message",
      version: "1",
      condition: {
        broadcaster_user_id: params.broadcasterUserId,
        user_id: params.broadcasterUserId,
      },
      transport: {
        method: "webhook",
        callback: getTwitchWebhookUrl(params.request),
        secret: webhookSecret,
      },
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as TwitchSubscriptionResponse;

  if (!response.ok) {
    console.error("Twitch EventSub subscribe error:", payload);
    return;
  }

  console.log("Twitch EventSub subscribe ok:", payload);
}

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code");
    const returnedState = request.nextUrl.searchParams.get("state");
    const error = request.nextUrl.searchParams.get("error");

    if (error) {
      return redirectBack(request, "error", error);
    }

    const storedState = request.cookies.get("cardpoc_twitch_oauth_state")?.value;
    const codeVerifier = request.cookies.get(
      "cardpoc_twitch_oauth_code_verifier",
    )?.value;
    const userId = request.cookies.get("cardpoc_twitch_oauth_user_id")?.value;

    if (!code || !returnedState || !storedState || !codeVerifier || !userId) {
      return redirectBack(request, "error", "missing_oauth_state");
    }

    if (returnedState !== storedState) {
      return redirectBack(request, "error", "invalid_oauth_state");
    }

    const tokenResponse = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: getRequiredEnv("TWITCH_CLIENT_ID"),
        client_secret: getRequiredEnv("TWITCH_CLIENT_SECRET"),
        redirect_uri: getTwitchRedirectUri(request),
        code,
        code_verifier: codeVerifier,
      }),
    });

    const tokenPayload = (await tokenResponse.json().catch(() => ({}))) as TwitchTokenResponse;

    if (!tokenResponse.ok || !tokenPayload.access_token) {
      console.error("Twitch token error:", tokenPayload);
      return redirectBack(request, "error", "twitch_token_exchange_failed");
    }

    const userResponse = await fetch("https://api.twitch.tv/helix/users", {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${tokenPayload.access_token}`,
        "Client-Id": getRequiredEnv("TWITCH_CLIENT_ID"),
      },
    });

    const userPayload = (await userResponse.json().catch(() => ({}))) as TwitchUsersResponse;

    if (!userResponse.ok) {
      console.error("Twitch user fetch error:", userPayload);
      return redirectBack(request, "error", "twitch_user_fetch_failed");
    }

    const twitchUser = userPayload.data?.[0] || null;
    const twitchUserId = twitchUser?.id;
    const twitchUsername = twitchUser?.display_name || twitchUser?.login;

    if (!twitchUserId || !twitchUsername) {
      console.error("Twitch user payload without required identity:", userPayload);
      return redirectBack(request, "error", "twitch_user_identity_missing");
    }

    const expiresAt = tokenPayload.expires_in
      ? new Date(Date.now() + tokenPayload.expires_in * 1000).toISOString()
      : null;

    const scopes = getScopes(tokenPayload.scope);

    const supabase = createSupabaseServiceClient();
    const { error: upsertError } = await supabase
      .from("user_social_accounts")
      .upsert(
        {
          user_id: userId,
          platform: "twitch",
          platform_user_id: String(twitchUserId),
          platform_username: String(twitchUsername),
          access_token: tokenPayload.access_token,
          refresh_token: tokenPayload.refresh_token ?? null,
          token_expires_at: expiresAt,
          scopes,
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,platform",
        },
      );

    if (upsertError) {
      console.error("Supabase Twitch social account upsert error:", upsertError);
      return redirectBack(request, "error", "database_save_failed");
    }

    await subscribeTwitchChatForAccount({
      request,
      broadcasterUserId: String(twitchUserId),
    });

    return redirectBack(request, "success");
  } catch (error) {
    console.error("Twitch OAuth callback error:", error);
    return redirectBack(request, "error", "twitch_oauth_callback_failed");
  }
}
