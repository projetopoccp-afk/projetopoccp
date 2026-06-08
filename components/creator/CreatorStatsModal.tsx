"use client";

import {
  Activity,
  BarChart3,
  ExternalLink,
  Eye,
  Globe2,
  Layers3,
  Share2,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import type { ReactNode } from "react";

import { useLanguage } from "@/contexts/LanguageContext";
import { translate } from "@/lib/i18n/translate";

type CreatorStatsSummary = {
  views: number;
  followers: number;
  shares: number;
};

type CreatorCollectionStatsSummary = {
  common: number;
  rare: number;
  epic: number;
  legendary: number;
  total: number;
  uniqueCollectors: number;
};

type CreatorLiveStatusSummary = {
  platform?: string;
  username?: string;
  isLive?: boolean;
  title?: string;
  viewerCount?: number;
  followerCount?: number;
  subscriberCount?: number;
  viewCount?: number;
  videoCount?: number;
  externalCount?: number;
  memberCount?: number;
  onlineMemberCount?: number;
  url?: string;
};

type CreatorStatsModalProps = {
  open: boolean;
  onClose: () => void;
  creatorName: string;
  stats: CreatorStatsSummary;
  collectionStats: CreatorCollectionStatsSummary;
  liveStatus: Partial<Record<string, CreatorLiveStatusSummary>>;
  externalReach: number;
  cardLevel: number;
  profileXp: number;
  dropsCount?: number;
};

function formatNumber(value: number | null | undefined) {
  const number = Number(value || 0);

  return new Intl.NumberFormat("pt-BR", {
    notation: Math.abs(number) >= 10000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(number);
}

function getPlatformLabel(platform: string) {
  const normalized = platform.toLowerCase();

  if (normalized.startsWith("youtube")) return "YouTube";
  if (normalized === "twitch") return "Twitch";
  if (normalized === "kick") return "Kick";
  if (normalized === "discord") return "Discord";

  return platform;
}

function getExternalCount(status: CreatorLiveStatusSummary | undefined) {
  return Number(
    status?.subscriberCount ??
      status?.followerCount ??
      status?.memberCount ??
      status?.externalCount ??
      0,
  );
}

export function CreatorStatsModal({
  open,
  onClose,
  creatorName,
  stats,
  collectionStats,
  liveStatus,
  externalReach,
  cardLevel,
  profileXp,
  dropsCount = 0,
}: CreatorStatsModalProps) {
  const { t } = useLanguage();

  if (!open) return null;

  const platformRows = Object.entries(liveStatus)
    .map(([key, status]) => ({
      key,
      platform: getPlatformLabel(key),
      count: getExternalCount(status),
      liveViewers: status?.isLive ? Number(status?.viewerCount || 0) : 0,
      isLive: Boolean(status?.isLive),
      url: status?.url,
    }))
    .filter((row) => row.count > 0 || row.liveViewers > 0 || row.url)
    .sort((a, b) => b.count + b.liveViewers - (a.count + a.liveViewers));

  const rarityRows = [
    {
      label: translate(t, "rarityCommon", "Comum"),
      value: collectionStats.common,
      className: "from-white/12 to-white/5 text-white/80",
    },
    {
      label: translate(t, "rarityRare", "Raro"),
      value: collectionStats.rare,
      className: "from-cyan-300/18 to-blue-500/8 text-cyan-100",
    },
    {
      label: translate(t, "rarityEpic", "Épico"),
      value: collectionStats.epic,
      className: "from-fuchsia-300/18 to-purple-500/8 text-fuchsia-100",
    },
    {
      label: translate(t, "rarityLegendary", "Lendário"),
      value: collectionStats.legendary,
      className: "from-amber-300/20 to-yellow-600/8 text-amber-100",
    },
  ];

  const cardsPerCollector =
    collectionStats.uniqueCollectors > 0
      ? collectionStats.total / collectionStats.uniqueCollectors
      : 0;

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/78 px-4 py-6 backdrop-blur-sm sm:px-6">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label={translate(t, "creatorStatsClose", "Fechar estatísticas")}
      />

      <section className="relative z-10 max-h-[min(88vh,820px)] w-full max-w-5xl overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#090b13]/96 shadow-2xl shadow-cyan-500/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(34,211,238,0.18),transparent_34%),radial-gradient(circle_at_82%_12%,rgba(217,70,239,0.16),transparent_36%),linear-gradient(135deg,rgba(255,255,255,0.06),transparent_34%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.04)_1px,transparent_1px)] bg-[size:34px_34px] opacity-70" />

        <div className="relative flex items-start justify-between gap-4 border-b border-white/10 px-5 py-5 sm:px-7">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-100">
              <BarChart3 className="h-3.5 w-3.5" />
              {translate(t, "creatorStatsBadge", "Estatísticas")}
            </div>
            <h2 className="mt-3 truncate text-2xl font-black tracking-tight text-white sm:text-3xl">
              {creatorName}
            </h2>
            <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-white/55">
              {translate(
                t,
                "creatorStatsDescription",
                "Resumo de crescimento, coleção e alcance do criador dentro e fora do Cardpoc.",
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label={translate(t, "creatorStatsClose", "Fechar estatísticas")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative max-h-[calc(min(88vh,820px)-104px)] overflow-y-auto px-5 py-5 sm:px-7 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={<Eye className="h-4 w-4" />}
              label={translate(t, "creatorProfileViews", "Visualizações")}
              value={formatNumber(stats.views)}
              tone="cyan"
            />
            <StatCard
              icon={<Users className="h-4 w-4" />}
              label={translate(t, "creatorProfileCardpocReach", "Alcance Cardpoc")}
              value={formatNumber(stats.followers)}
              tone="fuchsia"
            />
            <StatCard
              icon={<Globe2 className="h-4 w-4" />}
              label={translate(t, "creatorProfileGlobalReach", "Alcance global")}
              value={formatNumber(externalReach)}
              tone="white"
            />
            <StatCard
              icon={<Share2 className="h-4 w-4" />}
              label={translate(t, "creatorProfileSharedImpact", "Compartilhamentos")}
              value={formatNumber(stats.shares)}
              tone="white"
            />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[1.6rem] border border-cyan-300/15 bg-cyan-300/[0.05] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-100/65">
                    {translate(t, "creatorStatsCollectionTitle", "Coleção")}
                  </p>
                  <h3 className="mt-1 text-lg font-black text-white">
                    {translate(t, "creatorStatsCollectedCards", "Cartas coletadas")}
                  </h3>
                </div>
                <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 p-3 text-cyan-100">
                  <Layers3 className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <MiniMetric
                  label={translate(t, "creatorStatsTotalCards", "Total")}
                  value={formatNumber(collectionStats.total)}
                />
                <MiniMetric
                  label={translate(t, "creatorStatsCollectors", "Colecionadores")}
                  value={formatNumber(collectionStats.uniqueCollectors)}
                />
                <MiniMetric
                  label={translate(t, "creatorStatsCardsPerCollector", "Média")}
                  value={cardsPerCollector > 0 ? cardsPerCollector.toFixed(1) : "0"}
                />
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {rarityRows.map((rarity) => {
                  const percentage =
                    collectionStats.total > 0
                      ? Math.round((rarity.value / collectionStats.total) * 100)
                      : 0;

                  return (
                    <div
                      key={rarity.label}
                      className={`rounded-2xl border border-white/10 bg-gradient-to-br ${rarity.className} p-3`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em]">
                          {rarity.label}
                        </p>
                        <p className="text-sm font-black text-white">
                          {formatNumber(rarity.value)}
                        </p>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/30">
                        <div
                          className="h-full rounded-full bg-current opacity-80"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-fuchsia-300/15 bg-fuchsia-300/[0.045] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-fuchsia-100/65">
                    {translate(t, "creatorStatsProgressTitle", "Crescimento")}
                  </p>
                  <h3 className="mt-1 text-lg font-black text-white">
                    {translate(t, "creatorStatsCardpocProgress", "Progresso no Cardpoc")}
                  </h3>
                </div>
                <div className="rounded-full border border-fuchsia-300/20 bg-fuchsia-300/10 p-3 text-fuchsia-100">
                  <Sparkles className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <MiniMetric
                  label={translate(t, "creatorStatsLevel", "Nível")}
                  value={formatNumber(cardLevel)}
                />
                <MiniMetric
                  label={translate(t, "creatorStatsXp", "XP")}
                  value={formatNumber(profileXp)}
                />
                <MiniMetric
                  label={translate(t, "creatorStatsDrops", "Drops")}
                  value={formatNumber(dropsCount)}
                />
                <MiniMetric
                  label={translate(t, "creatorStatsLiveNow", "Ao vivo agora")}
                  value={formatNumber(
                    platformRows.reduce((total, row) => total + row.liveViewers, 0),
                  )}
                />
              </div>

              <p className="mt-5 rounded-2xl border border-white/10 bg-black/24 p-4 text-sm font-semibold leading-6 text-white/55">
                {translate(
                  t,
                  "creatorStatsGrowthHint",
                  "Quanto mais o perfil é visitado, seguido, compartilhado, coletado e usado em drops, maior tende a ser o crescimento dentro do Cardpoc.",
                )}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/45">
                  {translate(t, "creatorStatsExternalTitle", "Redes externas")}
                </p>
                <h3 className="mt-1 text-lg font-black text-white">
                  {translate(t, "creatorStatsExternalGrowth", "Alcance fora da plataforma")}
                </h3>
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.06] p-3 text-white/70">
                <Activity className="h-5 w-5" />
              </div>
            </div>

            {platformRows.length > 0 ? (
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {platformRows.map((row) => (
                  <div
                    key={row.key}
                    className="rounded-2xl border border-white/10 bg-black/22 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-white">{row.platform}</p>
                        <p className="mt-1 text-xs font-semibold text-white/45">
                          {row.isLive
                            ? translate(t, "creatorStatsCurrentlyLive", "Ao vivo")
                            : translate(t, "creatorStatsExternalMetric", "Métrica externa")}
                        </p>
                      </div>
                      {row.url ? (
                        <a
                          href={row.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/70 transition hover:bg-white/10 hover:text-white"
                          aria-label={row.platform}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      ) : null}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <MiniMetric
                        label={translate(t, "creatorStatsReach", "Alcance")}
                        value={formatNumber(row.count)}
                      />
                      <MiniMetric
                        label={translate(t, "creatorStatsViewers", "Viewers")}
                        value={formatNumber(row.liveViewers)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-5 rounded-2xl border border-white/10 bg-black/22 p-4 text-sm font-semibold text-white/45">
                {translate(
                  t,
                  "creatorStatsNoExternalData",
                  "Ainda não há métricas externas disponíveis para este perfil.",
                )}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone: "cyan" | "fuchsia" | "white";
}) {
  const toneClass =
    tone === "cyan"
      ? "border-cyan-300/15 bg-cyan-300/[0.06] text-cyan-100"
      : tone === "fuchsia"
        ? "border-fuchsia-300/15 bg-fuchsia-300/[0.06] text-fuchsia-100"
        : "border-white/10 bg-white/[0.04] text-white/75";

  return (
    <div className={`rounded-[1.4rem] border p-5 ${toneClass}`}>
      <div className="flex items-center gap-2 opacity-70">
        {icon}
        <p className="text-[10px] font-black uppercase tracking-[0.2em]">
          {label}
        </p>
      </div>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/24 p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>
      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}
