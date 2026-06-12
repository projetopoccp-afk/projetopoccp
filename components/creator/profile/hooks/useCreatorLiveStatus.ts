import { useEffect, useRef, useState } from "react";

import { supabase } from "@/lib/supabase/client";
import {
  extractPlatformUsername,
  getNormalizedYoutubeChannels,
  getPlatformFallbackUrl,
  mapCreatorLiveStatusRowToLiveStatus,
  mergeLiveStatusPreservingMetrics,
} from "../core/creator-profile-shared";
import type {
  CreatorLiveStatusRow,
  CreatorProfileRow,
  LiveStatus,
  LiveStatusMap,
  SocialLink,
} from "../core/creator-profile-shared";


type KickFollowerBrowserCacheEntry = {
  followerCount: number;
  updatedAt: number;
};

function getPositiveFollowerCount(value: unknown) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) return undefined;

  const followerCount = Math.floor(numericValue);

  if (followerCount <= 0 || followerCount > 500_000_000) return undefined;

  return followerCount;
}

function extractKickFollowerGoalCount(payload: unknown) {
  const goals = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { data?: unknown[] } | null)?.data)
      ? ((payload as { data: unknown[] }).data)
      : [];

  const followerGoal = goals.find((goal) => {
    if (!goal || typeof goal !== "object") return false;

    const goalRecord = goal as Record<string, unknown>;
    return String(goalRecord.type || "").toLowerCase() === "followers";
  }) as Record<string, unknown> | undefined;

  return getPositiveFollowerCount(followerGoal?.current_value);
}

async function fetchKickFollowerGoalFromBrowser(username: string) {
  const response = await fetch(
    `https://kick.com/api/v2/channels/${encodeURIComponent(username)}/goals`,
    {
      cache: "no-store",
      credentials: "omit",
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) return undefined;

  const payload = await response.json().catch(() => null);
  return extractKickFollowerGoalCount(payload);
}

async function cacheKickFollowerGoal(params: {
  creatorId: string;
  username: string;
  followerCount: number;
}) {
  await fetch("/api/kick/followers-cache", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      creatorId: params.creatorId,
      username: params.username,
      followerCount: params.followerCount,
      source: "kick_goals_browser",
    }),
  }).catch(() => null);
}

function mergeKickFollowerCount(
  currentLiveStatus: LiveStatusMap,
  followerCount: number,
): LiveStatusMap {
  const currentKickStatus = currentLiveStatus.kick;

  if (!currentKickStatus) return currentLiveStatus;

  return {
    ...currentLiveStatus,
    kick: {
      ...currentKickStatus,
      followerCount,
      externalCount: followerCount,
    },
  };
}

type LiveStatusTarget = {
  platform: "twitch" | "kick" | "youtube" | "discord";
  username: string;
  index?: number;
};

function buildLiveStatusTargets(socialLinks: SocialLink[]): LiveStatusTarget[] {
  const youtubeChannels = socialLinks
    .filter((social) => social.platform.toLowerCase() === "youtube")
    .map((social) => social.url);

  return [
    ...socialLinks
      .map((social) => {
        const platform = social.platform.toLowerCase();

        if (
          platform !== "twitch" &&
          platform !== "kick" &&
          platform !== "discord"
        ) {
          return null;
        }

        const platformUsername = extractPlatformUsername(platform, social.url);

        return {
          platform,
          username: platformUsername,
        };
      })
      .filter(
        (
          target,
        ): target is {
          platform: "twitch" | "kick" | "discord";
          username: string;
        } => Boolean(target && target.username.length > 0),
      ),
    ...getNormalizedYoutubeChannels(youtubeChannels).map((channel) => ({
      platform: "youtube" as const,
      username: channel.username,
      index: channel.originalIndex,
    })),
  ];
}

function mergeLiveStatusResults(
  currentLiveStatus: LiveStatusMap,
  results: Array<{
    platform: "twitch" | "kick" | "youtube" | "discord";
    index?: number;
    status: LiveStatus;
  }>,
): LiveStatusMap {
  return results.reduce<LiveStatusMap>(
    (accumulator, result) => {
      if (result.platform === "youtube") {
        accumulator[`youtube:${result.index ?? 0}`] =
          mergeLiveStatusPreservingMetrics(
            accumulator[`youtube:${result.index ?? 0}`],
            result.status,
          );

        const currentYoutube = accumulator.youtube;
        const currentSubscriberCount =
          currentYoutube?.subscriberCount ?? currentYoutube?.externalCount ?? 0;
        const nextSubscriberCount =
          result.status.subscriberCount ?? result.status.externalCount ?? 0;

        accumulator.youtube = mergeLiveStatusPreservingMetrics(
          currentYoutube,
          nextSubscriberCount >= currentSubscriberCount
            ? result.status
            : currentYoutube || result.status,
        );

        return accumulator;
      }

      accumulator[result.platform] = mergeLiveStatusPreservingMetrics(
        accumulator[result.platform],
        result.status,
      );
      return accumulator;
    },
    { ...currentLiveStatus },
  );
}

export function useCreatorLiveStatus(
  profile: CreatorProfileRow | null,
  socialLinks: SocialLink[],
) {
  const [liveStatus, setLiveStatus] = useState<LiveStatusMap>({});
  const [liveStatusLoading, setLiveStatusLoading] = useState(false);
  const kickFollowerBrowserCache = useRef<Record<string, KickFollowerBrowserCacheEntry>>({});

  useEffect(() => {
    if (!profile) {
      setLiveStatus({});
      return;
    }

    const creatorId = profile.id;
    const targets = buildLiveStatusTargets(socialLinks);

    if (targets.length === 0) {
      setLiveStatus({});
      return;
    }

    let cancelled = false;

    async function refreshKickFollowerGoalFromBrowser(targetUsername: string) {
      const cacheKey = targetUsername.toLowerCase();
      const cachedEntry = kickFollowerBrowserCache.current[cacheKey];
      const now = Date.now();

      if (cachedEntry && now - cachedEntry.updatedAt < 5 * 60 * 1000) {
        setLiveStatus((currentLiveStatus) =>
          mergeKickFollowerCount(currentLiveStatus, cachedEntry.followerCount),
        );
        return;
      }

      const followerCount = await fetchKickFollowerGoalFromBrowser(
        targetUsername,
      ).catch(() => undefined);

      if (!followerCount || cancelled) return;

      kickFollowerBrowserCache.current[cacheKey] = {
        followerCount,
        updatedAt: now,
      };

      setLiveStatus((currentLiveStatus) =>
        mergeKickFollowerCount(currentLiveStatus, followerCount),
      );

      await cacheKickFollowerGoal({
        creatorId,
        username: targetUsername,
        followerCount,
      });
    }

    async function loadLiveStatuses() {
      setLiveStatusLoading(true);

      try {
        const results = await Promise.all(
          targets.map(async ({ platform, username: targetUsername, index }) => {
            try {
              const params = new URLSearchParams({
                platform,
                username: targetUsername,
                creatorId,
              });

              const response = await fetch(
                `/api/live-status?${params.toString()}`,
              );

              if (!response.ok) {
                throw new Error(`Unable to load ${platform} live status.`);
              }

              const data: LiveStatus = await response.json();

              return {
                platform,
                index,
                status: {
                  ...data,
                  url:
                    data.url || getPlatformFallbackUrl(platform, targetUsername),
                },
              };
            } catch {
              return {
                platform,
                index,
                status: {
                  platform,
                  username: targetUsername,
                  isLive: false,
                  url: getPlatformFallbackUrl(platform, targetUsername),
                },
              };
            }
          }),
        );

        if (!cancelled) {
          setLiveStatus((currentLiveStatus) =>
            mergeLiveStatusResults(currentLiveStatus, results),
          );

          const kickTarget = targets.find(
            (target) => target.platform === "kick" && target.username,
          );

          if (kickTarget) {
            void refreshKickFollowerGoalFromBrowser(kickTarget.username);
          }
        }
      } finally {
        if (!cancelled) {
          setLiveStatusLoading(false);
        }
      }
    }

    async function loadCachedLiveStatuses() {
      const { data, error } = await supabase
        .from("creator_live_status")
        .select(
          "id, creator_id, platform, platform_username, is_live, title, viewer_count, game_name, started_at, thumbnail_url, live_url, raw_payload, last_checked_at, updated_at",
        )
        .eq("creator_id", creatorId)
        .in("platform", ["twitch", "kick"]);

      if (cancelled || error || !data) return;

      setLiveStatus((currentLiveStatus) => {
        const nextLiveStatus = { ...currentLiveStatus };

        (data as CreatorLiveStatusRow[]).forEach((row) => {
          nextLiveStatus[row.platform] = mergeLiveStatusPreservingMetrics(
            nextLiveStatus[row.platform],
            mapCreatorLiveStatusRowToLiveStatus(row),
          );
        });

        return nextLiveStatus;
      });
    }

    loadCachedLiveStatuses();
    loadLiveStatuses();

    const pollingInterval = window.setInterval(loadLiveStatuses, 30000);

    const liveStatusChannel = supabase
      .channel(`creator-live-status:${creatorId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "creator_live_status",
          filter: `creator_id=eq.${creatorId}`,
        },
        (payload) => {
          if (cancelled) return;

          if (payload.eventType === "DELETE") {
            const oldRow = payload.old as Partial<CreatorLiveStatusRow>;
            const deletedPlatform = oldRow.platform;

            if (!deletedPlatform) return;

            setLiveStatus((currentLiveStatus) => {
              const nextLiveStatus = { ...currentLiveStatus };
              delete nextLiveStatus[deletedPlatform];
              return nextLiveStatus;
            });

            return;
          }

          const row = payload.new as CreatorLiveStatusRow;

          if (row.platform !== "twitch" && row.platform !== "kick") return;

          setLiveStatus((currentLiveStatus) => ({
            ...currentLiveStatus,
            [row.platform]: mergeLiveStatusPreservingMetrics(
              currentLiveStatus[row.platform],
              mapCreatorLiveStatusRowToLiveStatus(row),
            ),
          }));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      window.clearInterval(pollingInterval);
      void supabase.removeChannel(liveStatusChannel);
    };
  }, [profile, socialLinks]);

  return { liveStatus, liveStatusLoading };
}
