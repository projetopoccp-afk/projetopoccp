"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Archive,
  Crown,
  Eye,
  Gem,
  Search,
  Share2,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";

import { CreatorPopup } from "@/components/creator/CreatorPopup";
import { CreatorCard } from "@/components/cards/CreatorCard";
import { CardpocModalShell } from "@/components/ui/CardpocModalShell";
import { supabase } from "@/lib/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
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
  common: "Comum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário",
  mythic: "Mítico",
};

type TranslateFunction = (key: any) => string;

function translate(t: TranslateFunction, key: string, fallback: string) {
  const value = t(key);

  return value && value !== key ? value : fallback;
}

function getDateLocale(language: string) {
  if (language === "en") return "en-US";
  if (language === "es") return "es-ES";

  return "pt-BR";
}

function getRarityLabel(rarity?: string | null, t?: TranslateFunction) {
  if (!rarity) {
    return t ? translate(t, "common", "Comum") : "Comum";
  }

  const normalizedRarity = rarity.toLowerCase();

  if (t) {
    return translate(
      t,
      normalizedRarity,
      rarityLabel[normalizedRarity] || rarity,
    );
  }

  return rarityLabel[normalizedRarity] || rarity;
}

const rarityXp: Record<string, number> = {
  common: 20,
  rare: 50,
  epic: 120,
  legendary: 300,
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
  pending: PendingNotificationCard | null,
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
      (card) => card.creator_profiles?.id === creatorId,
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
  const { t } = useLanguage();
  const [cards, setCards] = useState<UserCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<UserCard | null>(null);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [pendingNotificationCard, setPendingNotificationCard] =
    useState<PendingNotificationCard | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

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
        `,
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
        cardId:
          customEvent.detail?.cardId || customEvent.detail?.card_id || null,
        creatorId:
          customEvent.detail?.creatorId ||
          customEvent.detail?.creator_id ||
          null,
      });
    }

    window.addEventListener(
      "creator-nexus:open-collection-card",
      handleOpenCardFromNotification,
    );

    return () => {
      window.removeEventListener(
        "creator-nexus:open-collection-card",
        handleOpenCardFromNotification,
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

  const filteredCards = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) return cards;

    return cards.filter((card) => {
      const creator = card.creator_profiles;
      const searchableValues = [
        card.rarity,
        card.source,
        creator?.nickname,
        creator?.username,
        creator?.title,
        creator?.category,
        ...(creator?.tags || []),
      ];

      return searchableValues
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(normalizedSearch),
        );
    });
  }, [cards, searchTerm]);

  async function markCardAsSeen(card: UserCard) {
    if (card.seen_at) return;

    const seenAt = new Date().toISOString();

    setCards((currentCards) =>
      currentCards.map((currentCard) =>
        currentCard.id === card.id
          ? { ...currentCard, seen_at: seenAt }
          : currentCard,
      ),
    );

    setSelectedCard((currentCard) =>
      currentCard?.id === card.id
        ? { ...currentCard, seen_at: seenAt }
        : currentCard,
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
          <CardpocModalShell
            onClose={onClose}
            showCloseButton
            closeLabel={translate(t, "closeCollection", "Fechar coleção")}
            className="max-w-6xl"
            contentClassName="hide-scrollbar max-h-[calc(100vh-2rem)] overflow-y-auto p-8 pb-10"
            zIndexClassName="z-[100]"
          >
            <div className="relative z-10">
              <div className="inline-flex items-center gap-3 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-cyan-100">
                <Archive size={14} />
                {translate(t, "collection", "Minha Coleção")}
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.78fr)] lg:items-end">
                <div>
                  <h2 className="text-3xl font-black">
                    {translate(t, "collectionTitle", "Suas cartas do Cardpoc")}
                  </h2>

                  <p className="mt-3 max-w-2xl text-sm text-white/45">
                    {translate(
                      t,
                      "collectionDescription",
                      "Aqui ficam as cartas de criadores conquistadas por seguir, pacotes, missões e eventos. Notificações de carta podem abrir a carta específica diretamente aqui.",
                    )}
                  </p>
                </div>

                <label className="relative block w-full">
                  <Search
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cyan-100/55"
                  />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder={translate(
                      t,
                      "collectionSearchPlaceholder",
                      "Pesquisar por carta, criador, raridade...",
                    )}
                    className="h-12 w-full rounded-full border border-cyan-200/15 bg-white/[0.055] pl-12 pr-4 text-sm font-medium text-white outline-none transition placeholder:text-white/35 focus:border-cyan-200/35 focus:bg-white/[0.08] focus:shadow-[0_0_28px_rgba(34,211,238,0.12)]"
                  />
                </label>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <StatCard
                  icon={<Archive size={18} />}
                  label={translate(t, "total", "Total")}
                  value={stats.total}
                />
                <StatCard
                  icon={<Sparkles size={18} />}
                  label={translate(t, "commonPlural", "Comuns")}
                  value={stats.common}
                />
                <StatCard
                  icon={<Gem size={18} />}
                  label={translate(t, "rarePlural", "Raras")}
                  value={stats.rare}
                />
                <StatCard
                  icon={<Zap size={18} />}
                  label={translate(t, "epicPlural", "Épicas")}
                  value={stats.epic}
                />
                <StatCard
                  icon={<Crown size={18} />}
                  label={translate(t, "legendaryPlural", "Lendárias")}
                  value={stats.legendary}
                />
              </div>

              {loading ? (
                <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center text-white/50">
                  {translate(t, "loadingCollection", "Carregando coleção...")}
                </div>
              ) : cards.length === 0 ? (
                <EmptyCollection />
              ) : filteredCards.length === 0 ? (
                <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center text-white/50">
                  {translate(
                    t,
                    "collectionNoSearchResults",
                    "Nenhuma carta encontrada para essa pesquisa.",
                  )}
                </div>
              ) : (
                <div className="mt-10 grid grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredCards.map((card) => (
                    <CollectionCard
                      key={card.id}
                      card={card}
                      onClick={() => handleSelectCard(card)}
                    />
                  ))}
                </div>
              )}
            </div>
          </CardpocModalShell>
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
            document.body,
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
    nickname: profile.nickname || "Cardpoc",
    title: profile.title || "Digital Creator",
    faction: profile.faction || "Cardpoc",
    category: profile.category || "Creator",
    mainPlatform: "youtube",
    status: (profile.status as Creator["status"]) || "offline",
    avatarUrl: profile.avatar_url || "",
    bannerUrl: profile.banner_url || profile.avatar_url || "",
    bio: profile.bio || "",
    description: profile.description || "",
    tags: profile.tags || [],
    rank: (creatorCard.rank as Creator["rank"]) || "Bronze",
    rarity:
      (card.rarity as Creator["rarity"]) ||
      (creatorCard.rarity as Creator["rarity"]) ||
      "common",
    aura: creatorCard.aura || "Origin Aura",
    evolutionStage:
      (creatorCard.evolution_stage as Creator["evolutionStage"]) || "Stage 1",
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
  const { t } = useLanguage();

  return (
    <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
        <Archive size={28} />
      </div>

      <p className="mt-5 text-lg font-bold text-white">
        {translate(t, "emptyCollectionTitle", "Coleção vazia por enquanto")}
      </p>

      <p className="mx-auto mt-3 max-w-xl text-sm text-white/45">
        {translate(
          t,
          "emptyCollectionDescription",
          "Em breve você poderá conquistar cartas seguindo creators, abrindo pacotes e completando missões dentro do Cardpoc.",
        )}
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
  const { language, t } = useLanguage();
  const creator = buildCreatorFromCard(card);

  if (!creator) return null;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <CreatorCard creator={creator} onClick={() => onClick()} />
        <CollectionCardOverlay card={card} compact />
      </div>

      <CollectionCardMeta
        source={card.source}
        obtainedAt={card.obtained_at}
        locale={getDateLocale(language)}
        sourceLabel={translate(t, "collectionCardSource", "Origem")}
      />
    </div>
  );
}

function CollectionCardOverlay({
  card,
  compact = false,
}: {
  card: UserCard;
  compact?: boolean;
}) {
  const { t } = useLanguage();
  const isNew = isCardNew(card);

  if (!isNew) return null;

  const xp = getCardXp(card.rarity);

  return (
    <div
      className={`pointer-events-none absolute z-30 flex flex-col items-end gap-2 ${
        compact ? "right-3 top-12" : "right-4 top-14"
      }`}
    >
      <span className="rounded-full border border-cyan-300/30 bg-cyan-300/12 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-50 shadow-[0_0_18px_rgba(34,211,238,0.18)] backdrop-blur-md">
        {translate(t, "new", "Nova")}
      </span>

      <span className="rounded-full border border-purple-300/30 bg-purple-300/12 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-purple-50 shadow-[0_0_18px_rgba(216,180,254,0.16)] backdrop-blur-md">
        +{xp} XP
      </span>
    </div>
  );
}

function CollectionCardMeta({
  source,
  obtainedAt,
  locale,
  sourceLabel,
}: {
  source: string;
  obtainedAt: string;
  locale: string;
  sourceLabel: string;
}) {
  return (
    <div className="flex w-[240px] items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-2 text-[11px] text-white/45">
      <span className="max-w-[128px] truncate font-medium text-white/58">
        {sourceLabel}: {source}
      </span>

      <span>{new Date(obtainedAt).toLocaleDateString(locale)}</span>
    </div>
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
  const { t } = useLanguage();

  if (!card) return null;

  const creator = card.creator_profiles;
  const username = creator?.username || "creator";
  const nickname = creator?.nickname || "Cardpoc";
  const rarity = getRarityLabel(card.rarity, t);
  const xp = getCardXp(card.rarity);

  function openProfile() {
    if (!card) return;

    onOpenProfile(card);
  }

  async function shareCard() {
    const url = `${window.location.origin}/creator/${username}`;
    const text = translate(
      t,
      "shareCardText",
      `🃏 Eu conquistei a carta ${nickname} (${rarity}) no Cardpoc`,
    )
      .replace("{nickname}", nickname)
      .replace("{rarity}", rarity);

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${translate(t, "card", "Carta")} ${nickname}`,
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
          className="absolute right-6 top-6 z-30 flex h-12 w-12 items-center justify-center rounded-full border border-red-400/25 bg-black/70 text-red-100 shadow-[0_0_24px_rgba(248,113,113,0.14)] backdrop-blur-md transition-all hover:scale-105 hover:border-red-400/40 hover:bg-red-500/15"
          aria-label={translate(t, "closeCard", "Fechar carta")}
          title={translate(t, "closeCard", "Fechar carta")}
        >
          <X size={22} strokeWidth={3} />
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
                {translate(t, "newCard", "Nova carta")}
              </span>
            )}

            {isCardNew(card) && (
              <span className="rounded-full border border-purple-300/25 bg-purple-300/10 px-4 py-1 text-xs font-bold uppercase tracking-[0.25em] text-purple-100">
                +{xp} XP
              </span>
            )}
          </div>

          {(() => {
            const showcaseCreator = buildCreatorFromCard(card);

            if (!showcaseCreator) return null;

            return (
              <div className="collection-showcase-creator-card relative flex h-[430px] w-[300px] items-center justify-center sm:h-[470px] sm:w-[330px]">
                <div className="relative scale-[1.12] sm:scale-[1.22]">
                  <CreatorCard creator={showcaseCreator} onClick={() => {}} />
                  <CollectionCardOverlay card={card} />
                </div>
              </div>
            );
          })()}

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={openProfile}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 py-3 text-sm font-bold text-cyan-100 transition hover:bg-cyan-300/20"
            >
              <Eye size={16} />
              {translate(t, "viewProfile", "Ver perfil")}
            </button>

            <button
              type="button"
              onClick={shareCard}
              className="inline-flex items-center gap-2 rounded-full border border-purple-300/20 bg-purple-300/10 px-5 py-3 text-sm font-bold text-purple-100 transition hover:bg-purple-300/20"
            >
              <Share2 size={16} />
              {copied
                ? translate(t, "copied", "Copiado!")
                : translate(t, "shareCard", "Compartilhar carta")}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}