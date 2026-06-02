import { CreatorRarity } from "@/types/creator";

export const rarityStyles: Record<
  CreatorRarity,
  {
    label: string;
    badge: string;
    glow: string;
    border: string;
    text: string;
  }
> = {
  common: {
    label: "Comum",
    badge: "border-white/15 bg-white/10 text-white/70",
    glow: "bg-white/20",
    border: "border-white/15",
    text: "text-white/70",
  },

  rare: {
    label: "Raro",
    badge: "border-cyan-300/30 bg-cyan-300/10 text-cyan-100",
    glow: "bg-cyan-500/40",
    border: "border-cyan-300/25",
    text: "text-cyan-200",
  },

  epic: {
    label: "Épico",
    badge: "border-purple-300/30 bg-purple-300/10 text-purple-100",
    glow: "bg-purple-600/40",
    border: "border-purple-300/25",
    text: "text-purple-200",
  },

  legendary: {
    label: "Lendário",
    badge: "border-yellow-300/40 bg-yellow-300/10 text-yellow-100",
    glow: "bg-yellow-500/40",
    border: "border-yellow-300/30",
    text: "text-yellow-200",
  },

  mythic: {
    label: "Mítico",
    badge: "border-pink-300/40 bg-pink-300/10 text-pink-100",
    glow: "bg-pink-500/40",
    border: "border-pink-300/30",
    text: "text-pink-200",
  },
};

export const rarityLabels: Record<string, string> = {
  common: "Comum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário",
  mythic: "Mítico",
};

export function getRarityLabel(
  rarity?: string | null
): string {
  if (!rarity) return "Comum";

  return rarityLabels[rarity.toLowerCase()] || rarity;
}