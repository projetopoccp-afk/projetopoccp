import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const MYTHIC_RARITY = "mythic";

function getBearerToken(request: NextRequest) {
  const header = request.headers.get("authorization") || "";
  const [type, token] = header.split(" ");

  if (type?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

export async function POST(request: NextRequest) {
  try {
    const accessToken = getBearerToken(request);

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Supabase environment variables are missing" },
        { status: 500 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      completedCreatorIds?: unknown;
    };

    const completedCreatorIds = Array.isArray(body.completedCreatorIds)
      ? Array.from(
          new Set(
            body.completedCreatorIds
              .map((creatorId) => String(creatorId || "").trim())
              .filter(Boolean),
          ),
        )
      : [];

    if (completedCreatorIds.length === 0) {
      return NextResponse.json({ rewards: [] });
    }

    const { data: existingRewards, error: existingError } = await supabase
      .from("user_cards")
      .select("id,creator_id,seen_at")
      .eq("user_id", user.id)
      .eq("rarity", MYTHIC_RARITY)
      .in("creator_id", completedCreatorIds);

    if (existingError) {
      return NextResponse.json(
        { error: "Failed to check existing mythic rewards" },
        { status: 500 },
      );
    }

    const existingCreatorIds = new Set(
      (existingRewards ?? []).map((reward) => String(reward.creator_id)),
    );

    const missingCreatorIds = completedCreatorIds.filter(
      (creatorId) => !existingCreatorIds.has(creatorId),
    );

    let insertedRewards: Array<{
      id: string;
      creator_id: string;
      seen_at: string | null;
    }> = [];

    if (missingCreatorIds.length > 0) {
      const rowsToInsert = missingCreatorIds.map((creatorId) => ({
        user_id: user.id,
        creator_id: creatorId,
        rarity: MYTHIC_RARITY,
        source: "album_completion",
      }));

      const { data: insertedData, error: insertError } = await supabase
        .from("user_cards")
        .insert(rowsToInsert)
        .select("id,creator_id,seen_at");

      if (insertError) {
        return NextResponse.json(
          { error: "Failed to create mythic rewards" },
          { status: 500 },
        );
      }

      insertedRewards = insertedData ?? [];
    }

    return NextResponse.json({
      rewards: [...(existingRewards ?? []), ...insertedRewards],
    });
  } catch (error) {
    console.error("Unexpected album mythic reward error", error);
    return NextResponse.json(
      { error: "Unexpected album mythic reward error" },
      { status: 500 },
    );
  }
}
