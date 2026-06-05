"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Crown,
  Gem,
  Heart,
  Loader2,
  PackageOpen,
  Sparkles,
  Star,
  Trophy,
  UserRound,
  Zap,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase/client";

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
  return new Intl.NumberFormat("pt-BR").format(value);
}

function normalizeRarity(value: unknown): RarityKey | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (["common", "comum"].includes(normalized)) {
    return "common";
  }

  if (["rare", "raro", "rara"].includes(normalized)) {
    return "rare";
  }

  if (["epic", "epico", "épico", "epica", "épica"].includes(normalized)) {
    return "epic";
  }

  if (["legendary", "lendario", "lendário", "lendaria", "lendária"].includes(normalized)) {
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
    "Criador Cardpoc"
  );
}

function getUserName(profile: UserProfileRow) {
  return (
    profile.display_name ||
    profile.full_name ||
    profile.name ||
    profile.username ||
    "Colecionador Cardpoc"
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
  detail: string,
): RankingItem {
  const id = String(creator.id ?? creator.username ?? crypto.randomUUID());
  const username = creator.username ?? undefined;

  return {
    id,
    name: getCreatorName(creator),
    username,
    avatarUrl: String(creator.image_url ?? creator.avatar_url ?? "") || undefined,
    value: formatNumber(value),
    detail,
    href: username ? `/creator/${username}` : undefined,
    rawValue: value,
  };
}

function buildCollectorRankingItem(
  profile: UserProfileRow,
  value: number,
  detail: string,
): RankingItem {
  const id = String(profile.id ?? profile.username ?? crypto.randomUUID());
  const username = profile.username ?? undefined;

  return {
    id,
    name: getUserName(profile),
    username,
    avatarUrl: String(profile.avatar_url ?? profile.image_url ?? "") || undefined,
    value: formatNumber(value),
    detail,
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
                "Este ranking aparece quando houver registros reais suficientes no Supabase.",
              )}
            </p>
          </div>
        ) : (
          block.items.map((item, index) => {
            const position = index + 1;
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
                    {item.username ? `@${item.username}` : item.detail}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-black text-cyan-100">{item.value}</p>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {item.detail}
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

      const [creatorsResult, profilesResult, cardsResult, openingsResult, followsResult] =
        await Promise.all([
          supabase.from("creator_profiles").select("*"),
          supabase.from("profiles").select("*"),
          supabase.from("user_cards").select("*"),
          supabase.from("pack_openings").select("*"),
          supabase.from("creator_followers").select("*"),
        ]);

      if (!mounted) {
        return;
      }

      const hasHardError = Boolean(creatorsResult.error || profilesResult.error || cardsResult.error);

      if (hasHardError) {
        console.error("Rankings load error", {
          creators: creatorsResult.error,
          profiles: profilesResult.error,
          cards: cardsResult.error,
          openings: openingsResult.error,
          follows: followsResult.error,
        });
        setCurrentUserId(userId);
        setCreatorBlocks(buildCreatorBlocks([], []));
        setCollectorBlocks(buildCollectorBlocks([], [], [], [], userId));
        setStatus("error");
        return;
      }

      const creators = (creatorsResult.data ?? []) as CreatorProfileRow[];
      const profiles = (profilesResult.data ?? []) as UserProfileRow[];
      const cards = (cardsResult.data ?? []) as UserCardRow[];
      const openings = ((openingsResult.data ?? []) as PackOpeningRow[]) ?? [];
      const follows = ((followsResult.data ?? []) as CreatorFollowerRow[]) ?? [];

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
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(34,211,238,0.10),transparent_24%),radial-gradient(circle_at_82%_16%,rgba(168,85,247,0.08),transparent_26%),radial-gradient(circle_at_50%_105%,rgba(14,165,233,0.07),transparent_34%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.035)_1px,transparent_1px)] bg-[size:64px_64px] opacity-30" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.44)_72%,rgba(0,0,0,0.9)_100%)]" />
      </div>

      <section className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-100 shadow-[0_0_32px_rgba(34,211,238,0.13)]">
            <Trophy className="h-4 w-4" />
            {translate(t, "rankingsEyebrow", "Ranking Cardpoc")}
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            {translate(t, "rankingsPageTitle", "Rankings")}
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
            {translate(
              t,
              "rankingsPageDescription",
              "Acompanhe rankings reais de criadores e colecionadores com base nos dados do Cardpoc.",
            )}
          </p>
        </div>

        <div className="mt-10 rounded-[2rem] border border-cyan-300/15 bg-black/24 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.26)]">
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
                      "Estas posições usam apenas dados reais do seu usuário no Cardpoc.",
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
              : translate(t, "rankingsRealDataNotice", "Dados reais do Supabase.")}
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

  const buildItems = (source: Map<string, number>, detail: string) => {
    return sortRankingItems(
      Array.from(source.entries()).flatMap(([creatorId, value]) => {
        const creator = creatorById.get(creatorId);

        if (!creator) {
          return [];
        }

        return [buildCreatorRankingItem(creator, value, detail)];
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
      items: buildItems(totalCardsByCreator, "cartas coletadas"),
    },
    {
      id: "creator-legendary",
      titleKey: "rankingsCreatorMostLegendaryCards",
      titleFallback: "Mais cartas lendárias",
      descriptionKey: "rankingsCreatorMostLegendaryCardsDescription",
      descriptionFallback: "Criadores com mais cartas lendárias distribuídas.",
      icon: Gem,
      items: buildItems(legendaryCardsByCreator, "lendárias em coleções"),
    },
    {
      id: "creator-epic",
      titleKey: "rankingsCreatorMostEpicCards",
      titleFallback: "Mais cartas épicas",
      descriptionKey: "rankingsCreatorMostEpicCardsDescription",
      descriptionFallback: "Criadores com mais cartas épicas distribuídas.",
      icon: Crown,
      items: buildItems(epicCardsByCreator, "épicas em coleções"),
    },
    {
      id: "creator-rare",
      titleKey: "rankingsCreatorMostRareCards",
      titleFallback: "Mais cartas raras",
      descriptionKey: "rankingsCreatorMostRareCardsDescription",
      descriptionFallback: "Criadores com mais cartas raras distribuídas.",
      icon: Star,
      items: buildItems(rareCardsByCreator, "raras em coleções"),
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

  const buildUserItemsFromMap = (source: Map<string, number>, detail: string) => {
    return sortRankingItems(
      Array.from(source.entries()).flatMap(([userId, value]) => {
        const profile = profileById.get(userId);

        if (!profile) {
          return [];
        }

        return [buildCollectorRankingItem(profile, value, detail)];
      }),
    );
  };

  const xpItems = sortRankingItems(
    profiles.map((profile) => {
      const xp = Number(profile.xp ?? 0);
      const level = Number(profile.level ?? 0);
      const detail = level > 0 ? `nível ${level}` : "XP acumulado";

      return buildCollectorRankingItem(profile, xp, detail);
    }),
  );

  const followingItems = sortRankingItems(
    Array.from(followingByUser.entries()).flatMap(([userId, creatorIds]) => {
      const profile = profileById.get(userId);

      if (!profile) {
        return [];
      }

      return [buildCollectorRankingItem(profile, creatorIds.size, "criadores seguidos")];
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
      items: buildUserItemsFromMap(cardsByUser, "cartas coletadas"),
    },
    {
      id: "collector-packs",
      titleKey: "rankingsCollectorMostOpenedPacks",
      titleFallback: "Mais pacotes abertos",
      descriptionKey: "rankingsCollectorMostOpenedPacksDescription",
      descriptionFallback: "Quem mais abriu pacotes dentro do Cardpoc.",
      icon: PackageOpen,
      items: buildUserItemsFromMap(packsByUser, "pacotes abertos"),
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
