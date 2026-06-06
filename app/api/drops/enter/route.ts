import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type EnterDropBody = {
  dropId?: string;
  platformUsername?: string;
};

function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase admin environment variables.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function normalizeUsername(value: string) {
  return value.trim().replace(/^@/, "").toLowerCase();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as EnterDropBody;

    const dropId = String(body.dropId || "").trim();
    const platformUsername = String(body.platformUsername || "").trim();

    if (!dropId || !platformUsername) {
      return NextResponse.json(
        { error: "missing_required_fields" },
        { status: 400 },
      );
    }

    const supabaseAdmin = createSupabaseAdminClient();
    const normalizedUsername = normalizeUsername(platformUsername);

    const { data: drop, error: dropError } = await supabaseAdmin
      .from("creator_drops")
      .select("*")
      .eq("id", dropId)
      .single();

    if (dropError || !drop) {
      return NextResponse.json({ error: "drop_not_found" }, { status: 404 });
    }

    if (!drop.is_active) {
      return NextResponse.json({ error: "drop_not_active" }, { status: 409 });
    }

    if (drop.ends_at && new Date(drop.ends_at).getTime() < Date.now()) {
      await supabaseAdmin
        .from("creator_drops")
        .update({ is_active: false })
        .eq("id", drop.id);

      return NextResponse.json({ error: "drop_expired" }, { status: 409 });
    }

    const { data: linkedAccounts, error: accountError } = await supabaseAdmin
      .from("user_social_accounts")
      .select("user_id, platform_username")
      .eq("platform", "kick");

    if (accountError) {
      console.error("Drop entry account lookup error:", accountError);

      return NextResponse.json(
        { error: "linked_account_lookup_failed" },
        { status: 500 },
      );
    }

    const linkedAccount = (linkedAccounts || []).find(
      (account) =>
        normalizeUsername(String(account.platform_username || "")) ===
        normalizedUsername,
    );

    if (!linkedAccount?.user_id) {
      return NextResponse.json(
        { error: "linked_account_not_found" },
        { status: 404 },
      );
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
          message: "already_entered",
        });
      }

      console.error("Drop entry insert error:", entryError);

      return NextResponse.json(
        { error: "entry_insert_failed" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      entered: true,
      userId: linkedAccount.user_id,
      platformUsername: linkedAccount.platform_username,
    });
  } catch (error) {
    console.error("Drop entry unexpected error:", error);

    return NextResponse.json({ error: "unexpected_error" }, { status: 500 });
  }
}