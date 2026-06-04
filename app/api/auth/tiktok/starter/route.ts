import { createHmac, randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
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

function getStateSecret() {
  return process.env.TIKTOK_STATE_SECRET || tiktokClientSecret;
}

function toBase64Url(value: string | Buffer) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function signPayload(payload: string) {
  return createHmac("sha256", getStateSecret()).update(payload).digest("base64url");
}

function createSignedState(payload: TikTokStatePayload) {
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

function normalizeReturnTo(returnTo: string | null) {
  if (!returnTo) return "/";

  if (!returnTo.startsWith("/")) return "/";

  return returnTo;
}

export async function GET(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: "Supabase environment variables are not configured." },
        { status: 500 },
      );
    }

    if (!tiktokClientKey || !tiktokClientSecret || !tiktokRedirectUri) {
      return NextResponse.json(
        { error: "TikTok environment variables are not configured." },
        { status: 500 },
      );
    }

    const creatorId = request.nextUrl.searchParams.get("creatorId");
    const returnTo = normalizeReturnTo(request.nextUrl.searchParams.get("returnTo"));
    const authorizationHeader = request.headers.get("authorization") || "";
    const accessToken = authorizationHeader.replace(/^Bearer\s+/i, "").trim();

    if (!creatorId) {
      return NextResponse.json({ error: "creatorId is required." }, { status: 400 });
    }

    if (!accessToken) {
      return NextResponse.json({ error: "Authorization token is required." }, { status: 401 });
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json({ error: "User session is invalid." }, { status: 401 });
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
        .eq("id", creatorId)
        .maybeSingle(),
      supabaseAdmin
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle(),
    ]);

    const isOwner = Boolean(creator?.user_id && creator.user_id === user.id);
    const isAdmin = Boolean(accountProfile?.is_admin);

    if (!creator || (!isOwner && !isAdmin)) {
      return NextResponse.json(
        { error: "You are not allowed to connect TikTok for this creator." },
        { status: 403 },
      );
    }

    const state = createSignedState({
      creatorId,
      userId: user.id,
      returnTo,
      nonce: randomBytes(16).toString("hex"),
      iat: Date.now(),
    });

    const authorizationUrl = new URL("https://www.tiktok.com/v2/auth/authorize/");
    authorizationUrl.searchParams.set("client_key", tiktokClientKey);
    authorizationUrl.searchParams.set("scope", "user.info.basic");
    authorizationUrl.searchParams.set("response_type", "code");
    authorizationUrl.searchParams.set("redirect_uri", tiktokRedirectUri);
    authorizationUrl.searchParams.set("state", state);

    return NextResponse.json({ url: authorizationUrl.toString() });
  } catch (error) {
    console.error("TikTok start error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to start TikTok authorization.",
      },
      { status: 500 },
    );
  }
}
