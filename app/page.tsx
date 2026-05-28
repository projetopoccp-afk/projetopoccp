"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";

import { GlowBackground } from "@/components/effects/GlowBackground";
import { ParticleBackground } from "@/components/effects/ParticleBackground";
import { CreatorGrid } from "@/components/home/CreatorGrid";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { LoadingScreen } from "@/components/loading/LoadingScreen";

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <AnimatePresence>{loading && <LoadingScreen />}</AnimatePresence>

      <GlowBackground />
      <ParticleBackground />

      <SiteHeader search={search} onSearchChange={setSearch} />

      <section className="relative z-10 mx-auto flex max-w-7xl flex-col px-6 pt-10">
        <div className="mx-auto flex flex-col items-center text-center">
          <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 py-2 text-xs uppercase tracking-[0.3em] text-cyan-100 backdrop-blur">
            Digital Reputation Platform
          </div>

          <p className="mt-4 max-w-xl text-sm text-white/50">
            Discover legendary creators through living digital cards.
          </p>
        </div>
      </section>

      <CreatorGrid search={search} />
    </main>
  );
}