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
};

type AlbumCreator = CreatorWithMeta & {
  ownedRarityCount: number;
  isComplete: boolean;
};

const REQUIRED_RARITIES = ["common", "rare", "epic", "legendary"] as const;
const MYTHIC_RARITY = "mythic";

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
      .select("id")
      .eq("user_id", userId)
      .eq("creator_id", progress.creatorId)
      .eq("rarity", MYTHIC_RARITY)
      .maybeSingle();

    if (!existingMythic) {
      const { error } = await supabase.from("user_cards").insert({
        user_id: userId,
        creator_id: progress.creatorId,
        rarity: MYTHIC_RARITY,
      });

      if (error) {
        console.error("Failed to unlock mythic album reward", error);
        continue;
      }
    }

    const current = nextProgress.get(progress.creatorId) ?? {
      creatorId: progress.creatorId,
      rarities: new Set<string>(),
    };

    current.rarities.add(MYTHIC_RARITY);
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

export default function AlbumPage() {
  const { t } = useLanguage();

  const [creators, setCreators] = useState<CreatorWithMeta[]>([]);
  const [progressByCreator, setProgressByCreator] = useState<
    Map<string, UserCardProgress>
  >(new Map());
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
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
          const card = item.creator_cards?.[0];

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
          .select("creator_id,rarity")
          .eq("user_id", user.id);

        nextProgress = (cardsData ?? []).reduce((map, card: any) => {
          const creatorId = String(card.creator_id || "");
          const rarity = String(card.rarity || "").toLowerCase();

          if (!creatorId || !rarity) return map;

          const current = map.get(creatorId) ?? {
            creatorId,
            rarities: new Set<string>(),
          };

          current.rarities.add(rarity);
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
      };
    });
  }, [creators, progressByCreator]);

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
                onClick={() => setSelectedCreator(creator)}
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
  onClick,
}: {
  creator: AlbumCreator;
  index: number;
  onClick: () => void;
}) {
  const { t } = useLanguage();
  const progressPercentage =
    (creator.ownedRarityCount / REQUIRED_RARITIES.length) * 100;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.42, delay: Math.min(index * 0.025, 0.35) }}
      className={`group relative min-h-[430px] overflow-visible rounded-[34px] border p-4 text-left transition duration-300 ${
        creator.isComplete
          ? "border-pink-100/45 bg-pink-200/[0.06] shadow-[0_0_46px_rgba(244,114,182,0.22)] hover:border-pink-100/70 hover:shadow-[0_0_64px_rgba(244,114,182,0.34)]"
          : creator.ownedRarityCount > 0
            ? "border-white/14 bg-white/[0.04] hover:border-cyan-300/25"
            : "border-white/8 bg-white/[0.025] opacity-80 hover:opacity-100"
      }`}
    >
      <span className="pointer-events-none absolute inset-0 rounded-[34px] bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.12),transparent_34%),radial-gradient(circle_at_50%_82%,rgba(244,114,182,0.12),transparent_42%)] opacity-70" />
      <span className="pointer-events-none absolute inset-[1px] rounded-[33px] border border-white/[0.055]" />

      <AnimatePresence mode="popLayout" initial={false}>
        {creator.isComplete ? (
          <motion.span
            key="mythic-card"
            className="relative z-10 flex h-full min-h-[398px] items-center justify-center overflow-visible"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <MythicAlbumCard creator={creator} onClick={onClick} />
          </motion.span>
        ) : (
          <motion.span
            key="locked-card"
            className="relative z-10 flex h-full min-h-[398px] flex-col rounded-[26px] border border-white/10 bg-black/44 p-3 backdrop-blur-sm"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
          >
            <span className="relative flex flex-1 items-center justify-center overflow-hidden rounded-[22px] border border-white/10 bg-black/45">
              <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,rgba(255,255,255,0.075),transparent_28%),radial-gradient(circle_at_50%_72%,rgba(34,211,238,0.07),transparent_38%),linear-gradient(180deg,rgba(0,0,0,0.22),rgba(0,0,0,0.86))]" />
              <span className="absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.035)_0px,rgba(255,255,255,0.035)_1px,transparent_1px,transparent_9px)] opacity-25" />
              <span className="absolute flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-black/55 text-2xl text-white/28 shadow-[0_0_28px_rgba(0,0,0,0.65)]">
                ✦
              </span>
              <span
                className="absolute bottom-0 left-0 h-1 bg-cyan-200 shadow-[0_0_16px_rgba(103,232,249,0.8)] transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </span>

            <span className="mt-3 block min-w-0">
              <span className="block truncate text-sm font-black uppercase tracking-[0.12em] text-white/58">
                {creator.nickname}
              </span>
              <span className="mt-1 flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/38">
                <span>
                  {creator.ownedRarityCount}/{REQUIRED_RARITIES.length}
                </span>
                <span className="text-white/32">
                  {translate(t, "albumPageIncomplete", "Incompleta")}
                </span>
              </span>
            </span>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function MythicAlbumCard({
  creator,
  onClick,
}: {
  creator: AlbumCreator;
  onClick: () => void;
}) {
  const mythicCreator: CreatorWithMeta = {
    ...creator,
    rarity: "mythic" as CreatorWithMeta["rarity"],
    aura: "Sakura Mythic Aura",
    rank: creator.rank || "Bronze",
  };

  const petals = Array.from({ length: 16 }, (_, index) => index);

  return (
    <span className="relative block h-[360px] w-[240px] overflow-visible">
      <span className="pointer-events-none absolute -inset-6 rounded-[34px] bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.44),transparent_30%),radial-gradient(circle_at_50%_58%,rgba(251,207,232,0.34),transparent_46%),radial-gradient(circle_at_50%_90%,rgba(244,114,182,0.28),transparent_44%)] blur-xl" />
      <span className="pointer-events-none absolute -inset-3 rounded-[30px] border border-pink-100/35 shadow-[0_0_28px_rgba(244,114,182,0.38),inset_0_0_22px_rgba(255,255,255,0.18)]" />

      {petals.map((petal) => (
        <span
          key={petal}
          className="pointer-events-none absolute top-[-18%] z-20 h-2.5 w-4 rounded-[999px_0_999px_0] bg-pink-100/85 shadow-[0_0_12px_rgba(251,207,232,0.85)] animate-[albumPetalFall_4.8s_linear_infinite]"
          style={{
            left: `${8 + ((petal * 17) % 86)}%`,
            animationDelay: `${petal * 0.32}s`,
            animationDuration: `${4.3 + (petal % 5) * 0.42}s`,
          }}
        />
      ))}

      <span className="relative z-10 block h-full w-full overflow-visible rounded-[28px] [filter:drop-shadow(0_0_18px_rgba(244,114,182,0.42))]">
        <CreatorCard creator={mythicCreator} onClick={() => onClick()} />
      </span>

      <span className="pointer-events-none absolute bottom-3 left-1/2 z-30 -translate-x-1/2 rounded-full border border-pink-100/45 bg-black/70 px-5 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-pink-50 shadow-[0_0_18px_rgba(244,114,182,0.38)]">
        MÍTICA
      </span>

      <style jsx>{`
        @keyframes albumPetalFall {
          0% {
            transform: translate3d(0, -24px, 0) rotate(0deg);
            opacity: 0;
          }
          12% {
            opacity: 0.95;
          }
          100% {
            transform: translate3d(22px, 430px, 0) rotate(320deg);
            opacity: 0;
          }
        }
      `}</style>
    </span>
  );
}
