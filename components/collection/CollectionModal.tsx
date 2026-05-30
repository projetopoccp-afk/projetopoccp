"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  Crown,
  ExternalLink,
  Gem,
  Share2,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { supabase } from "@/lib/supabase/client";

type CollectionModalProps = {
  open: boolean;
  onClose: () => void;
};

type CreatorProfile = {
  id: string;
  nickname: string | null;
  username: string | null;
  title: string | null;
  category: string | null;
  avatar_url: string | null;
  banner_url: string | null;
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

const rarityClass: Record<string, string> = {
  common: "border-cyan-300/25 bg-cyan-300/10 text-cyan-100",
  rare: "border-blue-300/25 bg-blue-300/10 text-blue-100",
  epic: "border-purple-300/25 bg-purple-300/10 text-purple-100",
  legendary: "border-yellow-300/30 bg-yellow-300/10 text-yellow-100",
};

export function CollectionModal({ open, onClose }: CollectionModalProps) {
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<UserCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<UserCard | null>(null);

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
            nickname,
            username,
            title,
            category,
            avatar_url,
            banner_url
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

      setCards((data || []) as UserCard[]);
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
      />
    </>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
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
  const creator = card.creator_profiles;
  const imageUrl = creator?.avatar_url || creator?.banner_url || "";
  const nickname = creator?.nickname || "Creator Nexus";
  const username = creator?.username || "creator";
  const rarity = card.rarity || "common";

  return (
    <button
      onClick={onClick}
      className="group relative h-[360px] w-[240px] overflow-hidden rounded-[24px] border border-white/15 bg-black text-left shadow-[0_0_60px_rgba(0,0,0,0.8)] transition duration-500 hover:scale-[1.03] hover:border-cyan-300/35 hover:shadow-[0_0_70px_rgba(34,211,238,0.18)]"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/95" />

      {imageUrl ? (
        <img
          src={imageUrl}
          alt={nickname}
          className="absolute inset-0 h-full w-full object-cover opacity-85 transition duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-cyan-300/10 text-6xl font-black text-cyan-100">
          {nickname.slice(0, 2).toUpperCase()}
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />

      <div
        className={`absolute left-4 top-4 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] backdrop-blur ${
          rarityClass[rarity] || rarityClass.common
        }`}
      >
        {rarityLabel[rarity] || rarity}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-200">
          Carta conquistada
        </p>

        <h3 className="mt-2 text-xl font-bold text-white">{nickname}</h3>

        <p className="mt-1 text-xs text-white/50">@{username}</p>

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/70">
            {card.source}
          </span>

          <span className="text-xs text-white/45">
            {new Date(card.obtained_at).toLocaleDateString("pt-BR")}
          </span>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 rounded-[24px] ring-1 ring-inset ring-white/20" />
    </button>
  );
}

function CollectionCardShowcase({
  card,
  onClose,
}: {
  card: UserCard | null;
  onClose: () => void;
}) {
  const creator = card?.creator_profiles;
  const nickname = creator?.nickname || "Creator Nexus";
  const username = creator?.username || "creator";
  const imageUrl = creator?.avatar_url || creator?.banner_url || "";
  const rarity = card?.rarity || "common";
  const profileUrl = creator?.username ? `/creator/${creator.username}` : "/";

  async function shareCard() {
    if (!card) return;

    const text = `Eu conquistei a carta ${nickname} (${rarityLabel[rarity] || rarity}) no Creator Nexus!`;
    const url = `${window.location.origin}${profileUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${nickname} | Creator Nexus`,
          text,
          url,
        });
        return;
      } catch {
        return;
      }
    }

    await navigator.clipboard.writeText(`${text}\n${url}`);
    alert("Link da carta copiado!");
  }

  return (
    <AnimatePresence>
      {card && (
        <motion.div
          initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
          animate={{ opacity: 1, backdropFilter: "blur(16px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-4"
        >
          <button
            onClick={onClose}
            className="absolute inset-0"
            aria-label="Fechar carta"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.86, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="relative grid w-full max-w-4xl overflow-hidden rounded-[32px] border border-white/15 bg-zinc-950 text-white shadow-[0_0_90px_rgba(0,0,0,0.95)] md:grid-cols-[320px_1fr]"
          >
            <button
              onClick={onClose}
              className="absolute right-5 top-5 z-20 rounded-full border border-white/10 bg-white/5 p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>

            <div className="relative min-h-[460px] overflow-hidden bg-black">
              {imageUrl ? (
                <motion.img
                  src={imageUrl}
                  alt={nickname}
                  initial={{ scale: 1.05 }}
                  animate={{ scale: [1.05, 1.1, 1.05] }}
                  transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 h-full w-full object-cover opacity-90"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-cyan-300/10 text-7xl font-black text-cyan-100">
                  {nickname.slice(0, 2).toUpperCase()}
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />

              <div
                className={`absolute left-5 top-5 rounded-full border px-4 py-1 text-xs font-bold uppercase tracking-[0.25em] backdrop-blur ${
                  rarityClass[rarity] || rarityClass.common
                }`}
              >
                {rarityLabel[rarity] || rarity}
              </div>

              <div className="absolute bottom-6 left-6 right-6">
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">
                  Carta do Creator
                </p>

                <h3 className="mt-2 text-3xl font-black text-white">
                  {nickname}
                </h3>

                <p className="mt-1 text-sm text-white/55">@{username}</p>
              </div>
            </div>

            <div className="relative p-8">
              <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-purple-500/20 blur-[90px]" />
              <div className="absolute -bottom-20 -left-20 h-52 w-52 rounded-full bg-cyan-500/20 blur-[90px]" />

              <div className="relative z-10 flex h-full flex-col justify-center">
                <div className="inline-flex w-fit rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-cyan-100">
                  Item colecionável
                </div>

                <h2 className="mt-6 text-4xl font-black">{nickname}</h2>

                <p className="mt-3 text-white/50">
                  Você conquistou esta carta dentro do Creator Nexus.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <DetailBox label="Raridade" value={rarityLabel[rarity] || rarity} />
                  <DetailBox label="Fonte" value={card.source} />
                  <DetailBox
                    label="Conquistada em"
                    value={new Date(card.obtained_at).toLocaleDateString("pt-BR")}
                  />
                  <DetailBox label="Creator" value={`@${username}`} />
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href={profileUrl}
                    className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-5 py-3 text-sm font-black text-black transition hover:scale-105"
                  >
                    <ExternalLink size={16} />
                    Ver perfil
                  </a>

                  <button
                    onClick={shareCard}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-5 py-3 text-sm font-bold text-white transition hover:bg-white/[0.08]"
                  >
                    <Share2 size={16} />
                    Compartilhar carta
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DetailBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-white/35">
        {label}
      </p>
      <p className="mt-2 font-bold text-white">{value}</p>
    </div>
  );
}
