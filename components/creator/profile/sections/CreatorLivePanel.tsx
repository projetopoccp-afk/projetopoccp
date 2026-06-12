import type { useLanguage } from "@/contexts/LanguageContext";
import { translate } from "@/lib/i18n/translate";
import { Radio } from "lucide-react";

import { formatNumber } from "../core/creator-profile-shared";
import type { LiveStatus } from "../core/creator-profile-shared";

type TranslateFunction = ReturnType<typeof useLanguage>["t"];

type CreatorLivePlatformItem = {
  key: string;
  label: string;
  status: LiveStatus | undefined;
  fallbackUrl: string;
};

type CreatorLiveBannerProps = {
  t: TranslateFunction;
  heroLiveStatus: LiveStatus | null;
  livePlatformItems: CreatorLivePlatformItem[];
  onOpenLivePlatforms: () => void;
};

export function CreatorLiveBanner({
  t,
  heroLiveStatus,
  livePlatformItems,
  onOpenLivePlatforms,
}: CreatorLiveBannerProps) {
  if (!heroLiveStatus) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => {
        if (livePlatformItems.length > 1) {
          onOpenLivePlatforms();
          return;
        }

        window.open(heroLiveStatus.url || "#", "_blank", "noopener,noreferrer");
      }}
      className="mt-8 flex w-full items-center gap-3 rounded-[1.6rem] border border-red-300/20 bg-red-500/10 px-5 py-4 text-left text-sm font-bold text-red-50 backdrop-blur-xl transition hover:bg-red-500/15"
    >
      <Radio className="h-5 w-5 animate-pulse" />
      <span className="line-clamp-1">
        {livePlatformItems.length > 1
          ? translate(
              t,
              "creatorProfileChooseLivePlatform",
              "Este criador está ao vivo em mais de uma plataforma. Escolha onde assistir.",
            )
          : heroLiveStatus.title ||
            translate(t, "creatorProfileLiveFallbackTitle", "Live em andamento")}
      </span>
      {heroLiveStatus.viewerCount ? (
        <span className="ml-auto whitespace-nowrap text-red-100/70">
          {formatNumber(heroLiveStatus.viewerCount)}{" "}
          {translate(t, "creatorProfileViewers", "assistindo")}
        </span>
      ) : null}
    </button>
  );
}

type CreatorLivePlatformsModalProps = {
  t: TranslateFunction;
  open: boolean;
  livePlatformItems: CreatorLivePlatformItem[];
  onClose: () => void;
};

export function CreatorLivePlatformsModal({
  t,
  open,
  livePlatformItems,
  onClose,
}: CreatorLivePlatformsModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/80 px-4 py-6 sm:px-6">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label={translate(
          t,
          "creatorProfileCloseLivePlatforms",
          "Fechar plataformas ao vivo",
        )}
      />

      <div className="relative w-[min(92vw,760px)] rounded-[28px] border border-white/15 bg-zinc-950/95 p-5 text-white shadow-[0_0_90px_rgba(0,0,0,0.95)] sm:p-6">
        <div className="pointer-events-none absolute -left-24 -top-24 h-48 w-48 rounded-full bg-red-500/20 blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-cyan-500/20 blur-[80px]" />

        <div className="relative z-10">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-red-200">
            {translate(t, "creatorProfileLiveNow", "Ao vivo agora")}
          </p>

          <h3 className="mt-3 text-xl font-black sm:text-2xl">
            {translate(t, "creatorProfileLivePlatformsTitle", "Escolha onde assistir")}
          </h3>

          <p className="mt-2 text-sm text-white/45">
            {translate(
              t,
              "creatorProfileLivePlatformsDescription",
              "Este criador está online em mais de uma plataforma.",
            )}
          </p>

          <div className="mt-5 grid gap-3">
            {livePlatformItems.map((item: CreatorLivePlatformItem) => (
              <a
                key={item.key}
                href={item.status?.url || item.fallbackUrl || "#"}
                target="_blank"
                rel="noreferrer"
                onClick={onClose}
                className="group flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition hover:border-red-300/30 hover:bg-red-300/10"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-500/15 text-xs font-black text-red-100">
                  <Radio className="h-5 w-5 animate-pulse" />
                </div>

                <div className="min-w-0 flex-1 pr-2">
                  <p className="font-black text-white">{item.label}</p>
                  <p className="break-words text-sm leading-snug text-white/45">
                    {item.status?.title ||
                      translate(t, "creatorProfileLiveFallbackTitle", "Live em andamento")}
                  </p>
                </div>

                {item.status?.viewerCount ? (
                  <span className="hidden shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm font-bold text-red-100/70 sm:inline-flex">
                    {formatNumber(item.status.viewerCount)}
                  </span>
                ) : null}
              </a>
            ))}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-5 w-full rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm text-white/70 transition hover:bg-white/[0.08]"
          >
            {translate(t, "creatorProfileClose", "Fechar")}
          </button>
        </div>
      </div>
    </div>
  );
}
