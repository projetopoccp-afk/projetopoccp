"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

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
  const [progressByCreator, setProgressByCreator] = useState<Map<string, UserCardProgress>>(new Map());
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
        `
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

      const mappedCreators: CreatorWithMeta[] = creatorsData.map((item: any) => {
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
          level: card?.level || 1,
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
        progress?.rarities.has(rarity)
      ).length;

      return {
        ...creator,
        ownedRarityCount,
        isComplete: ownedRarityCount === REQUIRED_RARITIES.length,
      };
    });
  }, [creators, progressByCreator]);

  const completedCount = albumCreators.filter((creator) => creator.isComplete).length;
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

            <h1 className="mt-5 text-3xl font-black uppercase tracking-[0.12em] text-white sm:text-5xl">
              {translate(t, "albumPageTitle", "Coleção de Criadores")}
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-6 text-white/55 sm:text-base">
              {translate(
                t,
                "albumPageDescription",
                "Complete cada criador conquistando as 4 raridades. A carta do álbum só acende quando comum, rara, épica e lendária estiverem na sua coleção."
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-3xl border border-white/10 bg-white/[0.035] px-5 py-4 backdrop-blur-xl">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                {translate(t, "albumPageProgressLabel", "Progresso")}
              </p>
              <p className="mt-1 text-xl font-black text-white">
                {completedCount}/{totalCount}
              </p>
            </div>

            <Link
              href="/"
              className="rounded-2xl border border-cyan-300/20 bg-black/45 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-cyan-100 transition hover:-translate-y-0.5 hover:border-purple-300/40 hover:text-white"
            >
              {translate(t, "albumPageBackHome", "Voltar")}
            </Link>
          </div>
        </div>

        {!isLoggedIn && !loading && (
          <div className="mb-6 rounded-3xl border border-amber-300/20 bg-amber-300/[0.055] p-5 text-sm font-semibold text-amber-50/75 backdrop-blur-xl">
            {translate(
              t,
              "albumPageLoginHint",
              "Entre na sua conta para ver quais cartas já estão acesas no seu álbum."
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
                : creator
            )
          );
          setSelectedCreator((currentCreator) =>
            currentCreator?.id === updatedCreator.id
              ? { ...currentCreator, ...updatedCreator }
              : currentCreator
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
  const progressPercentage = (creator.ownedRarityCount / REQUIRED_RARITIES.length) * 100;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.42, delay: Math.min(index * 0.025, 0.35) }}
      className={`group relative aspect-[3/4] overflow-hidden rounded-[28px] border p-3 text-left transition duration-300 ${
        creator.isComplete
          ? "border-cyan-200/45 bg-cyan-300/[0.08] shadow-[0_0_34px_rgba(34,211,238,0.22)] hover:border-purple-200/60 hover:shadow-[0_0_46px_rgba(168,85,247,0.32)]"
          : creator.ownedRarityCount > 0
            ? "border-white/14 bg-white/[0.04] hover:border-cyan-300/25"
            : "border-white/8 bg-white/[0.025] opacity-75 hover:opacity-100"
      }`}
    >
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(34,211,238,0.18),transparent_34%),radial-gradient(circle_at_50%_85%,rgba(168,85,247,0.13),transparent_38%)] opacity-60" />

      {creator.isComplete && (
        <>
          <span className="absolute -inset-12 animate-pulse bg-[conic-gradient(from_180deg,transparent,rgba(34,211,238,0.22),transparent,rgba(168,85,247,0.2),transparent)] blur-xl" />
          <span className="absolute inset-0 bg-[linear-gradient(115deg,transparent_20%,rgba(255,255,255,0.14)_42%,transparent_58%)] opacity-0 transition duration-500 group-hover:translate-x-full group-hover:opacity-100" />
        </>
      )}

      <span className="relative flex h-full flex-col rounded-[22px] border border-white/10 bg-black/38 p-3 backdrop-blur-sm">
        <span className="relative flex flex-1 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/35">
          {creator.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={creator.avatarUrl}
              alt={creator.nickname}
              className={`h-full w-full object-cover transition duration-500 ${
                creator.isComplete
                  ? "scale-105 saturate-125"
                  : creator.ownedRarityCount > 0
                    ? "scale-105 opacity-70 grayscale-[45%]"
                    : "scale-105 opacity-25 grayscale"
              }`}
            />
          ) : (
            <span className="text-4xl text-white/20">✦</span>
          )}

          {!creator.isComplete && (
            <span className="absolute inset-0 bg-black/45" />
          )}

          <span
            className="absolute bottom-0 left-0 h-1 bg-cyan-200 shadow-[0_0_16px_rgba(103,232,249,0.8)] transition-all"
            style={{ width: `${progressPercentage}%` }}
          />
        </span>

        <span className="mt-3 block min-w-0">
          <span className={`block truncate text-sm font-black uppercase tracking-[0.12em] ${creator.isComplete ? "text-white" : "text-white/58"}`}>
            {creator.nickname}
          </span>
          <span className="mt-1 flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/38">
            <span>
              {creator.ownedRarityCount}/{REQUIRED_RARITIES.length}
            </span>
            <span className={creator.isComplete ? "text-cyan-100" : "text-white/32"}>
              {creator.isComplete
                ? translate(t, "albumPageComplete", "Acesa")
                : translate(t, "albumPageIncomplete", "Incompleta")}
            </span>
          </span>
        </span>
      </span>
    </motion.button>
  );
}
