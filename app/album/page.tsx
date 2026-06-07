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

function hasCompletedBaseRarities(rarities: Set<string>) {
  return REQUIRED_RARITIES.every((rarity) => rarities.has(rarity));
}

function createEmptyProgress(creatorId: string): UserCardProgress {
  return {
    creatorId,
    rarities: new Set<string>(),
    mythicCardId: null,
    mythicSeenAt: null,
  };
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
          const baseCards = Array.isArray(item.creator_cards)
            ? item.creator_cards
            : [];
          const card =
            baseCards.find(
              (creatorCard: any) => creatorCard?.rarity === "common",
            ) ?? baseCards[0];

          return {
            id: item.id,
            ownerId: item.user_id,
            username: item.username,
            nickname: item.nickname,
            title:
              item.title ||
              translate(t, "creatorGridDefaultTitle", "Rising Creator"),
            faction: item.faction || "",
            category: item.category || translate(t, "creator", "Creator"),
            mainPlatform: "youtube",
            status: item.status || "offline",
            avatarUrl: item.avatar_url || "",
            bannerUrl: item.banner_url || "",
            bio:
              item.bio ||
              translate(
                t,
                "creatorGridDefaultBio",
                "Novo criador aprovado na plataforma.",
              ),
            description:
              item.description ||
              translate(
                t,
                "creatorGridDefaultDescription",
                "Este perfil foi aprovado e poderá ser personalizado pelo criador em breve.",
              ),
            tags: normalizeCreatorTags(item.tags),
            rank: card?.rank || "Bronze",
            rarity: card?.rarity || "common",
            aura: card?.aura || "Origin Aura",
            evolutionStage:
              card?.evolution_stage ||
              translate(
                t,
                "creatorGridDefaultEvolutionStage",
                "Stage 1 — Rising Creator",
              ),
            powerScore: card?.power_score || 0,
            collectedBy: 0,
            level: card?.level || 1,
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

        nextProgress = (cardsData ?? []).reduce((map, card: any) => {
          const creatorId = String(card.creator_id || "");
          const rarity = String(card.rarity || "").toLowerCase();

          if (!creatorId || !rarity) return map;

          const current = map.get(creatorId) ?? createEmptyProgress(creatorId);

          current.rarities.add(rarity);

          if (rarity === MYTHIC_RARITY) {
            current.mythicCardId = card.id ?? current.mythicCardId;
            current.mythicSeenAt = card.seen_at ?? current.mythicSeenAt;
          }

          map.set(creatorId, current);
          return map;
        }, new Map<string, UserCardProgress>());
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

      return {
        ...creator,
        ownedRarityCount,
        isComplete: ownedRarityCount === REQUIRED_RARITIES.length,
        hasMythic: Boolean(progress?.rarities.has(MYTHIC_RARITY)),
        mythicCardId: progress?.mythicCardId ?? null,
        mythicSeenAt: progress?.mythicSeenAt ?? null,
      };
    });
  }, [creators, progressByCreator]);

  async function handleRevealMythic(creator: AlbumCreator) {
    if (!creator.mythicCardId || openingCreatorIds.has(creator.id)) return;

    setOpeningCreatorIds((current) => {
      const next = new Set(current);
      next.add(creator.id);
      return next;
    });

    const now = new Date().toISOString();

    const { error } = await supabase
      .from("user_cards")
      .update({ seen_at: now })
      .eq("id", creator.mythicCardId);

    if (error) {
      console.error("Failed to mark mythic card as revealed", error);
    }

    window.setTimeout(() => {
      setProgressByCreator((current) => {
        const next = new Map(current);
        const progress = next.get(creator.id) ?? createEmptyProgress(creator.id);
        progress.rarities.add(MYTHIC_RARITY);
        progress.mythicCardId = creator.mythicCardId;
        progress.mythicSeenAt = now;
        next.set(creator.id, progress);
        return next;
      });

      setOpeningCreatorIds((current) => {
        const next = new Set(current);
        next.delete(creator.id);
        return next;
      });
    }, 760);
  }

  const completedCount = albumCreators.filter(
    (creator) => creator.isComplete,
  ).length;
  const totalCount = albumCreators.length;

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <GlowBackground />
      <ParticleBackground />

      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-10">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
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

          <div className="rounded-3xl border border-white/10 bg-white/[0.035] px-5 py-4 backdrop-blur-xl">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
              {translate(t, "albumPageProgressLabel", "Progresso")}
            </p>
            <p className="mt-1 text-xl font-black text-white">
              {completedCount}/{totalCount}
            </p>
          </div>
        </div>

        {!isLoggedIn && !loading && (
          <div className="mb-6 rounded-3xl border border-amber-300/20 bg-amber-300/[0.055] p-5 text-sm font-semibold text-amber-50/75 backdrop-blur-xl">
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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {albumCreators.map((creator, index) => (
              <AlbumTile
                key={creator.id}
                creator={creator}
                index={index}
                isOpening={openingCreatorIds.has(creator.id)}
                onOpenCreator={() => setSelectedCreator(toMythicCreator(creator))}
                onReveal={() => handleRevealMythic(creator)}
              />
            ))}
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

function AlbumTile({
  creator,
  index,
  isOpening,
  onOpenCreator,
  onReveal,
}: {
  creator: AlbumCreator;
  index: number;
  isOpening: boolean;
  onOpenCreator: () => void;
  onReveal: () => void;
}) {
  const { t } = useLanguage();

  const progressPercentage =
    (creator.ownedRarityCount / REQUIRED_RARITIES.length) * 100;
  const isRevealed =
    creator.isComplete && creator.hasMythic && Boolean(creator.mythicSeenAt);
  const canReveal =
    creator.isComplete && creator.hasMythic && !creator.mythicSeenAt;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.42, delay: Math.min(index * 0.025, 0.35) }}
      className="relative min-h-[430px]"
    >
      <AnimatePresence mode="wait" initial={false}>
        {isRevealed ? (
          <motion.div
            key="revealed"
            className="relative flex min-h-[430px] items-center justify-center overflow-visible"
            initial={{ opacity: 0, scale: 0.88, rotateY: -18 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
          >
            <CreatorCard
              creator={toMythicCreator(creator)}
              onClick={onOpenCreator}
            />
          </motion.div>
        ) : (
          <motion.button
            key="sealed"
            type="button"
            onClick={canReveal ? onReveal : undefined}
            disabled={!canReveal || isOpening}
            className={`group relative flex min-h-[430px] w-full flex-col overflow-hidden rounded-[34px] border p-4 text-left transition duration-300 ${
              canReveal
                ? "cursor-pointer border-pink-100/28 bg-pink-200/[0.045] shadow-[0_0_34px_rgba(244,114,182,0.16)] hover:border-pink-100/55 hover:shadow-[0_0_52px_rgba(244,114,182,0.28)]"
                : creator.ownedRarityCount > 0
                  ? "cursor-default border-white/14 bg-white/[0.04]"
                  : "cursor-default border-white/8 bg-white/[0.025] opacity-80"
            }`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={
              isOpening
                ? {
                    opacity: 1,
                    scale: [1, 1.04, 0.98, 1.08],
                    rotateY: [0, -6, 10, 0],
                  }
                : { opacity: 1, scale: 1, rotateY: 0 }
            }
            exit={{ opacity: 0, scale: 0.92, rotateY: 22 }}
            transition={{
              duration: isOpening ? 0.76 : 0.32,
              ease: [0.22, 1, 0.36, 1],
            }}
            aria-label={
              canReveal
                ? `Revelar carta mítica de ${creator.nickname}`
                : `Carta de ${creator.nickname} ainda bloqueada`
            }
          >
            <span className="pointer-events-none absolute inset-0 rounded-[34px] bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.12),transparent_34%),radial-gradient(circle_at_50%_82%,rgba(244,114,182,0.12),transparent_42%)] opacity-70" />
            <span className="pointer-events-none absolute inset-[1px] rounded-[33px] border border-white/[0.055]" />

            <span className="relative z-10 flex flex-1 flex-col rounded-[26px] border border-white/10 bg-black/44 p-3 backdrop-blur-sm">
              <span className="relative flex flex-1 items-center justify-center overflow-hidden rounded-[22px] border border-white/10 bg-black/45">
                <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,rgba(255,255,255,0.075),transparent_28%),radial-gradient(circle_at_50%_72%,rgba(34,211,238,0.07),transparent_38%),linear-gradient(180deg,rgba(0,0,0,0.22),rgba(0,0,0,0.86))]" />
                <span className="absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.035)_0px,rgba(255,255,255,0.035)_1px,transparent_1px,transparent_9px)] opacity-25" />

                {canReveal && (
                  <span className="absolute inset-0 opacity-80">
                    <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-pink-100/18 shadow-[0_0_22px_rgba(251,207,232,0.45)]" />
                    <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-pink-100/14 shadow-[0_0_20px_rgba(251,207,232,0.36)]" />
                    <span className="absolute inset-8 rounded-[26px] border border-pink-100/18" />
                  </span>
                )}

                <span
                  className={`absolute flex h-16 w-16 items-center justify-center rounded-2xl border bg-black/55 text-2xl shadow-[0_0_28px_rgba(0,0,0,0.65)] transition ${
                    canReveal
                      ? "border-pink-100/30 text-pink-50/70 shadow-[0_0_34px_rgba(244,114,182,0.28)]"
                      : "border-white/10 text-white/28"
                  }`}
                >
                  ✦
                </span>

                {isOpening && (
                  <span className="absolute inset-0 z-20 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.82),rgba(251,207,232,0.34)_28%,transparent_62%)] animate-[albumRevealFlash_0.76s_ease-out_forwards]" />
                )}

                <span
                  className={`absolute bottom-0 left-0 h-1 shadow-[0_0_16px_rgba(103,232,249,0.8)] transition-all ${
                    canReveal ? "bg-pink-100" : "bg-cyan-200"
                  }`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </span>

              <span className="mt-3 block min-w-0">
                <span className="block truncate text-sm font-black uppercase tracking-[0.12em] text-white/58">
                  {canReveal ? "???" : creator.nickname}
                </span>
                <span className="mt-1 flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/38">
                  <span>
                    {creator.ownedRarityCount}/{REQUIRED_RARITIES.length}
                  </span>
                  <span className={canReveal ? "text-pink-50/60" : "text-white/32"}>
                    {canReveal
                      ? "Revelar"
                      : translate(t, "albumPageIncomplete", "Incompleta")}
                  </span>
                </span>
              </span>
            </span>

            <style jsx>{`
              @keyframes albumRevealFlash {
                0% {
                  opacity: 0;
                  transform: scale(0.72);
                }
                36% {
                  opacity: 1;
                  transform: scale(1.04);
                }
                100% {
                  opacity: 0;
                  transform: scale(1.38);
                }
              }
            `}</style>
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
