"use client";

import type { CSSProperties } from "react";
import { motion } from "framer-motion";

import { rarityStyles } from "@/lib/rarity";
import { Creator } from "@/types/creator";
import { TiltCard } from "./TiltCard";

type CreatorCardProps = {
  creator: Creator;
  onClick: (creator: Creator) => void;
};

type CardRarity = "common" | "rare" | "epic" | "legendary";

type Particle = {
  className: string;
  tx: string;
  ty: string;
  duration: number;
  delay: number;
};

type InternalRarityEffect = {
  className: string;
  particles: Particle[];
  style: CSSProperties & {
    "--card-primary": string;
    "--card-secondary": string;
    "--card-tertiary": string;
    "--card-soft": string;
    "--card-border": string;
    "--card-shadow": string;
    "--card-veil": string;
  };
};

const COMMON_PARTICLES: Particle[] = [
  { className: "left-[8%] top-[18%] h-[3px] w-[3px]", tx: "34px", ty: "-72px", duration: 7.8, delay: 0 },
  { className: "left-[22%] top-[72%] h-1 w-1", tx: "42px", ty: "-94px", duration: 8.4, delay: -1.4 },
  { className: "left-[42%] top-[32%] h-[3px] w-[3px]", tx: "-28px", ty: "-80px", duration: 7.2, delay: -2.1 },
  { className: "left-[64%] top-[82%] h-[3px] w-[3px]", tx: "-34px", ty: "-96px", duration: 8.8, delay: -3 },
  { className: "left-[82%] top-[40%] h-1 w-1", tx: "-48px", ty: "-78px", duration: 7.6, delay: -0.8 },
  { className: "left-[54%] top-[56%] h-[2px] w-[2px]", tx: "24px", ty: "-64px", duration: 6.8, delay: -4.2 },
  { className: "left-[14%] top-[88%] h-[2px] w-[2px]", tx: "58px", ty: "-110px", duration: 9.2, delay: -2.8 },
  { className: "left-[76%] top-[20%] h-[2px] w-[2px]", tx: "-30px", ty: "-68px", duration: 7.1, delay: -5 },
];

const RARE_PARTICLES: Particle[] = [
  { className: "left-[8%] top-[76%] h-1 w-1", tx: "48px", ty: "-122px", duration: 6.6, delay: 0 },
  { className: "left-[18%] top-[34%] h-[3px] w-[3px]", tx: "64px", ty: "-88px", duration: 7.1, delay: -1 },
  { className: "left-[28%] top-[88%] h-1.5 w-1.5", tx: "38px", ty: "-132px", duration: 7.4, delay: -2.4 },
  { className: "left-[44%] top-[46%] h-[3px] w-[3px]", tx: "-30px", ty: "-104px", duration: 6.4, delay: -3.1 },
  { className: "left-[62%] top-[82%] h-1 w-1", tx: "-54px", ty: "-118px", duration: 7.8, delay: -1.8 },
  { className: "left-[78%] top-[28%] h-1.5 w-1.5", tx: "-42px", ty: "-92px", duration: 6.9, delay: -4 },
  { className: "left-[88%] top-[66%] h-[3px] w-[3px]", tx: "-76px", ty: "-112px", duration: 7.6, delay: -5.2 },
  { className: "left-[52%] top-[18%] h-[2px] w-[2px]", tx: "22px", ty: "-78px", duration: 6.2, delay: -2.8 },
  { className: "left-[34%] top-[20%] h-[2px] w-[2px]", tx: "40px", ty: "-70px", duration: 7.2, delay: -6 },
  { className: "left-[70%] top-[54%] h-[2px] w-[2px]", tx: "-28px", ty: "-90px", duration: 6.7, delay: -3.8 },
];

const EPIC_PARTICLES: Particle[] = [
  { className: "left-[6%] top-[80%] h-1.5 w-1.5", tx: "74px", ty: "-146px", duration: 5.8, delay: 0 },
  { className: "left-[14%] top-[28%] h-1 w-1", tx: "62px", ty: "-100px", duration: 6.4, delay: -1.2 },
  { className: "left-[24%] top-[90%] h-1 w-1", tx: "44px", ty: "-150px", duration: 6.9, delay: -2.4 },
  { className: "left-[34%] top-[42%] h-[3px] w-[3px]", tx: "-40px", ty: "-116px", duration: 5.9, delay: -3.1 },
  { className: "left-[48%] top-[70%] h-1.5 w-1.5", tx: "42px", ty: "-132px", duration: 6.6, delay: -4 },
  { className: "left-[62%] top-[18%] h-[3px] w-[3px]", tx: "-48px", ty: "-86px", duration: 5.6, delay: -1.8 },
  { className: "left-[76%] top-[84%] h-1 w-1", tx: "-72px", ty: "-142px", duration: 6.8, delay: -5.1 },
  { className: "left-[88%] top-[48%] h-1.5 w-1.5", tx: "-82px", ty: "-112px", duration: 6.1, delay: -2.9 },
  { className: "left-[18%] top-[56%] h-[2px] w-[2px]", tx: "78px", ty: "-92px", duration: 5.4, delay: -4.8 },
  { className: "left-[54%] top-[36%] h-[2px] w-[2px]", tx: "-24px", ty: "-118px", duration: 6.2, delay: -6 },
  { className: "left-[82%] top-[20%] h-[2px] w-[2px]", tx: "-56px", ty: "-84px", duration: 5.7, delay: -3.6 },
  { className: "left-[40%] top-[12%] h-[2px] w-[2px]", tx: "28px", ty: "-72px", duration: 6.5, delay: -5.8 },
];

const LEGENDARY_PARTICLES: Particle[] = [
  { className: "left-[6%] top-[76%] h-1.5 w-1.5", tx: "84px", ty: "-150px", duration: 5.2, delay: 0 },
  { className: "left-[12%] top-[24%] h-1 w-1", tx: "76px", ty: "-96px", duration: 5.8, delay: -1 },
  { className: "left-[20%] top-[88%] h-1.5 w-1.5", tx: "64px", ty: "-160px", duration: 6.1, delay: -2.2 },
  { className: "left-[30%] top-[44%] h-[3px] w-[3px]", tx: "48px", ty: "-124px", duration: 5.4, delay: -3.1 },
  { className: "left-[42%] top-[84%] h-1 w-1", tx: "28px", ty: "-146px", duration: 5.9, delay: -4.4 },
  { className: "left-[54%] top-[18%] h-1.5 w-1.5", tx: "-30px", ty: "-94px", duration: 5.1, delay: -1.7 },
  { className: "left-[66%] top-[72%] h-1 w-1", tx: "-54px", ty: "-136px", duration: 6.2, delay: -2.9 },
  { className: "left-[78%] top-[34%] h-1.5 w-1.5", tx: "-74px", ty: "-110px", duration: 5.6, delay: -4.9 },
  { className: "left-[90%] top-[66%] h-1 w-1", tx: "-92px", ty: "-138px", duration: 6.4, delay: -3.8 },
  { className: "left-[24%] top-[14%] h-[2px] w-[2px]", tx: "50px", ty: "-76px", duration: 5.7, delay: -5.6 },
  { className: "left-[46%] top-[54%] h-[2px] w-[2px]", tx: "32px", ty: "-122px", duration: 5.3, delay: -6.2 },
  { className: "left-[72%] top-[90%] h-[2px] w-[2px]", tx: "-68px", ty: "-156px", duration: 6.6, delay: -5 },
  { className: "left-[86%] top-[18%] h-[2px] w-[2px]", tx: "-52px", ty: "-80px", duration: 5.5, delay: -6.7 },
  { className: "left-[36%] top-[26%] h-[2px] w-[2px]", tx: "28px", ty: "-104px", duration: 6, delay: -7.1 },
];

const INTERNAL_RARITY_EFFECTS: Record<CardRarity, InternalRarityEffect> = {
  common: {
    className: "creator-card-common",
    particles: COMMON_PARTICLES,
    style: {
      "--card-primary": "rgba(203, 213, 225, 0.96)",
      "--card-secondary": "rgba(34, 211, 238, 0.42)",
      "--card-tertiary": "rgba(148, 163, 184, 0.55)",
      "--card-soft": "rgba(148, 163, 184, 0.12)",
      "--card-border": "rgba(203, 213, 225, 0.38)",
      "--card-shadow": "rgba(34, 211, 238, 0.13)",
      "--card-veil": "rgba(15, 23, 42, 0.2)",
    },
  },
  rare: {
    className: "creator-card-rare",
    particles: RARE_PARTICLES,
    style: {
      "--card-primary": "rgba(125, 211, 252, 0.98)",
      "--card-secondary": "rgba(59, 130, 246, 0.72)",
      "--card-tertiary": "rgba(34, 211, 238, 0.62)",
      "--card-soft": "rgba(14, 165, 233, 0.16)",
      "--card-border": "rgba(125, 211, 252, 0.55)",
      "--card-shadow": "rgba(56, 189, 248, 0.24)",
      "--card-veil": "rgba(8, 47, 73, 0.14)",
    },
  },
  epic: {
    className: "creator-card-epic",
    particles: EPIC_PARTICLES,
    style: {
      "--card-primary": "rgba(250, 232, 255, 0.98)",
      "--card-secondary": "rgba(217, 70, 239, 0.82)",
      "--card-tertiary": "rgba(96, 165, 250, 0.58)",
      "--card-soft": "rgba(168, 85, 247, 0.18)",
      "--card-border": "rgba(232, 121, 249, 0.64)",
      "--card-shadow": "rgba(217, 70, 239, 0.3)",
      "--card-veil": "rgba(88, 28, 135, 0.12)",
    },
  },
  legendary: {
    className: "creator-card-legendary",
    particles: LEGENDARY_PARTICLES,
    style: {
      "--card-primary": "rgba(255, 251, 235, 0.98)",
      "--card-secondary": "rgba(251, 191, 36, 0.88)",
      "--card-tertiary": "rgba(45, 212, 191, 0.48)",
      "--card-soft": "rgba(245, 158, 11, 0.18)",
      "--card-border": "rgba(253, 224, 71, 0.7)",
      "--card-shadow": "rgba(251, 191, 36, 0.34)",
      "--card-veil": "rgba(120, 53, 15, 0.13)",
    },
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

export function CreatorCard({ creator, onClick }: CreatorCardProps) {
  const rarity = rarityStyles[creator.rarity];
  const internalRarity = normalizeRarity(creator.rarity);
  const effect = INTERNAL_RARITY_EFFECTS[internalRarity];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <TiltCard>
        <button
          onClick={() => onClick(creator)}
          style={effect.style}
          className={`creator-card-shell ${effect.className} group relative h-[360px] w-[240px] overflow-hidden rounded-[24px] border bg-black text-left transition duration-500 ${rarity.border}`}
        >
          <img
            src={creator.avatarUrl}
            alt={creator.nickname}
            className="creator-card-image absolute inset-0 h-full w-full object-cover opacity-95 transition duration-700 group-hover:scale-[1.035]"
          />

          <div className="creator-card-color-grade absolute inset-0" />
          <div className="creator-card-nebula absolute inset-0" />
          <div className="creator-card-orbit creator-card-orbit-a absolute inset-0" />
          <div className="creator-card-orbit creator-card-orbit-b absolute inset-0" />

          <div className="creator-card-particles pointer-events-none absolute inset-0">
            {effect.particles.map((particle, index) => (
              <span
                key={`${internalRarity}-particle-${index}`}
                className={`creator-card-particle absolute rounded-full ${particle.className}`}
                style={
                  {
                    "--particle-x": particle.tx,
                    "--particle-y": particle.ty,
                    animationDelay: `${particle.delay}s`,
                    animationDuration: `${particle.duration}s`,
                  } as CSSProperties
                }
              />
            ))}
          </div>

          <div className="creator-card-sparks pointer-events-none absolute inset-0" />
          <div className="creator-card-holo pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100" />
          <div className="creator-card-readability absolute inset-0" />

          <div
            className={`absolute left-4 top-4 z-20 rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em] backdrop-blur-md ${rarity.badge}`}
          >
            {rarity.label}
          </div>

          <div className="absolute right-4 top-4 z-20 rounded-full border border-white/20 bg-black/35 px-3 py-1 text-xs text-white/85 backdrop-blur-md">
            Lv. {creator.level}
          </div>

          <div className="absolute bottom-0 left-0 right-0 z-20 p-4">
            <p className={`text-xs uppercase tracking-[0.3em] ${rarity.text}`}>
              {creator.category}
            </p>

            <h2 className="mt-2 text-xl font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              {creator.nickname}
            </h2>

            <p className="mt-2 line-clamp-2 text-sm text-white/76 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              {creator.bio}
            </p>

            <div className="mt-4 flex items-center justify-between">
              <span
                className={`rounded-full border px-3 py-1 text-xs backdrop-blur-md ${rarity.badge}`}
              >
                {creator.rank}
              </span>

              <span className="text-xs text-white/55 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                @{creator.username}
              </span>
            </div>
          </div>

          <div className="creator-card-frame pointer-events-none absolute inset-0 rounded-[24px]" />

          <style>{`
            .creator-card-shell {
              isolation: isolate;
              border-color: var(--card-border);
              box-shadow:
                inset 0 0 20px rgba(255, 255, 255, 0.045),
                inset 0 0 42px var(--card-veil),
                0 14px 34px rgba(0, 0, 0, 0.62),
                0 0 18px var(--card-shadow);
              transform: translateZ(0);
              backface-visibility: hidden;
            }

            .creator-card-shell:hover {
              box-shadow:
                inset 0 0 22px rgba(255, 255, 255, 0.055),
                inset 0 0 48px var(--card-veil),
                0 18px 42px rgba(0, 0, 0, 0.66),
                0 0 28px var(--card-shadow);
            }

            .creator-card-image {
              z-index: 0;
              filter: contrast(1.08) saturate(1.08) brightness(0.98);
            }

            .creator-card-color-grade {
              z-index: 1;
              background:
                radial-gradient(circle at 50% 34%, transparent 0 28%, rgba(0, 0, 0, 0.08) 42%, rgba(0, 0, 0, 0.22) 72%),
                linear-gradient(to bottom, rgba(0,0,0,0.08), transparent 28%, rgba(0,0,0,0.3) 74%, rgba(0,0,0,0.9));
            }

            .creator-card-nebula {
              z-index: 2;
              opacity: 0.72;
              background:
                radial-gradient(circle at 18% 26%, var(--card-soft), transparent 30%),
                radial-gradient(circle at 82% 30%, color-mix(in srgb, var(--card-secondary), transparent 34%), transparent 32%),
                radial-gradient(circle at 48% 74%, color-mix(in srgb, var(--card-primary), transparent 84%), transparent 42%),
                conic-gradient(from 210deg at 50% 50%, transparent, color-mix(in srgb, var(--card-secondary), transparent 70%), transparent, color-mix(in srgb, var(--card-tertiary), transparent 74%), transparent);
              filter: blur(11px);
              mix-blend-mode: screen;
              transform: scale(1.16);
              animation: creatorCardNebula 12s ease-in-out infinite;
            }

            .creator-card-orbit {
              z-index: 3;
              opacity: 0.44;
              border-radius: inherit;
              mix-blend-mode: screen;
              filter: blur(0.1px);
            }

            .creator-card-orbit-a {
              background:
                radial-gradient(ellipse at 50% 45%, transparent 0 46%, color-mix(in srgb, var(--card-secondary), transparent 28%) 47%, transparent 50%),
                radial-gradient(ellipse at 46% 52%, transparent 0 55%, color-mix(in srgb, var(--card-primary), transparent 52%) 56%, transparent 58%);
              transform: rotate(-18deg) scale(1.12);
              animation: creatorCardOrbitA 9s ease-in-out infinite;
            }

            .creator-card-orbit-b {
              opacity: 0.28;
              background:
                radial-gradient(ellipse at 50% 54%, transparent 0 52%, color-mix(in srgb, var(--card-tertiary), transparent 40%) 53%, transparent 56%);
              transform: rotate(24deg) scale(1.18);
              animation: creatorCardOrbitB 11s ease-in-out infinite;
            }

            .creator-card-particles {
              z-index: 5;
              overflow: hidden;
              border-radius: inherit;
              mix-blend-mode: screen;
            }

            .creator-card-particle {
              background: var(--card-primary);
              box-shadow:
                0 0 6px var(--card-primary),
                0 0 14px var(--card-secondary),
                0 0 26px var(--card-shadow);
              animation-name: creatorCardParticleDrift;
              animation-timing-function: ease-in-out;
              animation-iteration-count: infinite;
              transform: translate3d(0, 0, 0);
              will-change: transform, opacity, filter;
            }

            .creator-card-sparks {
              z-index: 6;
              opacity: 0.45;
              background-image:
                radial-gradient(circle, var(--card-primary) 0 1px, transparent 1.6px),
                radial-gradient(circle, var(--card-secondary) 0 1px, transparent 1.5px);
              background-size: 42px 54px, 64px 78px;
              background-position: 0 0, 18px 24px;
              animation: creatorCardSparkField 10s linear infinite;
              mix-blend-mode: screen;
            }

            .creator-card-holo {
              z-index: 9;
              background:
                linear-gradient(115deg, transparent 18%, rgba(255,255,255,0.18) 42%, transparent 62%),
                radial-gradient(circle at 50% 0%, rgba(255,255,255,0.16), transparent 34%);
              transform: translateX(-120%);
              animation: creatorCardHolo 2.9s ease-in-out infinite;
              mix-blend-mode: screen;
            }

            .creator-card-readability {
              z-index: 10;
              background:
                linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.54) 26%, rgba(0,0,0,0.14) 58%, rgba(0,0,0,0.08) 100%),
                linear-gradient(to right, rgba(0,0,0,0.18), transparent 28%, transparent 72%, rgba(0,0,0,0.14));
            }

            .creator-card-frame {
              z-index: 30;
              border: 1px solid var(--card-border);
              box-shadow:
                inset 0 0 0 1px rgba(255, 255, 255, 0.08),
                inset 0 0 26px color-mix(in srgb, var(--card-shadow), transparent 58%);
            }

            .creator-card-common .creator-card-nebula {
              opacity: 0.34;
              animation-duration: 18s;
            }

            .creator-card-common .creator-card-orbit {
              opacity: 0.16;
            }

            .creator-card-common .creator-card-sparks {
              opacity: 0.2;
            }

            .creator-card-rare .creator-card-nebula {
              opacity: 0.58;
            }

            .creator-card-epic .creator-card-nebula {
              opacity: 0.72;
            }

            .creator-card-legendary .creator-card-nebula {
              opacity: 0.78;
            }

            .creator-card-legendary .creator-card-sparks {
              opacity: 0.58;
              background-size: 34px 46px, 52px 66px;
            }

            @keyframes creatorCardNebula {
              0%, 100% {
                transform: scale(1.16) rotate(0deg);
                opacity: 0.56;
              }
              45% {
                transform: scale(1.23) rotate(14deg);
                opacity: 0.82;
              }
              72% {
                transform: scale(1.18) rotate(-9deg);
                opacity: 0.68;
              }
            }

            @keyframes creatorCardOrbitA {
              0%, 100% {
                transform: rotate(-18deg) scale(1.12) translate3d(0, 0, 0);
                opacity: 0.28;
              }
              50% {
                transform: rotate(-8deg) scale(1.18) translate3d(4px, -6px, 0);
                opacity: 0.62;
              }
            }

            @keyframes creatorCardOrbitB {
              0%, 100% {
                transform: rotate(24deg) scale(1.18) translate3d(0, 0, 0);
                opacity: 0.18;
              }
              50% {
                transform: rotate(38deg) scale(1.24) translate3d(-5px, 6px, 0);
                opacity: 0.42;
              }
            }

            @keyframes creatorCardParticleDrift {
              0% {
                transform: translate3d(0, 0, 0) scale(0.72);
                opacity: 0;
                filter: brightness(0.9);
              }
              12% {
                opacity: 0.95;
              }
              54% {
                transform: translate3d(calc(var(--particle-x) * 0.55), calc(var(--particle-y) * 0.62), 0) scale(1.22);
                opacity: 1;
                filter: brightness(1.45);
              }
              100% {
                transform: translate3d(var(--particle-x), var(--particle-y), 0) scale(0.68);
                opacity: 0;
                filter: brightness(0.95);
              }
            }

            @keyframes creatorCardSparkField {
              0% {
                background-position: 0 0, 18px 24px;
              }
              100% {
                background-position: 42px -54px, 82px -54px;
              }
            }

            @keyframes creatorCardHolo {
              0%, 38% {
                transform: translateX(-120%);
              }
              72%, 100% {
                transform: translateX(120%);
              }
            }

            @supports not (color: color-mix(in srgb, white, transparent)) {
              .creator-card-nebula {
                background:
                  radial-gradient(circle at 18% 26%, var(--card-soft), transparent 30%),
                  radial-gradient(circle at 82% 30%, var(--card-secondary), transparent 32%),
                  radial-gradient(circle at 48% 74%, var(--card-soft), transparent 42%);
              }

              .creator-card-orbit-a {
                background:
                  radial-gradient(ellipse at 50% 45%, transparent 0 46%, var(--card-secondary) 47%, transparent 50%),
                  radial-gradient(ellipse at 46% 52%, transparent 0 55%, var(--card-soft) 56%, transparent 58%);
              }

              .creator-card-orbit-b {
                background:
                  radial-gradient(ellipse at 50% 54%, transparent 0 52%, var(--card-tertiary) 53%, transparent 56%);
              }

              .creator-card-frame {
                box-shadow:
                  inset 0 0 0 1px rgba(255, 255, 255, 0.08),
                  inset 0 0 26px var(--card-shadow);
              }
            }

            @media (prefers-reduced-motion: reduce) {
              .creator-card-nebula,
              .creator-card-orbit-a,
              .creator-card-orbit-b,
              .creator-card-particle,
              .creator-card-sparks,
              .creator-card-holo {
                animation: none;
              }
            }
          `}</style>
        </button>
      </TiltCard>
    </motion.div>
  );
}
