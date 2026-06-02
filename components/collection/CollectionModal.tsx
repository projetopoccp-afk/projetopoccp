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
    glow: "bg-cyan-400/25",
    text: "text-cyan-200",
    ring: "ring-cyan-200/25",
    frame: "from-cyan-300/16 via-slate-900/10 to-cyan-900/28",
    aura: "bg-cyan-400/18",
    shine: "from-transparent via-cyan-100/10 to-transparent",
    corner: "border-cyan-200/35 bg-cyan-300/10",
    shadow: "shadow-[0_0_70px_rgba(34,211,238,0.18)]",
  },
  rare: {
    border: "border-blue-300/45",
    badge: "border-blue-300/35 bg-blue-300/15 text-blue-100",
    glow: "bg-blue-500/35",
    text: "text-blue-100",
    ring: "ring-blue-200/35",
    frame: "from-blue-300/22 via-indigo-500/12 to-blue-950/40",
    aura: "bg-blue-500/24",
    shine: "from-transparent via-blue-100/18 to-transparent",
    corner: "border-blue-200/45 bg-blue-300/15",
    shadow: "shadow-[0_0_85px_rgba(59,130,246,0.28)]",
  },
  epic: {
    border: "border-purple-300/55",
    badge: "border-fuchsia-300/45 bg-fuchsia-300/15 text-fuchsia-100",
    glow: "bg-fuchsia-500/40",
    text: "text-fuchsia-100",
    ring: "ring-fuchsia-200/45",
    frame: "from-fuchsia-300/25 via-purple-600/18 to-yellow-500/16",
    aura: "bg-fuchsia-500/30",
    shine: "from-transparent via-fuchsia-100/24 to-transparent",
    corner: "border-fuchsia-200/55 bg-fuchsia-300/15",
    shadow: "shadow-[0_0_100px_rgba(217,70,239,0.35)]",
  },
  legendary: {
    border: "border-yellow-300/70",
    badge: "border-yellow-200/60 bg-yellow-300/20 text-yellow-50",
    glow: "bg-yellow-400/45",
    text: "text-yellow-50",
    ring: "ring-yellow-100/55",
    frame: "from-yellow-200/28 via-orange-500/20 to-red-600/20",
    aura: "bg-yellow-300/35",
    shine: "from-transparent via-yellow-50/30 to-transparent",
    corner: "border-yellow-100/70 bg-yellow-300/20",
    shadow: "shadow-[0_0_120px_rgba(250,204,21,0.45)]",
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

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden border bg-black text-left ${style.shadow} transition duration-500 hover:scale-[1.015] ${style.border} ${
        isLarge
          ? "h-[620px] w-[410px] rounded-[34px]"
          : "h-[360px] w-[240px] rounded-[24px]"
      }`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${style.frame}`} />
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/95" />

      {rarity !== "common" && (
        <div className="pointer-events-none absolute inset-0 opacity-50 mix-blend-screen">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.22),transparent_26%),radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.16),transparent_24%),radial-gradient(circle_at_40%_90%,rgba(255,255,255,0.12),transparent_25%)]" />
        </div>
      )}

      {(rarity === "epic" || rarity === "legendary") && (
        <motion.div
          aria-hidden
          animate={{ opacity: [0.25, 0.85, 0.25], scale: [0.98, 1.05, 0.98] }}
          transition={{ duration: rarity === "legendary" ? 1.7 : 2.3, repeat: Infinity, ease: "easeInOut" }}
          className={`pointer-events-none absolute -inset-8 rounded-full blur-3xl ${style.aura}`}
        />
      )}

      {rarity === "legendary" && (
        <motion.div
          aria-hidden
          animate={{ rotate: 360 }}
          transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
          className="pointer-events-none absolute -inset-16 opacity-40"
        >
          <div className="h-full w-full rounded-full bg-[conic-gradient(from_90deg,transparent,rgba(250,204,21,0.28),transparent,rgba(248,113,113,0.18),transparent)]" />
        </motion.div>
      )}

      <div className="absolute inset-0 opacity-70 transition group-hover:opacity-95">
        <div
          className={`absolute -top-20 left-10 h-44 w-44 rounded-full blur-2xl ${style.glow}`}
        />
        <div
          className={`absolute bottom-0 right-0 h-48 w-48 rounded-full blur-2xl ${style.glow}`}
        />
      </div>

      <div className="absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100">
        <div className={`absolute inset-0 translate-x-[-120%] bg-[linear-gradient(115deg,transparent_20%,rgba(255,255,255,0.16)_40%,transparent_60%)] transition-transform duration-1000 group-hover:translate-x-[120%] ${style.shine}`} />
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
        className={`absolute right-4 top-4 flex flex-col items-end gap-2 ${
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

      {rarity !== "common" && (
        <>
          <div className={`pointer-events-none absolute left-3 top-3 h-8 w-8 rounded-tl-2xl border-l border-t ${style.corner}`} />
          <div className={`pointer-events-none absolute right-3 top-3 h-8 w-8 rounded-tr-2xl border-r border-t ${style.corner}`} />
          <div className={`pointer-events-none absolute bottom-3 left-3 h-8 w-8 rounded-bl-2xl border-b border-l ${style.corner}`} />
          <div className={`pointer-events-none absolute bottom-3 right-3 h-8 w-8 rounded-br-2xl border-b border-r ${style.corner}`} />
        </>
      )}

      {rarity === "legendary" && (
        <div className="pointer-events-none absolute inset-x-6 top-16 h-px bg-gradient-to-r from-transparent via-yellow-100/80 to-transparent" />
      )}

      <div
        className={`pointer-events-none absolute inset-0 ring-1 ring-inset ${style.ring} ${
          isLarge ? "rounded-[34px]" : "rounded-[24px]"
        }`}
      />
    </button>
  );
}
