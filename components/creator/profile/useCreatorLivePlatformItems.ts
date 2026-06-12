import { useMemo } from "react";
import type { LiveStatus, SocialLink } from "./creator-profile-shared";
import { getSocialUrl } from "./creator-profile-shared";

type LivePlatformItem = {
  key: "twitch" | "kick";
  label: string;
  status: LiveStatus | undefined;
  fallbackUrl: string;
};

type UseCreatorLivePlatformItemsArgs = {
  socialLinks: SocialLink[];
  twitchStatus: LiveStatus | undefined;
  kickStatus: LiveStatus | undefined;
};

export function useCreatorLivePlatformItems({
  socialLinks,
  twitchStatus,
  kickStatus,
}: UseCreatorLivePlatformItemsArgs) {
  const twitchProfileUrl = getSocialUrl(socialLinks, "twitch");
  const kickProfileUrl = getSocialUrl(socialLinks, "kick");

  const livePlatformItems = useMemo(
    () =>
      [
        {
          key: "twitch" as const,
          label: "Twitch",
          status: twitchStatus,
          fallbackUrl: twitchProfileUrl,
        },
        {
          key: "kick" as const,
          label: "Kick",
          status: kickStatus,
          fallbackUrl: kickProfileUrl,
        },
      ].filter((item) => item.status?.isLive),
    [kickProfileUrl, kickStatus, twitchProfileUrl, twitchStatus],
  );

  const liveDropsPlatform: LivePlatformItem =
    livePlatformItems[0] ||
    (twitchProfileUrl.trim().length > 0
      ? {
          key: "twitch" as const,
          label: "Twitch",
          status: twitchStatus,
          fallbackUrl: twitchProfileUrl,
        }
      : {
          key: "kick" as const,
          label: "Kick",
          status: kickStatus,
          fallbackUrl: kickProfileUrl,
        });

  return {
    twitchProfileUrl,
    kickProfileUrl,
    livePlatformItems,
    liveDropsPlatform,
    heroLiveStatus: livePlatformItems[0]?.status || null,
  };
}
