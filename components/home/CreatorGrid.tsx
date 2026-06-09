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

const HOME_SHOWCASE_LIMIT = 32;
const CREATOR_ROTATION_INTERVAL = 30_000;

const RARITY_SHOWCASE_CYCLE = [
  { rarity: "common" },
  { rarity: "rare" },
  { rarity: "epic" },
  { rarity: "legendary" },
] as const;

const RARITY_SHOWCASE_INTERVAL = 9800;
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

function normalizeSearchText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^@/, "")
    .toLowerCase()
    .trim();
}

function rotateCreators<T>(items: T[], seed: number) {
  if (items.length <= 1) return items;

  const offset = seed % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
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
  const [loading, setLoading] = useState(true);
  const [rotationSeed, setRotationSeed] = useState(0);

  useEffect(() => {
    let mounted = true;

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

      if (!mounted) return;

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
      setLoading(false);
    }

    loadCreators();

    return () => {
      mounted = false;
    };
  }, [t]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (document.hidden) return;
      setRotationSeed((currentSeed) => currentSeed + 1);
    }, CREATOR_ROTATION_INTERVAL);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    function syncPopupWithUrl() {
      const usernameFromUrl = getCreatorUsernameFromPath();

      if (!usernameFromUrl) {
        setSelectedCreator(null);
        return;
      }

      const creatorFromUrl = creators.find(
        (creator) =>
          normalizeSearchText(creator.username) === normalizeSearchText(usernameFromUrl)
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

  const normalizedSearch = normalizeSearchText(search);
  const hasSearch = normalizedSearch.length > 0;

  const filteredCreators = useMemo(() => {
    if (!hasSearch) return [];

    return creators.filter((creator) => {
      const searchableText = normalizeSearchText(
        [
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
          creator.bio,
          creator.description,
          ...creator.tags,
        ].join(" ")
      );

      return searchableText.includes(normalizedSearch);
    });
  }, [creators, hasSearch, normalizedSearch]);

  const showcaseCreators = useMemo(() => {
    const orderedCreators = [...creators].sort((a, b) => {
      const scoreDiff = b.trendingScore - a.trendingScore;
      if (scoreDiff !== 0) return scoreDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return rotateCreators(orderedCreators, rotationSeed).slice(0, HOME_SHOWCASE_LIMIT);
  }, [creators, rotationSeed]);

  return (
    <>
      <section
        id="criadores"
        className="relative z-10 mx-auto max-w-[1800px] px-4 pb-20 pt-10 sm:px-6"
      >
        {loading && (
          <div className="grid grid-cols-2 justify-items-center gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
            {Array.from({ length: 16 }).map((_, index) => (
              <div
                key={`creator-skeleton-${index}`}
                className="h-[255px] w-[170px] animate-pulse rounded-[28px] border border-white/10 bg-white/[0.04] shadow-[0_0_28px_rgba(34,211,238,0.06)]"
              />
            ))}
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
            compact={false}
          />
        )}

        {!loading && hasSearch && filteredCreators.length === 0 && <EmptyState />}

        {!loading && !hasSearch && (
          <CreatorSection
            title=""
            description=""
            creators={showcaseCreators}
            onOpenCreator={handleOpenCreator}
            hideHeader
            compact
          />
        )}
      </section>

      <CreatorPopup
        creator={selectedCreator}
        onClose={handleCloseCreator}
        onCreatorUpdated={handleCreatorUpdated}
      />
    </>
  );
}

function CreatorSection({
  title,
  description,
  creators,
  onOpenCreator,
  hideHeader = false,
  compact = false,
}: {
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
            ? "grid grid-cols-2 justify-items-center gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8"
            : "grid grid-cols-1 justify-items-center gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        }
      >
        {creators.map((creator, index) => (
          <AnimatedRarityCreatorCard
            key={`creator-${creator.id}`}
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
  compact,
}: {
  creator: CreatorWithMeta;
  index: number;
  onClick: (creator: Creator) => void;
  compact: boolean;
}) {
  const initialRarityIndex = index % RARITY_SHOWCASE_CYCLE.length;
  const [activeRarityIndex, setActiveRarityIndex] = useState(initialRarityIndex);
  const [incomingRarityIndex, setIncomingRarityIndex] = useState<number | null>(
    null
  );

  const activeRarityIndexRef = useRef(initialRarityIndex);
  const isTransitioningRef = useRef(false);
  const transitionTimeoutRef = useRef<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (compact && !isHovered) return;

    function beginCardStackTransition() {
      if (isTransitioningRef.current) return;
      if (document.hidden) return;

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

    const startDelay = compact ? 180 : index * 1100;
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
  }, [compact, index, isHovered]);

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
          ? "relative h-[255px] w-[170px] overflow-visible [perspective:1200px]"
          : "relative h-[360px] w-[240px] overflow-visible [perspective:1200px]"
      }
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative z-10 h-full w-full">
        <CreatorCard creator={activeCreator} onClick={onClick} />
      </div>

      {incomingCreator && (!compact || isHovered) && (
        <motion.div
          key={`${creator.id}-${incomingCreator.rarity}-incoming`}
          className="pointer-events-none absolute inset-0 z-20 will-change-transform"
          initial={{
            x: compact ? 18 : 34,
            y: compact ? 10 : 18,
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
