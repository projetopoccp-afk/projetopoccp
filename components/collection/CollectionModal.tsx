"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Archive,
  Crown,
  Eye,
  Gem,
  Share2,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";

import { CreatorPopup } from "@/components/creator/CreatorPopup";
import { TiltCard } from "@/components/cards/TiltCard";
import { supabase } from "@/lib/supabase/client";
import { Creator } from "@/types/creator";

type CollectionModalProps = {
  open: boolean;
  onClose: () => void;
};

type CreatorCardData = {
  rank?: string | null;
  rarity?: string | null;
  aura?: string | null;
  evolution_stage?: string | null;
  power_score?: number | null;
  level?: number | null;
};

type CreatorProfile = {
  id: string;
  user_id?: string | null;
  nickname: string | null;
  username: string | null;
  title: string | null;
  faction?: string | null;
  category: string | null;
  status?: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  bio?: string | null;
  description?: string | null;
  tags?: string[] | null;
  creator_cards?: CreatorCardData[] | CreatorCardData | null;
};

type UserCard = {
  id: string;
  rarity: string;
  source: string;
  obtained_at: string;
  creator_profiles: CreatorProfile | null;
};

const rarityLabel: Record<string, string> = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
};

const rarityStyles: Record<
  string,
  {
    border: string;
    badge: string;
    glow: string;
    text: string;
    ring: string;
  }
> = {
  common: {
    border: "border-cyan-300/30",
    badge: "border-cyan-300/25 bg-cyan-300/10 text-cyan-100",
    glow: "bg-cyan-400/25",
    text: "text-cyan-200",
    ring: "ring-cyan-200/25",
  },
  rare: {
    border: "border-blue-300/35",
    badge: "border-blue-300/30 bg-blue-300/10 text-blue-100",
    glow: "bg-blue-500/25",
    text: "text-blue-200",
    ring: "ring-blue-200/30",
  },
  epic: {
    border: "border-purple-300/40",
    badge: "border-purple-300/35 bg-purple-300/10 text-purple-100",
    glow: "bg-purple-500/30",
    text: "text-purple-200",
    ring: "ring-purple-200/35",
  },
  legendary: {
    border: "border-yellow-300/45",
    badge: "border-yellow-300/40 bg-yellow-300/10 text-yellow-100",
    glow: "bg-yellow-400/30",
    text: "text-yellow-100",
    ring: "ring-yellow-200/40",
  },
};

export function CollectionModal({ open, onClose }: CollectionModalProps) {
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<UserCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<UserCard | null>(null);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);

  useEffect(() => {
    if (!open) return;

    async function loadCollection() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setCards([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_cards")
        .select(
          `
          id,
          rarity,
          source,
          obtained_at,
          creator_profiles (
            id,
            user_id,
            nickname,
            username,
            title,
            faction,
            category,
            status,
            avatar_url,
            banner_url,
            bio,
            description,
            tags,
            creator_cards (*)
          )
        `
        )
        .eq("user_id", user.id)
        .order("obtained_at", { ascending: false });

      if (error) {
        console.error(error);
        setCards([]);
        setLoading(false);
        return;
      }

      const normalizedCards = (data || []).map((item: any) => {
        const profile = Array.isArray(item.creator_profiles)
          ? item.creator_profiles[0]
          : item.creator_profiles;

        return {
          ...item,
          creator_profiles: profile,
        };
      });

      setCards(normalizedCards as UserCard[]);
      setLoading(false);
    }

    loadCollection();
  }, [open]);

  const stats = useMemo(() => {
    return {
      total: cards.length,
      common: cards.filter((card) => card.rarity === "common").length,
      rare: cards.filter((card) => card.rarity === "rare").length,
      epic: cards.filter((card) => card.rarity === "epic").length,
      legendary: cards.filter((card) => card.rarity === "legendary").length,
    };
  }, [cards]);

  function handleOpenCreatorProfile(card: UserCard) {
    const creator = buildCreatorFromCard(card);

    if (!creator) return;

    setSelectedCard(null);
    setSelectedCreator(creator);
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          >
            <button
              onClick={onClose}
              className="absolute inset-0"
              aria-label="Fechar coleção"
            />

            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.94 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="hide-scrollbar relative max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-[32px] border border-white/15 bg-zinc-950 p-8 text-white shadow-[0_0_80px_rgba(0,0,0,0.9)]"
            >
              <div className="absolute -left-24 -top-24 h-56 w-56 rounded-full bg-cyan-500/20 blur-[90px]" />
              <div className="absolute -bottom-24 -right-24 h-56 w-56 rounded-full bg-purple-600/20 blur-[90px]" />

              <button
                onClick={onClose}
                className="absolute right-5 top-5 z-10 rounded-full border border-white/10 bg-white/5 p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>

              <div className="relative z-10">
                <div className="inline-flex items-center gap-3 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-cyan-100">
                  <Archive size={14} />
                  Minha Coleção
                </div>

                <h2 className="mt-5 text-3xl font-black">
                  Suas cartas do Nexus
                </h2>

                <p className="mt-3 max-w-2xl text-sm text-white/45">
                  Aqui ficam as cartas de creators conquistadas por follows,
                  pacotes, missões e eventos.
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  <StatCard icon={<Archive size={18} />} label="Total" value={stats.total} />
                  <StatCard icon={<Sparkles size={18} />} label="Comuns" value={stats.common} />
                  <StatCard icon={<Gem size={18} />} label="Raras" value={stats.rare} />
                  <StatCard icon={<Zap size={18} />} label="Épicas" value={stats.epic} />
                  <StatCard icon={<Crown size={18} />} label="Lendárias" value={stats.legendary} />
                </div>

                {loading ? (
                  <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center text-white/50">
                    Carregando coleção...
                  </div>
                ) : cards.length === 0 ? (
                  <EmptyCollection />
                ) : (
                  <div className="mt-10 grid grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {cards.map((card) => (
                      <CollectionCard
                        key={card.id}
                        card={card}
                        onClick={() => setSelectedCard(card)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <CollectionCardShowcase
        card={selectedCard}
        onClose={() => setSelectedCard(null)}
        onOpenProfile={handleOpenCreatorProfile}
      />

      {selectedCreator && typeof document !== "undefined"
        ? createPortal(
            <div className="relative z-[200]">
              <CreatorPopup
                creator={selectedCreator}
                onClose={() => setSelectedCreator(null)}
              />
            </div>,
            document.body
          )
        : null}
    </>
  );
}

function buildCreatorFromCard(card: UserCard): Creator | null {
  const profile = card.creator_profiles;

  if (!profile) return null;

  const creatorCards = Array.isArray(profile.creator_cards)
    ? profile.creator_cards
    : profile.creator_cards
      ? [profile.creator_cards]
      : [];
  const creatorCard = creatorCards[0] || {};

  return {
    id: profile.id,
    ownerId: profile.user_id || "",
    username: profile.username || "creator",
    nickname: profile.nickname || "Creator Nexus",
    title: profile.title || "Digital Creator",
    faction: profile.faction || "Creator Nexus",
    category: profile.category || "Creator",
    mainPlatform: "youtube",
    status: (profile.status as Creator["status"]) || "offline",
    avatarUrl: profile.avatar_url || "",
    bannerUrl: profile.banner_url || profile.avatar_url || "",
    bio: profile.bio || "",
    description: profile.description || "",
    tags: profile.tags || [],
    rank: (creatorCard.rank as Creator["rank"]) || "Bronze",
    rarity: (creatorCard.rarity as Creator["rarity"]) || "common",
    aura: creatorCard.aura || "Origin Aura",
    evolutionStage: (creatorCard.evolution_stage as Creator["evolutionStage"]) || "Stage 1",
    powerScore: creatorCard.power_score || 0,
    collectedBy: 0,
    level: creatorCard.level || 1,
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
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center justify-between text-white/45">
        {icon}
        <span className="text-xs uppercase tracking-[0.25em]">{label}</span>
      </div>

      <p className="mt-4 text-3xl font-black text-cyan-100">{value}</p>
    </div>
  );
}

function EmptyCollection() {
  return (
    <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
        <Archive size={28} />
      </div>

      <p className="mt-5 text-lg font-bold text-white">
        Coleção vazia por enquanto
      </p>

      <p className="mx-auto mt-3 max-w-xl text-sm text-white/45">
        Em breve você poderá conquistar cartas seguindo creators, abrindo
        pacotes e completando missões dentro do Creator Nexus.
      </p>
    </div>
  );
}

function CollectionCard({
  card,
  onClick,
}: {
  card: UserCard;
  onClick: () => void;
}) {
  return (
    <TiltCard>
      <CollectionCardFace card={card} onClick={onClick} size="small" />
    </TiltCard>
  );
}

function CollectionCardShowcase({
  card,
  onClose,
  onOpenProfile,
}: {
  card: UserCard | null;
  onClose: () => void;
  onOpenProfile: (card: UserCard) => void;
}) {
  const [copied, setCopied] = useState(false);

  if (!card) return null;

  const creator = card.creator_profiles;
  const username = creator?.username || "creator";
  const nickname = creator?.nickname || "Creator Nexus";
  const rarity = rarityLabel[card.rarity] || card.rarity;

  function openProfile() {
    if (!card) return;

    onOpenProfile(card);
  }

  async function shareCard() {
  const url = `${window.location.origin}/card/${username}?v=1`;

  const text = `🃏 Eu conquistei a carta ${nickname} (${rarity}) no Creator Nexus`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: `Carta ${nickname}`,
        text,
        url,
      });

      return;
    } catch {
      // usuário cancelou
    }
  }

  await navigator.clipboard.writeText(`${text}\n${url}`);

  setCopied(true);

  setTimeout(() => {
    setCopied(false);
  }, 1800);
}

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
        animate={{ opacity: 1, backdropFilter: "blur(14px)" }}
        exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-4"
      >
        <button
          onClick={onClose}
          className="absolute inset-0"
          aria-label="Fechar carta"
        />

        <button
          onClick={onClose}
          className="absolute right-6 top-6 z-30 rounded-full border border-white/10 bg-white/5 p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>

        <motion.div
          initial={{ opacity: 0, scale: 0.82, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="relative z-20 flex flex-col items-center gap-5"
        >
          <TiltCard>
            <CollectionCardFace card={card} onClick={() => {}} size="large" />
          </TiltCard>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={openProfile}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 py-3 text-sm font-bold text-cyan-100 transition hover:bg-cyan-300/20"
            >
              <Eye size={16} />
              Ver perfil
            </button>

            <button
              onClick={shareCard}
              className="inline-flex items-center gap-2 rounded-full border border-purple-300/20 bg-purple-300/10 px-5 py-3 text-sm font-bold text-purple-100 transition hover:bg-purple-300/20"
            >
              <Share2 size={16} />
              {copied ? "Copiado!" : "Compartilhar carta"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function CollectionCardFace({
  card,
  onClick,
  size,
}: {
  card: UserCard;
  onClick: () => void;
  size: "small" | "large";
}) {
  const creator = card.creator_profiles;
  const imageUrl = creator?.avatar_url || creator?.banner_url || "";
  const nickname = creator?.nickname || "Creator Nexus";
  const username = creator?.username || "creator";
  const rarity = card.rarity || "common";
  const style = rarityStyles[rarity] || rarityStyles.common;
  const isLarge = size === "large";

  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden border bg-black text-left shadow-[0_0_60px_rgba(0,0,0,0.8)] transition duration-500 hover:shadow-[0_0_90px_rgba(34,211,238,0.20)] ${style.border} ${
        isLarge
          ? "h-[620px] w-[410px] rounded-[34px]"
          : "h-[360px] w-[240px] rounded-[24px]"
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/95" />

      <div className="absolute inset-0 opacity-70 transition group-hover:opacity-95">
        <div
          className={`absolute -top-20 left-10 h-44 w-44 rounded-full blur-2xl ${style.glow}`}
        />
        <div
          className={`absolute bottom-0 right-0 h-48 w-48 rounded-full blur-2xl ${style.glow}`}
        />
      </div>

      <div className="absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100">
        <div className="absolute inset-0 translate-x-[-120%] bg-[linear-gradient(115deg,transparent_20%,rgba(255,255,255,0.12)_40%,transparent_60%)] transition-transform duration-1000 group-hover:translate-x-[120%]" />
      </div>

      {imageUrl ? (
        <img
          src={imageUrl}
          alt={nickname}
          className="absolute inset-0 h-full w-full object-cover opacity-90"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-cyan-300/10 text-6xl font-black text-cyan-100">
          {nickname.slice(0, 2).toUpperCase()}
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

      <div
        className={`absolute border font-bold uppercase backdrop-blur ${style.badge} ${
          isLarge
            ? "left-7 top-7 rounded-full px-5 py-2 text-sm tracking-[0.32em]"
            : "left-4 top-4 rounded-full px-3 py-1 text-[10px] tracking-[0.25em]"
        }`}
      >
        {rarityLabel[rarity] || rarity}
      </div>

      <div
        className={`absolute bottom-0 left-0 right-0 ${
          isLarge ? "p-8" : "p-4"
        }`}
      >
        <p
          className={`uppercase ${style.text} ${
            isLarge
              ? "text-sm tracking-[0.35em]"
              : "text-[10px] tracking-[0.3em]"
          }`}
        >
          Carta do Creator
        </p>

        <h3
          className={`mt-2 font-black text-white ${
            isLarge ? "text-4xl" : "text-xl"
          }`}
        >
          {nickname}
        </h3>

        <p
          className={
            isLarge ? "mt-2 text-base text-white/55" : "mt-1 text-xs text-white/50"
          }
        >
          @{username}
        </p>

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/70">
            {card.source}
          </span>

          <span className="text-xs text-white/45">
            {new Date(card.obtained_at).toLocaleDateString("pt-BR")}
          </span>
        </div>
      </div>

      <div
        className={`pointer-events-none absolute inset-0 ring-1 ring-inset ${style.ring} ${
          isLarge ? "rounded-[34px]" : "rounded-[24px]"
        }`}
      />
    </button>
  );
}
