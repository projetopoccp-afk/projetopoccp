"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

import { CreatorCard } from "@/components/cards/CreatorCard";
import { CreatorPopup } from "@/components/creator/CreatorPopup";
import { useLanguage } from "@/contexts/LanguageContext";
import { translate } from "@/lib/i18n/translate";
import { supabase } from "@/lib/supabase/client";
import { Creator } from "@/types/creator";

type CreatorGridProps = {
  search: string;
};

type CreatorWithMeta = Creator & {
  createdAt: string;
  trendingScore: number;
};

type ActiveDrop = {
  id: string;
  creatorId: string;
  createdAt: string;
  creator?: CreatorWithMeta;
};

const RARITY_SHOWCASE_CYCLE = [
  { rarity: "common" },
  { rarity: "rare" },
  { rarity: "epic" },
  { rarity: "legendary" },
] as const;

const RARITY_SHOWCASE_INTERVAL = 9800;
const HOME_SHOWCASE_LIMIT = 32;
const HOME_SHOWCASE_ROTATION_INTERVAL = 30000;
const RARITY_STACK_TRANSITION = {
  duration: 0.72,
  ease: [0.22, 1, 0.36, 1],
} as const;

function normalizeCreatorTags(tags: unknown): string[] {
  if (Array.isArray(tags)) {
    return tags
      .map((tag) => String(tag).trim())
      .filter(Boolean);
  }

  if (typeof tags !== "string") return [];

  const trimmed = tags.trim();

  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed);

    if (Array.isArray(parsed)) {
      return parsed
        .map((tag) => String(tag).trim())
        .filter(Boolean);
    }
  } catch {
    // Fallback below for comma-separated values.
  }

  return trimmed
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map((tag) => tag.replace(/"/g, "").trim())
    .filter(Boolean);
}



function getRotatingCreatorScore(creator: CreatorWithMeta, seed: number) {
  const source = `${creator.id}:${creator.username}:${seed}`;
  let hash = 2166136261;

  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function getRotatingCreators(creators: CreatorWithMeta[], seed: number) {
  return [...creators]
    .sort((a, b) => {
      const scoreDifference =
        getRotatingCreatorScore(a, seed) - getRotatingCreatorScore(b, seed);

      if (scoreDifference !== 0) return scoreDifference;

      return b.trendingScore - a.trendingScore;
    })
    .slice(0, HOME_SHOWCASE_LIMIT);
}

function getCreatorUsernameFromPath() {
  if (typeof window === "undefined") return null;

  const match = window.location.pathname.match(/^\/creator\/([^/]+)$/);

  if (!match?.[1]) return null;

  return decodeURIComponent(match[1]);
}

export function CreatorGrid({ search }: CreatorGridProps) {
  const { t } = useLanguage();

  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [creators, setCreators] = useState<CreatorWithMeta[]>([]);
  const [activeDrops, setActiveDrops] = useState<ActiveDrop[]>([]);
  const [loading, setLoading] = useState(true);
  const [homeShowcaseSeed, setHomeShowcaseSeed] = useState(0);

  useEffect(() => {
    async function loadCreators() {
      const { data, error } = await supabase
        .from("creator_profiles")
        .select(
          `
          id,
          user_id,
          username,
          nickname,
          title,
          faction,
          category,
          status,
          avatar_url,
          banner_url,
          popup_animation_style,
          bio,
          description,
          tags,
          created_at,
          trending_score,
          profile_level,
          creator_cards (
            rarity,
            rank,
            aura,
            evolution_stage,
            level,
            power_score
          )
        `
        )
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      if (error || !data) {
        setCreators([]);
        setLoading(false);
        return;
      }

      const mappedCreators: CreatorWithMeta[] = data.map((item: any) => {
        const card = item.creator_cards?.[0];

        return {
          id: item.id,
          ownerId: item.user_id,
          username: item.username,
          nickname: item.nickname,
          title: item.title || translate(t, "creatorGridDefaultTitle", "Rising Creator"),
          faction: item.faction || "",
          category: item.category || translate(t, "creator", "Creator"),
          mainPlatform: "youtube",
          status: item.status || "offline",
          avatarUrl: item.avatar_url || "",
          bannerUrl: item.banner_url || "",
          popupAnimationStyle: item.popup_animation_style || "none",
          bio:
            item.bio ||
            translate(
              t,
              "creatorGridDefaultBio",
              "Novo criador aprovado na plataforma."
            ),
          description:
            item.description ||
            translate(
              t,
              "creatorGridDefaultDescription",
              "Este perfil foi aprovado e poderá ser personalizado pelo criador em breve."
            ),
          tags: normalizeCreatorTags(item.tags),
          rank: card?.rank || "Bronze",
          rarity: card?.rarity || "common",
          aura: card?.aura || "Origin Aura",
          evolutionStage:
            card?.evolution_stage ||
            translate(t, "creatorGridDefaultEvolutionStage", "Stage 1 — Rising Creator"),
          powerScore: card?.power_score || 0,
          collectedBy: 0,
          level: item.profile_level || card?.level || 1,
          followers: 0,
          likes: 0,
          views: 0,
          socials: [],
          traits: [
            {
              label: translate(t, "status", "Status"),
              value: translate(t, "creatorGridRecentlyApproved", "Recently approved"),
            },
            {
              label: translate(t, "creatorGridOrigin", "Origin"),
              value: translate(t, "creatorGridCreatorRequest", "Creator request"),
            },
            {
              label: translate(t, "creatorGridStyle", "Style"),
              value: translate(t, "creatorGridPendingCustomization", "Pending customization"),
            },
          ],
          featuredMoment: {
            title: translate(t, "creatorGridFirstAppearance", "First appearance"),
            description: translate(
              t,
              "creatorGridFirstAppearanceDescription",
              "Este creator acabou de entrar no universo da plataforma."
            ),
          },
          achievements: [
            {
              id: "approved",
              title: translate(t, "creatorGridCreatorApproved", "Creator Approved"),
              description: translate(
                t,
                "creatorGridCreatorApprovedDescription",
                "Perfil aprovado pela moderação."
              ),
            },
          ],
          createdAt: item.created_at || new Date().toISOString(),
          trendingScore: item.trending_score || 0,
        };
      });

      setCreators(mappedCreators);

      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const { data: dropsData } = await supabase
        .from("live_drops")
        .select("id,creator_id,created_at")
        .gte("created_at", twoHoursAgo)
        .order("created_at", { ascending: false })
        .limit(12);

      const mappedDrops: ActiveDrop[] = (dropsData ?? [])
        .map((drop: any) => ({
          id: drop.id,
          creatorId: drop.creator_id,
          createdAt: drop.created_at,
          creator: mappedCreators.find((creator) => creator.id === drop.creator_id),
        }))
        .filter((drop) => Boolean(drop.creator));

      setActiveDrops(mappedDrops);
      setLoading(false);
    }

    loadCreators();
  }, [t]);

  useEffect(() => {
    if (creators.length <= 1) return;

    const intervalId = window.setInterval(() => {
      setHomeShowcaseSeed((currentSeed) => currentSeed + 1);
    }, HOME_SHOWCASE_ROTATION_INTERVAL);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [creators.length]);

  useEffect(() => {
    function syncPopupWithUrl() {
      const usernameFromUrl = getCreatorUsernameFromPath();

      if (!usernameFromUrl) {
        setSelectedCreator(null);
        return;
      }

      const creatorFromUrl = creators.find(
        (creator) =>
          creator.username.toLowerCase() === usernameFromUrl.toLowerCase()
      );

      if (creatorFromUrl) {
        setSelectedCreator(creatorFromUrl);
      }
    }

    syncPopupWithUrl();

    window.addEventListener("popstate", syncPopupWithUrl);

    return () => {
      window.removeEventListener("popstate", syncPopupWithUrl);
    };
  }, [creators]);

  function handleOpenCreator(creator: Creator) {
    setSelectedCreator(creator);
  }

  function handleCloseCreator() {
    setSelectedCreator(null);
  }

  function handleCreatorUpdated(updatedCreator: Creator) {
    setCreators((currentCreators) =>
      currentCreators.map((creator) =>
        creator.id === updatedCreator.id
          ? {
              ...creator,
              ...updatedCreator,
              createdAt: creator.createdAt,
              trendingScore: creator.trendingScore,
            }
          : creator
      )
    );

    setSelectedCreator((currentCreator) =>
      currentCreator?.id === updatedCreator.id
        ? {
            ...currentCreator,
            ...updatedCreator,
          }
        : currentCreator
    );
  }

  const normalizedSearch = search.toLowerCase().trim();
  const hasSearch = normalizedSearch.length > 0;

  const filteredCreators = creators.filter((creator) => {
    const searchableText = [
      creator.nickname,
      creator.username,
      creator.category,
      creator.rank,
      creator.rarity,
      creator.aura,
      creator.mainPlatform,
      creator.title,
      creator.faction,
      creator.status,
      ...creator.tags,
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedSearch);
  });

  const homeShowcaseCreators = useMemo(() => {
    return getRotatingCreators(creators, homeShowcaseSeed);
  }, [creators, homeShowcaseSeed]);


  return (
    <>
      <section className="relative z-10 mx-auto max-w-[1760px] px-4 pb-20 pt-10 sm:px-6">
        {loading && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-8 py-10 text-center text-white/60">
            {translate(t, "creatorGridLoading", "Carregando creators...")}
          </div>
        )}

        {!loading && hasSearch && (
          <CreatorSection
            title={translate(t, "creatorGridSearchResults", "Resultado da busca")}
            description={translate(
              t,
              "creatorGridSearchResultsDescription",
              "Creators encontrados com base no termo pesquisado."
            )}
            creators={filteredCreators}
            onOpenCreator={handleOpenCreator}
          />
        )}

        {!loading && !hasSearch && (
          <div className="space-y-10">
            <ActiveDropsSection
              drops={activeDrops}
              onOpenCreator={handleOpenCreator}
            />

            <CreatorSection
              title=""
              description=""
              creators={homeShowcaseCreators}
              onOpenCreator={handleOpenCreator}
              hideHeader
              compact
            />
          </div>
        )}

        {!loading && hasSearch && filteredCreators.length === 0 && <EmptyState />}
      </section>

      <CreatorPopup
        creator={selectedCreator}
        onClose={handleCloseCreator}
        onCreatorUpdated={handleCreatorUpdated}
      />
    </>
  );
}

function ActiveDropsSection({
  drops,
  onOpenCreator,
}: {
  drops: ActiveDrop[];
  onOpenCreator: (creator: Creator) => void;
}) {
  const { t } = useLanguage();

  if (drops.length === 0) return null;

  return (
    <section className="rounded-[32px] border border-amber-300/15 bg-amber-300/[0.035] p-5 shadow-[0_0_40px_rgba(251,191,36,0.08)] backdrop-blur-xl sm:p-6">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-3 rounded-full border border-amber-200/20 bg-amber-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-amber-100">
            <span className="h-2 w-2 animate-pulse rounded-full bg-amber-200 shadow-[0_0_14px_rgba(251,191,36,0.95)]" />
            {translate(t, "creatorGridActiveDropsTitle", "Drops ativos")}
          </div>
          <p className="mt-3 max-w-2xl text-sm text-white/50">
            {translate(
              t,
              "creatorGridActiveDropsDescription",
              "Criadores que fizeram drops nas últimas 2 horas aparecem aqui."
            )}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {drops.map((drop) => {
          const creator = drop.creator;
          if (!creator) return null;

          return (
            <button
              key={drop.id}
              type="button"
              onClick={() => onOpenCreator(creator)}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-black/35 p-4 text-left transition hover:-translate-y-0.5 hover:border-amber-200/35 hover:bg-amber-300/[0.06]"
            >
              <span className="absolute inset-0 bg-gradient-to-br from-amber-300/10 via-transparent to-cyan-400/5 opacity-80" />
              <span className="relative flex items-center gap-4">
                <span className="h-14 w-14 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                  {creator.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={creator.avatarUrl}
                      alt={creator.nickname}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-xl">✦</span>
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-black uppercase tracking-[0.12em] text-white">
                    {creator.nickname}
                  </span>
                  <span className="mt-1 block text-xs font-semibold text-amber-100/70">
                    {translate(t, "creatorGridDropLastTwoHours", "Drop recente disponível")}
                  </span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function CreatorSection({
  eyebrow,
  title,
  description,
  creators,
  onOpenCreator,
  hideHeader = false,
  compact = false,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  creators: CreatorWithMeta[];
  onOpenCreator: (creator: Creator) => void;
  hideHeader?: boolean;
  compact?: boolean;
}) {
  if (creators.length === 0) return null;

  return (
    <div>
      {!hideHeader && (
        <div className="mb-5 flex flex-col gap-2 text-center sm:text-left">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-cyan-300/15 bg-cyan-300/5 px-5 py-2 shadow-[0_0_24px_rgba(34,211,238,0.08)]">
                <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)]" />
                <h2 className="text-base font-bold uppercase tracking-[0.28em] text-cyan-100">
                  {title}
                </h2>
              </div>

              {description && (
                <p className="mt-3 max-w-2xl text-sm text-white/45">
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div
        className={
          compact
            ? "grid grid-cols-2 justify-items-center gap-x-5 gap-y-9 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8"
            : "grid grid-cols-1 justify-items-center gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        }
      >
        {creators.map((creator, index) => (
          <AnimatedRarityCreatorCard
            key={`${compact ? "home" : "creator"}-${index}-${creator.id}`}
            creator={creator}
            index={index}
            onClick={onOpenCreator}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
}

function AnimatedRarityCreatorCard({
  creator,
  index,
  onClick,
  compact = false,
}: {
  creator: CreatorWithMeta;
  index: number;
  onClick: (creator: Creator) => void;
  compact?: boolean;
}) {
  const initialRarityIndex = index % RARITY_SHOWCASE_CYCLE.length;
  const [activeRarityIndex, setActiveRarityIndex] = useState(initialRarityIndex);
  const [incomingRarityIndex, setIncomingRarityIndex] = useState<number | null>(
    null
  );

  const activeRarityIndexRef = useRef(initialRarityIndex);
  const isTransitioningRef = useRef(false);
  const transitionTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    function beginCardStackTransition() {
      if (isTransitioningRef.current) return;

      const nextIndex =
        (activeRarityIndexRef.current + 1) % RARITY_SHOWCASE_CYCLE.length;

      isTransitioningRef.current = true;
      setIncomingRarityIndex(nextIndex);

      if (transitionTimeoutRef.current !== null) {
        window.clearTimeout(transitionTimeoutRef.current);
      }

      transitionTimeoutRef.current = window.setTimeout(() => {
        activeRarityIndexRef.current = nextIndex;
        setActiveRarityIndex(nextIndex);
        setIncomingRarityIndex(null);
        isTransitioningRef.current = false;
        transitionTimeoutRef.current = null;
      }, 760);
    }

    const startDelay = index * 1100;
    let intervalId: number | null = null;

    const timeoutId = window.setTimeout(() => {
      beginCardStackTransition();
      intervalId = window.setInterval(
        beginCardStackTransition,
        RARITY_SHOWCASE_INTERVAL
      );
    }, startDelay);

    return () => {
      window.clearTimeout(timeoutId);

      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }

      if (transitionTimeoutRef.current !== null) {
        window.clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, [index]);

  const activeShowcase = RARITY_SHOWCASE_CYCLE[activeRarityIndex];
  const incomingShowcase =
    incomingRarityIndex !== null
      ? RARITY_SHOWCASE_CYCLE[incomingRarityIndex]
      : null;

  const activeCreator: CreatorWithMeta = {
    ...creator,
    rarity: activeShowcase.rarity,
    level: creator.level || 1,
  };

  const incomingCreator: CreatorWithMeta | null = incomingShowcase
    ? {
        ...creator,
        rarity: incomingShowcase.rarity,
        level: creator.level || 1,
      }
    : null;

  return (
    <div
      className={
        compact
          ? "relative h-[252px] w-[168px] overflow-visible [perspective:1200px]"
          : "relative h-[360px] w-[240px] overflow-visible [perspective:1200px]"
      }
    >
      <div
        className={
          compact
            ? "absolute left-0 top-0 h-[360px] w-[240px] origin-top-left scale-[0.7]"
            : "relative h-full w-full"
        }
      >
        <div className="relative z-10 h-full w-full">
          <CreatorCard creator={activeCreator} onClick={onClick} />
        </div>

        {incomingCreator && (
          <motion.div
            key={`${creator.id}-${incomingCreator.rarity}-incoming`}
            className="pointer-events-none absolute inset-0 z-20 will-change-transform"
            initial={{
              x: 34,
              y: 18,
              rotateZ: 4.25,
              rotateY: -6,
              scale: 0.985,
              opacity: 0.94,
            }}
            animate={{
              x: 0,
              y: 0,
              rotateZ: 0,
              rotateY: 0,
              scale: 1,
              opacity: 1,
              transition: RARITY_STACK_TRANSITION,
            }}
            style={{
              transformStyle: "preserve-3d",
              backfaceVisibility: "hidden",
            }}
          >
            <CreatorCard creator={incomingCreator} onClick={onClick} />
          </motion.div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  const { t } = useLanguage();

  return (
    <div className="flex w-full flex-col items-center rounded-[32px] border border-white/10 bg-white/[0.03] px-8 py-16 text-center backdrop-blur-xl">
      <div className="h-20 w-20 rounded-full bg-gradient-to-br from-cyan-400/20 to-purple-500/20 blur-2xl" />

      <div className="relative -mt-12 flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-black/40 text-3xl">
        ✦
      </div>

      <h3 className="mt-6 text-2xl font-bold text-white">
        {translate(
          t,
          "creatorGridEmptyTitle",
          "Não identificamos nenhuma identidade correspondente à sua busca."
        )}
      </h3>

      <p className="mt-3 max-w-md text-sm text-white/50">
        {translate(
          t,
          "creatorGridEmptyDescription",
          "Tente pesquisar por nome do criador, categoria, raridade, plataforma ou tags."
        )}
      </p>
    </div>
  );
}
