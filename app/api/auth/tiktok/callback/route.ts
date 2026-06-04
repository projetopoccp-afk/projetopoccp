import { createHmac } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const tiktokClientKey = process.env.TIKTOK_CLIENT_KEY!;
const tiktokClientSecret = process.env.TIKTOK_CLIENT_SECRET!;
const tiktokRedirectUri =
  process.env.TIKTOK_REDIRECT_URI ||
  "https://www.cardpoc.com/api/auth/tiktok/callback";

type TikTokStatePayload = {
  creatorId: string;
  userId: string;
  returnTo: string;
  nonce: string;
  iat: number;
};

type TikTokTokenResponse = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  refresh_expires_in?: number;
  open_id?: string;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
};

type TikTokUserInfoResponse = {
  data?: {
    user?: {
      open_id?: string;
      union_id?: string;
      avatar_url?: string;
      display_name?: string;
    };
  };
  error?: {
    code?: string;
    message?: string;
    log_id?: string;
  };
};

function getStateSecret() {
  return process.env.TIKTOK_STATE_SECRET || tiktokClientSecret;
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );

  return Buffer.from(padded, "base64").toString("utf8");
}

function signPayload(payload: string) {
  return createHmac("sha256", getStateSecret()).update(payload).digest("base64url");
}

function verifySignedState(state: string): TikTokStatePayload {
  const [payload, signature] = state.split(".");

  if (!payload || !signature) {
    throw new Error("Invalid TikTok state.");
  }

  const expectedSignature = signPayload(payload);

  if (signature !== expectedSignature) {
    throw new Error("Invalid TikTok state signature.");
  }

  const parsed = JSON.parse(fromBase64Url(payload)) as TikTokStatePayload;

  if (!parsed.creatorId || !parsed.userId || !parsed.returnTo || !parsed.iat) {
    throw new Error("Invalid TikTok state payload.");
  }

  const maxAgeMs = 10 * 60 * 1000;

  if (Date.now() - parsed.iat > maxAgeMs) {
    throw new Error("TikTok authorization expired. Try connecting again.");
  }

  if (!parsed.returnTo.startsWith("/")) {
    parsed.returnTo = "/";
  }

  return parsed;
}

function redirectWithStatus(request: NextRequest, returnTo: string, status: "connected" | "error", message?: string) {
  const redirectUrl = new URL(returnTo, request.nextUrl.origin);
  redirectUrl.searchParams.set("tiktok", status);

  if (message) {
    redirectUrl.searchParams.set("message", message);
  }

  return NextResponse.redirect(redirectUrl);
}

function addSeconds(seconds: number | undefined) {
  if (!seconds) return null;

  return new Date(Date.now() + seconds * 1000).toISOString();
}

export async function GET(request: NextRequest) {
  let safeReturnTo = "/";

  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return redirectWithStatus(
        request,
        safeReturnTo,
        "error",
        "Supabase environment variables are not configured.",
      );
    }

    if (!tiktokClientKey || !tiktokClientSecret || !tiktokRedirectUri) {
      return redirectWithStatus(
        request,
        safeReturnTo,
        "error",
        "TikTok environment variables are not configured.",
      );
    }

    const error = request.nextUrl.searchParams.get("error");
    const errorDescription = request.nextUrl.searchParams.get("error_description");
    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");

    if (error) {
      return redirectWithStatus(
        request,
        safeReturnTo,
        "error",
        errorDescription || error,
      );
    }

    if (!code || !state) {
      return redirectWithStatus(
        request,
        safeReturnTo,
        "error",
        "TikTok authorization code or state is missing.",
      );
    }

    const parsedState = verifySignedState(state);
    safeReturnTo = parsedState.returnTo;

    const tokenResponse = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_key: tiktokClientKey,
        client_secret: tiktokClientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: tiktokRedirectUri,
      }),
      cache: "no-store",
    });

    const tokenData = (await tokenResponse.json()) as TikTokTokenResponse;

    if (!tokenResponse.ok || !tokenData.access_token) {
      throw new Error(
        tokenData.error_description ||
          tokenData.error ||
          "Unable to exchange TikTok authorization code.",
      );
    }

    const userInfoResponse = await fetch(
      "https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
        cache: "no-store",
      },
    );

    const userInfoData = (await userInfoResponse.json()) as TikTokUserInfoResponse;

    if (!userInfoResponse.ok || userInfoData.error?.code) {
      throw new Error(
        userInfoData.error?.message || "Unable to load TikTok user information.",
      );
    }

    const tiktokUser = userInfoData.data?.user;
    const platformUserId = tiktokUser?.open_id || tokenData.open_id;

    if (!platformUserId) {
      throw new Error("TikTok did not return an open_id.");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const [{ data: creator }, { data: accountProfile }] = await Promise.all([
      supabaseAdmin
        .from("creator_profiles")
        .select("id, user_id")
        .eq("id", parsedState.creatorId)
        .maybeSingle(),
      supabaseAdmin
        .from("profiles")
        .select("is_admin")
        .eq("id", parsedState.userId)
        .maybeSingle(),
    ]);

    const isOwner = Boolean(creator?.user_id && creator.user_id === parsedState.userId);
    const isAdmin = Boolean(accountProfile?.is_admin);

    if (!creator || (!isOwner && !isAdmin)) {
      throw new Error("You are not allowed to connect TikTok for this creator.");
    }

    const { error: upsertError } = await supabaseAdmin
      .from("creator_social_connections")
      .upsert(
        {
          creator_id: parsedState.creatorId,
          user_id: parsedState.userId,
          platform: "tiktok",
          platform_user_id: platformUserId,
          platform_username: null,
          display_name: tiktokUser?.display_name || null,
          avatar_url: tiktokUser?.avatar_url || null,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || null,
          scope: tokenData.scope || "user.info.basic",
          token_expires_at: addSeconds(tokenData.expires_in),
          refresh_token_expires_at: addSeconds(tokenData.refresh_expires_in),
          metadata: {
            union_id: tiktokUser?.union_id || null,
            token_type: tokenData.token_type || null,
          },
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "creator_id,platform",
        },
      );

    if (upsertError) {
      throw new Error(upsertError.message);
    }

    return redirectWithStatus(request, safeReturnTo, "connected");
  } catch (error) {
    console.error("TikTok callback error:", error);

    return redirectWithStatus(
      request,
      safeReturnTo,
      "error",
      error instanceof Error
        ? error.message
        : "Unable to connect TikTok account.",
    );
  }
}
