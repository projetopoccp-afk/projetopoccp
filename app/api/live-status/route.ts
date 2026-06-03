import { NextRequest, NextResponse } from "next/server";

type LiveStatusResponse = {
  platform: "twitch" | "kick";
  username: string;
  isLive: boolean;
  title?: string;
  viewerCount?: number;
  gameName?: string;
  startedAt?: string;
  thumbnail?: string;
  url: string;
};

async function getTwitchAccessToken() {
  const response = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.TWITCH_CLIENT_ID!,
      client_secret: process.env.TWITCH_CLIENT_SECRET!,
      grant_type: "client_credentials",
    }),
  });

  const data = await response.json();

  return data.access_token;
}

async function getKickAccessToken() {
  const response = await fetch("https://id.kick.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.KICK_CLIENT_ID!,
      client_secret: process.env.KICK_CLIENT_SECRET!,
      grant_type: "client_credentials",
    }),
  });

  const data = await response.json();

  return data.access_token;
}

async function getTwitchLiveStatus(
  username: string
): Promise<LiveStatusResponse> {
  const accessToken = await getTwitchAccessToken();

  const twitchResponse = await fetch(
    `https://api.twitch.tv/helix/streams?user_login=${username}`,
    {
      headers: {
        "Client-Id": process.env.TWITCH_CLIENT_ID!,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  const twitchData = await twitchResponse.json();
  const stream = twitchData.data?.[0];

  if (!stream) {
    return {
      platform: "twitch",
      username,
      isLive: false,
      url: `https://twitch.tv/${username}`,
    };
  }

  return {
    platform: "twitch",
    username,
    isLive: true,
    title: stream.title,
    viewerCount: stream.viewer_count,
    gameName: stream.game_name,
    startedAt: stream.started_at,
    thumbnail: stream.thumbnail_url,
    url: `https://twitch.tv/${username}`,
  };
}

async function getKickLiveStatus(
  username: string
): Promise<LiveStatusResponse> {
  const accessToken = await getKickAccessToken();

  const kickResponse = await fetch(
    `https://api.kick.com/public/v1/channels?slug=${encodeURIComponent(
      username
    )}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  const kickData = await kickResponse.json();
  const channel = kickData.data?.[0];

  const stream = channel?.stream;
  const category = channel?.category;

  if (!channel || !stream?.is_live) {
    return {
      platform: "kick",
      username,
      isLive: false,
      url: `https://kick.com/${username}`,
    };
  }

  return {
    platform: "kick",
    username,
    isLive: true,
    title: channel.stream_title,
    viewerCount: stream.viewer_count,
    gameName: category?.name,
    startedAt: stream.start_time,
    thumbnail: category?.thumbnail,
    url: stream.url || `https://kick.com/${username}`,
  };
}

export async function GET(request: NextRequest) {
  try {
    const platform =
      request.nextUrl.searchParams.get("platform") || "twitch";

    const username = request.nextUrl.searchParams.get("username");

    if (!username) {
      return NextResponse.json(
        {
          error: "username is required",
        },
        {
          status: 400,
        }
      );
    }

    if (platform === "kick") {
      const status = await getKickLiveStatus(username);

      return NextResponse.json(status);
    }

    const status = await getTwitchLiveStatus(username);

    return NextResponse.json(status);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        isLive: false,
      },
      {
        status: 500,
      }
    );
  }
}