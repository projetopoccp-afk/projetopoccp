"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
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
  /**
   * Usado pelo sistema de notificações.
   * Quando o usuário clicar em uma notificação de carta, envie o id da carta aqui
   * para a coleção abrir diretamente no detalhe da carta.
   */
  initialCardId?: string | null;
  /**
   * Alternativa para notificações antigas que talvez ainda não tenham card_id.
   * Com creator_id, a coleção tenta abrir a carta daquele creator.
   */
  initialCreatorId?: string | null;
  /**
   * Chamado depois que a carta da notificação for aberta.
   * Serve para limpar o estado no componente pai, se você usar initialCardId/initialCreatorId.
   */
  onInitialCardOpened?: () => void;
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
  seen_at?: string | null;
  creator_profiles: CreatorProfile | null;
};

type PendingNotificationCard = {
  cardId?: string | null;
  creatorId?: string | null;
  card_id?: string | null;
  creator_id?: string | null;
};

const rarityLabel: Record<string, string> = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
};

const rarityXp: Record<string, number> = {
  common: 20,
  rare: 50,
  epic: 120,
  legendary: 300,
};

const rarityStyles: Record<
  string,
  {
    border: string;
    badge: string;
    glow: string;
    text: string;
    ring: string;
    frame: string;
    aura: string;
    shine: string;
    corner: string;
    shadow: string;
  }
> = {
  common: {
    border: "border-cyan-300/30",
    badge: "border-cyan-300/25 bg-cyan-300/10 text-cyan-100",
    glow: "bg-cyan-400/20",
    text: "text-cyan-200",
    ring: "ring-cyan-200/25",
    frame: "from-cyan-300/12 via-slate-900/10 to-cyan-900/24",
    aura: "bg-cyan-400/14",
    shine: "from-transparent via-cyan-100/8 to-transparent",
    corner: "border-cyan-200/35 bg-cyan-300/10",
    shadow: "shadow-[0_0_42px_rgba(34,211,238,0.14)]",
  },
  rare: {
    border: "border-sky-300/70",
    badge: "border-sky-200/55 bg-sky-300/18 text-sky-50",
    glow: "bg-sky-400/32",
    text: "text-sky-100",
    ring: "ring-sky-200/45",
    frame: "from-sky-300/20 via-blue-950/10 to-cyan-950/34",
    aura: "bg-sky-400/22",
    shine: "from-transparent via-sky-100/14 to-transparent",
    corner: "border-sky-200/45 bg-sky-300/15",
    shadow: "shadow-[0_0_70px_rgba(14,165,233,0.34)]",
  },
  epic: {
    border: "border-fuchsia-300/75",
    badge: "border-fuchsia-200/65 bg-fuchsia-400/18 text-fuchsia-50",
    glow: "bg-fuchsia-500/36",
    text: "text-fuchsia-100",
    ring: "ring-fuchsia-200/55",
    frame: "from-fuchsia-300/24 via-purple-950/18 to-pink-700/18",
    aura: "bg-fuchsia-500/28",
    shine: "from-transparent via-fuchsia-100/18 to-transparent",
    corner: "border-fuchsia-200/55 bg-fuchsia-300/15",
    shadow: "shadow-[0_0_88px_rgba(217,70,239,0.46)]",
  },
  legendary: {
    border: "border-amber-200/85",
    badge: "border-amber-100/75 bg-amber-300/22 text-amber-50",
    glow: "bg-amber-300/40",
    text: "text-amber-50",
    ring: "ring-amber-100/65",
    frame: "from-amber-200/26 via-yellow-700/16 to-red-700/18",
    aura: "bg-amber-300/32",
    shine: "from-transparent via-amber-50/22 to-transparent",
    corner: "border-amber-100/70 bg-amber-300/20",
    shadow: "shadow-[0_0_108px_rgba(251,191,36,0.55)]",
  },
};

const rarityNeonStyles: Record<
  string,
  {
    outerAura: string;
    pulseAura: string;
    energyOverlay: string;
    staticOverlay: string;
    borderGlow: CSSProperties;
    badgeGlow: CSSProperties;
  }
> = {
  common: {
    outerAura: "bg-cyan-400/12 blur-2xl opacity-40",
    pulseAura: "bg-cyan-300/8",
    energyOverlay:
      "bg-[linear-gradient(90deg,rgba(34,211,238,0.06),rgba(34,211,238,0.11),rgba(34,211,238,0.06))]",
    staticOverlay:
      "bg-[linear-gradient(180deg,rgba(34,211,238,0.08),transparent_46%,rgba(34,211,238,0.05))]",
    borderGlow: {
      boxShadow:
        "0 0 0 1px rgba(103,232,249,.42), 0 0 16px rgba(34,211,238,.26), 0 0 38px rgba(34,211,238,.11)",
    },
    badgeGlow: {
      boxShadow: "0 0 16px rgba(34,211,238,.24)",
    },
  },
  rare: {
    outerAura: "bg-sky-400/30 blur-[30px] opacity-90",
    pulseAura: "bg-sky-300/20",
    energyOverlay:
      "bg-[linear-gradient(180deg,rgba(56,189,248,0.18),rgba(14,165,233,0.24),rgba(56,189,248,0.16)),linear-gradient(90deg,rgba(125,211,252,0.16),transparent_50%,rgba(14,165,233,0.14))]",
    staticOverlay:
      "bg-[linear-gradient(180deg,rgba(56,189,248,0.22),transparent_42%,rgba(14,165,233,0.14))]",
    borderGlow: {
      boxShadow:
        "0 0 0 1px rgba(125,211,252,.82), 0 0 28px rgba(14,165,233,.78), 0 0 78px rgba(2,132,199,.44), inset 0 0 22px rgba(56,189,248,.18)",
    },
    badgeGlow: {
      boxShadow: "0 0 24px rgba(56,189,248,.58)",
    },
  },
  epic: {
    outerAura: "bg-fuchsia-500/42 blur-[36px] opacity-100",
    pulseAura: "bg-fuchsia-400/28",
    energyOverlay:
      "bg-[linear-gradient(180deg,rgba(217,70,239,0.22),rgba(168,85,247,0.28),rgba(236,72,153,0.18)),linear-gradient(90deg,rgba(244,114,182,0.18),transparent_52%,rgba(192,38,211,0.18))]",
    staticOverlay:
      "bg-[linear-gradient(180deg,rgba(217,70,239,0.28),transparent_40%,rgba(168,85,247,0.20))]",
    borderGlow: {
      boxShadow:
        "0 0 0 1px rgba(240,171,252,.9), 0 0 34px rgba(217,70,239,.92), 0 0 100px rgba(168,85,247,.62), inset 0 0 30px rgba(217,70,239,.24)",
    },
    badgeGlow: {
      boxShadow: "0 0 32px rgba(217,70,239,.72)",
    },
  },
  legendary: {
    outerAura: "bg-amber-300/46 blur-[42px] opacity-100",
    pulseAura: "bg-amber-300/30",
    energyOverlay:
      "bg-[linear-gradient(180deg,rgba(251,191,36,0.28),rgba(245,158,11,0.34),rgba(239,68,68,0.18)),linear-gradient(90deg,rgba(254,240,138,0.18),transparent_50%,rgba(251,146,60,0.18))]",
    staticOverlay:
      "bg-[linear-gradient(180deg,rgba(251,191,36,0.34),transparent_38%,rgba(239,68,68,0.18))]",
    borderGlow: {
      boxShadow:
        "0 0 0 1px rgba(254,240,138,.96), 0 0 40px rgba(251,191,36,.98), 0 0 118px rgba(245,158,11,.68), 0 0 150px rgba(239,68,68,.28), inset 0 0 34px rgba(251,191,36,.26)",
    },
    badgeGlow: {
      boxShadow: "0 0 34px rgba(251,191,36,.82)",
    },
  },
};

function isRecentlyObtained(date: string) {
  const obtainedAt = new Date(date).getTime();
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  return Number.isFinite(obtainedAt) && now - obtainedAt <= oneDay;
}

function isCardNew(card: UserCard) {
  return !card.seen_at && isRecentlyObtained(card.obtained_at);
}

function getPendingCardId(pending: PendingNotificationCard | null) {
  return pending?.cardId || pending?.card_id || null;
}

function getPendingCreatorId(pending: PendingNotificationCard | null) {
  return pending?.creatorId || pending?.creator_id || null;
}

function getCardXp(rarity: string) {
  return rarityXp[rarity] || rarityXp.common;
}

function findNotificationCard(
  cards: UserCard[],
  pending: PendingNotificationCard | null
) {
  if (!pending) return null;

  const cardId = getPendingCardId(pending);
  const creatorId = getPendingCreatorId(pending);

  if (cardId) {
    const byCardId = cards.find((card) => card.id === cardId);

    if (byCardId) return byCardId;
  }

  if (creatorId) {
    const byCreatorId = cards.find(
      (card) => card.creator_profiles?.id === creatorId
    );

    if (byCreatorId) return byCreatorId;
  }

  return null;
}

export function CollectionModal({
  open,
  onClose,
  initialCardId = null,
  initialCreatorId = null,
  onInitialCardOpened,
}: CollectionModalProps) {
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<UserCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<UserCard | null>(null);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [pendingNotificationCard, setPendingNotificationCard] =
    useState<PendingNotificationCard | null>(null);

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
          seen_at,
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

  useEffect(() => {
    if (!open) return;

    if (initialCardId || initialCreatorId) {
      setPendingNotificationCard({
        cardId: initialCardId,
        creatorId: initialCreatorId,
      });
    }
  }, [open, initialCardId, initialCreatorId]);

  useEffect(() => {
    function handleOpenCardFromNotification(event: Event) {
      const customEvent = event as CustomEvent<PendingNotificationCard>;

      setPendingNotificationCard({
        cardId: customEvent.detail?.cardId || customEvent.detail?.card_id || null,
        creatorId:
          customEvent.detail?.creatorId || customEvent.detail?.creator_id || null,
      });
    }

    window.addEventListener(
      "creator-nexus:open-collection-card",
      handleOpenCardFromNotification
    );

    return () => {
      window.removeEventListener(
        "creator-nexus:open-collection-card",
        handleOpenCardFromNotification
      );
    };
  }, []);

  useEffect(() => {
    if (!open || loading || cards.length === 0 || !pendingNotificationCard) {
      return;
    }

    const cardToOpen = findNotificationCard(cards, pendingNotificationCard);

    if (!cardToOpen) return;

    handleSelectCard(cardToOpen);
    setPendingNotificationCard(null);
    onInitialCardOpened?.();
  }, [cards, loading, onInitialCardOpened, open, pendingNotificationCard]);

  const stats = useMemo(() => {
    return {
      total: cards.length,
      common: cards.filter((card) => card.rarity === "common").length,
      rare: cards.filter((card) => card.rarity === "rare").length,
      epic: cards.filter((card) => card.rarity === "epic").length,
      legendary: cards.filter((card) => card.rarity === "legendary").length,
    };
  }, [cards]);

  async function markCardAsSeen(card: UserCard) {
    if (card.seen_at) return;

    const seenAt = new Date().toISOString();

    setCards((currentCards) =>
      currentCards.map((currentCard) =>
        currentCard.id === card.id
          ? { ...currentCard, seen_at: seenAt }
          : currentCard
      )
    );

    setSelectedCard((currentCard) =>
      currentCard?.id === card.id ? { ...currentCard, seen_at: seenAt } : currentCard
    );

    const { error } = await supabase
      .from("user_cards")
      .update({ seen_at: seenAt })
      .eq("id", card.id);

    if (error) {
      console.error("Erro ao marcar carta como vista:", error);
    }
  }

  function handleSelectCard(card: UserCard) {
    setSelectedCard(card);
    void markCardAsSeen(card);
  }

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
            onClick={onClose}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.94 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              onClick={(event) => event.stopPropagation()}
              className="hide-scrollbar relative max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-[32px] border border-white/15 bg-zinc-950 p-8 text-white shadow-[0_0_80px_rgba(0,0,0,0.9)]"
            >
              <div className="pointer-events-none absolute -left-24 -top-24 h-56 w-56 rounded-full bg-cyan-500/20 blur-[90px]" />
              <div className="pointer-events-none absolute -bottom-24 -right-24 h-56 w-56 rounded-full bg-purple-600/20 blur-[90px]" />

              <button
                type="button"
                onClick={onClose}
                className="absolute right-5 top-5 z-20 rounded-full border border-white/10 bg-white/5 p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                aria-label="Fechar coleção"
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
                  pacotes, missões e eventos. Notificações de carta podem abrir
                  a carta específica diretamente aqui.
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
                        onClick={() => handleSelectCard(card)}
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
  const xp = getCardXp(card.rarity);

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
        onClick={onClose}
        className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-4"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-6 top-6 z-30 rounded-full border border-white/10 bg-white/5 p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
          aria-label="Fechar carta"
        >
          <X size={20} />
        </button>

        <motion.div
          initial={{ opacity: 0, scale: 0.82, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          onClick={(event) => event.stopPropagation()}
          className="relative z-20 flex flex-col items-center gap-5"
        >
          <div className="flex flex-wrap items-center justify-center gap-2">
            {isCardNew(card) && (
              <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-1 text-xs font-bold uppercase tracking-[0.25em] text-cyan-100">
                Nova carta
              </span>
            )}

            {isCardNew(card) && (
              <span className="rounded-full border border-purple-300/25 bg-purple-300/10 px-4 py-1 text-xs font-bold uppercase tracking-[0.25em] text-purple-100">
                +{xp} XP
              </span>
            )}
          </div>

          <TiltCard>
            <CollectionCardFace card={card} onClick={() => {}} size="large" />
          </TiltCard>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={openProfile}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 py-3 text-sm font-bold text-cyan-100 transition hover:bg-cyan-300/20"
            >
              <Eye size={16} />
              Ver perfil
            </button>

            <button
              type="button"
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
  const xp = getCardXp(rarity);
  const isNew = isCardNew(card);
  const neon = rarityNeonStyles[rarity] || rarityNeonStyles.common;
  const cardSizeClass = isLarge
    ? "h-[620px] w-[410px] rounded-[34px]"
    : "h-[360px] w-[240px] rounded-[24px]";
  const auraSizeClass = isLarge ? "rounded-[40px]" : "rounded-[28px]";
  const overlayOpacity =
    rarity === "common"
      ? "opacity-25"
      : rarity === "rare"
        ? "opacity-58"
        : rarity === "epic"
          ? "opacity-72"
          : "opacity-80";

  return (
    <div className={`relative ${cardSizeClass}`}>
      <div
        aria-hidden
        className={`pointer-events-none absolute -inset-4 ${auraSizeClass} ${neon.outerAura}`}
      />

      {rarity !== "common" && (
        <motion.div
          aria-hidden
          animate={{ opacity: [0.62, 0.92, 0.62], scale: [1, 1.035, 1] }}
          transition={{
            duration: rarity === "legendary" ? 3.2 : rarity === "epic" ? 3.5 : 3.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={`pointer-events-none absolute -inset-5 ${auraSizeClass} ${neon.pulseAura} blur-2xl`}
        />
      )}

      <button
        type="button"
        onClick={onClick}
        style={neon.borderGlow}
        className={`group relative ${cardSizeClass} overflow-hidden border bg-black text-left ${style.shadow} transition duration-500 hover:scale-[1.015] ${style.border}`}
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${style.frame}`} />
        <div className="absolute inset-0 bg-gradient-to-b from-white/8 via-transparent to-black/95" />

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

        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 ${neon.staticOverlay} ${overlayOpacity} mix-blend-screen`}
        />

        {rarity !== "common" && (
          <motion.div
            aria-hidden
            animate={{ opacity: [0.42, 0.76, 0.42], scale: [1, 1.018, 1] }}
            transition={{
              duration: rarity === "legendary" ? 3.4 : rarity === "epic" ? 3.7 : 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className={`pointer-events-none absolute inset-0 ${neon.energyOverlay} mix-blend-screen`}
          />
        )}

        {rarity === "epic" && (
          <div className="pointer-events-none absolute inset-0 mix-blend-screen">
            <motion.span
              animate={{ opacity: [0.12, 0.55, 0.12], scale: [0.9, 1.2, 0.9] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-[18%] top-[22%] h-1.5 w-1.5 rounded-full bg-fuchsia-100 shadow-[0_0_14px_rgba(240,171,252,0.95)]"
            />
            <motion.span
              animate={{ opacity: [0.08, 0.45, 0.08], scale: [0.85, 1.15, 0.85] }}
              transition={{ duration: 3.3, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
              className="absolute right-[22%] top-[42%] h-1 w-1 rounded-full bg-pink-100 shadow-[0_0_12px_rgba(244,114,182,0.9)]"
            />
            <motion.span
              animate={{ opacity: [0.1, 0.5, 0.1], scale: [0.9, 1.2, 0.9] }}
              transition={{ duration: 3.1, repeat: Infinity, ease: "easeInOut", delay: 1.4 }}
              className="absolute bottom-[26%] left-[32%] h-1 w-1 rounded-full bg-purple-100 shadow-[0_0_12px_rgba(216,180,254,0.9)]"
            />
          </div>
        )}

        {rarity === "legendary" && (
          <motion.div
            aria-hidden
            animate={{ opacity: [0.26, 0.52, 0.26] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(254,240,138,0.18),transparent_32%,rgba(251,191,36,0.18)_68%,rgba(239,68,68,0.10))] mix-blend-screen"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        <div
          style={neon.badgeGlow}
          className={`absolute border font-bold uppercase backdrop-blur ${style.badge} ${
            isLarge
              ? "left-7 top-7 rounded-full px-5 py-2 text-sm tracking-[0.32em]"
              : "left-4 top-4 rounded-full px-3 py-1 text-[10px] tracking-[0.25em]"
          }`}
        >
          {rarityLabel[rarity] || rarity}
        </div>

        <div
          className={`absolute flex flex-col items-end gap-2 ${
            isLarge ? "right-7 top-20" : "right-4 top-12"
          }`}
        >
          {isNew && (
            <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-100 backdrop-blur">
              Nova
            </span>
          )}

          {isNew && (
            <span className="rounded-full border border-purple-300/25 bg-purple-300/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-purple-100 backdrop-blur">
              +{xp} XP
            </span>
          )}
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

        {rarity === "legendary" && (
          <div className="pointer-events-none absolute inset-x-6 top-16 h-px bg-gradient-to-r from-transparent via-amber-100/70 to-transparent" />
        )}

        <div
          className={`pointer-events-none absolute inset-0 ring-1 ring-inset ${style.ring} ${
            isLarge ? "rounded-[34px]" : "rounded-[24px]"
          }`}
        />
      </button>
    </div>
  );
}
