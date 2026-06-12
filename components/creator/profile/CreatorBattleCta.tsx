import type { useLanguage } from "@/contexts/LanguageContext";
import { Sparkles } from "lucide-react";

import { translate } from "@/lib/i18n/translate";

type TranslateFunction = ReturnType<typeof useLanguage>["t"];

type CreatorBattleCtaProps = {
  t: TranslateFunction;
  disabled: boolean;
  onOpen: () => void;
};

export function CreatorBattleCta({ t, disabled, onOpen }: CreatorBattleCtaProps) {
  return (
    <div className="mt-5 overflow-hidden rounded-[1.8rem] border border-fuchsia-300/15 bg-[radial-gradient(circle_at_82%_50%,rgba(217,70,239,0.16),transparent_34%),linear-gradient(135deg,rgba(34,211,238,0.08),rgba(217,70,239,0.08),rgba(0,0,0,0.18))] p-5 shadow-2xl shadow-fuchsia-500/5 backdrop-blur-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-fuchsia-100/80">
            <Sparkles className="h-4 w-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.24em]">
              {translate(t, "creatorProfileBattleMode", "Batalha de criadores")}
            </p>
          </div>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-white/55">
            {translate(t, "creatorProfileBattleModeDescription", "Desafie outro criador e veja a comparação em uma arena animada.")}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpen}
          disabled={disabled}
          className="inline-flex items-center justify-center gap-2 rounded-[1.15rem] border border-fuchsia-300/30 bg-fuchsia-400/15 px-6 py-3.5 text-sm font-black uppercase tracking-[0.16em] text-fuchsia-50 shadow-lg shadow-fuchsia-500/10 transition hover:bg-fuchsia-400/25 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <Sparkles className="h-4 w-4" />
          {translate(t, "creatorProfileBattleOpenArena", "Iniciar batalha")}
        </button>
      </div>
    </div>
  );
}
