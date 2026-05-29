"use client";

import { useEffect, useMemo, useState } from "react";

import { CreatorCard } from "@/components/cards/CreatorCard";
import { CreatorPopup } from "@/components/creator/CreatorPopup";
import { GlowBackground } from "@/components/effects/GlowBackground";
import { ParticleBackground } from "@/components/effects/ParticleBackground";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { supabase } from "@/lib/supabase/client";
import { Creator } from "@/types/creator";

export function DiscoverPage() {
  const [search, setSearch] = useState("");
  const [creators, setCreators] = useState<Creator[]>([]);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);

  useEffect(() => {
    async function loadCreators() {
      const { data, error } = await supabase
        .from("creator_profiles")
        .select(
          `
          *,
          creator_cards (*)
        `
        )
        .eq("is_public", true)
        .order("trending_score", { ascending: false });

      if (error) {
        console.error(error);
        return;
      }

      const mappedCreators: Creator[] = (data || []).map((item: any) => {
        const card = item.creator_cards?.[0];

        return {
          id: item.id,
          ownerId: item.user_id,
          username: item.username,
          nickname: item.nickname,
          title: item.title || "Digital Creator",
          faction: item.faction || "Creator Nexus",
          category: item.category || "Creator",
          mainPlatform: "youtube",
          status: item.status || "offline",
          avatarUrl: item.avatar_url || "",
          bannerUrl: item.banner_url || item.avatar_url || "",
          bio: item.bio || "",
          description: item.description || "",
          tags: item.tags || [],
          rank: card?.rank || "Bronze",
          rarity: card?.rarity || "common",
          aura: card?.aura || "Origin Aura",
          evolutionStage: card?.evolution_stage || "Stage 1",
          powerScore: card?.power_score || 0,
          collectedBy: 0,
          level: card?.level || 1,
          followers: 0,
          likes: 0,
          views: 0,
          socials: [],
          traits: [],
          featuredMoment: {
            title: "",
            description: "",
          },
          achievements: [],
        };
      });

      setCreators(mappedCreators);
    }

    loadCreators();
  }, []);

  const filteredCreators = useMemo(() => {
    const term = search.toLowerCase().trim();

    if (!term) return creators;

    return creators.filter((creator) => {
      const text = [
        creator.nickname,
        creator.username,
        creator.title,
        creator.category,
        creator.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(term);
    });
  }, [creators, search]);

  const trendingCreators = filteredCreators.slice(0, 8);

  const risingCreators = [...filteredCreators]
    .sort((a, b) => a.followers - b.followers)
    .slice(0, 8);

  const newestCreators = [...filteredCreators].slice(0, 8);

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <GlowBackground />
      <ParticleBackground />

      <SiteHeader search={search} onSearchChange={setSearch} />

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-12">
        <div className="mb-12 text-center">
          <div className="mx-auto inline-flex items-center gap-3 rounded-full border border-cyan-300/15 bg-cyan-300/5 px-5 py-2">
            <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)]" />

            <span className="text-xs font-bold uppercase tracking-[0.35em] text-cyan-100">
              Discover
            </span>
          </div>

          <h1 className="mt-6 text-4xl font-black md:text-6xl">
            Explore o Nexus
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm text-white/45">
            Encontre creators em alta, novos perfis e cartas em crescimento
            dentro do Creator Nexus.
          </p>
        </div>

        <div className="space-y-14">
          <DiscoverSection
            title="Trending"
            creators={trendingCreators}
            onOpenCreator={setSelectedCreator}
          />

          <DiscoverSection
            title="Rising Creators"
            creators={risingCreators}
            onOpenCreator={setSelectedCreator}
          />

          <DiscoverSection
            title="Novos Perfis"
            creators={newestCreators}
            onOpenCreator={setSelectedCreator}
          />
        </div>
      </section>

      <CreatorPopup
        creator={selectedCreator}
        onClose={() => setSelectedCreator(null)}
      />
    </main>
  );
}

function DiscoverSection({
  title,
  creators,
  onOpenCreator,
}: {
  title: string;
  creators: Creator[];
  onOpenCreator: (creator: Creator) => void;
}) {
  if (creators.length === 0) return null;

  return (
    <section>
      <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-cyan-300/15 bg-cyan-300/5 px-5 py-2">
        <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)]" />

        <h2 className="text-base font-bold uppercase tracking-[0.28em] text-cyan-100">
          {title}
        </h2>
      </div>

      <div className="grid grid-cols-1 justify-items-center gap-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {creators.map((creator) => (
          <CreatorCard
            key={`${title}-${creator.id}`}
            creator={creator}
            onClick={onOpenCreator}
          />
        ))}
      </div>
    </section>
  );
}