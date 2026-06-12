import type { useLanguage } from "@/contexts/LanguageContext";
import { translate } from "@/lib/i18n/translate";
import { ChevronLeft, ChevronRight, Loader2, PlayCircle } from "lucide-react";

import {
  formatNumber,
  getPlatformLabel,
  getSafeClipUrl,
} from "./creator-profile-shared";
import type { AutoClip, SocialLink } from "./creator-profile-shared";

type TranslateFunction = ReturnType<typeof useLanguage>["t"];

type CreatorClipsSectionProps = {
  t: TranslateFunction;
  clipsLoading: boolean;
  clips: AutoClip[];
  clipPlatformSections: Array<[string, AutoClip[]]>;
  selectedClipPlatform: string;
  selectedPlatformClips: AutoClip[];
  socialLinks: SocialLink[];
  onSelectClipPlatform: (platform: string) => void;
};

function scrollClipCarousel(platform: string, left: number) {
  document
    .getElementById(`creator-profile-clips-${platform}`)
    ?.scrollBy({ left, behavior: "smooth" });
}

export function CreatorClipsSection({
  t,
  clipsLoading,
  clips,
  clipPlatformSections,
  selectedClipPlatform,
  selectedPlatformClips,
  socialLinks,
  onSelectClipPlatform,
}: CreatorClipsSectionProps) {
  return (
    <article className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <PlayCircle className="h-5 w-5 text-fuchsia-200" />
          <h2 className="text-2xl font-black tracking-tight">
            {translate(
              t,
              "creatorProfileFeaturedClips",
              "Clipes em destaque",
            )}
          </h2>
        </div>

        {clipsLoading ? (
          <span className="inline-flex items-center gap-2 text-sm font-bold text-white/45">
            <Loader2 className="h-4 w-4 animate-spin text-cyan-100" />
            {translate(
              t,
              "creatorProfileLoadingClips",
              "Carregando clipes...",
            )}
          </span>
        ) : null}
      </div>

      {clipsLoading ? (
        <div className="mt-5 rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4 text-sm font-bold text-white/50">
          {translate(
            t,
            "creatorProfileLoadingClips",
            "Carregando clipes...",
          )}
        </div>
      ) : clips.length > 0 ? (
        <div className="mt-5">
          {clipPlatformSections.length > 1 ? (
            <div className="mb-4 flex flex-wrap gap-2">
              {clipPlatformSections.map(([platform, platformClips]) => (
                <button
                  key={platform}
                  type="button"
                  onClick={() => onSelectClipPlatform(platform)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.18em] transition ${
                    selectedClipPlatform === platform
                      ? "border-fuchsia-300/40 bg-fuchsia-300/15 text-fuchsia-100 shadow-lg shadow-fuchsia-500/10"
                      : "border-white/10 bg-white/[0.04] text-white/50 hover:border-cyan-300/25 hover:text-cyan-100"
                  }`}
                >
                  <PlayCircle className="h-3.5 w-3.5" />
                  {getPlatformLabel(platform)}
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/55">
                    {platformClips.length}
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          {selectedClipPlatform && selectedPlatformClips.length > 0 ? (
            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-100/60">
                  {getPlatformLabel(selectedClipPlatform)}
                </p>
                <span className="text-xs font-bold text-white/35">
                  {selectedPlatformClips.length}{" "}
                  {selectedPlatformClips.length === 1
                    ? translate(t, "creatorProfileClipSingular", "clip")
                    : translate(t, "creatorProfileClipPlural", "clips")}
                </span>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => scrollClipCarousel(selectedClipPlatform, -320)}
                  className="absolute -left-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-fuchsia-300/20 bg-black/80 text-fuchsia-100 shadow-2xl backdrop-blur transition hover:border-fuchsia-300/45 hover:bg-fuchsia-300/15 sm:flex"
                  aria-label={translate(
                    t,
                    "creatorProfilePreviousClips",
                    "Clipes anteriores",
                  )}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <div
                  id={`creator-profile-clips-${selectedClipPlatform}`}
                  className="flex snap-x gap-3 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  {selectedPlatformClips.map((clip) => {
                    const thumbnail = clip.thumbnailUrl || clip.thumbnail_url;
                    const viewCount = clip.viewCount ?? clip.view_count ?? 0;
                    const clipHref = getSafeClipUrl(clip, socialLinks);

                    return (
                      <a
                        key={clip.id}
                        href={clipHref}
                        target="_blank"
                        rel="noreferrer"
                        className="group w-[220px] shrink-0 snap-start overflow-hidden rounded-[1.1rem] border border-white/10 bg-black/30 transition hover:border-cyan-300/30 hover:bg-cyan-300/[0.04] sm:w-[260px] lg:w-[290px]"
                      >
                        <div className="aspect-[16/8.5] bg-white/[0.04]">
                          {thumbnail ? (
                            <img
                              src={thumbnail}
                              alt={clip.title}
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-white/30">
                              <PlayCircle className="h-8 w-8" />
                            </div>
                          )}
                        </div>

                        <div className="p-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-100/60">
                              {getPlatformLabel(clip.platform)}
                            </p>

                            {viewCount > 0 ? (
                              <span className="text-[11px] font-bold text-white/40">
                                {formatNumber(viewCount)}
                              </span>
                            ) : null}
                          </div>

                          <h3 className="mt-1.5 line-clamp-2 text-xs font-black leading-5 text-white sm:text-sm">
                            {clip.title}
                          </h3>
                        </div>
                      </a>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => scrollClipCarousel(selectedClipPlatform, 320)}
                  className="absolute -right-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-fuchsia-300/20 bg-black/80 text-fuchsia-100 shadow-2xl backdrop-blur transition hover:border-fuchsia-300/45 hover:bg-fuchsia-300/15 sm:flex"
                  aria-label={translate(
                    t,
                    "creatorProfileNextClips",
                    "Próximos clipes",
                  )}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </section>
          ) : null}
        </div>
      ) : (
        <p className="mt-5 text-sm leading-7 text-white/50">
          {translate(
            t,
            "creatorProfileNoClips",
            "Este criador ainda não possui clipes públicos em destaque.",
          )}
        </p>
      )}
    </article>
  );
}
