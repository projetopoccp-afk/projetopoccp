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
  | "flare";

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
    label: "Violeta arcano",
    className: "creator-card-epic",
    borderColor: "rgba(167, 139, 250, 0.76)",
    glowColor: "rgba(88, 28, 135, 0.44)",
    particleColor: "rgba(233, 213, 255, 0.98)",
    secondaryColor: "rgba(124, 58, 237, 0.76)",
    tertiaryColor: "rgba(236, 72, 153, 0.56)",
    textGlow: "rgba(196, 181, 253, 0.62)",
    particleShape: "rune",
    particleCount: 16,
    particleAnimation: "creatorEpicArcaneSpiral",
    backgroundEffect: "arcane-violet-runes",
    auraEffect: "irregular-spiral-mist",
    intensity: 0.72,
    particles: [
      { left: "12%", top: "74%", size: "10px", tx: "48px", ty: "-104px", rotate: "160deg", duration: 6.8, delay: 0, shape: "rune", opacity: 0.74 },
      { left: "20%", top: "26%", size: "4px", tx: "82px", ty: "-34px", rotate: "220deg", duration: 5.9, delay: -1.4, shape: "star", opacity: 0.68 },
      { left: "30%", top: "88%", size: "8px", tx: "38px", ty: "-132px", rotate: "-180deg", duration: 7.4, delay: -2.1, shape: "rune", opacity: 0.62 },
      { left: "46%", top: "30%", size: "6px", tx: "-54px", ty: "-52px", rotate: "260deg", duration: 6.1, delay: -3.2, shape: "star", opacity: 0.66 },
      { left: "58%", top: "76%", size: "10px", tx: "-34px", ty: "-120px", rotate: "-240deg", duration: 7.1, delay: -4.4, shape: "rune", opacity: 0.7 },
      { left: "76%", top: "22%", size: "8px", tx: "-80px", ty: "10px", rotate: "190deg", duration: 6.5, delay: -1.9, shape: "rune", opacity: 0.58 },
      { left: "88%", top: "58%", size: "4px", tx: "-96px", ty: "-72px", rotate: "-130deg", duration: 5.8, delay: -5.3, shape: "star", opacity: 0.7 },
      { left: "8%", top: "42%", size: "5px", tx: "74px", ty: "-26px", rotate: "90deg", duration: 6.3, delay: -2.7, shape: "star", opacity: 0.56 },
      { left: "38%", top: "14%", size: "9px", tx: "24px", ty: "54px", rotate: "-210deg", duration: 7.8, delay: -6.1, shape: "rune", opacity: 0.58 },
      { left: "66%", top: "46%", size: "4px", tx: "-70px", ty: "34px", rotate: "120deg", duration: 6.6, delay: -3.8, shape: "star", opacity: 0.62 },
      { left: "50%", top: "90%", size: "6px", tx: "12px", ty: "-118px", rotate: "300deg", duration: 7.2, delay: -7, shape: "rune", opacity: 0.46 },
      { left: "24%", top: "56%", size: "3px", tx: "58px", ty: "-62px", rotate: "-70deg", duration: 5.5, delay: -4.8, shape: "star", opacity: 0.66 },
      { left: "84%", top: "84%", size: "8px", tx: "-90px", ty: "-116px", rotate: "250deg", duration: 7.6, delay: -5.9, shape: "rune", opacity: 0.48 },
      { left: "54%", top: "18%", size: "3px", tx: "-28px", ty: "76px", rotate: "20deg", duration: 5.7, delay: -7.5, shape: "star", opacity: 0.56 },
      { left: "16%", top: "92%", size: "4px", tx: "88px", ty: "-138px", rotate: "140deg", duration: 6.9, delay: -8.2, shape: "star", opacity: 0.52 },
      { left: "72%", top: "70%", size: "7px", tx: "-72px", ty: "-98px", rotate: "-280deg", duration: 7.7, delay: -8.8, shape: "rune", opacity: 0.5 },
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
            className={`absolute left-4 top-4 z-20 rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em] backdrop-blur-md ${rarity.badge}`}
          >
            {getTranslatedRarityLabel(t, internalRarity)}
          </div>

          <div className="absolute right-4 top-4 z-20 rounded-full border border-white/20 bg-black/35 px-3 py-1 text-xs text-white/85 backdrop-blur-md">
            {translate(t, "creatorCardLevelPrefix", "Lv.")} {creator.level}
          </div>

          <div className="absolute bottom-0 left-0 right-0 z-20 p-4">
            <p
              className={`text-xs uppercase tracking-[0.3em] ${rarity.text}`}
              style={{
                textShadow: `0 0 10px var(--rarity-text-glow)`,
              }}
            >
              {creator.category}
            </p>

            <h2 className="mt-2 text-xl font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
              {creator.nickname}
            </h2>

            <p className="mt-2 line-clamp-2 text-sm text-white/78 drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
              {creator.bio}
            </p>

            <div className="mt-4 flex items-center justify-between">
              <span
                className={`rounded-full border px-3 py-1 text-xs backdrop-blur-md ${rarity.badge}`}
              >
                {creator.rank}
              </span>

              <span className="text-xs text-white/55 drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
                @{creator.username}
              </span>
            </div>
          </div>

          <div className="creator-card-frame pointer-events-none absolute inset-0 rounded-[24px]" />

          <style>{`
            .creator-card-shell {
              isolation: isolate;
              border-color: var(--rarity-border);
              box-shadow:
                inset 0 0 18px rgba(255, 255, 255, 0.035),
                inset 0 0 calc(18px + (22px * var(--rarity-intensity))) rgba(255, 255, 255, 0.025),
                0 12px 30px rgba(0, 0, 0, 0.62),
                0 0 calc(12px + (22px * var(--rarity-intensity))) var(--rarity-glow);
              transform: translateZ(0);
              backface-visibility: hidden;
            }

            .creator-card-shell:hover {
              box-shadow:
                inset 0 0 20px rgba(255, 255, 255, 0.045),
                inset 0 0 calc(20px + (28px * var(--rarity-intensity))) rgba(255, 255, 255, 0.03),
                0 16px 38px rgba(0, 0, 0, 0.66),
                0 0 calc(18px + (30px * var(--rarity-intensity))) var(--rarity-glow);
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

            .creator-particle-layer {
              z-index: 5;
              overflow: hidden;
            }

            .creator-effect-shine {
              z-index: 9;
              mix-blend-mode: screen;
              background:
                linear-gradient(112deg, transparent 18%, rgba(255,255,255,0.16) 42%, transparent 63%);
              transform: translateX(-120%);
              animation: creatorCardHoverShine 3s ease-in-out infinite;
            }

            .creator-card-readability {
              z-index: 10;
              pointer-events: none;
              background:
                linear-gradient(to top, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.62) 24%, rgba(0,0,0,0.12) 56%, rgba(0,0,0,0.04) 100%),
                linear-gradient(to right, rgba(0,0,0,0.14), transparent 28%, transparent 72%, rgba(0,0,0,0.1));
            }

            .creator-card-frame {
              z-index: 30;
              border: 1px solid var(--rarity-border);
              box-shadow:
                inset 0 0 0 1px rgba(255, 255, 255, 0.08),
                inset 0 0 calc(14px + (16px * var(--rarity-intensity))) var(--rarity-glow);
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
              animation-name: creatorEpicArcaneSpiral;
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
              animation-name: creatorEpicArcaneSpiral;
              animation-timing-function: ease-in-out;
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

            /* EPIC — violeta arcano, runas, névoa irregular e espiral quebrada */
            .creator-card-epic .creator-effect-texture {
              opacity: 0.5;
              background:
                radial-gradient(circle at 20% 76%, rgba(88,28,135,0.3), transparent 26%),
                radial-gradient(circle at 78% 24%, rgba(124,58,237,0.24), transparent 24%),
                radial-gradient(circle at 54% 58%, rgba(236,72,153,0.14), transparent 28%);
              filter: blur(8px);
              animation: creatorEpicMist 8.5s ease-in-out infinite;
            }

            .creator-card-epic .creator-effect-aura {
              opacity: 0.54;
              background:
                conic-gradient(from 40deg at 48% 54%, transparent 0 14%, rgba(167,139,250,0.28) 18%, transparent 25%, transparent 42%, rgba(236,72,153,0.18) 48%, transparent 57%, transparent 76%, rgba(124,58,237,0.22) 82%, transparent 90%),
                radial-gradient(ellipse at 50% 56%, transparent 0 44%, rgba(196,181,253,0.16) 46%, transparent 51%);
              transform: rotate(-18deg) scale(1.15);
              animation: creatorEpicIrregularSpiral 7.8s cubic-bezier(0.43, 0, 0.2, 1) infinite;
            }

            .creator-card-epic .creator-effect-special {
              opacity: 0.42;
              background-image:
                radial-gradient(circle, rgba(233,213,255,0.5) 0 1px, transparent 1.8px),
                linear-gradient(135deg, transparent 0 44%, rgba(167,139,250,0.16) 45%, transparent 48%);
              background-size: 42px 42px, 100% 100%;
              animation: creatorEpicStarDrift 11s ease-in-out infinite;
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

            @keyframes creatorEpicMist {
              0%, 100% {
                transform: scale(1.08) translate3d(-6px, 4px, 0);
                opacity: 0.34;
              }
              40% {
                transform: scale(1.18) translate3d(10px, -8px, 0);
                opacity: 0.56;
              }
              72% {
                transform: scale(1.12) translate3d(-2px, -12px, 0);
                opacity: 0.42;
              }
            }

            @keyframes creatorEpicIrregularSpiral {
              0% {
                transform: rotate(-18deg) scale(1.15);
                opacity: 0.28;
              }
              38% {
                transform: rotate(44deg) scale(1.2) translate3d(4px, -8px, 0);
                opacity: 0.62;
              }
              70% {
                transform: rotate(12deg) scale(1.1) translate3d(-8px, 4px, 0);
                opacity: 0.44;
              }
              100% {
                transform: rotate(78deg) scale(1.15);
                opacity: 0.3;
              }
            }

            @keyframes creatorEpicStarDrift {
              0%, 100% {
                background-position: 0 0, 0 0;
                opacity: 0.28;
              }
              50% {
                background-position: 28px -42px, 0 0;
                opacity: 0.5;
              }
            }

            @keyframes creatorEpicArcaneSpiral {
              0% {
                transform: translate3d(0, 0, 0) rotate(0deg) scale(0.62);
                opacity: 0;
                filter: brightness(0.9);
              }
              16% {
                opacity: 0.9;
              }
              54% {
                transform: translate3d(calc(var(--particle-x) * 0.5), calc(var(--particle-y) * 0.44), 0) rotate(calc(var(--particle-rotate) * 0.52)) scale(1.18);
                opacity: 0.78;
                filter: brightness(1.55);
              }
              100% {
                transform: translate3d(var(--particle-x), var(--particle-y), 0) rotate(var(--particle-rotate)) scale(0.5);
                opacity: 0;
                filter: brightness(1);
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
