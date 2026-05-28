"use client";

import { motion } from "framer-motion";

import { rarityStyles } from "@/lib/rarity";
import { Creator } from "@/types/creator";
import { TiltCard } from "./TiltCard";

type CreatorCardProps = {
  creator: Creator;
  onClick: (creator: Creator) => void;
};

export function CreatorCard({ creator, onClick }: CreatorCardProps) {
  const rarity = rarityStyles[creator.rarity];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <TiltCard>
        <button
          onClick={() => onClick(creator)}
          className={`group relative h-[420px] w-[280px] overflow-hidden rounded-[28px] border bg-black text-left shadow-[0_0_60px_rgba(0,0,0,0.8)] transition duration-500 hover:shadow-[0_0_80px_rgba(34,211,238,0.25)] ${rarity.border}`}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/95" />

          <div className="absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100">
            <div className="absolute inset-0 translate-x-[-120%] bg-[linear-gradient(115deg,transparent_20%,rgba(255,255,255,0.12)_40%,transparent_60%)] transition-transform duration-1000 group-hover:translate-x-[120%]" />
          </div>

          <div className="absolute inset-0 opacity-70 blur-2xl transition group-hover:opacity-100">
            <div
              className={`absolute -top-20 left-10 h-40 w-40 rounded-full ${rarity.glow}`}
            />
            <div
              className={`absolute bottom-0 right-0 h-44 w-44 rounded-full ${rarity.glow}`}
            />
          </div>

          <img
            src={creator.avatarUrl}
            alt={creator.nickname}
            className="absolute inset-0 h-full w-full object-cover opacity-80 transition duration-700 group-hover:scale-115"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />

          <div
            className={`absolute left-4 top-4 rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em] backdrop-blur ${rarity.badge}`}
          >
            {rarity.label}
          </div>

          <div className="absolute right-4 top-4 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100 backdrop-blur">
            Lv. {creator.level}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-5">
            <p className={`text-xs uppercase tracking-[0.3em] ${rarity.text}`}>
              {creator.category}
            </p>

            <h2 className="mt-2 text-2xl font-bold text-white">
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

              <span className="text-xs text-white/50">
                @{creator.username}
              </span>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-0 rounded-[28px] ring-1 ring-inset ring-white/20" />
        </button>
      </TiltCard>
    </motion.div>
  );
}