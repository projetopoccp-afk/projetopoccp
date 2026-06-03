import { NextRequest, NextResponse } from "next/server";

async function getTwitchAccessToken() {
  const response = await fetch(
    "https://id.twitch.tv/oauth2/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.TWITCH_CLIENT_ID!,
        client_secret: process.env.TWITCH_CLIENT_SECRET!,
        grant_type: "client_credentials",
      }),
    }
  );

  const data = await response.json();

  return data.access_token;
}

export async function GET(request: NextRequest) {
  try {
    const username =
      request.nextUrl.searchParams.get("username");

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

    const accessToken =
      await getTwitchAccessToken();

    const twitchResponse = await fetch(
      `https://api.twitch.tv/helix/streams?user_login=${username}`,
      {
        headers: {
          "Client-Id":
            process.env.TWITCH_CLIENT_ID!,
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const twitchData =
      await twitchResponse.json();

    const stream = twitchData.data?.[0];

    if (!stream) {
      return NextResponse.json({
        isLive: false,
      });
    }

    return NextResponse.json({
      isLive: true,
      title: stream.title,
      viewerCount: stream.viewer_count,
      gameName: stream.game_name,
      startedAt: stream.started_at,
      thumbnail: stream.thumbnail_url,
      url: `https://twitch.tv/${username}`,
    });
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