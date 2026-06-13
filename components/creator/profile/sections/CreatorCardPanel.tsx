import type { RefObject } from "react";
import type { useLanguage } from "@/contexts/LanguageContext";
import { ChevronDown, Sparkles, Users } from "lucide-react";

import { CreatorCard } from "@/components/cards/CreatorCard";
import { CREATOR_POPUP_IMAGE_EFFECT_STYLES } from "@/components/creator/CreatorPopupImageEffects";
import { translate } from "@/lib/i18n/translate";
import { getRarityLabel } from "@/lib/rarity";
import type { Creator, CreatorRarity } from "@/types/creator";
import {
  formatNumber,
  RARITY_SHOWCASE_CYCLE,
  translateExisting,
} from "../core/creator-profile-shared";
import type {
  CreatorCollectionStats,
  CreatorProfileEditDraft,
} from "../core/creator-profile-shared";

type TranslateFunction = ReturnType<typeof useLanguage>["t"];

type CreatorCardPanelProps = {
  t: TranslateFunction;
  creatorForCard: Creator | null;
  isEditing: boolean;
  editDraft: CreatorProfileEditDraft | null;
  popupEffectDropdownRef: RefObject<HTMLDivElement | null>;
  popupEffectDropdownOpen: boolean;
  collectionStats: CreatorCollectionStats;
  highestCollectedRarity: CreatorRarity | null;
  onTogglePopupEffectDropdown: () => void;
  onClosePopupEffectDropdown: () => void;
  onEditDraftChange: (field: keyof CreatorProfileEditDraft, value: string) => void;
};

export function CreatorCardPanel({
  t,
  creatorForCard,
  isEditing,
  editDraft,
  popupEffectDropdownRef,
  popupEffectDropdownOpen,
  collectionStats,
  highestCollectedRarity,
  onTogglePopupEffectDropdown,
  onClosePopupEffectDropdown,
  onEditDraftChange,
}: CreatorCardPanelProps) {
  return (
    <div className="flex h-full min-h-full flex-col items-center px-0 py-0 lg:sticky lg:top-24 lg:self-stretch">
      {creatorForCard ? (
        <div className="relative z-10 w-fit origin-top scale-[1.1] sm:scale-[1.16] lg:scale-[1.18] xl:scale-[1.22]">
          <div className="pointer-events-none absolute -inset-8 -z-10 rounded-[3rem] bg-[radial-gradient(circle,rgba(34,211,238,0.22),transparent_66%)] blur-2xl" />
          <CreatorCard
            key={`${creatorForCard.id}-${creatorForCard.rarity}`}
            creator={creatorForCard}
            onClick={() => undefined}
          />
        </div>
      ) : null}

      {isEditing && editDraft ? (
        <div
          ref={popupEffectDropdownRef}
          className="relative z-40 mt-10 w-full max-w-[300px] px-2 sm:max-w-[330px] lg:mt-12 lg:px-0"
        >
          <button
            type="button"
            onClick={onTogglePopupEffectDropdown}
            className="flex w-full items-center justify-between gap-3 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-3 text-left text-xs font-black uppercase tracking-[0.18em] text-cyan-100 shadow-lg shadow-cyan-500/10 backdrop-blur transition hover:border-cyan-300/45 hover:bg-cyan-300/15"
          >
            <span className="inline-flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              {translate(
                t,
                "creatorProfilePopupThemeTitle",
                "Efeitos de apresentação",
              )}
            </span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 transition ${
                popupEffectDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {popupEffectDropdownOpen ? (
            <div className="absolute left-2 right-2 top-full z-50 mt-3 max-h-[360px] overflow-y-auto rounded-[1.5rem] border border-cyan-300/20 bg-[#05070d]/95 p-2 shadow-2xl shadow-cyan-500/20 backdrop-blur-xl [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:left-0 sm:right-0">
              <div className="px-2 pb-2 pt-1">
                <p className="text-[11px] font-bold leading-relaxed text-white/45">
                  {translate(
                    t,
                    "creatorProfilePopupThemeDescription",
                    "Escolha a animação que aparece apenas dentro da imagem do popup do criador.",
                  )}
                </p>
              </div>

              <div className="grid gap-1.5">
                {CREATOR_POPUP_IMAGE_EFFECT_STYLES.map((effectStyle) => {
                  const isSelected =
                    (editDraft.popupAnimationStyle || "none") ===
                    effectStyle.value;

                  return (
                    <button
                      key={effectStyle.value}
                      type="button"
                      onClick={() => {
                        onEditDraftChange("popupAnimationStyle", effectStyle.value);
                        onClosePopupEffectDropdown();
                      }}
                      className={`rounded-[1rem] border px-3 py-2.5 text-left transition ${
                        isSelected
                          ? "border-cyan-300/55 bg-cyan-300/15 shadow-lg shadow-cyan-500/10"
                          : "border-white/10 bg-white/[0.03] hover:border-cyan-300/30 hover:bg-cyan-300/[0.07]"
                      }`}
                    >
                      <span className="block text-xs font-black uppercase tracking-[0.18em] text-white/85">
                        {translateExisting(
                          t,
                          effectStyle.labelKey,
                          effectStyle.fallback,
                        )}
                      </span>
                      <span className="mt-1 block text-[11px] font-semibold leading-relaxed text-white/45">
                        {translateExisting(
                          t,
                          effectStyle.descriptionKey,
                          effectStyle.descriptionFallback,
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {!isEditing ? (
        <div className="relative z-20 mt-10 w-full max-w-[340px] rounded-[1.65rem] border border-white/10 bg-white/[0.035] p-4 shadow-2xl shadow-fuchsia-500/5 backdrop-blur-xl sm:max-w-[360px] lg:mt-auto">
          <div className="flex items-center gap-2 text-cyan-100/70">
            <Users className="h-4 w-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.24em]">
              {translate(t, "creatorProfileCommunityCollection", "Coleção da comunidade")}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.07] px-2 py-3">
              <p className="text-xl font-black text-white">{formatNumber(collectionStats.uniqueCollectors)}</p>
              <p className="mt-1 text-[8px] font-black uppercase tracking-[0.14em] text-cyan-100/55">
                {translate(t, "creatorProfileCollectors", "Colecionadores")}
              </p>
            </div>
            <div className="rounded-2xl border border-fuchsia-300/15 bg-fuchsia-300/[0.06] px-2 py-3">
              <p className="text-xl font-black text-white">{formatNumber(collectionStats.total)}</p>
              <p className="mt-1 text-[8px] font-black uppercase tracking-[0.14em] text-fuchsia-100/55">
                {translate(t, "creatorProfileCollectedCards", "Cartas")}
              </p>
            </div>
            <div className="rounded-2xl border border-yellow-300/15 bg-yellow-300/[0.07] px-2 py-3">
              <p className="truncate text-xl font-black text-white">
                {highestCollectedRarity
                  ? translate(
                      t,
                      highestCollectedRarity,
                      getRarityLabel(highestCollectedRarity),
                    )
                  : "-"}
              </p>
              <p className="mt-1 text-[8px] font-black uppercase tracking-[0.14em] text-yellow-100/55">
                {translate(t, "creatorProfileHighestRarity", "Maior")}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {RARITY_SHOWCASE_CYCLE.map((item) => {
              const rarityKey = item.rarity as keyof Omit<CreatorCollectionStats, "total" | "uniqueCollectors">;
              const amount = collectionStats[rarityKey] || 0;
              const percentage = collectionStats.total > 0 ? Math.round((amount / collectionStats.total) * 100) : 0;

              return (
                <div key={item.rarity} className="grid grid-cols-[74px_1fr_42px] items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-[0.16em] text-white/45">
                    {translate(
                      t,
                      item.rarity as CreatorRarity,
                      getRarityLabel(item.rarity as CreatorRarity),
                    )}
                  </span>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-cyan-300/60" style={{ width: `${percentage}%` }} />
                  </div>
                  <span className="text-right text-[10px] font-black text-cyan-100/70">{percentage}%</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
