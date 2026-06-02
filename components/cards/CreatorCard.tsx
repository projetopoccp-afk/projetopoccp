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

type InternalRarityEffect = {
  className: string;
  particles: string[];
  style: CSSProperties & {
    "--card-primary": string;
    "--card-secondary": string;
    "--card-soft": string;
    "--card-border": string;
    "--card-shadow": string;
  };
};

const INTERNAL_RARITY_EFFECTS: Record<CardRarity, InternalRarityEffect> = {
  common: {
    className: "creator-card-common",
    particles: [
      "left-[12%] top-[16%] h-1 w-1 opacity-40",
      "left-[72%] top-[22%] h-1 w-1 opacity-30",
      "left-[20%] top-[62%] h-1 w-1 opacity-35",
      "left-[82%] top-[72%] h-1 w-1 opacity-25",
      "left-[48%] top-[42%] h-[3px] w-[3px] opacity-30",
      "left-[34%] top-[84%] h-[3px] w-[3px] opacity-25",
    ],
    style: {
      "--card-primary": "rgba(148, 163, 184, 0.95)",
      "--card-secondary": "rgba(34, 211, 238, 0.42)",
      "--card-soft": "rgba(148, 163, 184, 0.14)",
      "--card-border": "rgba(148, 163, 184, 0.42)",
      "--card-shadow": "rgba(34, 211, 238, 0.16)",
    },
  },
  rare: {
    className: "creator-card-rare",
    particles: [
      "left-[10%] top-[18%] h-1 w-1 opacity-65",
      "left-[78%] top-[16%] h-1.5 w-1.5 opacity-55",
      "left-[26%] top-[38%] h-1 w-1 opacity-50",
      "left-[66%] top-[48%] h-1 w-1 opacity-60",
      "left-[18%] top-[78%] h-1.5 w-1.5 opacity-45",
      "left-[84%] top-[76%] h-1 w-1 opacity-55",
      "left-[46%] top-[66%] h-[3px] w-[3px] opacity-60",
    ],
    style: {
      "--card-primary": "rgba(125, 211, 252, 0.98)",
      "--card-secondary": "rgba(59, 130, 246, 0.58)",
      "--card-soft": "rgba(14, 165, 233, 0.18)",
      "--card-border": "rgba(125, 211, 252, 0.58)",
      "--card-shadow": "rgba(56, 189, 248, 0.26)",
    },
  },
  epic: {
    className: "creator-card-epic",
    particles: [
      "left-[14%] top-[14%] h-1.5 w-1.5 opacity-70",
      "left-[70%] top-[20%] h-1 w-1 opacity-65",
      "left-[88%] top-[42%] h-1.5 w-1.5 opacity-55",
      "left-[24%] top-[50%] h-1 w-1 opacity-70",
      "left-[54%] top-[62%] h-1.5 w-1.5 opacity-60",
      "left-[16%] top-[82%] h-1 w-1 opacity-65",
      "left-[78%] top-[82%] h-1 w-1 opacity-70",
      "left-[42%] top-[28%] h-[3px] w-[3px] opacity-60",
    ],
    style: {
      "--card-primary": "rgba(232, 121, 249, 0.98)",
      "--card-secondary": "rgba(168, 85, 247, 0.68)",
      "--card-soft": "rgba(217, 70, 239, 0.2)",
      "--card-border": "rgba(232, 121, 249, 0.64)",
      "--card-shadow": "rgba(217, 70, 239, 0.32)",
    },
  },
  legendary: {
    className: "creator-card-legendary",
    particles: [
      "left-[10%] top-[18%] h-1.5 w-1.5 opacity-75",
      "left-[34%] top-[14%] h-1 w-1 opacity-70",
      "left-[76%] top-[18%] h-1.5 w-1.5 opacity-80",
      "left-[18%] top-[44%] h-1 w-1 opacity-65",
      "left-[84%] top-[46%] h-1 w-1 opacity-70",
      "left-[30%] top-[70%] h-1.5 w-1.5 opacity-75",
      "left-[66%] top-[78%] h-1.5 w-1.5 opacity-85",
      "left-[48%] top-[34%] h-[3px] w-[3px] opacity-75",
      "left-[52%] top-[88%] h-1 w-1 opacity-65",
    ],
    style: {
      "--card-primary": "rgba(253, 224, 71, 0.98)",
      "--card-secondary": "rgba(245, 158, 11, 0.72)",
      "--card-soft": "rgba(251, 191, 36, 0.22)",
      "--card-border": "rgba(253, 224, 71, 0.72)",
      "--card-shadow": "rgba(251, 191, 36, 0.36)",
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
          className={`creator-card-shell ${effect.className} group relative h-[360px] w-[240px] overflow-hidden rounded-[24px] border bg-black text-left shadow-[0_0_60px_rgba(0,0,0,0.8)] transition duration-500 hover:shadow-[0_0_70px_var(--card-shadow)] ${rarity.border}`}
        >
          <div className="creator-card-rarity-bg absolute inset-0" />

          <div className="creator-card-energy absolute inset-0" />

          <div className="creator-card-particles pointer-events-none absolute inset-0">
            {effect.particles.map((particle, index) => (
              <span
                key={`${internalRarity}-particle-${index}`}
                className={`creator-card-particle absolute rounded-full ${particle}`}
                style={{
                  animationDelay: `${index * 0.45}s`,
                  animationDuration: `${4.5 + index * 0.35}s`,
                }}
              />
            ))}
          </div>

          <div className="creator-card-lines pointer-events-none absolute inset-0" />

          <img
            src={creator.avatarUrl}
            alt={creator.nickname}
            className="absolute inset-0 h-full w-full object-cover opacity-90 transition duration-700 group-hover:scale-105"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/28 to-black/10" />

          <div className="creator-card-holo pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100" />

          <div
            className={`absolute left-4 top-4 rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em] backdrop-blur ${rarity.badge}`}
          >
            {rarity.label}
          </div>

          <div className="absolute right-4 top-4 rounded-full border border-white/20 bg-black/35 px-3 py-1 text-xs text-white/85 backdrop-blur">
            Lv. {creator.level}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className={`text-xs uppercase tracking-[0.3em] ${rarity.text}`}>
              {creator.category}
            </p>

            <h2 className="mt-2 text-xl font-bold text-white">
              {creator.nickname}
            </h2>

            <p className="mt-2 line-clamp-2 text-sm text-white/70">
              {creator.bio}
            </p>

            <div className="mt-4 flex items-center justify-between">
              <span
                className={`rounded-full border px-3 py-1 text-xs ${rarity.badge}`}
              >
                {creator.rank}
              </span>

              <span className="text-xs text-white/50">@{creator.username}</span>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-0 rounded-[24px] ring-1 ring-inset ring-white/18" />

          <style>{`
            .creator-card-shell {
              isolation: isolate;
              border-color: var(--card-border);
              box-shadow:
                inset 0 0 24px rgba(255, 255, 255, 0.04),
                0 0 34px rgba(0, 0, 0, 0.8),
                0 0 28px var(--card-shadow);
            }

            .creator-card-rarity-bg {
              z-index: 0;
              opacity: 0.9;
              background:
                radial-gradient(circle at 20% 18%, var(--card-soft), transparent 34%),
                radial-gradient(circle at 82% 24%, var(--card-soft), transparent 30%),
                radial-gradient(circle at 50% 88%, var(--card-soft), transparent 42%),
                linear-gradient(145deg, rgba(255,255,255,0.08), transparent 38%, rgba(0,0,0,0.72));
            }

            .creator-card-energy {
              z-index: 1;
              opacity: 0.75;
              background:
                radial-gradient(circle at 50% 50%, transparent 0 48%, var(--card-soft) 49%, transparent 66%),
                conic-gradient(from 180deg at 50% 50%, transparent, var(--card-soft), transparent, var(--card-secondary), transparent);
              filter: blur(16px);
              transform: scale(1.2);
              animation: creatorCardEnergySpin 14s linear infinite;
            }

            .creator-card-particles {
              z-index: 3;
            }

            .creator-card-particle {
              background: var(--card-primary);
              box-shadow:
                0 0 8px var(--card-primary),
                0 0 18px var(--card-secondary);
              animation-name: creatorCardParticleFloat;
              animation-timing-function: ease-in-out;
              animation-iteration-count: infinite;
              transform: translate3d(0, 0, 0);
            }

            .creator-card-lines {
              z-index: 4;
              opacity: 0.36;
              background-image:
                linear-gradient(115deg, transparent 0%, transparent 38%, var(--card-soft) 45%, transparent 52%, transparent 100%),
                linear-gradient(75deg, transparent 0%, transparent 58%, var(--card-soft) 63%, transparent 70%, transparent 100%);
              background-size: 220% 220%;
              animation: creatorCardLines 7s ease-in-out infinite;
              mix-blend-mode: screen;
            }

            .creator-card-holo {
              z-index: 8;
              background:
                linear-gradient(115deg, transparent 18%, rgba(255,255,255,0.18) 42%, transparent 62%),
                radial-gradient(circle at 50% 0%, rgba(255,255,255,0.18), transparent 34%);
              transform: translateX(-115%);
              animation: creatorCardHolo 2.6s ease-in-out infinite;
              mix-blend-mode: screen;
            }

            .creator-card-common .creator-card-energy {
              opacity: 0.35;
              animation-duration: 22s;
            }

            .creator-card-common .creator-card-lines {
              opacity: 0.18;
            }

            .creator-card-rare .creator-card-rarity-bg {
              background:
                radial-gradient(circle at 16% 18%, rgba(125,211,252,0.22), transparent 34%),
                radial-gradient(circle at 80% 28%, rgba(59,130,246,0.18), transparent 32%),
                linear-gradient(145deg, rgba(14,165,233,0.12), transparent 42%, rgba(0,0,0,0.74));
            }

            .creator-card-epic .creator-card-rarity-bg {
              background:
                radial-gradient(circle at 18% 18%, rgba(232,121,249,0.24), transparent 34%),
                radial-gradient(circle at 78% 28%, rgba(168,85,247,0.22), transparent 34%),
                radial-gradient(circle at 50% 72%, rgba(236,72,153,0.16), transparent 38%),
                linear-gradient(145deg, rgba(217,70,239,0.12), transparent 42%, rgba(0,0,0,0.74));
            }

            .creator-card-legendary .creator-card-rarity-bg {
              background:
                radial-gradient(circle at 18% 18%, rgba(253,224,71,0.28), transparent 34%),
                radial-gradient(circle at 82% 30%, rgba(245,158,11,0.24), transparent 34%),
                radial-gradient(circle at 50% 80%, rgba(251,191,36,0.2), transparent 42%),
                linear-gradient(145deg, rgba(253,224,71,0.14), transparent 42%, rgba(0,0,0,0.72));
            }

            .creator-card-legendary .creator-card-energy,
            .creator-card-epic .creator-card-energy {
              opacity: 0.92;
            }

            @keyframes creatorCardEnergySpin {
              0% {
                transform: scale(1.2) rotate(0deg);
              }
              100% {
                transform: scale(1.2) rotate(360deg);
              }
            }

            @keyframes creatorCardParticleFloat {
              0%, 100% {
                transform: translate3d(0, 0, 0) scale(1);
                filter: brightness(1);
              }
              35% {
                transform: translate3d(14px, -22px, 0) scale(1.35);
                filter: brightness(1.35);
              }
              70% {
                transform: translate3d(-10px, -44px, 0) scale(0.85);
                filter: brightness(0.95);
              }
            }

            @keyframes creatorCardLines {
              0%, 100% {
                background-position: 0% 0%;
              }
              50% {
                background-position: 100% 100%;
              }
            }

            @keyframes creatorCardHolo {
              0%, 35% {
                transform: translateX(-120%);
              }
              70%, 100% {
                transform: translateX(120%);
              }
            }

            @media (prefers-reduced-motion: reduce) {
              .creator-card-energy,
              .creator-card-particle,
              .creator-card-lines,
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
