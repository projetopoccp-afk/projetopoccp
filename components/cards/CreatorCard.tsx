"use client";

import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import { rarityStyles } from "@/lib/rarity";
import { useLanguage } from "@/contexts/LanguageContext";
import { translate } from "@/lib/i18n/translate";
import { Creator } from "@/types/creator";
import { TiltCard } from "./TiltCard";

type CreatorCardProps = {
  creator: Creator;
  onClick: (creator: Creator) => void;
};

type CardRarity = "common" | "rare" | "epic" | "legendary";

type ParticleShape =
  | "dust"
  | "shard"
  | "pixel"
  | "spark"
  | "rune"
  | "star"
  | "solar"
  | "flare"
  | "arc";

type ParticleSpec = {
  left: string;
  top: string;
  size: string;
  tx: string;
  ty: string;
  rotate: string;
  duration: number;
  delay: number;
  opacity?: number;
  shape?: ParticleShape;
};

type RarityVisualConfig = {
  label: string;
  className: string;
  borderColor: string;
  glowColor: string;
  particleColor: string;
  particleShape: ParticleShape;
  particleCount: number;
  particleAnimation: string;
  backgroundEffect: string;
  auraEffect: string;
  intensity: number;
  secondaryColor: string;
  tertiaryColor: string;
  textGlow: string;
  particles: ParticleSpec[];
};

type RarityStyleVars = CSSProperties & {
  "--rarity-border": string;
  "--rarity-glow": string;
  "--rarity-particle": string;
  "--rarity-secondary": string;
  "--rarity-tertiary": string;
  "--rarity-text-glow": string;
  "--rarity-intensity": number;
};

const RARITY_VISUALS: Record<CardRarity, RarityVisualConfig> = {
  common: {
    label: "Prata metálico",
    className: "creator-card-common",
    borderColor: "rgba(226, 232, 240, 0.52)",
    glowColor: "rgba(203, 213, 225, 0.14)",
    particleColor: "rgba(241, 245, 249, 0.9)",
    secondaryColor: "rgba(148, 163, 184, 0.42)",
    tertiaryColor: "rgba(255, 255, 255, 0.28)",
    textGlow: "rgba(226, 232, 240, 0.36)",
    particleShape: "shard",
    particleCount: 12,
    particleAnimation: "creatorCommonFragmentFloat",
    backgroundEffect: "brushed-metal",
    auraEffect: "soft-edge-silver",
    intensity: 0.36,
    particles: [
      { left: "10%", top: "20%", size: "5px", tx: "22px", ty: "-36px", rotate: "42deg", duration: 8.8, delay: 0, shape: "shard", opacity: 0.58 },
      { left: "22%", top: "76%", size: "4px", tx: "36px", ty: "-62px", rotate: "-28deg", duration: 9.6, delay: -1.2, shape: "dust", opacity: 0.42 },
      { left: "36%", top: "28%", size: "7px", tx: "-18px", ty: "-44px", rotate: "68deg", duration: 10.2, delay: -2.8, shape: "shard", opacity: 0.5 },
      { left: "52%", top: "82%", size: "3px", tx: "20px", ty: "-48px", rotate: "18deg", duration: 8.4, delay: -3.4, shape: "dust", opacity: 0.38 },
      { left: "70%", top: "34%", size: "6px", tx: "-30px", ty: "-38px", rotate: "-54deg", duration: 9.2, delay: -4.2, shape: "shard", opacity: 0.48 },
      { left: "84%", top: "68%", size: "3px", tx: "-42px", ty: "-54px", rotate: "24deg", duration: 10.8, delay: -5.1, shape: "dust", opacity: 0.34 },
      { left: "16%", top: "48%", size: "3px", tx: "28px", ty: "-28px", rotate: "0deg", duration: 7.8, delay: -1.9, shape: "dust", opacity: 0.36 },
      { left: "46%", top: "16%", size: "4px", tx: "-12px", ty: "-32px", rotate: "81deg", duration: 11, delay: -6.2, shape: "shard", opacity: 0.44 },
      { left: "64%", top: "62%", size: "3px", tx: "-26px", ty: "-46px", rotate: "-15deg", duration: 8.9, delay: -7.4, shape: "dust", opacity: 0.32 },
      { left: "30%", top: "58%", size: "5px", tx: "18px", ty: "-40px", rotate: "36deg", duration: 10.4, delay: -3.8, shape: "shard", opacity: 0.46 },
      { left: "76%", top: "18%", size: "3px", tx: "-22px", ty: "-34px", rotate: "-30deg", duration: 9.8, delay: -8, shape: "dust", opacity: 0.3 },
      { left: "58%", top: "42%", size: "4px", tx: "14px", ty: "-30px", rotate: "61deg", duration: 8.6, delay: -6.7, shape: "shard", opacity: 0.42 },
    ],
  },

  rare: {
    label: "Azul claro elétrico",
    className: "creator-card-rare",
    borderColor: "rgba(125, 211, 252, 0.72)",
    glowColor: "rgba(56, 189, 248, 0.3)",
    particleColor: "rgba(186, 230, 253, 0.98)",
    secondaryColor: "rgba(14, 165, 233, 0.74)",
    tertiaryColor: "rgba(34, 211, 238, 0.64)",
    textGlow: "rgba(125, 211, 252, 0.55)",
    particleShape: "pixel",
    particleCount: 18,
    particleAnimation: "creatorRareDigitalPulse",
    backgroundEffect: "electric-circuit",
    auraEffect: "quick-blue-pulses",
    intensity: 0.62,
    particles: [
      { left: "8%", top: "18%", size: "3px", tx: "82px", ty: "-8px", rotate: "0deg", duration: 2.8, delay: 0, shape: "pixel", opacity: 0.72 },
      { left: "18%", top: "74%", size: "4px", tx: "98px", ty: "-34px", rotate: "0deg", duration: 3.1, delay: -0.7, shape: "spark", opacity: 0.78 },
      { left: "30%", top: "32%", size: "3px", tx: "-62px", ty: "24px", rotate: "0deg", duration: 2.6, delay: -1.4, shape: "pixel", opacity: 0.68 },
      { left: "46%", top: "84%", size: "3px", tx: "54px", ty: "-72px", rotate: "0deg", duration: 3.4, delay: -2.1, shape: "pixel", opacity: 0.65 },
      { left: "62%", top: "22%", size: "5px", tx: "-96px", ty: "16px", rotate: "0deg", duration: 2.9, delay: -1, shape: "spark", opacity: 0.82 },
      { left: "78%", top: "64%", size: "3px", tx: "-84px", ty: "-26px", rotate: "0deg", duration: 3.2, delay: -1.9, shape: "pixel", opacity: 0.7 },
      { left: "88%", top: "36%", size: "4px", tx: "-102px", ty: "30px", rotate: "0deg", duration: 2.7, delay: -2.5, shape: "spark", opacity: 0.76 },
      { left: "14%", top: "46%", size: "3px", tx: "112px", ty: "22px", rotate: "0deg", duration: 3.6, delay: -3, shape: "pixel", opacity: 0.62 },
      { left: "38%", top: "14%", size: "3px", tx: "44px", ty: "92px", rotate: "0deg", duration: 3.3, delay: -0.4, shape: "pixel", opacity: 0.56 },
      { left: "70%", top: "88%", size: "4px", tx: "-48px", ty: "-98px", rotate: "0deg", duration: 3, delay: -3.4, shape: "spark", opacity: 0.74 },
      { left: "24%", top: "58%", size: "2px", tx: "74px", ty: "-16px", rotate: "0deg", duration: 2.4, delay: -2.8, shape: "pixel", opacity: 0.62 },
      { left: "54%", top: "50%", size: "3px", tx: "-72px", ty: "0px", rotate: "0deg", duration: 2.9, delay: -3.7, shape: "pixel", opacity: 0.66 },
      { left: "82%", top: "16%", size: "2px", tx: "-54px", ty: "70px", rotate: "0deg", duration: 3.5, delay: -4.2, shape: "pixel", opacity: 0.58 },
      { left: "6%", top: "86%", size: "4px", tx: "116px", ty: "-56px", rotate: "0deg", duration: 3.8, delay: -4.7, shape: "spark", opacity: 0.72 },
      { left: "42%", top: "70%", size: "2px", tx: "60px", ty: "-42px", rotate: "0deg", duration: 2.5, delay: -5.1, shape: "pixel", opacity: 0.5 },
      { left: "66%", top: "42%", size: "3px", tx: "-92px", ty: "18px", rotate: "0deg", duration: 3.1, delay: -5.5, shape: "pixel", opacity: 0.7 },
      { left: "32%", top: "90%", size: "2px", tx: "26px", ty: "-92px", rotate: "0deg", duration: 3.7, delay: -6, shape: "pixel", opacity: 0.52 },
      { left: "92%", top: "78%", size: "3px", tx: "-110px", ty: "-40px", rotate: "0deg", duration: 3.4, delay: -6.4, shape: "spark", opacity: 0.64 },
    ],
  },

  epic: {
    label: "Esmeralda arcana",
    className: "creator-card-epic",
    borderColor: "rgba(110, 231, 183, 0.76)",
    glowColor: "rgba(16, 185, 129, 0.34)",
    particleColor: "rgba(209, 250, 229, 0.95)",
    secondaryColor: "rgba(5, 150, 105, 0.7)",
    tertiaryColor: "rgba(52, 211, 153, 0.52)",
    textGlow: "rgba(167, 243, 208, 0.58)",
    particleShape: "rune",
    particleCount: 16,
    particleAnimation: "creatorEpicArcaneCharge",
    backgroundEffect: "emerald-electric-runes",
    auraEffect: "subtle-emerald-arcs",
    intensity: 0.66,
    particles: [
      { left: "11%", top: "70%", size: "8px", tx: "36px", ty: "-88px", rotate: "72deg", duration: 5.8, delay: 0, shape: "rune", opacity: 0.58 },
      { left: "20%", top: "30%", size: "34px", tx: "54px", ty: "-20px", rotate: "-18deg", duration: 3.2, delay: -1.1, shape: "arc", opacity: 0.78 },
      { left: "31%", top: "84%", size: "7px", tx: "28px", ty: "-106px", rotate: "-120deg", duration: 6.4, delay: -2.2, shape: "rune", opacity: 0.5 },
      { left: "44%", top: "24%", size: "30px", tx: "-44px", ty: "-18px", rotate: "34deg", duration: 3.0, delay: -2.9, shape: "arc", opacity: 0.72 },
      { left: "57%", top: "72%", size: "8px", tx: "-26px", ty: "-98px", rotate: "140deg", duration: 6.1, delay: -4.2, shape: "rune", opacity: 0.56 },
      { left: "74%", top: "24%", size: "7px", tx: "-64px", ty: "12px", rotate: "96deg", duration: 5.7, delay: -1.7, shape: "rune", opacity: 0.46 },
      { left: "84%", top: "56%", size: "38px", tx: "-70px", ty: "-42px", rotate: "-42deg", duration: 3.4, delay: -5.1, shape: "arc", opacity: 0.74 },
      { left: "9%", top: "44%", size: "4px", tx: "62px", ty: "-20px", rotate: "0deg", duration: 5.4, delay: -2.4, shape: "star", opacity: 0.42 },
      { left: "38%", top: "14%", size: "7px", tx: "18px", ty: "44px", rotate: "-150deg", duration: 6.8, delay: -5.8, shape: "rune", opacity: 0.44 },
      { left: "66%", top: "44%", size: "32px", tx: "-56px", ty: "24px", rotate: "18deg", duration: 3.1, delay: -3.5, shape: "arc", opacity: 0.7 },
      { left: "49%", top: "88%", size: "6px", tx: "10px", ty: "-96px", rotate: "210deg", duration: 6.2, delay: -6.8, shape: "rune", opacity: 0.38 },
      { left: "24%", top: "56%", size: "3px", tx: "48px", ty: "-46px", rotate: "-20deg", duration: 4.9, delay: -4.6, shape: "star", opacity: 0.46 },
      { left: "82%", top: "82%", size: "7px", tx: "-76px", ty: "-92px", rotate: "166deg", duration: 6.7, delay: -5.5, shape: "rune", opacity: 0.36 },
      { left: "54%", top: "18%", size: "3px", tx: "-22px", ty: "64px", rotate: "0deg", duration: 4.7, delay: -7.2, shape: "star", opacity: 0.42 },
      { left: "15%", top: "91%", size: "34px", tx: "72px", ty: "-100px", rotate: "52deg", duration: 3.5, delay: -8, shape: "arc", opacity: 0.62 },
      { left: "72%", top: "68%", size: "6px", tx: "-58px", ty: "-80px", rotate: "-210deg", duration: 6.5, delay: -8.6, shape: "rune", opacity: 0.4 },
    ],
  },

  legendary: {
    label: "Ouro celestial",
    className: "creator-card-legendary",
    borderColor: "rgba(253, 224, 71, 0.82)",
    glowColor: "rgba(251, 191, 36, 0.42)",
    particleColor: "rgba(255, 251, 235, 0.98)",
    secondaryColor: "rgba(245, 158, 11, 0.88)",
    tertiaryColor: "rgba(252, 211, 77, 0.7)",
    textGlow: "rgba(253, 224, 71, 0.72)",
    particleShape: "solar",
    particleCount: 20,
    particleAnimation: "creatorLegendarySolarRise",
    backgroundEffect: "celestial-gold-rays",
    auraEffect: "premium-solar-flare",
    intensity: 0.88,
    particles: [
      { left: "8%", top: "86%", size: "5px", tx: "42px", ty: "-152px", rotate: "0deg", duration: 5.8, delay: 0, shape: "solar", opacity: 0.74 },
      { left: "14%", top: "28%", size: "10px", tx: "86px", ty: "-40px", rotate: "35deg", duration: 4.9, delay: -1, shape: "flare", opacity: 0.62 },
      { left: "22%", top: "74%", size: "4px", tx: "58px", ty: "-126px", rotate: "0deg", duration: 5.2, delay: -1.8, shape: "solar", opacity: 0.8 },
      { left: "34%", top: "18%", size: "6px", tx: "34px", ty: "58px", rotate: "-20deg", duration: 6.4, delay: -2.6, shape: "solar", opacity: 0.58 },
      { left: "44%", top: "90%", size: "12px", tx: "18px", ty: "-150px", rotate: "55deg", duration: 5.6, delay: -3.4, shape: "flare", opacity: 0.7 },
      { left: "56%", top: "34%", size: "5px", tx: "-42px", ty: "-78px", rotate: "0deg", duration: 5, delay: -4.2, shape: "solar", opacity: 0.72 },
      { left: "68%", top: "82%", size: "4px", tx: "-58px", ty: "-138px", rotate: "0deg", duration: 5.9, delay: -5, shape: "solar", opacity: 0.84 },
      { left: "80%", top: "20%", size: "14px", tx: "-74px", ty: "12px", rotate: "-45deg", duration: 6.8, delay: -5.8, shape: "flare", opacity: 0.56 },
      { left: "90%", top: "62%", size: "5px", tx: "-104px", ty: "-92px", rotate: "0deg", duration: 5.4, delay: -6.6, shape: "solar", opacity: 0.74 },
      { left: "16%", top: "54%", size: "3px", tx: "82px", ty: "-88px", rotate: "0deg", duration: 4.8, delay: -2.2, shape: "solar", opacity: 0.7 },
      { left: "30%", top: "42%", size: "11px", tx: "68px", ty: "-72px", rotate: "38deg", duration: 6.2, delay: -7.2, shape: "flare", opacity: 0.46 },
      { left: "48%", top: "12%", size: "4px", tx: "2px", ty: "94px", rotate: "0deg", duration: 5.1, delay: -8, shape: "solar", opacity: 0.64 },
      { left: "62%", top: "58%", size: "3px", tx: "-76px", ty: "-72px", rotate: "0deg", duration: 5.5, delay: -8.7, shape: "solar", opacity: 0.68 },
      { left: "74%", top: "92%", size: "5px", tx: "-96px", ty: "-156px", rotate: "0deg", duration: 6, delay: -9.2, shape: "solar", opacity: 0.76 },
      { left: "86%", top: "38%", size: "4px", tx: "-110px", ty: "-24px", rotate: "0deg", duration: 4.7, delay: -3.1, shape: "solar", opacity: 0.62 },
      { left: "40%", top: "66%", size: "4px", tx: "28px", ty: "-114px", rotate: "0deg", duration: 5.7, delay: -4.6, shape: "solar", opacity: 0.72 },
      { left: "54%", top: "78%", size: "9px", tx: "-18px", ty: "-122px", rotate: "-30deg", duration: 6.6, delay: -9.8, shape: "flare", opacity: 0.52 },
      { left: "24%", top: "12%", size: "3px", tx: "70px", ty: "64px", rotate: "0deg", duration: 5.3, delay: -10.4, shape: "solar", opacity: 0.58 },
      { left: "6%", top: "40%", size: "4px", tx: "104px", ty: "-16px", rotate: "0deg", duration: 4.9, delay: -11, shape: "solar", opacity: 0.68 },
      { left: "96%", top: "86%", size: "10px", tx: "-128px", ty: "-112px", rotate: "44deg", duration: 6.9, delay: -11.6, shape: "flare", opacity: 0.48 },
    ],
  },
};

function normalizeRarity(rarity: Creator["rarity"]): CardRarity {
  const value = String(rarity || "").toLowerCase();

  if (value === "lendário" || value === "lendario" || value === "legendary") {
    return "legendary";
  }

  if (value === "épico" || value === "epico" || value === "epic") {
    return "epic";
  }

  if (value === "raro" || value === "rare") {
    return "rare";
  }

  return "common";
}

function createRarityStyle(config: RarityVisualConfig): RarityStyleVars {
  return {
    "--rarity-border": config.borderColor,
    "--rarity-glow": config.glowColor,
    "--rarity-particle": config.particleColor,
    "--rarity-secondary": config.secondaryColor,
    "--rarity-tertiary": config.tertiaryColor,
    "--rarity-text-glow": config.textGlow,
    "--rarity-intensity": config.intensity,
  };
}

function particleShapeClass(shape: ParticleShape) {
  return `creator-particle-${shape}`;
}

function getTranslatedRarityLabel(
  t: (key: keyof typeof import("@/lib/i18n/translations").translations.pt) => string,
  rarity: CardRarity
) {
  if (rarity === "legendary") {
    return translate(t, "creatorCardRarityLegendary", "Legendary");
  }

  if (rarity === "epic") {
    return translate(t, "creatorCardRarityEpic", "Epic");
  }

  if (rarity === "rare") {
    return translate(t, "creatorCardRarityRare", "Rare");
  }

  return translate(t, "creatorCardRarityCommon", "Common");
}

export function CreatorCard({ creator, onClick }: CreatorCardProps) {
  const { t } = useLanguage();
  const rarity = rarityStyles[creator.rarity];
  const internalRarity = normalizeRarity(creator.rarity);
  const config = RARITY_VISUALS[internalRarity];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <TiltCard>
        <button
          onClick={() => onClick(creator)}
          style={createRarityStyle(config)}
          className={`creator-card-shell ${config.className} group relative h-[360px] w-[240px] overflow-hidden rounded-[24px] border bg-black text-left transition duration-500`}
          aria-label={`${translate(t, "creatorCardOpenAria", "Open card for")} ${creator.nickname}`}
        >
          <img
            src={creator.avatarUrl}
            alt={creator.nickname}
            className="creator-card-image absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]"
          />

          <div className="creator-effect-base absolute inset-0" />
          <div className="creator-effect-texture absolute inset-0" />
          <div className="creator-effect-aura absolute inset-0" />
          <div className="creator-effect-special absolute inset-0" />
          <div className="creator-card-art-depth pointer-events-none absolute inset-0" />
          <div className="creator-card-holographic pointer-events-none absolute inset-0" />

          <div className="creator-particle-layer pointer-events-none absolute inset-0">
            {config.particles.map((particle, index) => (
              <span
                key={`${internalRarity}-${particle.shape || config.particleShape}-${index}`}
                className={`creator-particle absolute ${particleShapeClass(
                  particle.shape || config.particleShape
                )}`}
                style={
                  {
                    left: particle.left,
                    top: particle.top,
                    width: particle.size,
                    height: particle.size,
                    opacity: particle.opacity ?? 0.7,
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

          <div className="creator-effect-shine pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100" />
          <div className="creator-card-readability absolute inset-0" />

          <div
            className={`creator-card-rarity-badge absolute left-4 top-4 z-20 rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em] backdrop-blur-md ${rarity.badge}`}
          >
            {getTranslatedRarityLabel(t, internalRarity)}
          </div>

          <div className="creator-card-level-badge absolute right-4 top-4 z-20 rounded-full border border-white/20 bg-black/35 px-3 py-1 text-xs text-white/85 backdrop-blur-md">
            {translate(t, "creatorCardLevelPrefix", "Lv.")} {creator.level}
          </div>

          <div className="absolute bottom-5 left-0 right-0 z-20 px-4">
            <h2 className="pr-4 text-xl font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
              {creator.nickname}
            </h2>

            <span
              className={`mt-1 block text-xs font-medium ${rarity.text} drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]`}
              style={{
                textShadow: `0 0 8px var(--rarity-text-glow)`,
              }}
            >
              @{creator.username}
            </span>
          </div>

          <div className="creator-card-frame creator-card-frame-outer pointer-events-none absolute inset-0 rounded-[24px]" />
          <div className="creator-card-frame creator-card-frame-metal pointer-events-none absolute inset-[2px] rounded-[22px]" />
          <div className="creator-card-frame creator-card-frame-inner pointer-events-none absolute inset-[5px] rounded-[19px]" />

          <style>{`
            .creator-card-shell {
              isolation: isolate;
              border-color: var(--rarity-border);
              box-shadow:
                inset 0 0 12px rgba(255, 255, 255, 0.028),
                inset 0 0 calc(10px + (12px * var(--rarity-intensity))) rgba(255, 255, 255, 0.018),
                0 12px 28px rgba(0, 0, 0, 0.62),
                0 0 calc(6px + (12px * var(--rarity-intensity))) var(--rarity-glow);
              transform: translateZ(0);
              backface-visibility: hidden;
            }

            .creator-card-shell:hover {
              box-shadow:
                inset 0 0 14px rgba(255, 255, 255, 0.035),
                inset 0 0 calc(12px + (14px * var(--rarity-intensity))) rgba(255, 255, 255, 0.022),
                0 16px 36px rgba(0, 0, 0, 0.66),
                0 0 calc(8px + (14px * var(--rarity-intensity))) var(--rarity-glow);
            }

            .creator-card-image {
              z-index: 0;
              opacity: 0.97;
              filter: contrast(1.09) saturate(1.06) brightness(1.02);
            }

            .creator-effect-base,
            .creator-effect-texture,
            .creator-effect-aura,
            .creator-effect-special,
            .creator-card-art-depth,
            .creator-card-holographic,
            .creator-particle-layer,
            .creator-effect-shine,
            .creator-card-readability,
            .creator-card-frame {
              border-radius: inherit;
            }

            .creator-effect-base {
              z-index: 1;
              pointer-events: none;
              background:
                linear-gradient(to bottom, rgba(0,0,0,0.06), transparent 34%, rgba(0,0,0,0.34) 76%, rgba(0,0,0,0.9)),
                radial-gradient(circle at 50% 36%, transparent 0 24%, rgba(0,0,0,0.04) 42%, rgba(0,0,0,0.2) 78%);
            }

            .creator-effect-texture,
            .creator-effect-aura,
            .creator-effect-special,
            .creator-particle-layer {
              pointer-events: none;
              mix-blend-mode: screen;
            }

            .creator-effect-texture {
              z-index: 2;
            }

            .creator-effect-aura {
              z-index: 3;
            }

            .creator-effect-special {
              z-index: 4;
            }

            .creator-card-art-depth {
              z-index: 6;
              background:
                radial-gradient(circle at 50% 8%, rgba(255,255,255,0.16), transparent 22%),
                linear-gradient(to right, rgba(0,0,0,0.32), transparent 22%, transparent 78%, rgba(0,0,0,0.28)),
                linear-gradient(to bottom, transparent 0 52%, rgba(0,0,0,0.18) 72%, rgba(0,0,0,0.48) 100%);
              mix-blend-mode: soft-light;
            }

            .creator-card-holographic {
              z-index: 7;
              opacity: 0.1;
              mix-blend-mode: screen;
              background:
                linear-gradient(118deg, transparent 0 24%, rgba(255,255,255,0.1) 34%, var(--rarity-tertiary) 42%, transparent 58%),
                conic-gradient(from 210deg at 50% 18%, transparent 0 22%, rgba(255,255,255,0.055) 30%, var(--rarity-secondary) 38%, transparent 50%, transparent 70%, rgba(255,255,255,0.045) 78%, transparent 100%);
              transform: translate3d(-8%, -6%, 0) rotate(-3deg) scale(1.18);
              animation: creatorCardHolographicDrift 8s ease-in-out infinite;
            }

            .creator-particle-layer {
              z-index: 8;
              overflow: hidden;
            }

            .creator-effect-shine {
              z-index: 11;
              mix-blend-mode: screen;
              background:
                linear-gradient(112deg, transparent 22%, rgba(255,255,255,0.06) 40%, rgba(255,255,255,0.16) 47%, var(--rarity-tertiary) 52%, transparent 68%);
              transform: translateX(-120%);
              animation: creatorCardHoverShine 3s ease-in-out infinite;
            }

            .creator-card-readability {
              z-index: 10;
              pointer-events: none;
              background:
                linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.34) 24%, rgba(0,0,0,0.08) 54%, rgba(0,0,0,0.03) 100%),
                linear-gradient(to right, rgba(0,0,0,0.1), transparent 28%, transparent 72%, rgba(0,0,0,0.08));
            }

            .creator-card-rarity-badge,
            .creator-card-level-badge {
              box-shadow:
                inset 0 1px 0 rgba(255,255,255,0.22),
                inset 0 -1px 0 rgba(0,0,0,0.42),
                0 8px 18px rgba(0,0,0,0.28),
                0 0 8px var(--rarity-glow);
            }

            .creator-card-rarity-badge {
              background:
                linear-gradient(135deg, rgba(255,255,255,0.18), rgba(0,0,0,0.28)),
                radial-gradient(circle at 18% 0%, var(--rarity-glow), transparent 56%);
              border-color: var(--rarity-border);
            }

            .creator-card-level-badge {
              background:
                linear-gradient(135deg, rgba(255,255,255,0.14), rgba(0,0,0,0.38));
            }

            .creator-card-frame {
              z-index: 30;
            }

            .creator-card-frame-outer {
              border: 1px solid rgba(255,255,255,0.16);
              box-shadow:
                inset 0 0 0 1px rgba(255,255,255,0.055),
                inset 0 0 0 2px rgba(0,0,0,0.26),
                inset 0 0 calc(8px + (10px * var(--rarity-intensity))) var(--rarity-glow),
                0 0 0 1px var(--rarity-border),
                0 0 calc(7px + (12px * var(--rarity-intensity))) var(--rarity-glow);
            }

            .creator-card-frame-metal {
              z-index: 31;
              border: 1px solid rgba(255,255,255,0.1);
              background:
                linear-gradient(135deg, rgba(255,255,255,0.16), transparent 16%, rgba(0,0,0,0.16) 36%, transparent 58%, rgba(255,255,255,0.1) 76%, transparent 92%),
                linear-gradient(90deg, rgba(0,0,0,0.24), transparent 16%, transparent 84%, rgba(0,0,0,0.28));
              box-shadow:
                inset 0 0 0 1px var(--rarity-border),
                inset 0 0 10px rgba(0,0,0,0.42);
              mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
              -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
              mask-composite: exclude;
              -webkit-mask-composite: xor;
              padding: 3px;
            }

            .creator-card-frame-inner {
              z-index: 32;
              border: 1px solid rgba(255,255,255,0.08);
              box-shadow:
                inset 0 0 0 1px rgba(0,0,0,0.44),
                inset 0 0 0 2px rgba(255,255,255,0.025),
                0 0 0 1px rgba(0,0,0,0.24),
                0 0 7px var(--rarity-glow);
            }

            .creator-particle {
              background: var(--rarity-particle);
              box-shadow:
                0 0 6px var(--rarity-particle),
                0 0 16px var(--rarity-secondary);
              will-change: transform, opacity, filter;
            }

            .creator-particle-dust {
              border-radius: 999px;
              filter: blur(0.2px);
              animation-name: creatorCommonFragmentFloat;
              animation-timing-function: ease-in-out;
              animation-iteration-count: infinite;
            }

            .creator-particle-shard {
              clip-path: polygon(50% 0%, 100% 42%, 58% 100%, 0% 58%);
              border-radius: 1px;
              background:
                linear-gradient(135deg, rgba(255,255,255,0.98), var(--rarity-secondary));
              animation-name: creatorCommonFragmentFloat;
              animation-timing-function: ease-in-out;
              animation-iteration-count: infinite;
            }

            .creator-particle-pixel {
              border-radius: 1px;
              box-shadow:
                0 0 5px var(--rarity-particle),
                10px 0 0 -1px var(--rarity-secondary),
                -8px 7px 0 -1px var(--rarity-tertiary);
              animation-name: creatorRareDigitalPulse;
              animation-timing-function: steps(4, end);
              animation-iteration-count: infinite;
            }

            .creator-particle-spark {
              height: 1px !important;
              border-radius: 999px;
              background: linear-gradient(90deg, transparent, var(--rarity-particle), transparent);
              animation-name: creatorRareDigitalPulse;
              animation-timing-function: ease-out;
              animation-iteration-count: infinite;
            }

            .creator-particle-rune {
              border: 1px solid var(--rarity-particle);
              border-radius: 2px;
              background: transparent;
              box-shadow:
                inset 0 0 8px var(--rarity-secondary),
                0 0 12px var(--rarity-secondary);
              animation-name: creatorEpicArcaneCharge;
              animation-timing-function: cubic-bezier(0.45, 0, 0.25, 1);
              animation-iteration-count: infinite;
            }

            .creator-particle-rune::before,
            .creator-particle-rune::after {
              content: "";
              position: absolute;
              inset: 45% 12%;
              background: var(--rarity-particle);
              box-shadow: 0 0 8px var(--rarity-secondary);
            }

            .creator-particle-rune::after {
              transform: rotate(90deg);
            }

            .creator-particle-star {
              clip-path: polygon(50% 0%, 60% 38%, 100% 50%, 60% 62%, 50% 100%, 40% 62%, 0% 50%, 40% 38%);
              animation-name: creatorEpicArcaneCharge;
              animation-timing-function: ease-in-out;
              animation-iteration-count: infinite;
            }

            .creator-particle-arc {
              height: 3px !important;
              border-radius: 999px;
              background:
                linear-gradient(90deg, transparent 0 4%, rgba(236,253,245,1) 12%, var(--rarity-particle) 24%, transparent 34%, rgba(167,243,208,0.98) 45%, var(--rarity-secondary) 58%, transparent 72%, rgba(236,253,245,0.9) 82%, transparent 100%);
              clip-path: polygon(0 54%, 10% 54%, 18% 18%, 28% 76%, 38% 34%, 49% 70%, 60% 26%, 72% 62%, 100% 62%, 100% 100%, 0 100%);
              box-shadow:
                0 0 8px rgba(209,250,229,0.88),
                0 0 18px rgba(52,211,153,0.72),
                0 0 28px rgba(16,185,129,0.42);
              animation-name: creatorEpicElectricArc;
              animation-timing-function: steps(3, end);
              animation-iteration-count: infinite;
            }

            .creator-particle-solar {
              border-radius: 999px;
              background:
                radial-gradient(circle, rgba(255,255,255,1) 0 24%, var(--rarity-particle) 25% 44%, var(--rarity-secondary) 45% 100%);
              box-shadow:
                0 0 8px rgba(255,255,255,0.95),
                0 0 20px var(--rarity-secondary),
                0 0 34px var(--rarity-glow);
              animation-name: creatorLegendarySolarRise;
              animation-timing-function: ease-in-out;
              animation-iteration-count: infinite;
            }

            .creator-particle-flare {
              height: 2px !important;
              border-radius: 999px;
              background: linear-gradient(90deg, transparent, rgba(255,255,255,0.95), var(--rarity-secondary), transparent);
              box-shadow:
                0 0 10px rgba(255,255,255,0.8),
                0 0 24px var(--rarity-secondary);
              animation-name: creatorLegendarySolarRise;
              animation-timing-function: ease-in-out;
              animation-iteration-count: infinite;
            }

            /* COMMON — prata metálico, limpo, fragmentos discretos */
            .creator-card-common .creator-effect-texture {
              opacity: 0.38;
              background:
                repeating-linear-gradient(112deg, transparent 0 10px, rgba(255,255,255,0.06) 11px, transparent 13px),
                linear-gradient(135deg, transparent, rgba(226,232,240,0.1), transparent);
              animation: creatorCommonMetalSweep 9s ease-in-out infinite;
            }

            .creator-card-common .creator-effect-aura {
              opacity: 0.26;
              background:
                radial-gradient(circle at 18% 20%, rgba(255,255,255,0.12), transparent 22%),
                radial-gradient(circle at 78% 78%, rgba(203,213,225,0.1), transparent 24%);
            }

            .creator-card-common .creator-effect-special {
              opacity: 0.18;
              background:
                linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
              transform: translateX(-100%);
              animation: creatorCommonThinGleam 7.5s ease-in-out infinite;
            }

            /* RARE — azul tecnológico, circuitos, pulsos rápidos */
            .creator-card-rare .creator-effect-texture {
              opacity: 0.46;
              background-image:
                linear-gradient(90deg, transparent 0 22%, rgba(125,211,252,0.22) 22% 23%, transparent 23% 100%),
                linear-gradient(0deg, transparent 0 31%, rgba(14,165,233,0.18) 31% 32%, transparent 32% 100%),
                radial-gradient(circle at 18% 32%, rgba(125,211,252,0.26), transparent 18%),
                radial-gradient(circle at 82% 68%, rgba(34,211,238,0.18), transparent 20%);
              background-size: 58px 58px, 64px 64px, 100% 100%, 100% 100%;
              animation: creatorRareCircuitScan 4.2s linear infinite;
            }

            .creator-card-rare .creator-effect-aura {
              opacity: 0.52;
              background:
                linear-gradient(90deg, transparent 0 18%, rgba(125,211,252,0.18) 20%, transparent 24%),
                linear-gradient(90deg, transparent 0 68%, rgba(14,165,233,0.16) 70%, transparent 73%);
              animation: creatorRarePulseBars 2.4s ease-in-out infinite;
            }

            .creator-card-rare .creator-effect-special {
              opacity: 0.4;
              background:
                linear-gradient(180deg, transparent 0 46%, rgba(186,230,253,0.2) 47%, transparent 49%),
                linear-gradient(90deg, transparent 0 54%, rgba(56,189,248,0.18) 55%, transparent 57%);
              animation: creatorRareCrossPulse 1.9s steps(3, end) infinite;
            }

            /* EPIC — esmeralda arcana com raios elétricos sutis visíveis */
            .creator-card-epic .creator-effect-texture {
              opacity: 0.5;
              background-image:
                linear-gradient(118deg, transparent 0 15%, rgba(110,231,183,0.16) 16%, transparent 18% 100%),
                linear-gradient(62deg, transparent 0 58%, rgba(52,211,153,0.14) 59%, transparent 61% 100%),
                radial-gradient(circle at 18% 72%, rgba(6,95,70,0.26), transparent 20%),
                radial-gradient(circle at 78% 24%, rgba(16,185,129,0.2), transparent 19%);
              background-size: 100% 100%, 100% 100%, 100% 100%, 100% 100%;
              filter: none;
              animation: creatorEpicStaticCharge 5.4s ease-in-out infinite;
            }

            .creator-card-epic .creator-effect-aura {
              opacity: 0.5;
              background:
                linear-gradient(132deg, transparent 0 24%, rgba(209,250,229,0.28) 25%, rgba(52,211,153,0.18) 26%, transparent 29% 100%),
                linear-gradient(48deg, transparent 0 67%, rgba(110,231,183,0.24) 68%, rgba(16,185,129,0.12) 69%, transparent 72% 100%),
                radial-gradient(circle at 50% 52%, rgba(16,185,129,0.12), transparent 35%);
              transform: none;
              animation: creatorEpicElectricFlicker 2.6s steps(5, end) infinite;
            }

            .creator-card-epic .creator-effect-special {
              opacity: 0.56;
              overflow: hidden;
              background-image:
                radial-gradient(circle, rgba(209,250,229,0.5) 0 1px, transparent 1.7px),
                linear-gradient(112deg, transparent 0 22%, rgba(167,243,208,0.18) 23%, transparent 25% 100%);
              background-size: 42px 42px, 100% 100%;
              animation: creatorEpicRuneSpark 6.8s ease-in-out infinite;
            }

            .creator-card-epic .creator-effect-special::before,
            .creator-card-epic .creator-effect-special::after {
              content: "";
              position: absolute;
              left: -12%;
              width: 124%;
              height: 42px;
              opacity: 0;
              border-radius: 999px;
              background:
                linear-gradient(90deg, transparent 0 8%, rgba(236,253,245,0.98) 12%, rgba(52,211,153,0.82) 17%, transparent 23%, rgba(167,243,208,0.9) 31%, transparent 37%, rgba(16,185,129,0.78) 48%, rgba(236,253,245,0.88) 52%, transparent 60%, rgba(52,211,153,0.7) 70%, transparent 84%);
              clip-path: polygon(0 58%, 8% 58%, 12% 28%, 17% 74%, 23% 42%, 29% 64%, 35% 22%, 43% 70%, 50% 36%, 57% 62%, 65% 30%, 74% 66%, 82% 46%, 92% 58%, 100% 58%, 100% 100%, 0 100%);
              box-shadow:
                0 0 10px rgba(236,253,245,0.65),
                0 0 24px rgba(52,211,153,0.58),
                0 0 42px rgba(16,185,129,0.3);
              filter: drop-shadow(0 0 7px rgba(167,243,208,0.7));
              mix-blend-mode: screen;
              transform-origin: center;
              animation: creatorEpicVisibleLightning 3.4s steps(4, end) infinite;
            }

            .creator-card-epic .creator-effect-special::before {
              top: 28%;
              transform: rotate(-18deg) translateX(-18%);
              animation-delay: -0.8s;
            }

            .creator-card-epic .creator-effect-special::after {
              top: 58%;
              transform: rotate(21deg) translateX(16%);
              animation-delay: -2.15s;
              opacity: 0;
            }

            /* LEGENDARY — ouro celestial, raios, flare premium e partículas solares */
            .creator-card-legendary .creator-effect-texture {
              opacity: 0.56;
              background:
                conic-gradient(from 180deg at 50% 10%, rgba(255,255,255,0.22), transparent 9%, rgba(251,191,36,0.2) 13%, transparent 22%, rgba(253,224,71,0.16) 26%, transparent 38%, rgba(255,255,255,0.18) 44%, transparent 62%, rgba(245,158,11,0.22) 70%, transparent 100%);
              transform-origin: 50% 12%;
              animation: creatorLegendaryRays 9s ease-in-out infinite;
            }

            .creator-card-legendary .creator-effect-aura {
              opacity: 0.54;
              background:
                radial-gradient(circle at 50% 10%, rgba(255,255,255,0.3), transparent 13%),
                radial-gradient(circle at 18% 34%, rgba(253,224,71,0.18), transparent 22%),
                radial-gradient(circle at 84% 64%, rgba(251,191,36,0.2), transparent 25%),
                linear-gradient(180deg, rgba(251,191,36,0.08), transparent 56%);
              animation: creatorLegendaryCelestialGlow 5.8s ease-in-out infinite;
            }

            .creator-card-legendary .creator-effect-special {
              opacity: 0.44;
              background:
                linear-gradient(118deg, transparent 0 34%, rgba(255,255,255,0.18) 37%, rgba(253,224,71,0.24) 39%, transparent 43%),
                linear-gradient(72deg, transparent 0 60%, rgba(251,191,36,0.18) 63%, transparent 66%);
              animation: creatorLegendaryNobleFlare 6.4s ease-in-out infinite;
            }

            @keyframes creatorCommonMetalSweep {
              0%, 100% {
                background-position: 0 0, 0 0;
                opacity: 0.28;
              }
              50% {
                background-position: 44px 24px, 0 0;
                opacity: 0.44;
              }
            }

            @keyframes creatorCommonThinGleam {
              0%, 55% {
                transform: translateX(-120%);
                opacity: 0;
              }
              70% {
                opacity: 0.22;
              }
              100% {
                transform: translateX(120%);
                opacity: 0;
              }
            }

            @keyframes creatorCommonFragmentFloat {
              0% {
                transform: translate3d(0, 0, 0) rotate(0deg) scale(0.75);
                opacity: 0;
                filter: brightness(0.9);
              }
              20% {
                opacity: var(--particle-opacity, 0.55);
              }
              62% {
                transform: translate3d(calc(var(--particle-x) * 0.62), calc(var(--particle-y) * 0.7), 0) rotate(calc(var(--particle-rotate) * 0.55)) scale(1);
                opacity: 0.68;
                filter: brightness(1.2);
              }
              100% {
                transform: translate3d(var(--particle-x), var(--particle-y), 0) rotate(var(--particle-rotate)) scale(0.72);
                opacity: 0;
                filter: brightness(0.95);
              }
            }

            @keyframes creatorRareCircuitScan {
              0% {
                background-position: 0 0, 0 0, 0 0, 0 0;
                filter: brightness(0.95);
              }
              50% {
                filter: brightness(1.4);
              }
              100% {
                background-position: 58px 0, 0 -64px, 0 0, 0 0;
                filter: brightness(1);
              }
            }

            @keyframes creatorRarePulseBars {
              0%, 100% {
                transform: translateX(-18px);
                opacity: 0.24;
              }
              45% {
                transform: translateX(18px);
                opacity: 0.62;
              }
              65% {
                opacity: 0.36;
              }
            }

            @keyframes creatorRareCrossPulse {
              0%, 100% {
                opacity: 0.18;
                filter: brightness(1);
              }
              50% {
                opacity: 0.52;
                filter: brightness(1.55);
              }
            }

            @keyframes creatorRareDigitalPulse {
              0% {
                transform: translate3d(0, 0, 0) scaleX(0.6);
                opacity: 0;
                filter: brightness(1);
              }
              18% {
                opacity: 0.95;
              }
              52% {
                transform: translate3d(calc(var(--particle-x) * 0.48), calc(var(--particle-y) * 0.48), 0) scaleX(1.55);
                opacity: 1;
                filter: brightness(1.9);
              }
              100% {
                transform: translate3d(var(--particle-x), var(--particle-y), 0) scaleX(0.3);
                opacity: 0;
                filter: brightness(1.1);
              }
            }

            @keyframes creatorEpicStaticCharge {
              0%, 100% {
                background-position: 0 0, 0 0, 0 0, 0 0;
                opacity: 0.3;
              }
              34% {
                background-position: 8px -4px, -6px 6px, 0 0, 0 0;
                opacity: 0.48;
              }
              36% {
                opacity: 0.28;
              }
              62% {
                background-position: -10px 5px, 10px -5px, 0 0, 0 0;
                opacity: 0.42;
              }
            }

            @keyframes creatorEpicElectricFlicker {
              0%, 100% {
                opacity: 0.24;
                filter: brightness(0.98);
              }
              18% {
                opacity: 0.46;
                filter: brightness(1.32);
              }
              28% {
                opacity: 0.3;
              }
              52% {
                opacity: 0.52;
                filter: brightness(1.42);
              }
              68% {
                opacity: 0.26;
              }
            }

            @keyframes creatorEpicRuneSpark {
              0%, 100% {
                background-position: 0 0, 0 0, 0 0;
                opacity: 0.22;
              }
              45% {
                background-position: 18px -26px, 0 0, 0 0;
                opacity: 0.38;
              }
              52% {
                opacity: 0.28;
              }
            }

            @keyframes creatorEpicArcaneCharge {
              0% {
                transform: translate3d(0, 0, 0) rotate(0deg) scale(0.72);
                opacity: 0;
                filter: brightness(0.9);
              }
              18% {
                opacity: var(--particle-opacity, 0.62);
              }
              48% {
                transform: translate3d(calc(var(--particle-x) * 0.42), calc(var(--particle-y) * 0.46), 0) rotate(calc(var(--particle-rotate) * 0.42)) scale(1.04);
                opacity: 0.62;
                filter: brightness(1.38);
              }
              100% {
                transform: translate3d(var(--particle-x), var(--particle-y), 0) rotate(var(--particle-rotate)) scale(0.58);
                opacity: 0;
                filter: brightness(1);
              }
            }

            @keyframes creatorEpicElectricArc {
              0%, 8%, 100% {
                transform: translate3d(0, 0, 0) rotate(0deg) scaleX(0.45);
                opacity: 0;
                filter: brightness(1);
              }
              14% {
                opacity: var(--particle-opacity, 0.72);
                transform: translate3d(calc(var(--particle-x) * 0.12), calc(var(--particle-y) * 0.12), 0) rotate(calc(var(--particle-rotate) * 0.16)) scaleX(1.18);
                filter: brightness(2.05);
              }
              20% {
                opacity: 0.18;
              }
              32% {
                opacity: var(--particle-opacity, 0.68);
                transform: translate3d(calc(var(--particle-x) * 0.36), calc(var(--particle-y) * 0.3), 0) rotate(calc(var(--particle-rotate) * 0.42)) scaleX(1.32);
                filter: brightness(2.15);
              }
              44% {
                opacity: 0.12;
              }
              56% {
                opacity: var(--particle-opacity, 0.52);
                transform: translate3d(calc(var(--particle-x) * 0.62), calc(var(--particle-y) * 0.58), 0) rotate(calc(var(--particle-rotate) * 0.72)) scaleX(1);
                filter: brightness(1.85);
              }
              68%, 100% {
                transform: translate3d(var(--particle-x), var(--particle-y), 0) rotate(var(--particle-rotate)) scaleX(0.52);
                opacity: 0;
                filter: brightness(1);
              }
            }

            @keyframes creatorEpicVisibleLightning {
              0%, 18%, 100% {
                opacity: 0;
                filter: brightness(1) drop-shadow(0 0 4px rgba(167,243,208,0.25));
              }
              22% {
                opacity: 0.72;
                filter: brightness(1.8) drop-shadow(0 0 8px rgba(167,243,208,0.75));
              }
              26% {
                opacity: 0.18;
              }
              34% {
                opacity: 0.64;
                filter: brightness(1.95) drop-shadow(0 0 10px rgba(52,211,153,0.85));
              }
              42% {
                opacity: 0.08;
              }
              54% {
                opacity: 0.46;
                filter: brightness(1.55) drop-shadow(0 0 7px rgba(167,243,208,0.55));
              }
              62%, 100% {
                opacity: 0;
              }
            }

            @keyframes creatorLegendaryRays {
              0%, 100% {
                transform: rotate(-8deg) scale(1.1);
                opacity: 0.34;
              }
              50% {
                transform: rotate(8deg) scale(1.18);
                opacity: 0.64;
              }
            }

            @keyframes creatorLegendaryCelestialGlow {
              0%, 100% {
                opacity: 0.34;
                filter: brightness(1);
              }
              45% {
                opacity: 0.66;
                filter: brightness(1.35);
              }
              70% {
                opacity: 0.46;
                filter: brightness(1.12);
              }
            }

            @keyframes creatorLegendaryNobleFlare {
              0%, 42% {
                transform: translateX(-110%);
                opacity: 0;
              }
              56% {
                opacity: 0.5;
              }
              82%, 100% {
                transform: translateX(110%);
                opacity: 0;
              }
            }

            @keyframes creatorLegendarySolarRise {
              0% {
                transform: translate3d(0, 0, 0) rotate(0deg) scale(0.56);
                opacity: 0;
                filter: brightness(1);
              }
              14% {
                opacity: 0.95;
              }
              48% {
                transform: translate3d(calc(var(--particle-x) * 0.45), calc(var(--particle-y) * 0.5), 0) rotate(calc(var(--particle-rotate) * 0.45)) scale(1.35);
                opacity: 1;
                filter: brightness(1.9);
              }
              100% {
                transform: translate3d(var(--particle-x), var(--particle-y), 0) rotate(var(--particle-rotate)) scale(0.72);
                opacity: 0;
                filter: brightness(1.1);
              }
            }

            @keyframes creatorCardHolographicDrift {
              0%, 100% {
                transform: translate3d(-10%, -7%, 0) rotate(-4deg) scale(1.18);
                opacity: 0.12;
              }
              45% {
                transform: translate3d(8%, 5%, 0) rotate(4deg) scale(1.22);
                opacity: calc(0.08 + (0.05 * var(--rarity-intensity)));
              }
              72% {
                transform: translate3d(2%, -4%, 0) rotate(1deg) scale(1.2);
                opacity: 0.1;
              }
            }

            @keyframes creatorCardHoverShine {
              0%, 40% {
                transform: translateX(-120%);
              }
              75%, 100% {
                transform: translateX(120%);
              }
            }

            @media (prefers-reduced-motion: reduce) {
              .creator-effect-texture,
              .creator-effect-aura,
              .creator-effect-special,
              .creator-card-holographic,
              .creator-particle,
              .creator-effect-shine {
                animation: none !important;
              }
            }
          `}</style>
        </button>
      </TiltCard>
    </motion.div>
  );
}
