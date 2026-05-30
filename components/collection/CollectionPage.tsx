"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";

import { CreatorCard } from "@/components/cards/CreatorCard";
import { CreatorPopup } from "@/components/creator/CreatorPopup";
import { GlowBackground } from "@/components/effects/GlowBackground";
import { ParticleBackground } from "@/components/effects/ParticleBackground";
import { supabase } from "@/lib/supabase/client";
import { Creator } from "@/types/creator";

export function CollectionPage() {
  const [loading, setLoading] = useState(true);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);

  useEffect(() => {
    async function loadCollection() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("user_cards")
        .select(`
          rarity,
          source,
          obtained_at,
          creator_profiles (
            *,
            creator_cards (*)
          )
        `)
        .eq("user_id", user.id)
        .order("obtained_at", { ascending: false });

      const mapped = (data || [])
        .map((item: any) => {
          const profile = item.creator_profiles;
          const card = profile?.creator_cards?.[0];

          if (!profile) return null;

          return {
            id: profile.id,
            ownerId: profile.user_id,
            username: profile.username,
            nickname: profile.nickname,
            title: profile.title || "Digital Creator",
            faction: profile.faction || "Creator Nexus",
            category: profile.category || "Creator",
            mainPlatform: "youtube",
            status: profile.status || "offline",
            avatarUrl: profile.avatar_url || "",
            bannerUrl: profile.banner_url || profile.avatar_url || "",
            bio: profile.bio || "",
            description: profile.description || "",
            tags: profile.tags || [],
            rank: card?.rank || "Bronze",
            rarity: item.rarity || card?.rarity || "common",
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
          } as Creator;
        })
        .filter(Boolean) as Creator[];

      setCreators(mapped);
      setLoading(false);
    }

    loadCollection();
  }, []);

  const stats = useMemo(() => {
    return {
      total: creators.length,
      common: creators.filter((c) => c.rarity === "common").length,
      rare: creators.filter((c) => c.rarity === "rare").length,
      epic: creators.filter((c) => c.rarity === "epic").length,
      legendary: creators.filter((c) => c.rarity === "legendary").length,
    };
  }, [creators]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <GlowBackground />
      <ParticleBackground />

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-10">
        <a
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/70 transition hover:bg-white/[0.08] hover:text-white"
        >
          <ArrowLeft size={16} />
          Voltar
        </a>

        <div className="mt-10">
          <div className="inline-flex items-center gap-3 rounded-full border border-cyan-300/15 bg-cyan-300/5 px-5 py-2">
            <Sparkles size={16} className="text-cyan-200" />

            <span className="text-xs font-bold uppercase tracking-[0.35em] text-cyan-100">
              Minha Coleção
            </span>
          </div>

          <h1 className="mt-6 text-4xl font-black md:text-6xl">
            Suas cartas do Nexus
          </h1>

          <p className="mt-4 max-w-2xl text-sm text-white/45">
            Aqui ficarão todas as cartas de creators que você conquistar por
            follows, pacotes, missões e eventos.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Comuns" value={stats.common} />
          <StatCard label="Raras" value={stats.rare} />
          <StatCard label="Épicas" value={stats.epic} />
          <StatCard label="Lendárias" value={stats.legendary} />
        </div>

        {loading ? (
          <div className="mt-16 rounded-3xl border border-white/10 bg-white/[0.04] p-10 text-center text-white/50">
            Carregando coleção...
          </div>
        ) : creators.length === 0 ? (
          <div className="mt-16 rounded-[32px] border border-white/10 bg-white/[0.04] p-10 text-center">
            <p className="text-lg font-bold text-white">Coleção vazia</p>
            <p className="mt-3 text-sm text-white/45">
              Em breve você poderá conquistar cartas seguindo creators, abrindo
              pacotes e completando missões.
            </p>
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-1 justify-items-center gap-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {creators.map((creator) => (
              <CreatorCard
                key={creator.id}
                creator={creator}
                onClick={setSelectedCreator}
              />
            ))}
          </div>
        )}
      </section>

      <CreatorPopup
        creator={selectedCreator}
        onClose={() => setSelectedCreator(null)}
      />
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <p className="text-xs uppercase tracking-[0.25em] text-white/35">
        {label}
      </p>

      <p className="mt-3 text-3xl font-black text-cyan-100">{value}</p>
    </div>
  );
}