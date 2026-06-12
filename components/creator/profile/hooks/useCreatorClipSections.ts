import { useEffect, useMemo } from "react";
import type { AutoClip } from "../core/creator-profile-shared";

const CLIP_PLATFORM_ORDER = ["youtube", "twitch", "kick", "tiktok", "instagram"];

type UseCreatorClipSectionsArgs = {
  clips: AutoClip[];
  activeClipPlatform: string;
  setActiveClipPlatform: (platform: string) => void;
};

export function useCreatorClipSections({
  clips,
  activeClipPlatform,
  setActiveClipPlatform,
}: UseCreatorClipSectionsArgs) {
  const groupedClips = useMemo(() => {
    return clips.reduce<Record<string, AutoClip[]>>((accumulator, clip) => {
      const platform = String(clip.platform || "outros").toLowerCase();

      if (!accumulator[platform]) {
        accumulator[platform] = [];
      }

      accumulator[platform].push(clip);
      return accumulator;
    }, {});
  }, [clips]);

  const clipPlatformSections = useMemo(() => {
    return (Object.entries(groupedClips) as Array<[string, AutoClip[]]>).sort(
      ([platformA], [platformB]) => {
        const indexA = CLIP_PLATFORM_ORDER.indexOf(platformA);
        const indexB = CLIP_PLATFORM_ORDER.indexOf(platformB);

        return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
      },
    );
  }, [groupedClips]);

  const clipPlatformKey = useMemo(
    () => clipPlatformSections.map(([platform]) => platform).join("|"),
    [clipPlatformSections],
  );

  const selectedClipPlatform =
    activeClipPlatform && groupedClips[activeClipPlatform]
      ? activeClipPlatform
      : clipPlatformSections[0]?.[0] || "";

  const selectedPlatformClips = selectedClipPlatform
    ? groupedClips[selectedClipPlatform] || []
    : [];

  useEffect(() => {
    if (!clipPlatformSections.length) {
      if (activeClipPlatform) setActiveClipPlatform("");
      return;
    }

    if (!activeClipPlatform || !groupedClips[activeClipPlatform]) {
      setActiveClipPlatform(clipPlatformSections[0][0]);
    }
  }, [activeClipPlatform, clipPlatformKey, clipPlatformSections, groupedClips, setActiveClipPlatform]);

  return {
    groupedClips,
    clipPlatformSections,
    clipPlatformKey,
    selectedClipPlatform,
    selectedPlatformClips,
  };
}
