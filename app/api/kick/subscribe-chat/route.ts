import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

export async function GET() {
  try {
    const supabaseAdmin = createSupabaseAdminClient();

    const { data: account, error: accountError } = await supabaseAdmin
      .from("user_social_accounts")
      .select("user_id, platform_username, access_token, scopes")
      .eq("platform", "kick")
      .order("verified_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (accountError || !account?.access_token) {
      return NextResponse.json(
        {
          ok: false,
          error: "kick_account_token_not_found",
          details: accountError?.message || null,
        },
        { status: 404 },
      );
    }

    const subscribePayload = {
      events: [
        {
          name: "chat.message.sent",
          version: 1,
        },
      ],
    };

    console.log("Kick subscribe payload:", JSON.stringify(subscribePayload));

    const response = await fetch(
      "https://api.kick.com/public/v1/events/subscriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${account.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscribePayload),
      },
    );

    const text = await response.text();

    console.log("Kick subscribe status:", response.status);
    console.log("Kick subscribe response:", text);

    let payload: unknown = text;

    try {
      payload = JSON.parse(text);
    } catch {
      // mantém texto bruto
    }

    return NextResponse.json(
      {
        ok: response.ok,
        status: response.status,
        kickResponse: payload,
        account: {
          user_id: account.user_id,
          platform_username: account.platform_username,
          scopes: account.scopes,
        },
      },
      { status: response.ok ? 200 : 500 },
    );
  } catch (error) {
    console.error("Kick subscribe chat unexpected error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "unexpected_error",
      },
      { status: 500 },
    );
  }
}