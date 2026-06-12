import type { useLanguage } from "@/contexts/LanguageContext";
import { Eye, Globe2, Share2, Users } from "lucide-react";

import { translate } from "@/lib/i18n/translate";
import { formatNumber } from "./creator-profile-shared";
import type { CreatorStats } from "./creator-profile-shared";

type TranslateFunction = ReturnType<typeof useLanguage>["t"];

type CreatorProfileStatsGridProps = {
  t: TranslateFunction;
  stats: CreatorStats;
  externalReach: number;
  liveStatusLoading: boolean;
};

export function CreatorProfileStatsGrid({
  t,
  stats,
  externalReach,
  liveStatusLoading,
}: CreatorProfileStatsGridProps) {
  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-[1.4rem] border border-cyan-300/15 bg-cyan-300/[0.06] p-5 backdrop-blur-xl">
        <div className="flex items-center gap-2 text-cyan-100/55">
          <Eye className="h-4 w-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.22em]">
            {translate(t, "creatorProfileViews", "Visualizações")}
          </p>
        </div>
        <p className="mt-3 text-3xl font-black">{formatNumber(stats.views)}</p>
      </div>

      <div className="rounded-[1.4rem] border border-fuchsia-300/15 bg-fuchsia-300/[0.06] p-5 backdrop-blur-xl">
        <div className="flex items-center gap-2 text-fuchsia-100/55">
          <Users className="h-4 w-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.22em]">
            {translate(t, "creatorProfileCardpocReach", "Alcance Cardpoc")}
          </p>
        </div>
        <p className="mt-3 text-3xl font-black">{formatNumber(stats.followers)}</p>
      </div>

      <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
        <div className="flex items-center gap-2 text-white/40">
          <Globe2 className="h-4 w-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.22em]">
            {translate(t, "creatorProfileGlobalReach", "Alcance global")}
          </p>
        </div>
        <p className="mt-3 text-3xl font-black">
          {liveStatusLoading ? "..." : formatNumber(externalReach)}
        </p>
      </div>

      <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
        <div className="flex items-center gap-2 text-white/40">
          <Share2 className="h-4 w-4" />
          <p className="text-[9px] font-black uppercase leading-tight tracking-[0.16em] [overflow-wrap:anywhere]">
            {translate(t, "creatorProfileSharedImpact", "Compartilhamentos")}
          </p>
        </div>
        <p className="mt-3 text-3xl font-black">{formatNumber(stats.shares)}</p>
      </div>
    </div>
  );
}
