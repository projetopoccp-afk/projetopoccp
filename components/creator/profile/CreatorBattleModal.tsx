import type { useLanguage } from "@/contexts/LanguageContext";
import { Loader2, Sparkles } from "lucide-react";

import { CreatorCard } from "@/components/cards/CreatorCard";
import { translate } from "@/lib/i18n/translate";
import { getRarityLabel } from "@/lib/rarity";
import type { Creator } from "@/types/creator";
import { formatNumber, normalizeCreatorRarity } from "./creator-profile-shared";
import type { CreatorBattleCandidate } from "./creator-profile-shared";

type TranslateFunction = ReturnType<typeof useLanguage>["t"];

type BattleRow = {
  key: string;
  label: string;
  current: number;
  opponent: number;
};

type BattleScore = {
  current: number;
  draws: number;
  opponent: number;
};

type CreatorBattleModalProps = {
  open: boolean;
  t: TranslateFunction;
  nickname: string;
  creatorForCard: Creator | null;
  battleStarted: boolean;
  battleSearchQuery: string;
  filteredBattleCandidates: CreatorBattleCandidate[];
  selectedBattleCreatorId: string;
  selectedBattleCreator: CreatorBattleCandidate | undefined;
  selectedBattleCreatorForCard: Creator | null;
  battleStatsReady: boolean;
  battleLoading: boolean;
  visibleBattleRows: BattleRow[];
  battleRowsLength: number;
  revealedBattleRows: number;
  visibleBattleScore: BattleScore;
  battleAnimationComplete: boolean;
  battleFinalWinner: "current" | "opponent" | "draw";
  onClose: () => void;
  onBattleSearchQueryChange: (value: string) => void;
  onSelectBattleCandidate: (creatorId: string) => void;
  onStartBattleAnimation: () => void;
};

export function CreatorBattleModal({
  open,
  t,
  nickname,
  creatorForCard,
  battleStarted,
  battleSearchQuery,
  filteredBattleCandidates,
  selectedBattleCreatorId,
  selectedBattleCreator,
  selectedBattleCreatorForCard,
  battleStatsReady,
  battleLoading,
  visibleBattleRows,
  battleRowsLength,
  revealedBattleRows,
  visibleBattleScore,
  battleAnimationComplete,
  battleFinalWinner,
  onClose,
  onBattleSearchQueryChange,
  onSelectBattleCandidate,
  onStartBattleAnimation,
}: CreatorBattleModalProps) {
  if (!open) return null;

  return (
<div className="fixed inset-x-0 bottom-0 top-[76px] z-[90] flex items-center justify-center bg-black/78 px-4 py-4 backdrop-blur-md" role="dialog" aria-modal="true">
  <div className="relative max-h-[calc(100vh-108px)] w-full max-w-7xl overflow-y-auto rounded-[2rem] border border-fuchsia-300/25 bg-[#07040b]/95 p-4 shadow-2xl shadow-fuchsia-500/20 [scrollbar-width:none] [-ms-overflow-style:none] sm:p-6 [&::-webkit-scrollbar]:hidden">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_40%,rgba(34,211,238,0.22),transparent_33%),radial-gradient(circle_at_82%_42%,rgba(248,113,113,0.18),transparent_33%),linear-gradient(90deg,rgba(34,211,238,0.08),transparent,rgba(217,70,239,0.08))]" />
    {battleStarted ? (
      <div className="pointer-events-none absolute inset-0 opacity-50 animate-[battleFriction_1100ms_ease-in-out_infinite] bg-[linear-gradient(90deg,transparent,rgba(34,211,238,0.12),transparent,rgba(244,63,94,0.12),transparent)]" />
    ) : null}

    <button
      type="button"
      onClick={onClose}
      className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/45 text-2xl font-light text-white/70 transition hover:border-fuchsia-300/30 hover:text-white"
      aria-label="Fechar batalha"
    >
      ×
    </button>

    <div className="relative z-10">
      <div className="mb-5 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.34em] text-fuchsia-100/60">
          {translate(t, "creatorProfileBattleMode", "Batalha de criadores")}
        </p>
        <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white md:text-4xl">
          {battleStarted && selectedBattleCreator
            ? `${nickname} VS ${selectedBattleCreator.nickname || selectedBattleCreator.username}`
            : translate(t, "creatorProfileBattleChooseOpponent", "Escolha o oponente")}
        </h2>
      </div>

      {!battleStarted ? (
        <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)_260px] lg:items-stretch">
          <div className="flex items-center justify-center rounded-[1.7rem] border border-cyan-300/15 bg-cyan-300/[0.04] p-3 shadow-2xl shadow-cyan-500/10">
            {creatorForCard ? (
              <div className="scale-[0.82] sm:scale-[0.9] lg:scale-[0.86]">
                <CreatorCard creator={creatorForCard} onClick={() => undefined} />
              </div>
            ) : null}
          </div>

          <div className="rounded-[1.7rem] border border-white/10 bg-black/35 p-4 backdrop-blur-xl">
            <div className="flex items-center justify-center gap-3">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-300/25 to-transparent" />
              <span className="rounded-full border border-fuchsia-300/25 bg-fuchsia-300/10 px-4 py-1 text-sm font-black text-fuchsia-100 shadow-lg shadow-fuchsia-500/10">
                VS
              </span>
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-fuchsia-300/25 to-transparent" />
            </div>

            <label className="mt-5 block">
              <span className="text-[10px] font-black uppercase tracking-[0.24em] text-white/45">
                {translate(t, "creatorProfileBattleSearchOpponent", "Pesquisar oponente")}
              </span>
              <input
                value={battleSearchQuery}
                onChange={(event) => onBattleSearchQueryChange(event.target.value)}
                placeholder={translate(t, "creatorProfileBattleSearchPlaceholder", "Buscar criador pelo nome...")}
                className="mt-2 w-full rounded-[1.15rem] border border-fuchsia-300/20 bg-black/45 px-4 py-3 text-sm font-bold text-fuchsia-50 outline-none transition placeholder:text-white/25 focus:border-fuchsia-300/45"
              />
            </label>

            <div className="mt-4 max-h-[280px] space-y-2 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {filteredBattleCandidates.length > 0 ? (
                filteredBattleCandidates.map((candidate) => {
                  const selected = candidate.id === selectedBattleCreatorId;
                  const candidateCard = Array.isArray(candidate.creator_cards)
                    ? candidate.creator_cards[0] || null
                    : candidate.creator_cards || null;

                  return (
                    <button
                      key={candidate.id}
                      type="button"
                      onClick={() => onSelectBattleCandidate(candidate.id)}
                      className={`flex w-full items-center gap-3 rounded-[1rem] border px-3 py-2.5 text-left transition ${
                        selected
                          ? "border-fuchsia-300/45 bg-fuchsia-300/15 shadow-lg shadow-fuchsia-500/10"
                          : "border-white/10 bg-white/[0.035] hover:border-fuchsia-300/30 hover:bg-fuchsia-300/[0.08]"
                      }`}
                    >
                      <span className="h-10 w-10 overflow-hidden rounded-full border border-white/10 bg-white/10">
                        {candidate.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={candidate.avatar_url}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-black text-white">
                          {candidate.nickname || candidate.username}
                        </span>
                        <span className="block truncate text-xs font-semibold text-white/40">
                          @{candidate.username}
                        </span>
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-white/45">
                        {getRarityLabel(normalizeCreatorRarity(candidateCard?.rarity || "common"))}
                      </span>
                    </button>
                  );
                })
              ) : (
                <p className="rounded-[1rem] border border-white/10 bg-white/[0.03] px-3 py-4 text-sm font-semibold text-white/45">
                  {translate(t, "creatorProfileBattleNoOpponents", "Nenhum criador encontrado.")}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onStartBattleAnimation}
              disabled={!selectedBattleCreator || !battleStatsReady || battleLoading}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-[1.15rem] border border-fuchsia-300/30 bg-fuchsia-400/15 px-5 py-3.5 text-sm font-black uppercase tracking-[0.16em] text-fuchsia-50 shadow-lg shadow-fuchsia-500/10 transition hover:bg-fuchsia-400/25 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {battleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {translate(t, "creatorProfileBattleStart", "Iniciar batalha")}
            </button>
          </div>

          <div className="flex items-center justify-center rounded-[1.7rem] border border-rose-300/15 bg-rose-300/[0.04] p-3 shadow-2xl shadow-rose-500/10">
            {selectedBattleCreatorForCard ? (
              <div className="scale-[0.82] sm:scale-[0.9] lg:scale-[0.86] animate-[battleSlideInRight_420ms_ease-out_both]">
                <CreatorCard creator={selectedBattleCreatorForCard} onClick={() => undefined} />
              </div>
            ) : (
              <div className="flex h-[360px] w-full flex-col items-center justify-center rounded-[1.4rem] border border-dashed border-white/10 bg-white/[0.025] text-center">
                <Sparkles className="h-8 w-8 text-fuchsia-100/35" />
                <p className="mt-3 max-w-[180px] text-xs font-black uppercase tracking-[0.18em] text-white/35">
                  {translate(t, "creatorProfileBattleSelectOpponentCard", "Selecione um criador para revelar a carta")}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[230px_minmax(0,1fr)_230px] lg:items-center">
          <div className="flex justify-center animate-[battleSlideInLeft_520ms_ease-out_both]">
            {creatorForCard ? (
              <div className="scale-[0.82] sm:scale-[0.9] lg:scale-[0.86] animate-[battleCardClashLeft_900ms_ease-in-out_1]">
                <CreatorCard creator={creatorForCard} onClick={() => undefined} />
              </div>
            ) : null}
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-black/35 p-4 backdrop-blur-xl">
            <div className="mb-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
              <div>
                <p className="truncate text-sm font-black text-cyan-100 md:text-base">{nickname}</p>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/35">
                  {translate(t, "creatorProfileBattleCurrent", "Atual")}
                </p>
              </div>
              <span className="animate-[battleVsPulse_900ms_ease-in-out_infinite] rounded-full border border-fuchsia-300/25 bg-fuchsia-300/10 px-4 py-2 text-sm font-black text-fuchsia-100 shadow-lg shadow-fuchsia-500/20">VS</span>
              <div>
                <p className="truncate text-sm font-black text-fuchsia-100 md:text-base">
                  {selectedBattleCreator?.nickname || selectedBattleCreator?.username}
                </p>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/35">
                  {translate(t, "creatorProfileBattleOpponent", "Oponente")}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {visibleBattleRows.map((row, index) => {
                const currentWins = row.current > row.opponent;
                const opponentWins = row.opponent > row.current;
                const draw = !currentWins && !opponentWins;

                return (
                  <div key={row.key} className="grid animate-[battleRowReveal_460ms_ease-out_both] grid-cols-[84px_minmax(0,1fr)_84px] items-center gap-3 rounded-[1rem] border border-white/10 bg-white/[0.035] px-3 py-2.5" style={{ animationDelay: `${index * 70}ms` }}>
                    <p className={`rounded-xl px-3 py-2 text-center text-lg font-black ${
                      draw
                        ? "bg-yellow-300/10 text-yellow-100"
                        : currentWins
                          ? "bg-emerald-400/18 text-emerald-100 shadow-lg shadow-emerald-500/10"
                          : "bg-red-500/16 text-red-100"
                    }`}>
                      {formatNumber(row.current)}
                    </p>
                    <div className="text-center">
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/55">{row.label}</p>
                      <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-white/35">
                        {currentWins
                          ? translate(t, "creatorProfileBattleCurrentWins", "Você vence")
                          : opponentWins
                            ? translate(t, "creatorProfileBattleOpponentWins", "Oponente vence")
                            : translate(t, "creatorProfileBattleDraw", "Empate")}
                      </p>
                    </div>
                    <p className={`rounded-xl px-3 py-2 text-center text-lg font-black ${
                      draw
                        ? "bg-yellow-300/10 text-yellow-100"
                        : opponentWins
                          ? "bg-emerald-400/18 text-emerald-100 shadow-lg shadow-emerald-500/10"
                          : "bg-red-500/16 text-red-100"
                    }`}>
                      {formatNumber(row.opponent)}
                    </p>
                  </div>
                );
              })}

              {revealedBattleRows < battleRowsLength ? (
                <div className="rounded-[1rem] border border-fuchsia-300/15 bg-fuchsia-300/[0.05] px-3 py-4 text-center text-xs font-black uppercase tracking-[0.2em] text-fuchsia-100/60 animate-pulse">
                  {translate(t, "creatorProfileBattleCalculating", "Calculando próximo impacto...")}
                </div>
              ) : null}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-2">
                <p className="text-xl font-black text-cyan-100">{visibleBattleScore.current}</p>
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-cyan-100/50">
                  {translate(t, "creatorProfileBattleCurrentWins", "Você vence")}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2">
                <p className="text-xl font-black text-white">{visibleBattleScore.draws}</p>
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/40">
                  {translate(t, "creatorProfileBattleDraw", "Empate")}
                </p>
              </div>
              <div className="rounded-2xl border border-fuchsia-300/15 bg-fuchsia-300/[0.06] px-3 py-2">
                <p className="text-xl font-black text-fuchsia-100">{visibleBattleScore.opponent}</p>
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-fuchsia-100/50">
                  {translate(t, "creatorProfileBattleOpponentWins", "Oponente vence")}
                </p>
              </div>
            </div>

            {battleAnimationComplete ? (
              <div className={`mt-4 rounded-[1.2rem] border px-4 py-4 text-center ${
                battleFinalWinner === "current"
                  ? "border-emerald-300/25 bg-emerald-400/10"
                  : battleFinalWinner === "opponent"
                    ? "border-rose-300/25 bg-rose-400/10"
                    : "border-yellow-300/25 bg-yellow-300/10"
              }`}>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/45">
                  {translate(t, "creatorProfileBattleFinalResult", "Resultado final")}
                </p>
                <p className="mt-1 text-2xl font-black text-white">
                  {battleFinalWinner === "current"
                    ? translate(t, "creatorProfileBattleYouWon", "Você venceu")
                    : battleFinalWinner === "opponent"
                      ? `${selectedBattleCreator?.nickname || selectedBattleCreator?.username} ${translate(t, "creatorProfileBattleWon", "venceu")}`
                      : translate(t, "creatorProfileBattleFinalDraw", "Empate geral")}
                </p>
              </div>
            ) : null}
          </div>

          <div className="flex justify-center animate-[battleSlideInRight_520ms_ease-out_both]">
            {selectedBattleCreatorForCard ? (
              <div className="scale-[0.82] sm:scale-[0.9] lg:scale-[0.86] animate-[battleCardClashRight_900ms_ease-in-out_1]">
                <CreatorCard creator={selectedBattleCreatorForCard} onClick={() => undefined} />
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>

    <style jsx>{`
      @keyframes battleSlideInLeft {
        from { opacity: 0; transform: translateX(-48px) rotate(-4deg) scale(0.92); }
        to { opacity: 1; transform: translateX(0) rotate(0deg) scale(1); }
      }
      @keyframes battleSlideInRight {
        from { opacity: 0; transform: translateX(48px) rotate(4deg) scale(0.92); }
        to { opacity: 1; transform: translateX(0) rotate(0deg) scale(1); }
      }
      @keyframes battleCardClashLeft {
        0% { transform: translateX(0) rotate(0deg) scale(1); }
        42% { transform: translateX(34px) rotate(2deg) scale(1.03); filter: brightness(1.25); }
        58% { transform: translateX(18px) rotate(-1deg) scale(0.99); filter: brightness(1.05); }
        100% { transform: translateX(0) rotate(0deg) scale(1); }
      }
      @keyframes battleCardClashRight {
        0% { transform: translateX(0) rotate(0deg) scale(1); }
        42% { transform: translateX(-34px) rotate(-2deg) scale(1.03); filter: brightness(1.25); }
        58% { transform: translateX(-18px) rotate(1deg) scale(0.99); filter: brightness(1.05); }
        100% { transform: translateX(0) rotate(0deg) scale(1); }
      }
      @keyframes battleVsPulse {
        0%, 100% { transform: scale(1); box-shadow: 0 0 0 rgba(217,70,239,0); }
        50% { transform: scale(1.12); box-shadow: 0 0 32px rgba(217,70,239,0.38); }
      }
      @keyframes battleRowReveal {
        from { opacity: 0; transform: translateY(12px) scale(0.98); filter: blur(4px); }
        to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
      }
      @keyframes battleFriction {
        0%, 100% { transform: translateX(-6%); opacity: 0.25; }
        50% { transform: translateX(6%); opacity: 0.55; }
      }
    `}</style>
  </div>
</div>
  );
}
