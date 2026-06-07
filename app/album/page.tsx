"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { CreatorCard } from "@/components/cards/CreatorCard";
import { CreatorPopup } from "@/components/creator/CreatorPopup";
import { GlowBackground } from "@/components/effects/GlowBackground";
import { ParticleBackground } from "@/components/effects/ParticleBackground";
import { useLanguage } from "@/contexts/LanguageContext";
import { translate } from "@/lib/i18n/translate";
import { supabase } from "@/lib/supabase/client";
import { Creator } from "@/types/creator";

type CreatorWithMeta = Creator & {
  createdAt: string;
  trendingScore: number;
};

type UserCardProgress = {
  creatorId: string;
  rarities: Set<string>;
  mythicCardId: string | null;
  mythicSeenAt: string | null;
};

type AlbumCreator = CreatorWithMeta & {
  ownedRarityCount: number;
  isComplete: boolean;
  hasMythic: boolean;
  mythicCardId: string | null;
  mythicSeenAt: string | null;
};

const REQUIRED_RARITIES = ["common", "rare", "epic", "legendary"] as const;
const MYTHIC_RARITY = "mythic";

function createEmptyProgress(creatorId: string): UserCardProgress {
  return {
    creatorId,
    rarities: new Set<string>(),
    mythicCardId: null,
    mythicSeenAt: null,
  };
}

function hasCompletedBaseRarities(rarities: Set<string>) {
  return REQUIRED_RARITIES.every((rarity) => rarities.has(rarity));
}

async function ensureMythicAlbumRewards({
  userId,
  progressByCreator,
}: {
  userId: string;
  progressByCreator: Map<string, UserCardProgress>;
}) {
  const creatorsToReward = Array.from(progressByCreator.values()).filter(
    (progress) =>
      hasCompletedBaseRarities(progress.rarities) &&
      !progress.rarities.has(MYTHIC_RARITY),
  );

  if (creatorsToReward.length === 0) return progressByCreator;

  const nextProgress = new Map(progressByCreator);

  for (const progress of creatorsToReward) {
    const { data: existingMythic } = await supabase
      .from("user_cards")
      .select("id,seen_at")
      .eq("user_id", userId)
      .eq("creator_id", progress.creatorId)
      .eq("rarity", MYTHIC_RARITY)
      .maybeSingle();

    let mythicCardId = existingMythic?.id ?? null;
    let mythicSeenAt = existingMythic?.seen_at ?? null;

    if (!existingMythic) {
      const { data: insertedMythic, error } = await supabase
        .from("user_cards")
        .insert({
          user_id: userId,
          creator_id: progress.creatorId,
          rarity: MYTHIC_RARITY,
          source: "album_completion",
        })
        .select("id,seen_at")
        .single();

      if (error) {
        console.error("Failed to unlock mythic album reward", error);
        continue;
      }

      mythicCardId = insertedMythic?.id ?? null;
      mythicSeenAt = insertedMythic?.seen_at ?? null;
    }

    const current =
      nextProgress.get(progress.creatorId) ??
      createEmptyProgress(progress.creatorId);

    current.rarities.add(MYTHIC_RARITY);
    current.mythicCardId = mythicCardId;
    current.mythicSeenAt = mythicSeenAt;
    nextProgress.set(progress.creatorId, current);
  }

  return nextProgress;
}

function normalizeCreatorTags(tags: unknown): string[] {
  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim()).filter(Boolean);
  }

  if (typeof tags !== "string") return [];

  const trimmed = tags.trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.map((tag) => String(tag).trim()).filter(Boolean);
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

function toMythicCreator(creator: AlbumCreator): CreatorWithMeta {
  return {
    ...creator,
    rarity: MYTHIC_RARITY as CreatorWithMeta["rarity"],
    aura: "Sakura Mythic Aura",
    rank: creator.rank || "Bronze",
  };
}

export default function AlbumPage() {
  const { t } = useLanguage();

  const [creators, setCreators] = useState<CreatorWithMeta[]>([]);
  const [progressByCreator, setProgressByCreator] = useState<
    Map<string, UserCardProgress>
  >(new Map());
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [openingCreatorIds, setOpeningCreatorIds] = useState<Set<string>>(
    new Set(),
  );
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadAlbum() {
      setLoading(true);

      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;

      if (!mounted) return;

      setIsLoggedIn(Boolean(user));

      const { data: creatorsData, error: creatorsError } = await supabase
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
          bio,
          description,
          tags,
          created_at,
          trending_score,
          creator_cards (
            rarity,
            rank,
            aura,
            evolution_stage,
            level,
            power_score
          )
        `,
        )
        .eq("is_public", true)
        .order("nickname", { ascending: true });

      if (!mounted) return;

      if (creatorsError || !creatorsData) {
        setCreators([]);
        setProgressByCreator(new Map());
        setLoading(false);
        return;
      }

      const mappedCreators: CreatorWithMeta[] = creatorsData.map(
        (item: any) => {
          const cards = Array.isArray(item.creator_cards)
            ? item.creator_cards
            : [];
          const preferredCard =
            cards.find(
              (card: any) =>
                String(card?.rarity).toLowerCase() === MYTHIC_RARITY,
            ) ||
            cards.find(
              (card: any) => String(card?.rarity).toLowerCase() === "legendary",
            ) ||
            cards.find(
              (card: any) => String(card?.rarity).toLowerCase() === "epic",
            ) ||
            cards.find(
              (card: any) => String(card?.rarity).toLowerCase() === "rare",
            ) ||
            cards[0];

          return {
            id: item.id,
            userId: item.user_id || item.id,
            username: item.username || "creator",
            nickname: item.nickname || item.username || "Creator",
            title: item.title || "Creator Card",
            faction: item.faction || "Cardpoc",
            category: item.category || "creator",
            status: item.status || "approved",
            mainPlatform:
              item.main_platform || item.mainPlatform || item.platform || "cardpoc",
            avatarUrl:
              item.avatar_url || item.banner_url || "/placeholder-card.png",
            bannerUrl:
              item.banner_url || item.avatar_url || "/placeholder-card.png",
            bio: item.bio || item.description || "",
            description: item.description || item.bio || "",
            tags: normalizeCreatorTags(item.tags),
            rarity: (preferredCard?.rarity ||
              "common") as CreatorWithMeta["rarity"],
            rank: preferredCard?.rank || "Bronze",
            aura: preferredCard?.aura || "Cardpoc Aura",
            evolutionStage:
              preferredCard?.evolution_stage || "Stage 1 — Rising Creator",
            powerScore: preferredCard?.power_score || 0,
            collectedBy: 0,
            level: preferredCard?.level || 1,
            followers: 0,
            likes: 0,
            views: 0,
            socials: [],
            traits: [
              {
                label: translate(t, "status", "Status"),
                value: translate(
                  t,
                  "creatorGridRecentlyApproved",
                  "Recently approved",
                ),
              },
              {
                label: translate(t, "creatorGridOrigin", "Origin"),
                value: translate(
                  t,
                  "creatorGridCreatorRequest",
                  "Creator request",
                ),
              },
              {
                label: translate(t, "creatorGridStyle", "Style"),
                value: translate(
                  t,
                  "creatorGridPendingCustomization",
                  "Pending customization",
                ),
              },
            ],
            featuredMoment: {
              title: translate(
                t,
                "creatorGridFirstAppearance",
                "First appearance",
              ),
              description: translate(
                t,
                "creatorGridFirstAppearanceDescription",
                "Este creator acabou de entrar no universo da plataforma.",
              ),
            },
            achievements: [
              {
                id: "approved",
                title: translate(
                  t,
                  "creatorGridCreatorApproved",
                  "Creator Approved",
                ),
                description: translate(
                  t,
                  "creatorGridCreatorApprovedDescription",
                  "Perfil aprovado pela moderação.",
                ),
              },
            ],
            createdAt: item.created_at || new Date().toISOString(),
            trendingScore: item.trending_score || 0,
          };
        },
      );

      let nextProgress = new Map<string, UserCardProgress>();

      if (user) {
        const { data: cardsData } = await supabase
          .from("user_cards")
          .select("id,creator_id,rarity,seen_at")
          .eq("user_id", user.id);

        nextProgress = (cardsData ?? []).reduce(
          (map: Map<string, UserCardProgress>, card: any) => {
            const creatorId = String(card.creator_id || "");
            const rarity = String(card.rarity || "").toLowerCase();

            if (!creatorId || !rarity) return map;

            const current =
              map.get(creatorId) ?? createEmptyProgress(creatorId);
            current.rarities.add(rarity);

            if (rarity === MYTHIC_RARITY) {
              current.mythicCardId = card.id ?? current.mythicCardId;
              current.mythicSeenAt = card.seen_at ?? current.mythicSeenAt;
            }

            map.set(creatorId, current);
            return map;
          },
          new Map<string, UserCardProgress>(),
        );
      }

      if (user) {
        nextProgress = await ensureMythicAlbumRewards({
          userId: user.id,
          progressByCreator: nextProgress,
        });
      }

      if (!mounted) return;

      setCreators(mappedCreators);
      setProgressByCreator(nextProgress);
      setLoading(false);
    }

    loadAlbum();

    return () => {
      mounted = false;
    };
  }, [t]);

  const albumCreators = useMemo<AlbumCreator[]>(() => {
    return creators.map((creator) => {
      const progress = progressByCreator.get(creator.id);
      const ownedRarityCount = REQUIRED_RARITIES.filter((rarity) =>
        progress?.rarities.has(rarity),
      ).length;
      const hasMythic = Boolean(progress?.rarities.has(MYTHIC_RARITY));

      return {
        ...creator,
        ownedRarityCount,
        isComplete: ownedRarityCount === REQUIRED_RARITIES.length,
        hasMythic,
        mythicCardId: progress?.mythicCardId ?? null,
        mythicSeenAt: progress?.mythicSeenAt ?? null,
      };
    });
  }, [creators, progressByCreator]);

  const completedCount = albumCreators.filter(
    (creator) => creator.isComplete,
  ).length;
  const totalCount = albumCreators.length;

  async function revealMythic(creator: AlbumCreator) {
    if (!creator.mythicCardId || creator.mythicSeenAt) return;

    setOpeningCreatorIds((current) => new Set(current).add(creator.id));

    const revealedAt = new Date().toISOString();

    const { error } = await supabase
      .from("user_cards")
      .update({ seen_at: revealedAt })
      .eq("id", creator.mythicCardId);

    if (error) {
      console.error("Failed to mark mythic album card as revealed", error);
      setOpeningCreatorIds((current) => {
        const next = new Set(current);
        next.delete(creator.id);
        return next;
      });
      return;
    }

    window.setTimeout(() => {
      setProgressByCreator((current) => {
        const next = new Map(current);
        const progress =
          next.get(creator.id) ?? createEmptyProgress(creator.id);
        progress.rarities.add(MYTHIC_RARITY);
        progress.mythicCardId = creator.mythicCardId;
        progress.mythicSeenAt = revealedAt;
        next.set(creator.id, progress);
        return next;
      });

      setOpeningCreatorIds((current) => {
        const next = new Set(current);
        next.delete(creator.id);
        return next;
      });
    }, 1150);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <GlowBackground />
      <ParticleBackground />

      <section className="relative z-10 mx-auto max-w-[1540px] px-5 pb-24 pt-10 sm:px-8 lg:px-10">
        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-3 rounded-full border border-cyan-300/15 bg-cyan-300/5 px-5 py-2 text-xs font-black uppercase tracking-[0.24em] text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.08)]">
              <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)]" />
              {translate(t, "albumPageBadge", "Álbum Cardpoc")}
            </div>

            <p className="mt-4 max-w-3xl text-sm leading-6 text-white/55 sm:text-base">
              {translate(
                t,
                "albumPageDescription",
                "Complete cada criador conquistando as 4 raridades. A carta do álbum só acende quando comum, rara, épica e lendária estiverem na sua coleção.",
              )}
            </p>
          </div>

          <div className="w-full max-w-[310px] rounded-[28px] border border-white/10 bg-white/[0.035] px-6 py-5 backdrop-blur-xl shadow-[0_0_34px_rgba(0,0,0,0.32)]">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
              {translate(t, "albumPageProgressLabel", "Progresso")}
            </p>
            <div className="mt-2 flex items-end justify-between gap-4">
              <p className="text-2xl font-black text-white">
                {completedCount}/{totalCount}
              </p>
              <span className="rounded-full border border-pink-100/20 bg-pink-100/[0.06] px-3 py-1 text-xs font-black text-pink-50/80">
                {totalCount > 0
                  ? Math.round((completedCount / totalCount) * 100)
                  : 0}
                %
              </span>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-200 via-white to-pink-200 shadow-[0_0_18px_rgba(251,207,232,0.48)] transition-all duration-500"
                style={{
                  width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </div>

        {!isLoggedIn && !loading && (
          <div className="mb-8 rounded-3xl border border-amber-300/20 bg-amber-300/[0.055] p-5 text-sm font-semibold text-amber-50/75 backdrop-blur-xl">
            {translate(
              t,
              "albumPageLoginHint",
              "Entre na sua conta para ver quais cartas já estão acesas no seu álbum.",
            )}
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-8 py-10 text-center text-white/60">
            {translate(t, "albumPageLoading", "Carregando álbum...")}
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-[42px] border border-white/[0.045] bg-black/[0.08] px-3 py-6 sm:px-5 lg:px-6">
            <SakuraVineField completedCount={completedCount} totalCount={totalCount} />

            <div className="relative z-10 grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-x-10 gap-y-14">
              {albumCreators.map((creator, index) => (
                <AlbumTile
                  key={creator.id}
                  creator={creator}
                  index={index}
                  isOpening={openingCreatorIds.has(creator.id)}
                  onReveal={() => revealMythic(creator)}
                  onOpenCreator={(nextCreator) => setSelectedCreator(nextCreator)}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      <CreatorPopup
        creator={selectedCreator}
        onClose={() => setSelectedCreator(null)}
        onCreatorUpdated={(updatedCreator) => {
          setCreators((currentCreators) =>
            currentCreators.map((creator) =>
              creator.id === updatedCreator.id
                ? {
                    ...creator,
                    ...updatedCreator,
                    createdAt: creator.createdAt,
                    trendingScore: creator.trendingScore,
                  }
                : creator,
            ),
          );
          setSelectedCreator((currentCreator) =>
            currentCreator?.id === updatedCreator.id
              ? { ...currentCreator, ...updatedCreator }
              : currentCreator,
          );
        }}
      />
    </main>
  );
}


function SakuraVineField({
  completedCount,
  totalCount,
}: {
  completedCount: number;
  totalCount: number;
}) {
  const completionRatio = totalCount > 0 ? completedCount / totalCount : 0;
  const branches = Array.from({ length: 18 }, (_, index) => index);
  const blossoms = Array.from({ length: 44 }, (_, index) => index);

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[42px]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(34,211,238,0.055),transparent_28%),radial-gradient(circle_at_76%_45%,rgba(244,114,182,0.075),transparent_34%),radial-gradient(circle_at_45%_100%,rgba(168,85,247,0.08),transparent_42%)]" />
      <div className="absolute inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:96px_96px]" />

      {branches.map((branch) => {
        const row = Math.floor(branch / 6);
        const col = branch % 6;
        const top = 12 + row * 32 + (col % 2) * 5;
        const left = -8 + col * 20;
        const rotate = col % 2 === 0 ? 9 + row * 2 : -11 - row;
        const width = 34 + ((branch + row) % 4) * 8;
        const isLit = branch / branches.length <= completionRatio;

        return (
          <span
            key={`sakura-branch-${branch}`}
            className={`absolute h-[2px] origin-left rounded-full transition duration-700 ${
              isLit
                ? "bg-gradient-to-r from-pink-100/0 via-pink-200/46 to-pink-100/0 shadow-[0_0_18px_rgba(244,114,182,0.28)]"
                : "bg-gradient-to-r from-white/0 via-white/[0.075] to-white/0"
            }`}
            style={{
              top: `${top}%`,
              left: `${left}%`,
              width: `${width}%`,
              transform: `rotate(${rotate}deg)`,
            }}
          >
            <span
              className={`absolute left-[22%] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full blur-[1px] ${
                isLit ? "bg-pink-200/32" : "bg-white/[0.04]"
              }`}
            />
            <span
              className={`absolute left-[68%] top-1/2 h-2 w-2 -translate-y-1/2 rounded-full blur-[1px] ${
                isLit ? "bg-pink-100/28" : "bg-white/[0.035]"
              }`}
            />
          </span>
        );
      })}

      {blossoms.map((blossom) => {
        const left = (blossom * 23) % 100;
        const top = 7 + ((blossom * 17) % 90);
        const isLit = blossom / blossoms.length <= completionRatio;
        const size = 5 + (blossom % 4) * 2;

        return (
          <span
            key={`sakura-blossom-${blossom}`}
            className={`absolute rounded-[999px_0_999px_0] transition duration-700 ${
              isLit
                ? "bg-pink-100/50 shadow-[0_0_14px_rgba(251,207,232,0.34)]"
                : "bg-white/[0.055]"
            }`}
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: `${size}px`,
              height: `${Math.max(4, size - 2)}px`,
              transform: `rotate(${(blossom * 37) % 180}deg)`,
            }}
          />
        );
      })}
    </div>
  );
}

function AlbumTile({
  creator,
  index,
  isOpening,
  onReveal,
  onOpenCreator,
}: {
  creator: AlbumCreator;
  index: number;
  isOpening: boolean;
  onReveal: () => void;
  onOpenCreator: (creator: Creator) => void;
}) {
  const { t } = useLanguage();
  const progressPercentage =
    (creator.ownedRarityCount / REQUIRED_RARITIES.length) * 100;
  const isReadyToReveal =
    creator.isComplete && creator.hasMythic && !creator.mythicSeenAt;
  const isRevealed =
    creator.isComplete && creator.hasMythic && Boolean(creator.mythicSeenAt);
  const mythicCreator = toMythicCreator(creator);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.42, delay: Math.min(index * 0.025, 0.35) }}
      className="relative mx-auto h-[482px] w-full max-w-[292px]"
    >
      <div
        className={`relative h-full overflow-hidden rounded-[36px] border p-4 transition duration-300 ${
          isRevealed
            ? "border-pink-100/40 bg-pink-100/[0.055] shadow-[0_0_48px_rgba(244,114,182,0.2)]"
            : isReadyToReveal || isOpening
              ? "border-pink-100/34 bg-pink-100/[0.045] shadow-[0_0_42px_rgba(244,114,182,0.16)]"
              : creator.ownedRarityCount > 0
                ? "border-white/14 bg-white/[0.04]"
                : "border-white/8 bg-white/[0.025] opacity-85"
        }`}
      >
        <span className="pointer-events-none absolute inset-0 rounded-[36px] bg-[radial-gradient(circle_at_50%_10%,rgba(255,255,255,0.11),transparent_28%),radial-gradient(circle_at_50%_88%,rgba(244,114,182,0.13),transparent_42%)] opacity-80" />
        <span className="pointer-events-none absolute inset-[1px] rounded-[35px] border border-white/[0.055]" />

        <div className="relative z-10 flex h-full flex-col">
          <div className="relative flex h-[386px] items-center justify-center overflow-visible rounded-[28px] border border-white/10 bg-black/34 shadow-[inset_0_0_34px_rgba(0,0,0,0.5)]">
            <AnimatePresence mode="wait" initial={false}>
              {isRevealed ? (
                <motion.div
                  key="revealed"
                  initial={{ opacity: 0, scale: 0.92, rotateY: -12 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  className="relative flex h-full w-full items-center justify-center overflow-visible"
                >
                  <MythicCardStage
                    creator={mythicCreator}
                    onClick={() => onOpenCreator(mythicCreator)}
                  />
                </motion.div>
              ) : isOpening ? (
                <motion.div
                  key="opening"
                  className="absolute inset-0 overflow-hidden rounded-[26px]"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <OpeningEnvelope />
                </motion.div>
              ) : (
                <motion.button
                  key="locked"
                  type="button"
                  onClick={
                    isReadyToReveal ? onReveal : () => onOpenCreator(creator)
                  }
                  className="absolute inset-0 overflow-hidden rounded-[26px] text-left"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.28 }}
                  aria-label={
                    isReadyToReveal
                      ? `Revelar carta mítica de ${creator.nickname}`
                      : `Abrir criador ${creator.nickname}`
                  }
                >
                  <LockedAlbumPack
                    creator={creator}
                    progressPercentage={progressPercentage}
                    isReadyToReveal={isReadyToReveal}
                  />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-4 min-w-0 px-1">
            <div className="flex items-start justify-between gap-3">
              <span className="block min-w-0 truncate text-base font-black uppercase tracking-[0.12em] text-white/66">
                {creator.nickname}
              </span>
              {isRevealed && (
                <span className="shrink-0 rounded-full border border-pink-100/35 bg-pink-100/[0.08] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-pink-50">
                  Mítica
                </span>
              )}
            </div>

            <div className="mt-2 flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/38">
              <span>
                {creator.ownedRarityCount}/{REQUIRED_RARITIES.length}
              </span>
              <span
                className={isRevealed ? "text-pink-50/72" : "text-white/32"}
              >
                {isRevealed
                  ? translate(t, "albumPageComplete", "Completa")
                  : isReadyToReveal
                    ? "Pronta"
                    : translate(t, "albumPageIncomplete", "Incompleta")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function LockedAlbumPack({
  creator,
  progressPercentage,
  isReadyToReveal,
}: {
  creator: AlbumCreator;
  progressPercentage: number;
  isReadyToReveal: boolean;
}) {
  return (
    <span className="relative flex h-full w-full items-center justify-center rounded-[26px] border border-white/10 bg-black/48">
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.075),transparent_28%),radial-gradient(circle_at_50%_78%,rgba(34,211,238,0.075),transparent_40%),linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.88))]" />
      <span className="absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.035)_0px,rgba(255,255,255,0.035)_1px,transparent_1px,transparent_9px)] opacity-25" />
      <span className="absolute inset-x-6 top-6 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
      <span className="absolute inset-x-6 bottom-6 h-px bg-gradient-to-r from-transparent via-white/14 to-transparent" />

      {isReadyToReveal ? (
        <span className="absolute -inset-1 rounded-[28px] border border-pink-100/25 bg-[radial-gradient(circle_at_50%_40%,rgba(251,207,232,0.14),transparent_46%)] shadow-[0_0_34px_rgba(244,114,182,0.18)]" />
      ) : null}

      <span className="relative z-10 flex flex-col items-center gap-3 text-center">
        <span
          className={`flex h-16 w-16 items-center justify-center rounded-2xl border text-2xl shadow-[0_0_28px_rgba(0,0,0,0.65)] ${
            isReadyToReveal
              ? "border-pink-100/28 bg-pink-100/[0.06] text-pink-50/75"
              : "border-white/10 bg-black/55 text-white/28"
          }`}
        >
          ✦
        </span>
        {isReadyToReveal && (
          <span className="rounded-full border border-pink-100/25 bg-black/40 px-4 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-pink-50/80">
            Clique para revelar
          </span>
        )}
      </span>

      <span
        className="absolute bottom-0 left-0 h-1 bg-cyan-200 shadow-[0_0_16px_rgba(103,232,249,0.8)] transition-all"
        style={{ width: `${progressPercentage}%` }}
      />
      <span className="sr-only">{creator.nickname}</span>
    </span>
  );
}

function OpeningEnvelope() {
  const petals = Array.from({ length: 18 }, (_, index) => index);

  return (
    <span className="relative block h-full w-full rounded-[26px] bg-black/50">
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(251,207,232,0.26),transparent_45%),linear-gradient(180deg,rgba(255,244,249,0.1),rgba(0,0,0,0.8))]" />
      <motion.span
        className="absolute inset-x-0 top-0 h-1/2 origin-top rounded-t-[26px] border-b border-pink-100/20 bg-[linear-gradient(145deg,rgba(255,244,249,0.18),rgba(42,12,28,0.78))] shadow-[0_0_34px_rgba(244,114,182,0.2)]"
        animate={{ rotateX: -78, y: -18, opacity: 0.18 }}
        transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.span
        className="absolute inset-x-0 bottom-0 h-1/2 origin-bottom rounded-b-[26px] border-t border-pink-100/20 bg-[linear-gradient(35deg,rgba(255,244,249,0.16),rgba(22,6,16,0.88))] shadow-[0_0_34px_rgba(244,114,182,0.16)]"
        animate={{ rotateX: 72, y: 18, opacity: 0.18 }}
        transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.span
        className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80 blur-2xl"
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: 2.2, opacity: [0, 0.75, 0] }}
        transition={{ duration: 1.1, ease: "easeOut" }}
      />
      {petals.map((petal) => (
        <motion.span
          key={petal}
          className="absolute left-1/2 top-1/2 h-2.5 w-4 rounded-[999px_0_999px_0] bg-pink-100/90 shadow-[0_0_14px_rgba(251,207,232,0.9)]"
          initial={{ x: 0, y: 0, rotate: 0, opacity: 0 }}
          animate={{
            x: Math.cos(petal * 0.9) * (80 + (petal % 4) * 20),
            y: Math.sin(petal * 0.9) * (80 + (petal % 5) * 18),
            rotate: 220 + petal * 28,
            opacity: [0, 1, 0],
          }}
          transition={{ duration: 1.05, delay: petal * 0.025, ease: "easeOut" }}
        />
      ))}
    </span>
  );
}

function MythicCardStage({
  creator,
  onClick,
}: {
  creator: CreatorWithMeta;
  onClick: () => void;
}) {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-visible">
      <span className="pointer-events-none absolute -inset-3 rounded-[30px] bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.42),transparent_30%),radial-gradient(circle_at_50%_58%,rgba(251,207,232,0.3),transparent_44%),radial-gradient(circle_at_50%_90%,rgba(244,114,182,0.22),transparent_42%)] blur-xl" />
      <span className="pointer-events-none absolute inset-3 rounded-[28px] border border-pink-100/24 shadow-[inset_0_0_24px_rgba(255,255,255,0.1),0_0_30px_rgba(244,114,182,0.16)]" />
      <div className="relative z-10 origin-center scale-[0.94]">
        <CreatorCard creator={creator} onClick={() => onClick()} />
      </div>
    </div>
  );
}
