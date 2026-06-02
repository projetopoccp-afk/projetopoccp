"use client";

import { useEffect, useMemo, useState } from "react";

import { CreatorCard } from "@/components/cards/CreatorCard";
import { CreatorPopup } from "@/components/creator/CreatorPopup";
import { supabase } from "@/lib/supabase/client";
import { Creator } from "@/types/creator";

type CreatorGridProps = {
  search: string;
};

type CreatorWithMeta = Creator & {
  createdAt: string;
  trendingScore: number;
};

const RARITY_SHOWCASE_CYCLE = [
  { rarity: "common", level: 1 },
  { rarity: "rare", level: 2 },
  { rarity: "epic", level: 3 },
  { rarity: "legendary", level: 5 },
] as const;

const RARITY_SHOWCASE_INTERVAL = 2200;

function getCreatorUsernameFromPath() {
  if (typeof window === "undefined") return null;

  const match = window.location.pathname.match(/^\/creator\/([^/]+)$/);

  if (!match?.[1]) return null;

  return decodeURIComponent(match[1]);
}

export function CreatorGrid({ search }: CreatorGridProps) {
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [creators, setCreators] = useState<CreatorWithMeta[]>([]);
  const [loading, setLoading] = useState(true);

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
          title: item.title || "Rising Creator",
          faction: item.faction || "",
          category: item.category || "Creator",
          mainPlatform: "youtube",
          status: item.status || "offline",
          avatarUrl: item.avatar_url || "",
          bannerUrl: item.banner_url || "",
          bio: item.bio || "Novo creator aprovado na plataforma.",
          description:
            item.description ||
            "Este perfil foi aprovado e poderá ser personalizado pelo criador em breve.",
          tags: item.tags || [],
          rank: card?.rank || "Bronze",
          rarity: card?.rarity || "common",
          aura: card?.aura || "Origin Aura",
          evolutionStage: card?.evolution_stage || "Stage 1 — Rising Creator",
          powerScore: card?.power_score || 0,
          collectedBy: 0,
          level: card?.level || 1,
          followers: 0,
          likes: 0,
          views: 0,
          socials: [],
          traits: [
            {
              label: "Status",
              value: "Recently approved",
            },
            {
              label: "Origin",
              value: "Creator request",
            },
            {
              label: "Style",
              value: "Pending customization",
            },
          ],
          featuredMoment: {
            title: "First appearance",
            description:
              "Este creator acabou de entrar no universo da plataforma.",
          },
          achievements: [
            {
              id: "approved",
              title: "Creator Approved",
              description: "Perfil aprovado pela moderação.",
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

    const nextUrl = `/creator/${encodeURIComponent(creator.username)}`;

    if (window.location.pathname !== nextUrl) {
      window.history.pushState(
        {
          creatorId: creator.id,
        },
        "",
        nextUrl
      );
    }
  }

  function handleCloseCreator() {
    setSelectedCreator(null);

    if (window.location.pathname.startsWith("/creator/")) {
      window.history.pushState(null, "", "/");
    }
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

  const featuredCreators = useMemo(() => {
    return [...creators]
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, 6);
  }, [creators]);

  const newestCreators = useMemo(() => {
    return [...creators]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 6);
  }, [creators]);

  return (
    <>
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-10">
        {loading && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-8 py-10 text-center text-white/60">
            Carregando creators...
          </div>
        )}

        {!loading && hasSearch && (
          <CreatorSection
            title="Resultado da busca"
            description="Creators encontrados com base no termo pesquisado."
            creators={filteredCreators}
            onOpenCreator={handleOpenCreator}
          />
        )}

        {!loading && !hasSearch && (
          <div className="space-y-10">
            <CreatorSection
              title="Cartas em Destaque"
              description=""
              creators={featuredCreators}
              onOpenCreator={handleOpenCreator}
            />

            <CreatorSection
              title="Cartas Novas"
              description=""
              creators={newestCreators}
              onOpenCreator={handleOpenCreator}
            />
          </div>
        )}

        {!loading && hasSearch && filteredCreators.length === 0 && <EmptyState />}
      </section>

      <CreatorPopup creator={selectedCreator} onClose={handleCloseCreator} />
    </>
  );
}

function CreatorSection({
  eyebrow,
  title,
  description,
  creators,
  onOpenCreator,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  creators: CreatorWithMeta[];
  onOpenCreator: (creator: Creator) => void;
}) {
  if (creators.length === 0) return null;

  return (
    <div>
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

      <div className="grid grid-cols-1 justify-items-center gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {creators.map((creator, index) => (
          <AnimatedRarityCreatorCard
            key={`${title}-${creator.id}`}
            creator={creator}
            index={index}
            onClick={onOpenCreator}
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
}: {
  creator: CreatorWithMeta;
  index: number;
  onClick: (creator: Creator) => void;
}) {
  const [rarityIndex, setRarityIndex] = useState(index % RARITY_SHOWCASE_CYCLE.length);

  useEffect(() => {
    const startDelay = index * 280;
    let intervalId: number | null = null;

    const timeoutId = window.setTimeout(() => {
      setRarityIndex((current) => (current + 1) % RARITY_SHOWCASE_CYCLE.length);

      intervalId = window.setInterval(() => {
        setRarityIndex((current) => (current + 1) % RARITY_SHOWCASE_CYCLE.length);
      }, RARITY_SHOWCASE_INTERVAL);
    }, startDelay);

    return () => {
      window.clearTimeout(timeoutId);

      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
    };
  }, [index]);

  const showcase = RARITY_SHOWCASE_CYCLE[rarityIndex];

  const showcasedCreator: CreatorWithMeta = {
    ...creator,
    rarity: showcase.rarity,
    level: showcase.level,
  };

  return (
    <div className="transition duration-500 ease-out">
      <CreatorCard creator={showcasedCreator} onClick={onClick} />
    </div>
  );
}


function EmptyState() {
  return (
    <div className="flex w-full flex-col items-center rounded-[32px] border border-white/10 bg-white/[0.03] px-8 py-16 text-center backdrop-blur-xl">
      <div className="h-20 w-20 rounded-full bg-gradient-to-br from-cyan-400/20 to-purple-500/20 blur-2xl" />

      <div className="relative -mt-12 flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-black/40 text-3xl">
        ✦
      </div>

      <h3 className="mt-6 text-2xl font-bold text-white">
        No digital identities detected
      </h3>

      <p className="mt-3 max-w-md text-sm text-white/50">
        Try searching by creator name, category, rarity, platform or tags.
      </p>
    </div>
  );
}
