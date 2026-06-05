"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
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
import { TiltCard } from "@/components/cards/TiltCard";
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
    return translate(t, normalizedRarity, rarityLabel[normalizedRarity] || rarity);
  }

  return rarityLabel[normalizedRarity] || rarity;
}

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
    border: "border-sky-300/60",
    badge: "border-sky-300/45 bg-sky-300/15 text-sky-100",
    glow: "bg-sky-400/36",
    text: "text-sky-100",
    ring: "ring-sky-200/45",
    frame: "from-sky-300/22 via-cyan-400/10 to-blue-950/38",
    aura: "bg-sky-400/24",
    shine: "from-transparent via-sky-100/18 to-transparent",
    corner: "border-sky-200/45 bg-sky-300/15",
    shadow: "shadow-[0_0_90px_rgba(56,189,248,0.34)]",
  },
  epic: {
    border: "border-fuchsia-300/70",
    badge: "border-fuchsia-300/55 bg-fuchsia-300/18 text-fuchsia-100",
    glow: "bg-fuchsia-500/44",
    text: "text-fuchsia-100",
    ring: "ring-fuchsia-200/55",
    frame: "from-fuchsia-400/26 via-purple-700/20 to-pink-500/12",
    aura: "bg-fuchsia-500/34",
    shine: "from-transparent via-fuchsia-100/24 to-transparent",
    corner: "border-fuchsia-200/55 bg-fuchsia-300/15",
    shadow: "shadow-[0_0_110px_rgba(217,70,239,0.44)]",
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

type CollectionParticleShape =
  | "silverShard"
  | "silverDust"
  | "bluePixel"
  | "blueSpark"
  | "violetRune"
  | "violetStar"
  | "goldOrb"
  | "goldRay";

type CollectionParticle = {
  left: string;
  top: string;
  size: string;
  tx: string;
  ty: string;
  rotate: string;
  duration: number;
  delay: number;
  shape: CollectionParticleShape;
  opacity: number;
};

type CollectionRarityVisual = {
  className: string;
  borderColor: string;
  glowColor: string;
  particleColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  particleShape: CollectionParticleShape;
  particleCount: number;
  particleAnimation: string;
  backgroundEffect: string;
  auraEffect: string;
  intensity: number;
  particles: CollectionParticle[];
};

type CollectionRarityVars = CSSProperties & {
  "--collection-border": string;
  "--collection-glow": string;
  "--collection-particle": string;
  "--collection-secondary": string;
  "--collection-tertiary": string;
  "--collection-intensity": number;
};

const collectionRarityVisuals: Record<string, CollectionRarityVisual> = {
  common: {
    className: "collection-common",
    borderColor: "rgba(226, 232, 240, 0.55)",
    glowColor: "rgba(203, 213, 225, 0.14)",
    particleColor: "rgba(248, 250, 252, 0.88)",
    secondaryColor: "rgba(148, 163, 184, 0.42)",
    tertiaryColor: "rgba(255, 255, 255, 0.25)",
    particleShape: "silverShard",
    particleCount: 10,
    particleAnimation: "collectionSilverFloat",
    backgroundEffect: "metal-brush",
    auraEffect: "clean-silver-edge",
    intensity: 0.32,
    particles: [
      { left: "12%", top: "22%", size: "5px", tx: "20px", ty: "-36px", rotate: "40deg", duration: 9, delay: 0, shape: "silverShard", opacity: 0.46 },
      { left: "28%", top: "74%", size: "3px", tx: "28px", ty: "-50px", rotate: "-15deg", duration: 10.2, delay: -1.8, shape: "silverDust", opacity: 0.35 },
      { left: "44%", top: "26%", size: "6px", tx: "-18px", ty: "-42px", rotate: "70deg", duration: 8.6, delay: -3.2, shape: "silverShard", opacity: 0.42 },
      { left: "62%", top: "82%", size: "3px", tx: "-24px", ty: "-54px", rotate: "10deg", duration: 9.8, delay: -4.7, shape: "silverDust", opacity: 0.32 },
      { left: "80%", top: "42%", size: "5px", tx: "-34px", ty: "-34px", rotate: "-45deg", duration: 9.4, delay: -5.5, shape: "silverShard", opacity: 0.4 },
      { left: "18%", top: "54%", size: "3px", tx: "30px", ty: "-26px", rotate: "0deg", duration: 8.8, delay: -2.4, shape: "silverDust", opacity: 0.3 },
      { left: "52%", top: "58%", size: "4px", tx: "12px", ty: "-36px", rotate: "35deg", duration: 10.4, delay: -6.2, shape: "silverShard", opacity: 0.34 },
      { left: "74%", top: "18%", size: "3px", tx: "-24px", ty: "-28px", rotate: "0deg", duration: 9.1, delay: -7.3, shape: "silverDust", opacity: 0.28 },
      { left: "36%", top: "88%", size: "3px", tx: "18px", ty: "-58px", rotate: "0deg", duration: 11, delay: -3.9, shape: "silverDust", opacity: 0.32 },
      { left: "88%", top: "76%", size: "4px", tx: "-38px", ty: "-46px", rotate: "55deg", duration: 10.6, delay: -8.1, shape: "silverShard", opacity: 0.35 },
    ],
  },
  rare: {
    className: "collection-rare",
    borderColor: "rgba(125, 211, 252, 0.72)",
    glowColor: "rgba(56, 189, 248, 0.28)",
    particleColor: "rgba(186, 230, 253, 0.98)",
    secondaryColor: "rgba(14, 165, 233, 0.78)",
    tertiaryColor: "rgba(34, 211, 238, 0.6)",
    particleShape: "bluePixel",
    particleCount: 16,
    particleAnimation: "collectionBluePulse",
    backgroundEffect: "electric-circuit",
    auraEffect: "fast-blue-scan",
    intensity: 0.58,
    particles: [
      { left: "8%", top: "20%", size: "3px", tx: "78px", ty: "-4px", rotate: "0deg", duration: 2.8, delay: 0, shape: "bluePixel", opacity: 0.7 },
      { left: "18%", top: "74%", size: "4px", tx: "96px", ty: "-30px", rotate: "0deg", duration: 3.1, delay: -0.7, shape: "blueSpark", opacity: 0.78 },
      { left: "30%", top: "34%", size: "3px", tx: "-58px", ty: "18px", rotate: "0deg", duration: 2.6, delay: -1.3, shape: "bluePixel", opacity: 0.64 },
      { left: "44%", top: "84%", size: "3px", tx: "52px", ty: "-68px", rotate: "0deg", duration: 3.4, delay: -2, shape: "bluePixel", opacity: 0.6 },
      { left: "62%", top: "22%", size: "5px", tx: "-88px", ty: "14px", rotate: "0deg", duration: 2.9, delay: -1, shape: "blueSpark", opacity: 0.82 },
      { left: "78%", top: "64%", size: "3px", tx: "-82px", ty: "-24px", rotate: "0deg", duration: 3.2, delay: -1.9, shape: "bluePixel", opacity: 0.66 },
      { left: "88%", top: "36%", size: "4px", tx: "-100px", ty: "28px", rotate: "0deg", duration: 2.7, delay: -2.5, shape: "blueSpark", opacity: 0.72 },
      { left: "14%", top: "46%", size: "3px", tx: "108px", ty: "20px", rotate: "0deg", duration: 3.6, delay: -3, shape: "bluePixel", opacity: 0.58 },
      { left: "38%", top: "14%", size: "3px", tx: "42px", ty: "86px", rotate: "0deg", duration: 3.3, delay: -0.4, shape: "bluePixel", opacity: 0.54 },
      { left: "70%", top: "88%", size: "4px", tx: "-46px", ty: "-92px", rotate: "0deg", duration: 3, delay: -3.4, shape: "blueSpark", opacity: 0.72 },
      { left: "24%", top: "58%", size: "2px", tx: "70px", ty: "-12px", rotate: "0deg", duration: 2.4, delay: -2.8, shape: "bluePixel", opacity: 0.56 },
      { left: "54%", top: "50%", size: "3px", tx: "-68px", ty: "0px", rotate: "0deg", duration: 2.9, delay: -3.7, shape: "bluePixel", opacity: 0.6 },
      { left: "82%", top: "16%", size: "2px", tx: "-52px", ty: "64px", rotate: "0deg", duration: 3.5, delay: -4.2, shape: "bluePixel", opacity: 0.52 },
      { left: "6%", top: "86%", size: "4px", tx: "110px", ty: "-52px", rotate: "0deg", duration: 3.8, delay: -4.7, shape: "blueSpark", opacity: 0.68 },
      { left: "42%", top: "70%", size: "2px", tx: "58px", ty: "-40px", rotate: "0deg", duration: 2.5, delay: -5.1, shape: "bluePixel", opacity: 0.5 },
      { left: "66%", top: "42%", size: "3px", tx: "-88px", ty: "16px", rotate: "0deg", duration: 3.1, delay: -5.5, shape: "bluePixel", opacity: 0.66 },
    ],
  },
  epic: {
    className: "collection-epic",
    borderColor: "rgba(167, 139, 250, 0.78)",
    glowColor: "rgba(88, 28, 135, 0.42)",
    particleColor: "rgba(233, 213, 255, 0.98)",
    secondaryColor: "rgba(124, 58, 237, 0.78)",
    tertiaryColor: "rgba(236, 72, 153, 0.54)",
    particleShape: "violetRune",
    particleCount: 14,
    particleAnimation: "collectionVioletArcane",
    backgroundEffect: "arcane-runes",
    auraEffect: "irregular-violet-mist",
    intensity: 0.72,
    particles: [
      { left: "12%", top: "74%", size: "10px", tx: "42px", ty: "-98px", rotate: "160deg", duration: 6.8, delay: 0, shape: "violetRune", opacity: 0.68 },
      { left: "20%", top: "26%", size: "4px", tx: "78px", ty: "-30px", rotate: "220deg", duration: 5.9, delay: -1.4, shape: "violetStar", opacity: 0.64 },
      { left: "30%", top: "88%", size: "8px", tx: "34px", ty: "-126px", rotate: "-180deg", duration: 7.4, delay: -2.1, shape: "violetRune", opacity: 0.56 },
      { left: "46%", top: "30%", size: "6px", tx: "-50px", ty: "-48px", rotate: "260deg", duration: 6.1, delay: -3.2, shape: "violetStar", opacity: 0.6 },
      { left: "58%", top: "76%", size: "10px", tx: "-30px", ty: "-112px", rotate: "-240deg", duration: 7.1, delay: -4.4, shape: "violetRune", opacity: 0.64 },
      { left: "76%", top: "22%", size: "8px", tx: "-74px", ty: "8px", rotate: "190deg", duration: 6.5, delay: -1.9, shape: "violetRune", opacity: 0.54 },
      { left: "88%", top: "58%", size: "4px", tx: "-90px", ty: "-68px", rotate: "-130deg", duration: 5.8, delay: -5.3, shape: "violetStar", opacity: 0.66 },
      { left: "8%", top: "42%", size: "5px", tx: "70px", ty: "-22px", rotate: "90deg", duration: 6.3, delay: -2.7, shape: "violetStar", opacity: 0.52 },
      { left: "38%", top: "14%", size: "9px", tx: "22px", ty: "50px", rotate: "-210deg", duration: 7.8, delay: -6.1, shape: "violetRune", opacity: 0.5 },
      { left: "66%", top: "46%", size: "4px", tx: "-66px", ty: "30px", rotate: "120deg", duration: 6.6, delay: -3.8, shape: "violetStar", opacity: 0.58 },
      { left: "50%", top: "90%", size: "6px", tx: "10px", ty: "-110px", rotate: "300deg", duration: 7.2, delay: -7, shape: "violetRune", opacity: 0.42 },
      { left: "24%", top: "56%", size: "3px", tx: "54px", ty: "-58px", rotate: "-70deg", duration: 5.5, delay: -4.8, shape: "violetStar", opacity: 0.6 },
      { left: "84%", top: "84%", size: "8px", tx: "-84px", ty: "-110px", rotate: "250deg", duration: 7.6, delay: -5.9, shape: "violetRune", opacity: 0.44 },
      { left: "54%", top: "18%", size: "3px", tx: "-24px", ty: "70px", rotate: "20deg", duration: 5.7, delay: -7.5, shape: "violetStar", opacity: 0.52 },
    ],
  },
  legendary: {
    className: "collection-legendary",
    borderColor: "rgba(253, 224, 71, 0.84)",
    glowColor: "rgba(251, 191, 36, 0.4)",
    particleColor: "rgba(255, 251, 235, 0.98)",
    secondaryColor: "rgba(245, 158, 11, 0.88)",
    tertiaryColor: "rgba(252, 211, 77, 0.72)",
    particleShape: "goldOrb",
    particleCount: 18,
    particleAnimation: "collectionGoldSolar",
    backgroundEffect: "celestial-rays",
    auraEffect: "premium-gold-flare",
    intensity: 0.86,
    particles: [
      { left: "8%", top: "86%", size: "5px", tx: "38px", ty: "-144px", rotate: "0deg", duration: 5.8, delay: 0, shape: "goldOrb", opacity: 0.72 },
      { left: "14%", top: "28%", size: "10px", tx: "80px", ty: "-38px", rotate: "35deg", duration: 4.9, delay: -1, shape: "goldRay", opacity: 0.58 },
      { left: "22%", top: "74%", size: "4px", tx: "54px", ty: "-120px", rotate: "0deg", duration: 5.2, delay: -1.8, shape: "goldOrb", opacity: 0.76 },
      { left: "34%", top: "18%", size: "6px", tx: "30px", ty: "54px", rotate: "-20deg", duration: 6.4, delay: -2.6, shape: "goldOrb", opacity: 0.54 },
      { left: "44%", top: "90%", size: "12px", tx: "16px", ty: "-142px", rotate: "55deg", duration: 5.6, delay: -3.4, shape: "goldRay", opacity: 0.64 },
      { left: "56%", top: "34%", size: "5px", tx: "-38px", ty: "-74px", rotate: "0deg", duration: 5, delay: -4.2, shape: "goldOrb", opacity: 0.68 },
      { left: "68%", top: "82%", size: "4px", tx: "-54px", ty: "-130px", rotate: "0deg", duration: 5.9, delay: -5, shape: "goldOrb", opacity: 0.8 },
      { left: "80%", top: "20%", size: "14px", tx: "-70px", ty: "10px", rotate: "-45deg", duration: 6.8, delay: -5.8, shape: "goldRay", opacity: 0.52 },
      { left: "90%", top: "62%", size: "5px", tx: "-98px", ty: "-88px", rotate: "0deg", duration: 5.4, delay: -6.6, shape: "goldOrb", opacity: 0.7 },
      { left: "16%", top: "54%", size: "3px", tx: "78px", ty: "-84px", rotate: "0deg", duration: 4.8, delay: -2.2, shape: "goldOrb", opacity: 0.66 },
      { left: "30%", top: "42%", size: "11px", tx: "62px", ty: "-68px", rotate: "38deg", duration: 6.2, delay: -7.2, shape: "goldRay", opacity: 0.42 },
      { left: "48%", top: "12%", size: "4px", tx: "0px", ty: "88px", rotate: "0deg", duration: 5.1, delay: -8, shape: "goldOrb", opacity: 0.6 },
      { left: "62%", top: "58%", size: "3px", tx: "-70px", ty: "-68px", rotate: "0deg", duration: 5.5, delay: -8.7, shape: "goldOrb", opacity: 0.64 },
      { left: "74%", top: "92%", size: "5px", tx: "-90px", ty: "-148px", rotate: "0deg", duration: 6, delay: -9.2, shape: "goldOrb", opacity: 0.72 },
      { left: "86%", top: "38%", size: "4px", tx: "-104px", ty: "-22px", rotate: "0deg", duration: 4.7, delay: -3.1, shape: "goldOrb", opacity: 0.58 },
      { left: "40%", top: "66%", size: "4px", tx: "24px", ty: "-108px", rotate: "0deg", duration: 5.7, delay: -4.6, shape: "goldOrb", opacity: 0.68 },
      { left: "54%", top: "78%", size: "9px", tx: "-16px", ty: "-116px", rotate: "-30deg", duration: 6.6, delay: -9.8, shape: "goldRay", opacity: 0.48 },
      { left: "96%", top: "86%", size: "10px", tx: "-120px", ty: "-106px", rotate: "44deg", duration: 6.9, delay: -11.6, shape: "goldRay", opacity: 0.46 },
    ],
  },
};

function getCollectionRarityVisual(rarity: string) {
  return collectionRarityVisuals[rarity] || collectionRarityVisuals.common;
}

function createCollectionRarityVars(config: CollectionRarityVisual): CollectionRarityVars {
  return {
    "--collection-border": config.borderColor,
    "--collection-glow": config.glowColor,
    "--collection-particle": config.particleColor,
    "--collection-secondary": config.secondaryColor,
    "--collection-tertiary": config.tertiaryColor,
    "--collection-intensity": config.intensity,
  };
}

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
        .some((value) => String(value).toLowerCase().includes(normalizedSearch));
    });
  }, [cards, searchTerm]);

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
          <CardpocModalShell
            onClose={onClose}
            className="max-w-6xl"
            contentClassName="hide-scrollbar max-h-[calc(100vh-2rem)] overflow-y-auto p-8 pb-10"
            zIndexClassName="z-[100]"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-5 top-5 z-20 rounded-full border border-white/10 bg-white/5 p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
              aria-label={translate(t, "closeCollection", "Fechar coleção")}
            >
              <X size={18} />
            </button>

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
                      "Aqui ficam as cartas de criadores conquistadas por seguir, pacotes, missões e eventos. Notificações de carta podem abrir a carta específica diretamente aqui."
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
                      "Pesquisar por carta, criador, raridade..."
                    )}
                    className="h-12 w-full rounded-full border border-cyan-200/15 bg-white/[0.055] pl-12 pr-4 text-sm font-medium text-white outline-none transition placeholder:text-white/35 focus:border-cyan-200/35 focus:bg-white/[0.08] focus:shadow-[0_0_28px_rgba(34,211,238,0.12)]"
                  />
                </label>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <StatCard icon={<Archive size={18} />} label={translate(t, "total", "Total")} value={stats.total} />
                <StatCard icon={<Sparkles size={18} />} label={translate(t, "commonPlural", "Comuns")} value={stats.common} />
                <StatCard icon={<Gem size={18} />} label={translate(t, "rarePlural", "Raras")} value={stats.rare} />
                <StatCard icon={<Zap size={18} />} label={translate(t, "epicPlural", "Épicas")} value={stats.epic} />
                <StatCard icon={<Crown size={18} />} label={translate(t, "legendaryPlural", "Lendárias")} value={stats.legendary} />
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
                    "Nenhuma carta encontrada para essa pesquisa."
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
          "Em breve você poderá conquistar cartas seguindo creators, abrindo pacotes e completando missões dentro do Cardpoc."
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
  const { language, t } = useLanguage();

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
      `🃏 Eu conquistei a carta ${nickname} (${rarity}) no Cardpoc`
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
          className="absolute right-6 top-6 z-30 rounded-full border border-white/10 bg-white/5 p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
          aria-label={translate(t, "closeCard", "Fechar carta")}
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
                {translate(t, "newCard", "Nova carta")}
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

function CollectionCardFace({
  card,
  onClick,
  size,
}: {
  card: UserCard;
  onClick: () => void;
  size: "small" | "large";
}) {
  const { language, t } = useLanguage();
  const creator = card.creator_profiles;
  const imageUrl = creator?.avatar_url || creator?.banner_url || "";
  const nickname = creator?.nickname || "Cardpoc";
  const username = creator?.username || "creator";
  const rarity = card.rarity || "common";
  const style = rarityStyles[rarity] || rarityStyles.common;
  const visual = getCollectionRarityVisual(rarity);
  const isLarge = size === "large";
  const xp = getCardXp(rarity);
  const isNew = isCardNew(card);

  const cardSizeClass = isLarge
    ? "h-[620px] w-[410px] rounded-[34px]"
    : "h-[360px] w-[240px] rounded-[24px]";

  return (
    <button
      type="button"
      onClick={onClick}
      style={createCollectionRarityVars(visual)}
      className={`collection-card-shell ${visual.className} group relative ${cardSizeClass} overflow-hidden border bg-black text-left transition duration-500 hover:scale-[1.015]`}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={nickname}
          className="collection-card-image absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-cyan-300/10 text-6xl font-black text-cyan-100">
          {nickname.slice(0, 2).toUpperCase()}
        </div>
      )}

      <div className="collection-effect-base absolute inset-0" />
      <div className="collection-effect-texture absolute inset-0" />
      <div className="collection-effect-aura absolute inset-0" />
      <div className="collection-effect-special absolute inset-0" />

      <div className="collection-particle-layer pointer-events-none absolute inset-0">
        {visual.particles.map((particle, index) => (
          <span
            key={`${card.id}-${rarity}-particle-${index}`}
            className={`collection-particle collection-particle-${particle.shape} absolute`}
            style={
              {
                left: particle.left,
                top: particle.top,
                width: particle.size,
                height: particle.size,
                opacity: particle.opacity,
                "--particle-x": particle.tx,
                "--particle-y": particle.ty,
                "--particle-rotate": particle.rotate,
                animationDelay: `${particle.delay}s`,
                animationDuration: `${particle.duration}s`,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div className="collection-effect-shine pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100" />
      <div className="collection-card-readability absolute inset-0" />

      <div
        className={`absolute z-20 border font-bold uppercase backdrop-blur-md ${style.badge} ${
          isLarge
            ? "left-7 top-7 rounded-full px-5 py-2 text-sm tracking-[0.32em]"
            : "left-4 top-4 rounded-full px-3 py-1 text-[10px] tracking-[0.25em]"
        }`}
      >
        {getRarityLabel(rarity, t)}
      </div>

      <div
        className={`absolute z-20 flex flex-col items-end gap-2 ${
          isLarge ? "right-7 top-20" : "right-4 top-12"
        }`}
      >
        {isNew && (
          <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-100 backdrop-blur">
            {translate(t, "new", "Nova")}
          </span>
        )}

        {isNew && (
          <span className="rounded-full border border-purple-300/25 bg-purple-300/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-purple-100 backdrop-blur">
            +{xp} XP
          </span>
        )}
      </div>

      <div className={`absolute bottom-0 left-0 right-0 z-20 ${isLarge ? "p-8" : "p-4"}`}>
        <p
          className={`uppercase ${style.text} ${
            isLarge ? "text-sm tracking-[0.35em]" : "text-[10px] tracking-[0.3em]"
          }`}
          style={{ textShadow: "0 0 10px var(--collection-glow)" }}
        >
          {translate(t, "creatorCard", "Carta do Creator")}
        </p>

        <h3
          className={`mt-2 font-black text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] ${
            isLarge ? "text-4xl" : "text-xl"
          }`}
        >
          {nickname}
        </h3>

        <p
          className={
            isLarge
              ? "mt-2 text-base text-white/58 drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]"
              : "mt-1 text-xs text-white/55 drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]"
          }
        >
          @{username}
        </p>

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/72 backdrop-blur-md">
            {card.source}
          </span>

          <span className="text-xs text-white/48">
            {new Date(card.obtained_at).toLocaleDateString(getDateLocale(language))}
          </span>
        </div>
      </div>

      <div className="collection-card-frame pointer-events-none absolute inset-0" />

      <style>{`
        .collection-card-shell {
          isolation: isolate;
          border-color: var(--collection-border);
          box-shadow:
            inset 0 0 18px rgba(255, 255, 255, 0.035),
            0 12px 30px rgba(0, 0, 0, 0.62),
            0 0 calc(12px + (22px * var(--collection-intensity))) var(--collection-glow);
          transform: translateZ(0);
          backface-visibility: hidden;
        }

        .collection-card-shell:hover {
          box-shadow:
            inset 0 0 20px rgba(255, 255, 255, 0.045),
            0 16px 38px rgba(0, 0, 0, 0.66),
            0 0 calc(18px + (30px * var(--collection-intensity))) var(--collection-glow);
        }

        .collection-card-image {
          z-index: 0;
          opacity: 0.98;
          filter: contrast(1.09) saturate(1.06) brightness(1.02);
        }

        .collection-effect-base,
        .collection-effect-texture,
        .collection-effect-aura,
        .collection-effect-special,
        .collection-particle-layer,
        .collection-effect-shine,
        .collection-card-readability,
        .collection-card-frame {
          border-radius: inherit;
          pointer-events: none;
        }

        .collection-effect-base {
          z-index: 1;
          background:
            linear-gradient(to bottom, rgba(0,0,0,0.04), transparent 34%, rgba(0,0,0,0.34) 76%, rgba(0,0,0,0.9)),
            radial-gradient(circle at 50% 36%, transparent 0 24%, rgba(0,0,0,0.04) 42%, rgba(0,0,0,0.18) 78%);
        }

        .collection-effect-texture,
        .collection-effect-aura,
        .collection-effect-special,
        .collection-particle-layer,
        .collection-effect-shine {
          mix-blend-mode: screen;
        }

        .collection-effect-texture { z-index: 2; }
        .collection-effect-aura { z-index: 3; }
        .collection-effect-special { z-index: 4; }
        .collection-particle-layer {
          z-index: 5;
          overflow: hidden;
        }

        .collection-card-readability {
          z-index: 10;
          background:
            linear-gradient(to top, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.62) 24%, rgba(0,0,0,0.12) 56%, rgba(0,0,0,0.04) 100%),
            linear-gradient(to right, rgba(0,0,0,0.12), transparent 28%, transparent 72%, rgba(0,0,0,0.08));
        }

        .collection-card-frame {
          z-index: 30;
          border: 1px solid var(--collection-border);
          box-shadow:
            inset 0 0 0 1px rgba(255, 255, 255, 0.08),
            inset 0 0 calc(14px + (16px * var(--collection-intensity))) var(--collection-glow);
        }

        .collection-effect-shine {
          z-index: 9;
          background: linear-gradient(112deg, transparent 18%, rgba(255,255,255,0.16) 42%, transparent 63%);
          transform: translateX(-120%);
          animation: collectionHoverShine 3s ease-in-out infinite;
        }

        .collection-particle {
          background: var(--collection-particle);
          box-shadow:
            0 0 6px var(--collection-particle),
            0 0 16px var(--collection-secondary);
          will-change: transform, opacity, filter;
        }

        .collection-particle-silverDust {
          border-radius: 999px;
          filter: blur(0.2px);
          animation: collectionSilverFloat ease-in-out infinite;
        }

        .collection-particle-silverShard {
          clip-path: polygon(50% 0%, 100% 42%, 58% 100%, 0% 58%);
          border-radius: 1px;
          background: linear-gradient(135deg, rgba(255,255,255,0.98), var(--collection-secondary));
          animation: collectionSilverFloat ease-in-out infinite;
        }

        .collection-particle-bluePixel {
          border-radius: 1px;
          box-shadow:
            0 0 5px var(--collection-particle),
            10px 0 0 -1px var(--collection-secondary),
            -8px 7px 0 -1px var(--collection-tertiary);
          animation: collectionBluePulse steps(4, end) infinite;
        }

        .collection-particle-blueSpark {
          height: 1px !important;
          border-radius: 999px;
          background: linear-gradient(90deg, transparent, var(--collection-particle), transparent);
          animation: collectionBluePulse ease-out infinite;
        }

        .collection-particle-violetRune {
          border: 1px solid var(--collection-particle);
          border-radius: 2px;
          background: transparent;
          box-shadow: inset 0 0 8px var(--collection-secondary), 0 0 12px var(--collection-secondary);
          animation: collectionVioletArcane cubic-bezier(0.45, 0, 0.25, 1) infinite;
        }

        .collection-particle-violetRune::before,
        .collection-particle-violetRune::after {
          content: "";
          position: absolute;
          inset: 45% 12%;
          background: var(--collection-particle);
          box-shadow: 0 0 8px var(--collection-secondary);
        }

        .collection-particle-violetRune::after {
          transform: rotate(90deg);
        }

        .collection-particle-violetStar {
          clip-path: polygon(50% 0%, 60% 38%, 100% 50%, 60% 62%, 50% 100%, 40% 62%, 0% 50%, 40% 38%);
          animation: collectionVioletArcane ease-in-out infinite;
        }

        .collection-particle-goldOrb {
          border-radius: 999px;
          background: radial-gradient(circle, rgba(255,255,255,1) 0 24%, var(--collection-particle) 25% 44%, var(--collection-secondary) 45% 100%);
          box-shadow:
            0 0 8px rgba(255,255,255,0.95),
            0 0 20px var(--collection-secondary),
            0 0 34px var(--collection-glow);
          animation: collectionGoldSolar ease-in-out infinite;
        }

        .collection-particle-goldRay {
          height: 2px !important;
          border-radius: 999px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.95), var(--collection-secondary), transparent);
          box-shadow: 0 0 10px rgba(255,255,255,0.8), 0 0 24px var(--collection-secondary);
          animation: collectionGoldSolar ease-in-out infinite;
        }

        .collection-common .collection-effect-texture {
          opacity: 0.36;
          background:
            repeating-linear-gradient(112deg, transparent 0 10px, rgba(255,255,255,0.06) 11px, transparent 13px),
            linear-gradient(135deg, transparent, rgba(226,232,240,0.1), transparent);
          animation: collectionMetalSweep 9s ease-in-out infinite;
        }

        .collection-common .collection-effect-aura {
          opacity: 0.24;
          background:
            radial-gradient(circle at 18% 20%, rgba(255,255,255,0.12), transparent 22%),
            radial-gradient(circle at 78% 78%, rgba(203,213,225,0.1), transparent 24%);
        }

        .collection-common .collection-effect-special {
          opacity: 0.16;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
          transform: translateX(-100%);
          animation: collectionThinGleam 7.5s ease-in-out infinite;
        }

        .collection-rare .collection-effect-texture {
          opacity: 0.46;
          background-image:
            linear-gradient(90deg, transparent 0 22%, rgba(125,211,252,0.22) 22% 23%, transparent 23% 100%),
            linear-gradient(0deg, transparent 0 31%, rgba(14,165,233,0.18) 31% 32%, transparent 32% 100%),
            radial-gradient(circle at 18% 32%, rgba(125,211,252,0.24), transparent 18%),
            radial-gradient(circle at 82% 68%, rgba(34,211,238,0.16), transparent 20%);
          background-size: 58px 58px, 64px 64px, 100% 100%, 100% 100%;
          animation: collectionCircuitScan 4.2s linear infinite;
        }

        .collection-rare .collection-effect-aura {
          opacity: 0.5;
          background:
            linear-gradient(90deg, transparent 0 18%, rgba(125,211,252,0.16) 20%, transparent 24%),
            linear-gradient(90deg, transparent 0 68%, rgba(14,165,233,0.14) 70%, transparent 73%);
          animation: collectionBlueBars 2.4s ease-in-out infinite;
        }

        .collection-rare .collection-effect-special {
          opacity: 0.38;
          background:
            linear-gradient(180deg, transparent 0 46%, rgba(186,230,253,0.2) 47%, transparent 49%),
            linear-gradient(90deg, transparent 0 54%, rgba(56,189,248,0.18) 55%, transparent 57%);
          animation: collectionCrossPulse 1.9s steps(3, end) infinite;
        }

        .collection-epic .collection-effect-texture {
          opacity: 0.5;
          background:
            radial-gradient(circle at 20% 76%, rgba(88,28,135,0.28), transparent 26%),
            radial-gradient(circle at 78% 24%, rgba(124,58,237,0.22), transparent 24%),
            radial-gradient(circle at 54% 58%, rgba(236,72,153,0.12), transparent 28%);
          filter: blur(8px);
          animation: collectionEpicMist 8.5s ease-in-out infinite;
        }

        .collection-epic .collection-effect-aura {
          opacity: 0.52;
          background:
            conic-gradient(from 40deg at 48% 54%, transparent 0 14%, rgba(167,139,250,0.26) 18%, transparent 25%, transparent 42%, rgba(236,72,153,0.16) 48%, transparent 57%, transparent 76%, rgba(124,58,237,0.2) 82%, transparent 90%),
            radial-gradient(ellipse at 50% 56%, transparent 0 44%, rgba(196,181,253,0.14) 46%, transparent 51%);
          transform: rotate(-18deg) scale(1.15);
          animation: collectionIrregularSpiral 7.8s cubic-bezier(0.43, 0, 0.2, 1) infinite;
        }

        .collection-epic .collection-effect-special {
          opacity: 0.4;
          background-image:
            radial-gradient(circle, rgba(233,213,255,0.48) 0 1px, transparent 1.8px),
            linear-gradient(135deg, transparent 0 44%, rgba(167,139,250,0.14) 45%, transparent 48%);
          background-size: 42px 42px, 100% 100%;
          animation: collectionStarDrift 11s ease-in-out infinite;
        }

        .collection-legendary .collection-effect-texture {
          opacity: 0.54;
          background:
            conic-gradient(from 180deg at 50% 10%, rgba(255,255,255,0.2), transparent 9%, rgba(251,191,36,0.18) 13%, transparent 22%, rgba(253,224,71,0.14) 26%, transparent 38%, rgba(255,255,255,0.16) 44%, transparent 62%, rgba(245,158,11,0.2) 70%, transparent 100%);
          transform-origin: 50% 12%;
          animation: collectionGoldRays 9s ease-in-out infinite;
        }

        .collection-legendary .collection-effect-aura {
          opacity: 0.52;
          background:
            radial-gradient(circle at 50% 10%, rgba(255,255,255,0.28), transparent 13%),
            radial-gradient(circle at 18% 34%, rgba(253,224,71,0.16), transparent 22%),
            radial-gradient(circle at 84% 64%, rgba(251,191,36,0.18), transparent 25%),
            linear-gradient(180deg, rgba(251,191,36,0.07), transparent 56%);
          animation: collectionGoldGlow 5.8s ease-in-out infinite;
        }

        .collection-legendary .collection-effect-special {
          opacity: 0.42;
          background:
            linear-gradient(118deg, transparent 0 34%, rgba(255,255,255,0.16) 37%, rgba(253,224,71,0.22) 39%, transparent 43%),
            linear-gradient(72deg, transparent 0 60%, rgba(251,191,36,0.16) 63%, transparent 66%);
          animation: collectionNobleFlare 6.4s ease-in-out infinite;
        }

        @keyframes collectionMetalSweep {
          0%, 100% { background-position: 0 0, 0 0; opacity: 0.28; }
          50% { background-position: 44px 24px, 0 0; opacity: 0.44; }
        }

        @keyframes collectionThinGleam {
          0%, 55% { transform: translateX(-120%); opacity: 0; }
          70% { opacity: 0.2; }
          100% { transform: translateX(120%); opacity: 0; }
        }

        @keyframes collectionSilverFloat {
          0% { transform: translate3d(0, 0, 0) rotate(0deg) scale(0.75); opacity: 0; filter: brightness(0.9); }
          20% { opacity: 0.62; }
          62% { transform: translate3d(calc(var(--particle-x) * 0.62), calc(var(--particle-y) * 0.7), 0) rotate(calc(var(--particle-rotate) * 0.55)) scale(1); opacity: 0.66; filter: brightness(1.2); }
          100% { transform: translate3d(var(--particle-x), var(--particle-y), 0) rotate(var(--particle-rotate)) scale(0.72); opacity: 0; filter: brightness(0.95); }
        }

        @keyframes collectionCircuitScan {
          0% { background-position: 0 0, 0 0, 0 0, 0 0; filter: brightness(0.95); }
          50% { filter: brightness(1.4); }
          100% { background-position: 58px 0, 0 -64px, 0 0, 0 0; filter: brightness(1); }
        }

        @keyframes collectionBlueBars {
          0%, 100% { transform: translateX(-18px); opacity: 0.24; }
          45% { transform: translateX(18px); opacity: 0.6; }
          65% { opacity: 0.34; }
        }

        @keyframes collectionCrossPulse {
          0%, 100% { opacity: 0.16; filter: brightness(1); }
          50% { opacity: 0.5; filter: brightness(1.55); }
        }

        @keyframes collectionBluePulse {
          0% { transform: translate3d(0, 0, 0) scaleX(0.6); opacity: 0; filter: brightness(1); }
          18% { opacity: 0.95; }
          52% { transform: translate3d(calc(var(--particle-x) * 0.48), calc(var(--particle-y) * 0.48), 0) scaleX(1.55); opacity: 1; filter: brightness(1.9); }
          100% { transform: translate3d(var(--particle-x), var(--particle-y), 0) scaleX(0.3); opacity: 0; filter: brightness(1.1); }
        }

        @keyframes collectionEpicMist {
          0%, 100% { transform: scale(1.08) translate3d(-6px, 4px, 0); opacity: 0.34; }
          40% { transform: scale(1.18) translate3d(10px, -8px, 0); opacity: 0.54; }
          72% { transform: scale(1.12) translate3d(-2px, -12px, 0); opacity: 0.4; }
        }

        @keyframes collectionIrregularSpiral {
          0% { transform: rotate(-18deg) scale(1.15); opacity: 0.28; }
          38% { transform: rotate(44deg) scale(1.2) translate3d(4px, -8px, 0); opacity: 0.6; }
          70% { transform: rotate(12deg) scale(1.1) translate3d(-8px, 4px, 0); opacity: 0.42; }
          100% { transform: rotate(78deg) scale(1.15); opacity: 0.3; }
        }

        @keyframes collectionStarDrift {
          0%, 100% { background-position: 0 0, 0 0; opacity: 0.28; }
          50% { background-position: 28px -42px, 0 0; opacity: 0.48; }
        }

        @keyframes collectionVioletArcane {
          0% { transform: translate3d(0, 0, 0) rotate(0deg) scale(0.62); opacity: 0; filter: brightness(0.9); }
          16% { opacity: 0.86; }
          54% { transform: translate3d(calc(var(--particle-x) * 0.5), calc(var(--particle-y) * 0.44), 0) rotate(calc(var(--particle-rotate) * 0.52)) scale(1.18); opacity: 0.72; filter: brightness(1.55); }
          100% { transform: translate3d(var(--particle-x), var(--particle-y), 0) rotate(var(--particle-rotate)) scale(0.5); opacity: 0; filter: brightness(1); }
        }

        @keyframes collectionGoldRays {
          0%, 100% { transform: rotate(-8deg) scale(1.1); opacity: 0.32; }
          50% { transform: rotate(8deg) scale(1.18); opacity: 0.62; }
        }

        @keyframes collectionGoldGlow {
          0%, 100% { opacity: 0.32; filter: brightness(1); }
          45% { opacity: 0.64; filter: brightness(1.35); }
          70% { opacity: 0.44; filter: brightness(1.12); }
        }

        @keyframes collectionNobleFlare {
          0%, 42% { transform: translateX(-110%); opacity: 0; }
          56% { opacity: 0.48; }
          82%, 100% { transform: translateX(110%); opacity: 0; }
        }

        @keyframes collectionGoldSolar {
          0% { transform: translate3d(0, 0, 0) rotate(0deg) scale(0.56); opacity: 0; filter: brightness(1); }
          14% { opacity: 0.92; }
          48% { transform: translate3d(calc(var(--particle-x) * 0.45), calc(var(--particle-y) * 0.5), 0) rotate(calc(var(--particle-rotate) * 0.45)) scale(1.35); opacity: 1; filter: brightness(1.9); }
          100% { transform: translate3d(var(--particle-x), var(--particle-y), 0) rotate(var(--particle-rotate)) scale(0.72); opacity: 0; filter: brightness(1.1); }
        }

        @keyframes collectionHoverShine {
          0%, 40% { transform: translateX(-120%); }
          75%, 100% { transform: translateX(120%); }
        }

        @media (prefers-reduced-motion: reduce) {
          .collection-effect-texture,
          .collection-effect-aura,
          .collection-effect-special,
          .collection-particle,
          .collection-effect-shine {
            animation: none !important;
          }
        }
      `}</style>
    </button>
  );
}
