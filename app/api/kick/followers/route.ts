import { NextRequest, NextResponse } from "next/server";

type KickFollowerGoal = {
  id?: number | string;
  type?: string;
  current_value?: number | string | null;
  target_value?: number | string | null;
  title?: string | null;
  description?: string | null;
};

type KickFollowersDebug = {
  username: string;
  url?: string;
  status?: number;
  ok?: boolean;
  contentType?: string | null;
  bodyPreview?: string;
  parsedGoals?: KickFollowerGoal[];
  selectedGoal?: KickFollowerGoal | null;
  error?: string;
};

function normalizeKickUsername(username: string) {
  const value = username.trim();

  if (!value) return "";

  try {
    const url = value.startsWith("http")
      ? new URL(value)
      : new URL(`https://${value}`);

    if (url.hostname.includes("kick.com")) {
      const slug = url.pathname.split("/").filter(Boolean)[0];
      return (slug || "").replace(/^@/, "").toLowerCase();
    }
  } catch {
    // Continua com normalização manual abaixo.
  }

  return value
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/^kick\.com\//i, "")
    .replace(/^@/, "")
    .split("?")[0]
    .split("#")[0]
    .split("/")[0]
    .trim()
    .toLowerCase();
}

function toPositiveInteger(value: unknown) {
  if (value === null || value === undefined || value === "") return undefined;

  if (typeof value === "string") {
    const normalized = value.replace(/[^\d]/g, "");
    if (!normalized) return undefined;

    const parsed = Number(normalized);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : undefined;
}

function extractGoals(payload: unknown): KickFollowerGoal[] {
  if (!payload || typeof payload !== "object") return [];

  const root = payload as Record<string, unknown>;

  const candidates = [
    root.data,
    root.goals,
    root.channel_goals,
    root.result,
    payload,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter(
        (item): item is KickFollowerGoal =>
          !!item && typeof item === "object",
      );
    }

    if (candidate && typeof candidate === "object") {
      const nested = candidate as Record<string, unknown>;

      if (Array.isArray(nested.data)) {
        return nested.data.filter(
          (item): item is KickFollowerGoal =>
            !!item && typeof item === "object",
        );
      }

      if (Array.isArray(nested.goals)) {
        return nested.goals.filter(
          (item): item is KickFollowerGoal =>
            !!item && typeof item === "object",
        );
      }
    }
  }

  return [];
}

function isFollowerGoal(goal: KickFollowerGoal) {
  const type = String(goal.type || "").toLowerCase().trim();
  const title = String(goal.title || "").toLowerCase();
  const description = String(goal.description || "").toLowerCase();

  return (
    type === "followers" ||
    type === "follower" ||
    title.includes("followers") ||
    title.includes("seguidores") ||
    description.includes("followers") ||
    description.includes("seguidores")
  );
}

function extractKickFollowerCountFromGoals(payload: unknown) {
  const goals = extractGoals(payload);
  const followerGoal = goals.find(isFollowerGoal);

  if (!followerGoal) {
    return {
      followerCount: undefined,
      goals,
      selectedGoal: null,
    };
  }

  return {
    followerCount: toPositiveInteger(followerGoal.current_value),
    goals,
    selectedGoal: followerGoal,
  };
}

async function fetchKickGoals(username: string) {
  const url = `https://kick.com/api/v2/channels/${encodeURIComponent(username)}/goals`;

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
      Referer: `https://kick.com/${encodeURIComponent(username)}`,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
    },
  });

  const text = await response.text();
  let data: unknown = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  return {
    url,
    response,
    text,
    data,
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const rawUsername = searchParams.get("username") || searchParams.get("channel") || "";
  const debugEnabled = searchParams.get("debug") === "1";
  const username = normalizeKickUsername(rawUsername);

  if (!username) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing username",
      },
      { status: 400 },
    );
  }

  const debug: KickFollowersDebug = { username };

  try {
    const { url, response, text, data } = await fetchKickGoals(username);
    const { followerCount, goals, selectedGoal } =
      extractKickFollowerCountFromGoals(data);

    debug.url = url;
    debug.status = response.status;
    debug.ok = response.ok;
    debug.contentType = response.headers.get("content-type");
    debug.bodyPreview = text.slice(0, 600);
    debug.parsedGoals = goals;
    debug.selectedGoal = selectedGoal;

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          username,
          followerCount: null,
          source: "kick-goals",
          error: `Kick goals request failed with ${response.status}`,
          ...(debugEnabled ? { debug } : {}),
        },
        { status: 200 },
      );
    }

    if (!followerCount) {
      return NextResponse.json({
        ok: true,
        username,
        followerCount: null,
        source: "kick-goals",
        note: "No followers goal found. Not using subscribers, viewers, targets, or external counters as fallback.",
        ...(debugEnabled ? { debug } : {}),
      });
    }

    return NextResponse.json({
      ok: true,
      username,
      followerCount,
      source: "kick-goals",
      ...(debugEnabled ? { debug } : {}),
    });
  } catch (error) {
    debug.error = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        ok: false,
        username,
        followerCount: null,
        source: "kick-goals",
        error: "Unexpected error while reading Kick followers",
        ...(debugEnabled ? { debug } : {}),
      },
      { status: 200 },
    );
  }
}
