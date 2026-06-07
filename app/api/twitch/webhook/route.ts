import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TwitchChatMessageEvent = {
  broadcaster_user_id?: string;
  broadcaster_user_login?: string;
  broadcaster_user_name?: string;
  chatter_user_id?: string;
  chatter_user_login?: string;
  chatter_user_name?: string;
  message?: {
    text?: string;
  };
};

type TwitchWebhookPayload = {
  challenge?: string;
  subscription?: {
    id?: string;
    type?: string;
    status?: string;
  };
  event?: TwitchChatMessageEvent;
};

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

function normalize(value: unknown) {
  return String(value || "").trim();
}

function normalizeUsername(value: unknown) {
  return normalize(value).replace(/^@/, "").toLowerCase();
}

function verifyTwitchSignature(request: NextRequest, rawBody: string) {
  const secret = process.env.TWITCH_WEBHOOK_SECRET;

  if (!secret) {
    console.error("Missing TWITCH_WEBHOOK_SECRET.");
    return false;
  }

  const messageId = request.headers.get("twitch-eventsub-message-id") || "";
  const timestamp = request.headers.get("twitch-eventsub-message-timestamp") || "";
  const signature = request.headers.get("twitch-eventsub-message-signature") || "";

  if (!messageId || !timestamp || !signature) return false;

  const expectedSignature = `sha256=${createHmac("sha256", secret)
    .update(messageId + timestamp + rawBody)
    .digest("hex")}`;

  const expectedBuffer = Buffer.from(expectedSignature);
  const receivedBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== receivedBuffer.length) return false;

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

async function findLinkedTwitchAccount(params: {
  supabaseAdmin: ReturnType<typeof createSupabaseAdminClient>;
  twitchUserId?: string;
  twitchUsername?: string;
}) {
  const { supabaseAdmin, twitchUserId, twitchUsername } = params;

  if (twitchUserId) {
    const { data, error } = await supabaseAdmin
      .from("user_social_accounts")
      .select("user_id, platform_username, platform_user_id")
      .eq("platform", "twitch")
      .eq("platform_user_id", twitchUserId)
      .maybeSingle();

    if (error) {
      console.error("Twitch webhook account lookup by id error:", error);
    }

    if (data?.user_id) return data;
  }

  const normalizedUsername = normalizeUsername(twitchUsername);

  if (!normalizedUsername) return null;

  const { data, error } = await supabaseAdmin
    .from("user_social_accounts")
    .select("user_id, platform_username, platform_user_id")
    .eq("platform", "twitch");

  if (error) {
    console.error("Twitch webhook account lookup error:", error);
    return null;
  }

  return (data || []).find(
    (account) =>
      normalizeUsername(account.platform_username) === normalizedUsername,
  ) || null;
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "twitch-webhook-online",
  });
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();

    if (!verifyTwitchSignature(request, rawBody)) {
      return NextResponse.json({ error: "invalid_signature" }, { status: 403 });
    }

    const payload = JSON.parse(rawBody) as TwitchWebhookPayload;
    const messageType = request.headers.get("twitch-eventsub-message-type") || "";

    if (messageType === "webhook_callback_verification") {
      return new NextResponse(payload.challenge || "", {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }

    if (messageType === "revocation") {
      console.warn("Twitch EventSub subscription revoked:", JSON.stringify(payload));
      return NextResponse.json({ ok: true, revoked: true });
    }

    if (messageType !== "notification") {
      return NextResponse.json({ ok: true, ignored: "unsupported_message_type" });
    }

    if (payload.subscription?.type !== "channel.chat.message") {
      return NextResponse.json({ ok: true, ignored: "unsupported_event_type" });
    }

    const event = payload.event || {};
    const message = normalize(event.message?.text);

    if (message.toUpperCase() !== "CARDPOC") {
      return NextResponse.json({ ok: true, ignored: "keyword_mismatch" });
    }

    const supabaseAdmin = createSupabaseAdminClient();
    const linkedAccount = await findLinkedTwitchAccount({
      supabaseAdmin,
      twitchUserId: event.chatter_user_id,
      twitchUsername: event.chatter_user_login || event.chatter_user_name,
    });

    if (!linkedAccount?.user_id) {
      return NextResponse.json({
        ok: true,
        ignored: "twitch_account_not_linked",
        username: event.chatter_user_login || event.chatter_user_name,
      });
    }

    const nowIso = new Date().toISOString();

    const { data: activeDrops, error: dropError } = await supabaseAdmin
      .from("creator_drops")
      .select("id, keyword, is_active, starts_at, ends_at")
      .eq("is_active", true)
      .lte("starts_at", nowIso)
      .gte("ends_at", nowIso)
      .ilike("keyword", "CARDPOC")
      .order("created_at", { ascending: false })
      .limit(1);

    if (dropError) {
      console.error("Twitch webhook active drop lookup error:", dropError);
      return NextResponse.json(
        { error: "active_drop_lookup_failed" },
        { status: 500 },
      );
    }

    const drop = activeDrops?.[0];

    if (!drop?.id) {
      return NextResponse.json({
        ok: true,
        ignored: "no_active_drop",
      });
    }

    const { error: entryError } = await supabaseAdmin
      .from("drop_entries")
      .insert({
        drop_id: drop.id,
        user_id: linkedAccount.user_id,
        platform: "twitch",
        platform_username:
          linkedAccount.platform_username ||
          event.chatter_user_name ||
          event.chatter_user_login ||
          "Twitch",
      });

    if (entryError) {
      if (entryError.code === "23505") {
        return NextResponse.json({
          ok: true,
          alreadyEntered: true,
          username: linkedAccount.platform_username,
          dropId: drop.id,
        });
      }

      console.error("Twitch webhook entry insert error:", entryError);

      return NextResponse.json(
        { error: "entry_insert_failed" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      entered: true,
      platform: "twitch",
      username: linkedAccount.platform_username,
      dropId: drop.id,
    });
  } catch (error) {
    console.error("Twitch webhook unexpected error:", error);

    return NextResponse.json(
      { error: "unexpected_error" },
      { status: 500 },
    );
  }
}
