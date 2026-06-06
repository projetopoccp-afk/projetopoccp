import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase admin environment variables.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function normalize(value: unknown) {
  return String(value || "").trim();
}

function normalizeUsername(value: unknown) {
  return normalize(value).replace(/^@/, "").toLowerCase();
}

function findDeepValue(payload: any, keys: string[]): string {
  const stack = [payload];

  while (stack.length) {
    const item = stack.pop();

    if (!item || typeof item !== "object") continue;

    for (const key of keys) {
      if (typeof item[key] === "string" || typeof item[key] === "number") {
        return String(item[key]);
      }
    }

    for (const value of Object.values(item)) {
      if (value && typeof value === "object") stack.push(value);
    }
  }

  return "";
}

export async function GET() {
  return Response.json({
    ok: true,
    route: "kick-webhook-online",
  });
}

console.log("KICK WEBHOOK POST RECEIVED");

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const supabaseAdmin = createSupabaseAdminClient();

    console.log("Kick webhook payload:", JSON.stringify(payload));

    const eventType = normalize(
      payload?.event ||
        payload?.type ||
        payload?.event_type ||
        payload?.data?.event ||
        payload?.data?.type,
    );

    const message = findDeepValue(payload, [
      "message",
      "content",
      "text",
      "body",
    ]);

    const username = findDeepValue(payload, [
      "username",
      "user_name",
      "sender_username",
      "slug",
      "name",
    ]);

    if (!eventType.includes("chat") && !message) {
      return NextResponse.json({ ok: true, ignored: "not_chat_event" });
    }

    if (normalize(message).toUpperCase() !== "CARDPOC") {
      return NextResponse.json({ ok: true, ignored: "keyword_mismatch" });
    }

    const normalizedUsername = normalizeUsername(username);

    if (!normalizedUsername) {
      return NextResponse.json(
        { error: "missing_chat_username" },
        { status: 400 },
      );
    }

    const { data: linkedAccounts, error: accountError } = await supabaseAdmin
      .from("user_social_accounts")
      .select("user_id, platform_username")
      .eq("platform", "kick");

    if (accountError) {
      console.error("Kick webhook account lookup error:", accountError);
      return NextResponse.json(
        { error: "linked_account_lookup_failed" },
        { status: 500 },
      );
    }

    const linkedAccount = (linkedAccounts || []).find(
      (account) =>
        normalizeUsername(account.platform_username) === normalizedUsername,
    );

    if (!linkedAccount?.user_id) {
      return NextResponse.json({
        ok: true,
        ignored: "kick_account_not_linked",
        username,
      });
    }

    const nowIso = new Date().toISOString();

    const { data: activeDrops, error: dropError } = await supabaseAdmin
      .from("creator_drops")
      .select("id, keyword, is_active, starts_at, ends_at")
      .eq("platform", "kick")
      .eq("is_active", true)
      .lte("starts_at", nowIso)
      .gte("ends_at", nowIso)
      .ilike("keyword", "CARDPOC")
      .order("created_at", { ascending: false })
      .limit(1);

    if (dropError) {
      console.error("Kick webhook active drop lookup error:", dropError);
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
        platform: "kick",
        platform_username: linkedAccount.platform_username,
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

      console.error("Kick webhook entry insert error:", entryError);

      return NextResponse.json(
        { error: "entry_insert_failed" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      entered: true,
      username: linkedAccount.platform_username,
      dropId: drop.id,
    });
  } catch (error) {
    console.error("Kick webhook unexpected error:", error);

    return NextResponse.json(
      { error: "unexpected_error" },
      { status: 500 },
    );
  }
}