import { createHash, randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StartKickOAuthBody = {
  accessToken?: string;
};

function base64Url(buffer: Buffer) {
  return buffer
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

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

function createSupabaseAnonClient() {
  return createClient(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as StartKickOAuthBody;
    const accessToken = body.accessToken;

    if (!accessToken) {
      return NextResponse.json(
        { error: "missing_supabase_access_token" },
        { status: 401 }
      );
    }

    const supabase = createSupabaseAnonClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json(
        { error: "invalid_supabase_session" },
        { status: 401 }
      );
    }

    const kickClientId = getRequiredEnv("KICK_CLIENT_ID");
    const redirectUri = getKickRedirectUri(request);
    const state = base64Url(randomBytes(32));
    const codeVerifier = base64Url(randomBytes(64));
    const codeChallenge = base64Url(
      createHash("sha256").update(codeVerifier).digest()
    );

    const authorizeUrl = new URL("https://id.kick.com/oauth/authorize");
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("client_id", kickClientId);
    authorizeUrl.searchParams.set("redirect_uri", redirectUri);
    authorizeUrl.searchParams.set("scope", "user:read");
    authorizeUrl.searchParams.set("state", state);
    authorizeUrl.searchParams.set("code_challenge", codeChallenge);
    authorizeUrl.searchParams.set("code_challenge_method", "S256");

    const response = NextResponse.json({ url: authorizeUrl.toString() });
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 60 * 10,
    };

    response.cookies.set("cardpoc_kick_oauth_state", state, cookieOptions);
    response.cookies.set(
      "cardpoc_kick_oauth_code_verifier",
      codeVerifier,
      cookieOptions
    );
    response.cookies.set("cardpoc_kick_oauth_user_id", user.id, cookieOptions);

    return response;
  } catch (error) {
    console.error("Kick OAuth start error:", error);

    return NextResponse.json(
      { error: "kick_oauth_start_failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "method_not_allowed_use_post" },
    { status: 405 }
  );
}
