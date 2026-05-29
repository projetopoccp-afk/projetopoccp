"use client";

import { useEffect, useState } from "react";

import { CreatorCard } from "@/components/cards/CreatorCard";
import { CreatorPopup } from "@/components/creator/CreatorPopup";
import { supabase } from "@/lib/supabase/client";
import { Creator } from "@/types/creator";

type CreatorGridProps = {
  search: string;
};

export function CreatorGrid({ search }: CreatorGridProps) {
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [creators, setCreators] = useState<Creator[]>([]);
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

      const mappedCreators: Creator[] = data.map((item: any) => {
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
        };
      });

      setCreators(mappedCreators);
      setLoading(false);
    }

    loadCreators();
  }, []);

  const normalizedSearch = search.toLowerCase().trim();

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
      creator.status,
      ...creator.tags,
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedSearch);
  });

  return (
    <>
      <section className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 justify-items-center gap-8 px-6 pb-20 pt-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading && (
          <div className="col-span-full rounded-3xl border border-white/10 bg-white/[0.03] px-8 py-10 text-center text-white/60">
            Carregando creators...
          </div>
        )}

        {!loading &&
          filteredCreators.map((creator) => (
            <CreatorCard
              key={creator.id}
              creator={creator}
              onClick={setSelectedCreator}
            />
          ))}

        {!loading && filteredCreators.length === 0 && (
          <div className="col-span-full flex w-full max-w-2xl flex-col items-center rounded-[32px] border border-white/10 bg-white/[0.03] px-8 py-16 text-center backdrop-blur-xl">
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
        )}
      </section>

      <CreatorPopup
        creator={selectedCreator}
        onClose={() => setSelectedCreator(null)}
      />
    </>
  );
}