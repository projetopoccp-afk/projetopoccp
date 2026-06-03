import { NextRequest, NextResponse } from "next/server";

type SocialPlatform = "twitch" | "kick" | "youtube";

type LiveStatusResponse = {
  platform: SocialPlatform;
  username: string;
  isLive: boolean;
  title?: string;
  viewerCount?: number;
  gameName?: string;
  startedAt?: string;
  thumbnail?: string;
  url: string;

  followerCount?: number;
  subscriberCount?: number;
  viewCount?: number;
  videoCount?: number;
  externalCount?: number;
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

async function getTwitchUserId(username: string, accessToken: string) {
  const response = await fetch(
    `https://api.twitch.tv/helix/users?login=${encodeURIComponent(username)}`,
    {
      headers: {
        "Client-Id": process.env.TWITCH_CLIENT_ID!,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  const data = await response.json();
  return data.data?.[0]?.id as string | undefined;
}

async function getTwitchFollowerCount(
  broadcasterId: string,
  accessToken: string
) {
  const response = await fetch(
    `https://api.twitch.tv/helix/channels/followers?broadcaster_id=${broadcasterId}&first=1`,
    {
      headers: {
        "Client-Id": process.env.TWITCH_CLIENT_ID!,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  const data = await response.json();
  return Number(data.total ?? 0);
}

async function getTwitchLiveStatus(
  username: string
): Promise<LiveStatusResponse> {
  const accessToken = await getTwitchAccessToken();
  const broadcasterId = await getTwitchUserId(username, accessToken);

  const followerCount = broadcasterId
    ? await getTwitchFollowerCount(broadcasterId, accessToken)
    : 0;

  const twitchResponse = await fetch(
    `https://api.twitch.tv/helix/streams?user_login=${encodeURIComponent(
      username
    )}`,
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
      followerCount,
      externalCount: followerCount,
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
    followerCount,
    externalCount: followerCount,
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

  const followerCount = Number(
    channel?.followers_count ??
      channel?.follower_count ??
      channel?.followersCount ??
      channel?.followerCount ??
      0
  );

  if (!channel || !stream?.is_live) {
    return {
      platform: "kick",
      username,
      isLive: false,
      followerCount,
      externalCount: followerCount,
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
    followerCount,
    externalCount: followerCount,
    url: stream.url || `https://kick.com/${username}`,
  };
}

async function getYouTubeChannelStatus(
  username: string
): Promise<LiveStatusResponse> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY não configurada");
  }

  const cleanUsername = username.replace("@", "");

  const params = new URLSearchParams({
    part: "snippet,statistics",
    forHandle: cleanUsername,
    key: apiKey,
  });

  const youtubeResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?${params.toString()}`,
    {
      next: {
        revalidate: 3600,
      },
    }
  );

  const youtubeData = await youtubeResponse.json();

  if (!youtubeResponse.ok) {
    console.error("Erro YouTube:", youtubeData);
    throw new Error("Erro ao buscar dados do YouTube");
  }

  const channel = youtubeData.items?.[0];

  if (!channel) {
    return {
      platform: "youtube",
      username,
      isLive: false,
      subscriberCount: 0,
      externalCount: 0,
      url: `https://www.youtube.com/@${cleanUsername}`,
    };
  }

  const subscriberCount = Number(channel.statistics?.subscriberCount ?? 0);

  return {
    platform: "youtube",
    username: channel.snippet?.title || username,
    isLive: false,
    title: channel.snippet?.title,
    thumbnail: channel.snippet?.thumbnails?.high?.url,
    subscriberCount,
    viewCount: Number(channel.statistics?.viewCount ?? 0),
    videoCount: Number(channel.statistics?.videoCount ?? 0),
    externalCount: subscriberCount,
    url: `https://www.youtube.com/@${cleanUsername}`,
  };
}

export async function GET(request: NextRequest) {
  try {
    const platform =
      (request.nextUrl.searchParams.get("platform") as SocialPlatform) ||
      "twitch";

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

    if (platform === "youtube") {
      const status = await getYouTubeChannelStatus(username);
      return NextResponse.json(status);
    }

    const status = await getTwitchLiveStatus(username);
    return NextResponse.json(status);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        isLive: false,
        externalCount: 0,
      },
      {
        status: 500,
      }
    );
  }
}