import type { RefObject } from "react";
import type { useLanguage } from "@/contexts/LanguageContext";
import { ExternalLink, Globe2 } from "lucide-react";

import { translate } from "@/lib/i18n/translate";
import {
  formatNumber,
  getPlatformLabel,
  getPlatformLiveStatus,
  getTrustedLiveStatusExternalCount,
} from "./creator-profile-shared";
import type {
  LiveStatusMap,
  SocialLink,
  VisibleYoutubeChannel,
} from "./creator-profile-shared";

type TranslateFunction = ReturnType<typeof useLanguage>["t"];

type CreatorSocialDropdownProps = {
  t: TranslateFunction;
  dropdownRef: RefObject<HTMLDivElement | null>;
  open: boolean;
  items: SocialLink[];
  liveStatus: LiveStatusMap;
  visibleYoutubeChannels: VisibleYoutubeChannel[];
  youtubeExternalReach: number;
  onToggle: () => void;
  onClose: () => void;
  onOpenYoutubeChannels: () => void;
};

export function CreatorSocialDropdown({
  t,
  dropdownRef,
  open,
  items,
  liveStatus,
  visibleYoutubeChannels,
  youtubeExternalReach,
  onToggle,
  onClose,
  onOpenYoutubeChannels,
}: CreatorSocialDropdownProps) {
  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/20"
      >
        <Globe2 className="h-4 w-4" />
        {translate(t, "creatorProfileSocialLinks", "Redes sociais")}
      </button>

      {open ? (
        <div className="absolute left-0 z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-[1.4rem] border border-white/10 bg-[#100913]/95 p-3 shadow-2xl shadow-black/50 backdrop-blur-xl">
          {items.length > 0 ? (
            <div className="space-y-2">
              {items.map((social: SocialLink) => {
                const normalizedPlatform = social.platform.toLowerCase();
                const isYoutube = normalizedPlatform === "youtube";
                const platformStatus = getPlatformLiveStatus(
                  liveStatus,
                  normalizedPlatform,
                );
                const platformCount = isYoutube
                  ? youtubeExternalReach
                  : getTrustedLiveStatusExternalCount(
                      normalizedPlatform,
                      platformStatus,
                    );
                const platformSuffix =
                  normalizedPlatform === "discord"
                    ? "membros"
                    : isYoutube
                      ? translate(t, "creatorProfileSubscribers", "inscritos")
                      : translate(
                          t,
                          "creatorProfileFollowersShort",
                          "seguidores",
                        );
                const platformLabel = isYoutube
                  ? visibleYoutubeChannels.length > 1
                    ? `YouTube (${visibleYoutubeChannels.length})`
                    : "YouTube"
                  : getPlatformLabel(normalizedPlatform);

                const counterLabel =
                  platformCount > 0
                    ? `${formatNumber(platformCount)} ${platformSuffix}`
                    : "";

                if (isYoutube) {
                  return (
                    <button
                      key="youtube-social-dropdown"
                      type="button"
                      onClick={() => {
                        onClose();

                        if (visibleYoutubeChannels.length > 1) {
                          onOpenYoutubeChannels();
                          return;
                        }

                        window.open(social.url, "_blank", "noopener,noreferrer");
                      }}
                      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-sm font-bold text-white/75 transition hover:border-cyan-300/30 hover:text-cyan-100"
                    >
                      <span>{platformLabel}</span>
                      {counterLabel ? (
                        <span className="ml-auto text-xs font-black text-cyan-100/70">
                          {counterLabel}
                        </span>
                      ) : null}
                      <ExternalLink className="h-4 w-4 shrink-0" />
                    </button>
                  );
                }

                return (
                  <a
                    key={`${social.platform}-${social.url}`}
                    href={social.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={onClose}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white/75 transition hover:border-cyan-300/30 hover:text-cyan-100"
                  >
                    <span>{platformLabel}</span>
                    {counterLabel ? (
                      <span className="ml-auto text-xs font-black text-cyan-100/70">
                        {counterLabel}
                      </span>
                    ) : null}
                    <ExternalLink className="h-4 w-4 shrink-0" />
                  </a>
                );
              })}
            </div>
          ) : (
            <p className="px-3 py-2 text-sm font-semibold leading-6 text-white/50">
              {translate(
                t,
                "creatorProfileNoSocialLinks",
                "As redes sociais deste criador ainda não foram adicionadas.",
              )}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
