"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Crown,
  Gem,
  Heart,
  Loader2,
  Medal,
  PackageOpen,
  Sparkles,
  Star,
  Trophy,
  UserRound,
  Zap,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase/client";
import { GlowBackground } from "@/components/effects/GlowBackground";
import { ParticleBackground } from "@/components/effects/ParticleBackground";

type RankingTab = "creators" | "collectors";
type RankingStatus = "idle" | "loading" | "ready" | "error";
type RarityKey = "common" | "rare" | "epic" | "legendary";

type CreatorProfileRow = Record<string, unknown> & {
  id?: string;
  name?: string | null;
  nickname?: string | null;
  display_name?: string | null;
  username?: string | null;
  image_url?: string | null;
  avatar_url?: string | null;
};

type UserProfileRow = Record<string, unknown> & {
  id?: string;
  username?: string | null;
  full_name?: string | null;
  display_name?: string | null;
  name?: string | null;
  avatar_url?: string | null;
  image_url?: string | null;
  xp?: number | null;
  level?: number | null;
};

type UserCardRow = Record<string, unknown> & {
  id?: string;
  user_id?: string | null;
  creator_id?: string | null;
  creator_profile_id?: string | null;
  rarity?: string | null;
};

type PackOpeningRow = Record<string, unknown> & {
  id?: string;
  user_id?: string | null;
  opened_by?: string | null;
  profile_id?: string | null;
};

type CreatorFollowerRow = Record<string, unknown> & {
  id?: string;
  user_id?: string | null;
  follower_id?: string | null;
  profile_id?: string | null;
  creator_id?: string | null;
  creator_profile_id?: string | null;
};

type RankingItem = {
  id: string;
  name: string;
  username?: string;
  avatarUrl?: string;
  value: string;
  detail: string;
  detailKey?: string;
  detailFallback?: string;
  detailValue?: string;
  href?: string;
  rawValue: number;
};

type RankingBlock = {
  id: string;
  titleKey: string;
  titleFallback: string;
  descriptionKey: string;
  descriptionFallback: string;
  icon: ComponentType<{ className?: string }>;
  items: RankingItem[];
};

type UserPositionMetric = {
  id: string;
  labelKey: string;
  labelFallback: string;
  value: string;
};

function translate(t: unknown, key: string, fallback: string) {
  try {
    const translateFn = t as (key: any, fallback?: string) => string;
    const value = translateFn(key as any, fallback);

    if (!value || value === key) {
      return fallback;
    }

    return value;
  } catch {
    return fallback;
  }
}

function formatNumber(value: number) {
  return new Intl.NumberFormat().format(value);
}

function normalizeRarity(value: unknown): RarityKey | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

  if (["common", "comum"].includes(normalized)) {
    return "common";
  }

  if (["rare", "raro", "rara"].includes(normalized)) {
    return "rare";
  }

  if (["epic", "epico", "epica"].includes(normalized)) {
    return "epic";
  }

  if (["legendary", "lendario", "lendaria", "legendario", "legendaria"].includes(normalized)) {
    return "legendary";
  }

  return null;
}

function getCreatorIdFromCard(card: UserCardRow) {
  return String(card.creator_id ?? card.creator_profile_id ?? "");
}

function getUserIdFromPackOpening(opening: PackOpeningRow) {
  return String(opening.user_id ?? opening.opened_by ?? opening.profile_id ?? "");
}

function getUserIdFromFollower(row: CreatorFollowerRow) {
  return String(row.user_id ?? row.follower_id ?? "");
}

function getCreatorIdFromFollower(row: CreatorFollowerRow) {
  return String(row.creator_id ?? row.creator_profile_id ?? row.profile_id ?? "");
}

function getCreatorName(creator: CreatorProfileRow) {
  return (
    creator.nickname ||
    creator.display_name ||
    creator.name ||
    creator.username ||
    "Cardpoc"
  );
}

function buildFallbackCreator(creatorId: string): CreatorProfileRow {
  return {
    id: creatorId,
    nickname: "Criador Cardpoc",
    username: undefined,
  };
}

function getUserName(profile: UserProfileRow) {
  return (
    profile.display_name ||
    profile.full_name ||
    profile.name ||
    profile.username ||
    "Cardpoc"
  );
}

function getRankBadgeClass(position: number) {
  if (position === 1) {
    return "border-amber-300/70 bg-amber-300/15 text-amber-100 shadow-[0_0_28px_rgba(251,191,36,0.22)]";
  }

  if (position === 2) {
    return "border-slate-200/50 bg-slate-200/10 text-slate-100 shadow-[0_0_24px_rgba(226,232,240,0.12)]";
  }

  if (position === 3) {
    return "border-orange-300/50 bg-orange-300/10 text-orange-100 shadow-[0_0_24px_rgba(251,146,60,0.12)]";
  }

  return "border-cyan-300/30 bg-cyan-300/10 text-cyan-100";
}

function sortRankingItems(items: RankingItem[]) {
  return [...items]
    .filter((item) => item.rawValue > 0)
    .sort((a, b) => b.rawValue - a.rawValue)
    .slice(0, 10);
}

function rankPosition(items: RankingItem[], userId?: string | null) {
  if (!userId) {
    return "—";
  }

  const index = items.findIndex((item) => item.id === userId);

  if (index < 0) {
    return "—";
  }

  return `#${index + 1}`;
}

function buildCreatorRankingItem(
  creator: CreatorProfileRow,
  value: number,
  detailKey: string,
  detailFallback: string,
): RankingItem {
  const id = String(creator.id ?? creator.username ?? crypto.randomUUID());
  const username = creator.username ?? undefined;

  return {
    id,
    name: getCreatorName(creator),
    username,
    avatarUrl: String(creator.image_url ?? creator.avatar_url ?? "") || undefined,
    value: formatNumber(value),
    detail: detailFallback,
    detailKey,
    detailFallback,
    href: username ? `/creator/${username}` : undefined,
    rawValue: value,
  };
}

function buildCollectorRankingItem(
  profile: UserProfileRow,
  value: number,
  detailKey: string,
  detailFallback: string,
  detailValue?: string,
): RankingItem {
  const id = String(profile.id ?? profile.username ?? crypto.randomUUID());
  const username = profile.username ?? undefined;

  return {
    id,
    name: getUserName(profile),
    username,
    avatarUrl: String(profile.avatar_url ?? profile.image_url ?? "") || undefined,
    value: formatNumber(value),
    detail: detailValue ? `${detailFallback} ${detailValue}` : detailFallback,
    detailKey,
    detailFallback,
    detailValue,
    rawValue: value,
  };
}

function RankingCard({ block, status }: { block: RankingBlock; status: RankingStatus }) {
  const { t } = useLanguage();
  const Icon = block.icon;
  const isLoading = status === "loading" || status === "idle";

  return (
    <article className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/28 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.28)] transition duration-300 hover:-translate-y-1 hover:border-cyan-300/35 hover:shadow-[0_28px_110px_rgba(34,211,238,0.13)]">
      <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-cyan-400/10 blur-3xl transition duration-300 group-hover:bg-cyan-300/16" />
      <div className="pointer-events-none absolute -bottom-20 -left-16 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-100 shadow-[0_0_32px_rgba(34,211,238,0.16)]">
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-black tracking-tight text-white">
            {translate(t, block.titleKey, block.titleFallback)}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-400">
            {translate(t, block.descriptionKey, block.descriptionFallback)}
          </p>
        </div>
      </div>

      <div className="relative mt-5 space-y-3">
        {isLoading ? (
          <div className="flex min-h-40 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.025] text-sm font-bold text-slate-400">
            <Loader2 className="mr-2 h-4 w-4 animate-spin text-cyan-100" />
            {translate(t, "rankingsLoading", "Carregando dados reais...")}
          </div>
        ) : block.items.length === 0 ? (
          <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-white/12 bg-white/[0.025] px-5 text-center">
            <AlertCircle className="h-5 w-5 text-cyan-100/80" />
            <p className="mt-3 text-sm font-black text-white">
              {translate(t, "rankingsEmptyTitle", "Sem dados suficientes")}
            </p>
            <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
              {translate(
                t,
                "rankingsEmptyDescription",
                "Este ranking aparece quando houver registros reais suficientes no Cardpoc.",
              )}
            </p>
          </div>
        ) : (
          block.items.map((item, index) => {
            const position = index + 1;
            const translatedDetail = item.detailKey
              ? `${translate(t, item.detailKey, item.detailFallback ?? item.detail)}${
                  item.detailValue ? ` ${item.detailValue}` : ""
                }`
              : item.detail;

            const content = (
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3 transition duration-300 hover:border-cyan-300/25 hover:bg-cyan-300/[0.055]">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border text-sm font-black ${getRankBadgeClass(
                    position,
                  )}`}
                >
                  #{position}
                </div>

                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-300/15 via-violet-400/10 to-fuchsia-500/15 text-sm font-black text-white">
                  {item.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    item.name.slice(0, 2).toUpperCase()
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold text-white">{item.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {item.username ? `@${item.username}` : translatedDetail}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-black text-cyan-100">{item.value}</p>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {translatedDetail}
                  </p>
                </div>
              </div>
            );

            if (item.href) {
              return (
                <Link key={item.id} href={item.href} className="block">
                  {content}
                </Link>
              );
            }

            return <div key={item.id}>{content}</div>;
          })
        )}
      </div>
    </article>
  );
}

export default function RankingsPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<RankingTab>("creators");
  const [status, setStatus] = useState<RankingStatus>("idle");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [creatorBlocks, setCreatorBlocks] = useState<RankingBlock[]>([]);
  const [collectorBlocks, setCollectorBlocks] = useState<RankingBlock[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadRankings() {
      setStatus("loading");

      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id ?? null;

      const [
        creatorsResult,
        profilesResult,
        cardsResult,
        openingsResult,
        followsResult,
        publicSnapshotResult,
      ] = await Promise.all([
        supabase.from("creator_profiles").select("*"),
        supabase.from("profiles").select("*"),
        supabase.from("user_cards").select("id,user_id,creator_id,rarity,created_at"),
        supabase.from("pack_openings").select("*"),
        supabase.from("creator_followers").select("*"),
        (supabase as any).rpc("get_public_rankings_snapshot"),
      ]);

      if (!mounted) {
        return;
      }

      const hasHardError = Boolean(creatorsResult.error || profilesResult.error || cardsResult.error);

      const snapshot = (publicSnapshotResult?.data ?? null) as
        | {
            creators?: CreatorProfileRow[];
            profiles?: UserProfileRow[];
            cards?: UserCardRow[];
            openings?: PackOpeningRow[];
            follows?: CreatorFollowerRow[];
          }
        | null;

      const hasSnapshot =
        !publicSnapshotResult?.error &&
        snapshot &&
        Array.isArray(snapshot.creators) &&
        Array.isArray(snapshot.cards);

      if (hasHardError && !hasSnapshot) {
        console.error("Rankings load error", {
          creators: creatorsResult.error,
          profiles: profilesResult.error,
          cards: cardsResult.error,
          openings: openingsResult.error,
          follows: followsResult.error,
          publicSnapshot: publicSnapshotResult?.error,
        });
        setCurrentUserId(userId);
        setCreatorBlocks(buildCreatorBlocks([], []));
        setCollectorBlocks(buildCollectorBlocks([], [], [], [], userId));
        setStatus("error");
        return;
      }

      const profiles = (hasSnapshot ? snapshot?.profiles ?? [] : profilesResult.data ?? []) as UserProfileRow[];
      const cards = (hasSnapshot ? snapshot?.cards ?? [] : cardsResult.data ?? []) as UserCardRow[];
      const openings = (hasSnapshot ? snapshot?.openings ?? [] : openingsResult.data ?? []) as PackOpeningRow[];
      const follows = (hasSnapshot ? snapshot?.follows ?? [] : followsResult.data ?? []) as CreatorFollowerRow[];

      let creators = (hasSnapshot ? snapshot?.creators ?? [] : creatorsResult.data ?? []) as CreatorProfileRow[];
      const loadedCreatorIds = new Set(
        creators.map((creator) => String(creator.id ?? "")).filter(Boolean),
      );
      const cardCreatorIds = Array.from(
        new Set(cards.map((card) => getCreatorIdFromCard(card)).filter(Boolean)),
      );
      const missingCreatorIds = cardCreatorIds.filter((creatorId) => !loadedCreatorIds.has(creatorId));

      if (missingCreatorIds.length > 0) {
        const { data: missingCreators, error: missingCreatorsError } = await supabase
          .from("creator_profiles")
          .select("*")
          .in("id", missingCreatorIds);

        if (!missingCreatorsError && missingCreators?.length) {
          creators = [...creators, ...((missingCreators ?? []) as CreatorProfileRow[])];
        }
      }

      setCurrentUserId(userId);
      setCreatorBlocks(buildCreatorBlocks(creators, cards));
      setCollectorBlocks(buildCollectorBlocks(profiles, cards, openings, follows, userId));
      setStatus("ready");
    }

    loadRankings();

    return () => {
      mounted = false;
    };
  }, []);

  const activeBlocks = useMemo(() => {
    return activeTab === "creators" ? creatorBlocks : collectorBlocks;
  }, [activeTab, creatorBlocks, collectorBlocks]);

  const userPositionMetrics = useMemo<UserPositionMetric[]>(() => {
    const xpItems = collectorBlocks.find((block) => block.id === "collector-xp")?.items ?? [];
    const cardItems = collectorBlocks.find((block) => block.id === "collector-cards")?.items ?? [];
    const packItems = collectorBlocks.find((block) => block.id === "collector-packs")?.items ?? [];
    const followingItems = collectorBlocks.find((block) => block.id === "collector-following")?.items ?? [];

    return [
      {
        id: "xp-position",
        labelKey: "rankingsXpPosition",
        labelFallback: "XP",
        value: rankPosition(xpItems, currentUserId),
      },
      {
        id: "cards-position",
        labelKey: "rankingsCardsPosition",
        labelFallback: "Cartas",
        value: rankPosition(cardItems, currentUserId),
      },
      {
        id: "packs-position",
        labelKey: "rankingsPacksPosition",
        labelFallback: "Pacotes",
        value: rankPosition(packItems, currentUserId),
      },
      {
        id: "following-position",
        labelKey: "rankingsFollowingPosition",
        labelFallback: "Seguindo",
        value: rankPosition(followingItems, currentUserId),
      },
    ];
  }, [collectorBlocks, currentUserId]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020607] text-white">
      <GlowBackground />
      <ParticleBackground />

      <section className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 sm:pt-16 lg:px-8 lg:pt-20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-100 shadow-[0_0_32px_rgba(34,211,238,0.13)]">
              <Trophy className="h-4 w-4" />
              {translate(t, "rankingsEyebrow", "Ranking Cardpoc")}
            </div>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
              {translate(t, "rankingsPageTitle", "Rankings")}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
              {translate(
                t,
                "rankingsPageDescription",
                "Acompanhe os criadores e colecionadores que mais se destacam no Cardpoc.",
              )}
            </p>
          </div>

          <div className="hidden rounded-3xl border border-white/10 bg-black/20 px-4 py-3 text-right text-xs font-semibold text-slate-500 shadow-[0_18px_70px_rgba(0,0,0,0.24)] sm:block">
            {status === "error"
              ? translate(t, "rankingsErrorNotice", "Não foi possível carregar alguns dados agora.")
              : translate(t, "rankingsRealDataNotice", "Rankings atualizados com dados reais.")}
          </div>
        </div>

        <div className="mt-6 rounded-[2rem] border border-cyan-300/15 bg-black/24 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.26)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-cyan-100">
                <Medal className="h-3.5 w-3.5" />
                {translate(t, "rankingsYourPosition", "Sua posição")}
              </div>
              <h2 className="mt-4 text-xl font-black text-white">
                {translate(t, "rankingsYourProgressTitle", "Seu progresso nos rankings")}
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-400">
                {currentUserId
                  ? translate(
                      t,
                      "rankingsYourProgressDescription",
                      "Acompanhe sua evolução em XP, cartas, pacotes e criadores seguidos.",
                    )
                  : translate(
                      t,
                      "rankingsYourProgressLoggedOutDescription",
                      "Entre na sua conta para ver sua posição real em XP, cartas, pacotes e criadores seguidos.",
                    )}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[520px]">
              {userPositionMetrics.map((metric) => (
                <div
                  key={metric.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-4 text-center"
                >
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                    {translate(t, metric.labelKey, metric.labelFallback)}
                  </p>
                  <p className="mt-1 text-2xl font-black text-cyan-100">{metric.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-stretch justify-between gap-4 rounded-[2rem] border border-white/10 bg-black/20 p-3 sm:flex-row sm:items-center">
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <button
              type="button"
              onClick={() => setActiveTab("creators")}
              className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition ${
                activeTab === "creators"
                  ? "border border-cyan-300/35 bg-cyan-300/12 text-cyan-50 shadow-[0_0_28px_rgba(34,211,238,0.13)]"
                  : "border border-transparent text-slate-400 hover:bg-white/[0.055] hover:text-white"
              }`}
            >
              <Star className="h-4 w-4" />
              {translate(t, "rankingsCreatorsTab", "Criadores")}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("collectors")}
              className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition ${
                activeTab === "collectors"
                  ? "border border-violet-300/35 bg-violet-300/12 text-violet-50 shadow-[0_0_28px_rgba(168,85,247,0.13)]"
                  : "border border-transparent text-slate-400 hover:bg-white/[0.055] hover:text-white"
              }`}
            >
              <UserRound className="h-4 w-4" />
              {translate(t, "rankingsCollectorsTab", "Colecionadores")}
            </button>
          </div>

          <p className="px-2 text-center text-xs font-semibold text-slate-500 sm:text-right">
            {status === "error"
              ? translate(t, "rankingsErrorNotice", "Não foi possível carregar alguns dados agora.")
              : translate(t, "rankingsRealDataNotice", "Rankings atualizados com dados reais.")}
          </p>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {activeBlocks.map((block) => (
            <RankingCard key={block.id} block={block} status={status} />
          ))}
        </div>
      </section>
    </main>
  );
}

function buildCreatorBlocks(
  creators: CreatorProfileRow[],
  cards: UserCardRow[],
): RankingBlock[] {
  const creatorById = new Map<string, CreatorProfileRow>();

  creators.forEach((creator) => {
    if (creator.id) {
      creatorById.set(String(creator.id), creator);
    }
  });

  const totalCardsByCreator = new Map<string, number>();
  const legendaryCardsByCreator = new Map<string, number>();
  const epicCardsByCreator = new Map<string, number>();
  const rareCardsByCreator = new Map<string, number>();

  cards.forEach((card) => {
    const creatorId = getCreatorIdFromCard(card);

    if (!creatorId) {
      return;
    }

    totalCardsByCreator.set(creatorId, (totalCardsByCreator.get(creatorId) ?? 0) + 1);

    const rarity = normalizeRarity(card.rarity);

    if (rarity === "legendary") {
      legendaryCardsByCreator.set(
        creatorId,
        (legendaryCardsByCreator.get(creatorId) ?? 0) + 1,
      );
    }

    if (rarity === "epic") {
      epicCardsByCreator.set(creatorId, (epicCardsByCreator.get(creatorId) ?? 0) + 1);
    }

    if (rarity === "rare") {
      rareCardsByCreator.set(creatorId, (rareCardsByCreator.get(creatorId) ?? 0) + 1);
    }
  });

  const buildItems = (
    source: Map<string, number>,
    detailKey: string,
    detailFallback: string,
  ) => {
    return sortRankingItems(
      Array.from(source.entries()).flatMap(([creatorId, value]) => {
        const creator = creatorById.get(creatorId) ?? buildFallbackCreator(creatorId);

        return [buildCreatorRankingItem(creator, value, detailKey, detailFallback)];
      }),
    );
  };

  return [
    {
      id: "creator-collected",
      titleKey: "rankingsCreatorMostCollected",
      titleFallback: "Mais colecionado",
      descriptionKey: "rankingsCreatorMostCollectedDescription",
      descriptionFallback: "Quantidade total de cartas desse criador nas coleções.",
      icon: Sparkles,
      items: buildItems(totalCardsByCreator, "rankingsCollectedCardsLabel", "cartas coletadas"),
    },
    {
      id: "creator-legendary",
      titleKey: "rankingsCreatorMostLegendaryCards",
      titleFallback: "Mais cartas lendárias",
      descriptionKey: "rankingsCreatorMostLegendaryCardsDescription",
      descriptionFallback: "Criadores com mais cartas lendárias distribuídas.",
      icon: Gem,
      items: buildItems(legendaryCardsByCreator, "rankingsLegendaryCardsInCollectionsLabel", "lendárias em coleções"),
    },
    {
      id: "creator-epic",
      titleKey: "rankingsCreatorMostEpicCards",
      titleFallback: "Mais cartas épicas",
      descriptionKey: "rankingsCreatorMostEpicCardsDescription",
      descriptionFallback: "Criadores com mais cartas épicas distribuídas.",
      icon: Crown,
      items: buildItems(epicCardsByCreator, "rankingsEpicCardsInCollectionsLabel", "épicas em coleções"),
    },
    {
      id: "creator-rare",
      titleKey: "rankingsCreatorMostRareCards",
      titleFallback: "Mais cartas raras",
      descriptionKey: "rankingsCreatorMostRareCardsDescription",
      descriptionFallback: "Criadores com mais cartas raras distribuídas.",
      icon: Star,
      items: buildItems(rareCardsByCreator, "rankingsRareCardsInCollectionsLabel", "raras em coleções"),
    },
  ];
}

function buildCollectorBlocks(
  profiles: UserProfileRow[],
  cards: UserCardRow[],
  openings: PackOpeningRow[],
  follows: CreatorFollowerRow[],
  currentUserId: string | null,
): RankingBlock[] {
  const profileById = new Map<string, UserProfileRow>();

  profiles.forEach((profile) => {
    if (profile.id) {
      profileById.set(String(profile.id), profile);
    }
  });

  if (currentUserId && !profileById.has(currentUserId)) {
    profileById.set(currentUserId, { id: currentUserId, username: "" });
  }

  const cardsByUser = new Map<string, number>();
  const packsByUser = new Map<string, number>();
  const followingByUser = new Map<string, Set<string>>();

  cards.forEach((card) => {
    const userId = String(card.user_id ?? "");

    if (!userId) {
      return;
    }

    cardsByUser.set(userId, (cardsByUser.get(userId) ?? 0) + 1);
  });

  openings.forEach((opening) => {
    const userId = getUserIdFromPackOpening(opening);

    if (!userId) {
      return;
    }

    packsByUser.set(userId, (packsByUser.get(userId) ?? 0) + 1);
  });

  follows.forEach((follow) => {
    const userId = getUserIdFromFollower(follow);
    const creatorId = getCreatorIdFromFollower(follow);

    if (!userId || !creatorId) {
      return;
    }

    if (!followingByUser.has(userId)) {
      followingByUser.set(userId, new Set<string>());
    }

    followingByUser.get(userId)?.add(creatorId);
  });

  const buildUserItemsFromMap = (
    source: Map<string, number>,
    detailKey: string,
    detailFallback: string,
  ) => {
    return sortRankingItems(
      Array.from(source.entries()).flatMap(([userId, value]) => {
        const profile = profileById.get(userId);

        if (!profile) {
          return [];
        }

        return [buildCollectorRankingItem(profile, value, detailKey, detailFallback)];
      }),
    );
  };

  const xpItems = sortRankingItems(
    profiles.map((profile) => {
      const xp = Number(profile.xp ?? 0);
      const level = Number(profile.level ?? 0);
      return level > 0
        ? buildCollectorRankingItem(
            profile,
            xp,
            "rankingsLevelDetailLabel",
            "nível",
            String(level),
          )
        : buildCollectorRankingItem(
            profile,
            xp,
            "rankingsAccumulatedXpLabel",
            "XP acumulado",
          );
    }),
  );

  const followingItems = sortRankingItems(
    Array.from(followingByUser.entries()).flatMap(([userId, creatorIds]) => {
      const profile = profileById.get(userId);

      if (!profile) {
        return [];
      }

      return [
        buildCollectorRankingItem(
          profile,
          creatorIds.size,
          "rankingsFollowedCreatorsLabel",
          "criadores seguidos",
        ),
      ];
    }),
  );

  return [
    {
      id: "collector-xp",
      titleKey: "rankingsCollectorMostXp",
      titleFallback: "Mais XP",
      descriptionKey: "rankingsCollectorMostXpDescription",
      descriptionFallback: "Colecionadores com maior experiência acumulada.",
      icon: Zap,
      items: xpItems,
    },
    {
      id: "collector-cards",
      titleKey: "rankingsCollectorMostCards",
      titleFallback: "Mais cartas",
      descriptionKey: "rankingsCollectorMostCardsDescription",
      descriptionFallback: "Usuários com mais cartas na coleção.",
      icon: Sparkles,
      items: buildUserItemsFromMap(
        cardsByUser,
        "rankingsCollectedCardsLabel",
        "cartas coletadas",
      ),
    },
    {
      id: "collector-packs",
      titleKey: "rankingsCollectorMostOpenedPacks",
      titleFallback: "Mais pacotes abertos",
      descriptionKey: "rankingsCollectorMostOpenedPacksDescription",
      descriptionFallback: "Quem mais abriu pacotes dentro do Cardpoc.",
      icon: PackageOpen,
      items: buildUserItemsFromMap(
        packsByUser,
        "rankingsOpenedPacksLabel",
        "pacotes abertos",
      ),
    },
    {
      id: "collector-following",
      titleKey: "rankingsCollectorMostFollowedCreators",
      titleFallback: "Mais criadores seguidos",
      descriptionKey: "rankingsCollectorMostFollowedCreatorsDescription",
      descriptionFallback: "Usuários que mais acompanham criadores na plataforma.",
      icon: Heart,
      items: followingItems,
    },
  ];
}
