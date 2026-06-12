import { useMemo } from "react";
import type { SocialLink } from "./creator-profile-shared";

type YoutubeChannelItem = {
  url: string;
};

type UseCreatorSocialDropdownItemsArgs = {
  socialLinks: SocialLink[];
  visibleYoutubeChannels: YoutubeChannelItem[];
};

export function useCreatorSocialDropdownItems({
  socialLinks,
  visibleYoutubeChannels,
}: UseCreatorSocialDropdownItemsArgs) {
  return useMemo(
    () =>
      [
        ...socialLinks.filter(
          (social) => social.platform.toLowerCase() !== "youtube",
        ),
        ...(visibleYoutubeChannels.length > 0
          ? [
              {
                platform: "youtube",
                url: visibleYoutubeChannels[0].url,
              },
            ]
          : []),
      ].filter((social) => social.url.trim().length > 0),
    [socialLinks, visibleYoutubeChannels],
  );
}
