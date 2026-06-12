import { useEffect, useState } from "react";

import {
  extractPlatformUsername,
  getSocialUrl,
} from "./creator-profile-shared";
import type {
  AutoClip,
  CreatorProfileRow,
  SocialLink,
} from "./creator-profile-shared";

export function useCreatorClips(
  profile: CreatorProfileRow | null,
  socialLinks: SocialLink[],
) {
  const [clips, setClips] = useState<AutoClip[]>([]);
  const [clipsLoading, setClipsLoading] = useState(false);

  useEffect(() => {
    if (!profile) {
      setClips([]);
      return;
    }

    const twitchUsername = extractPlatformUsername(
      "twitch",
      getSocialUrl(socialLinks, "twitch"),
    );
    const kickUsername = extractPlatformUsername(
      "kick",
      getSocialUrl(socialLinks, "kick"),
    );
    const youtubeUrls = socialLinks
      .filter((social) => social.platform.toLowerCase() === "youtube")
      .map((social) => social.url)
      .filter(Boolean);

    if (!twitchUsername && !kickUsername && youtubeUrls.length === 0) {
      setClips([]);
      return;
    }

    const params = new URLSearchParams();

    if (twitchUsername) {
      params.set("twitch", twitchUsername);
    }

    if (kickUsername) {
      params.set("kick", kickUsername);
    }

    youtubeUrls.forEach((url) => {
      params.append("youtube", url);
    });

    let cancelled = false;

    async function loadAutoClips() {
      setClipsLoading(true);

      try {
        const response = await fetch(`/api/creator-clips?${params.toString()}`);

        if (!response.ok) {
          throw new Error("Unable to load creator clips.");
        }

        const data = await response.json();

        if (!cancelled) {
          setClips(Array.isArray(data?.clips) ? data.clips : []);
        }
      } catch {
        if (!cancelled) {
          setClips([]);
        }
      } finally {
        if (!cancelled) {
          setClipsLoading(false);
        }
      }
    }

    loadAutoClips();

    return () => {
      cancelled = true;
    };
  }, [profile, socialLinks]);

  return { clips, clipsLoading };
}
