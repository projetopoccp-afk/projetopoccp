import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TwitchAccount = {
  user_id: string;
  platform_user_id: string | null;
  platform_username: string | null;
  scopes: string[] | null;
};

type TwitchTokenResponse = {
  access_token?: string;
  expires_in?: number;
  token_type?: string;
  error?: string;
  message?: string;
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

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function createSupabaseAdminClient() {
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
    throw new Error(payload.message || payload.error || "twitch_app_token_failed");
  }

  return payload.access_token;
}

export async function GET(request: NextRequest) {
  try {
    const webhookSecret = process.env.TWITCH_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return NextResponse.json(
        { ok: false, error: "missing_twitch_webhook_secret" },
        { status: 500 },
      );
    }

    const supabaseAdmin = createSupabaseAdminClient();
    const { data: accounts, error: accountError } = await supabaseAdmin
      .from("user_social_accounts")
      .select("user_id, platform_user_id, platform_username, scopes")
      .eq("platform", "twitch")
      .order("verified_at", { ascending: false });

    if (accountError) {
      return NextResponse.json(
        {
          ok: false,
          error: "twitch_account_lookup_failed",
          details: accountError.message,
        },
        { status: 500 },
      );
    }

    const appAccessToken = await getTwitchAppAccessToken();
    const callback = `${getSiteUrl(request)}/api/twitch/webhook`;
    const results: Array<{
      user_id: string;
      platform_username: string | null;
      ok: boolean;
      status?: number;
      response?: unknown;
      skipped?: string;
    }> = [];

    for (const account of (accounts || []) as TwitchAccount[]) {
      if (!account.platform_user_id) {
        results.push({
          user_id: account.user_id,
          platform_username: account.platform_username,
          ok: false,
          skipped: "missing_platform_user_id",
        });
        continue;
      }

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
            broadcaster_user_id: account.platform_user_id,
            user_id: account.platform_user_id,
          },
          transport: {
            method: "webhook",
            callback,
            secret: webhookSecret,
          },
        }),
      });

      const text = await response.text();
      let payload: unknown = text;

      try {
        payload = JSON.parse(text);
      } catch {
        // mantém texto bruto
      }

      results.push({
        user_id: account.user_id,
        platform_username: account.platform_username,
        ok: response.ok,
        status: response.status,
        response: payload,
      });
    }

    return NextResponse.json({
      ok: true,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error("Twitch subscribe chat unexpected error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "unexpected_error",
      },
      { status: 500 },
    );
  }
}
