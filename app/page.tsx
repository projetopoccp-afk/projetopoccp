"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { GlowBackground } from "@/components/effects/GlowBackground";
import { ParticleBackground } from "@/components/effects/ParticleBackground";
import { CreatorGrid } from "@/components/home/CreatorGrid";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { LoadingScreen } from "@/components/loading/LoadingScreen";
import { useLanguage } from "@/contexts/LanguageContext";
import { translate } from "@/lib/i18n/translate";

export default function HomePage() {
  const [search, setSearch] = useState("");

  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [showCardpocGuide, setShowCardpocGuide] = useState(false);

  useEffect(() => {
    const hasSeenLoading = sessionStorage.getItem(
      "cardpoc-initial-loading"
    );

    if (!hasSeenLoading) {
      setLoading(true);

      const timer = setTimeout(() => {
        setLoading(false);
        sessionStorage.setItem(
          "cardpoc-initial-loading",
          "true"
        );
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <AnimatePresence>
        {loading && <LoadingScreen />}
      </AnimatePresence>

      <GlowBackground />
      <ParticleBackground />

      <SiteHeader
        search={search}
        onSearchChange={setSearch}
      />

      <section className="relative z-10 mx-auto flex max-w-7xl flex-col px-6 pt-10">
        <div className="mx-auto flex flex-col items-center text-center">
          <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 py-2 text-xs uppercase tracking-[0.3em] text-cyan-100 backdrop-blur">
            {translate(t, "homePageBadge", "Colecione Criadores")}
          </div>

          <h1 className="mt-5 bg-gradient-to-r from-white via-cyan-100 to-purple-200 bg-clip-text text-3xl font-black uppercase tracking-[0.22em] text-transparent sm:text-5xl">
            {translate(t, "homePageTitle", "Colecione Criadores")}
          </h1>

          <p className="mt-4 max-w-2xl text-sm font-medium text-white/55 sm:text-base">
            {translate(
              t,
              "homePageDescription",
              "Descubra criadores de conteúdo, acompanhe lives, clips e estatísticas, ganhe cartas digitais e complete sua coleção."
            )}
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
              {translate(t, "homePagePillarLives", "Lives")}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
              {translate(t, "homePagePillarClips", "Clips")}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
              {translate(t, "homePagePillarStats", "Estatísticas")}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
              {translate(t, "homePagePillarCards", "Cartas Digitais")}
            </span>
          </div>
        </div>
      </section>

      <CreatorGrid search={search} />

      <button
        type="button"
        onClick={() => setShowCardpocGuide(true)}
        className="fixed bottom-5 right-5 z-40 group flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/25 bg-black/70 text-cyan-100 shadow-[0_0_28px_rgba(34,211,238,0.18)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-purple-300/40 hover:text-white hover:shadow-[0_0_34px_rgba(168,85,247,0.25)]"
        aria-label={translate(t, "homePageGuideOpenAria", "Entender o Cardpoc")}
      >
        <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-400/10 via-transparent to-purple-500/10 opacity-80" />
        <span className="relative text-lg">◈</span>
        <span className="pointer-events-none absolute bottom-full right-0 mb-3 hidden whitespace-nowrap rounded-full border border-white/10 bg-black/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/70 shadow-2xl backdrop-blur-xl group-hover:block">
          {translate(t, "homePageGuideTooltip", "O que é o Cardpoc?")}
        </span>
      </button>

      {showCardpocGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label={translate(t, "homePageGuideTitle", "O que é o Cardpoc?")}
          onClick={() => setShowCardpocGuide(false)}
        >
          <div
            className="relative w-full max-w-lg overflow-hidden rounded-[32px] border border-cyan-300/20 bg-[#050812]/95 p-6 shadow-[0_0_60px_rgba(34,211,238,0.16)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="absolute -left-16 -top-16 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="absolute -bottom-20 -right-16 h-48 w-48 rounded-full bg-purple-500/20 blur-3xl" />

            <button
              type="button"
              onClick={() => setShowCardpocGuide(false)}
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 transition hover:border-cyan-300/30 hover:text-white"
              aria-label={translate(t, "close", "Fechar")}
            >
              ×
            </button>

            <div className="relative">
              <div className="mb-5 inline-flex items-center gap-3 rounded-full border border-cyan-300/15 bg-cyan-300/5 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-100">
                <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)]" />
                {translate(t, "homePageGuideBadge", "Guia rápido")}
              </div>

              <h2 className="text-2xl font-black uppercase tracking-[0.12em] text-white sm:text-3xl">
                {translate(t, "homePageGuideTitle", "O que é o Cardpoc?")}
              </h2>

              <p className="mt-3 text-sm leading-6 text-white/60">
                {translate(
                  t,
                  "homePageGuideDescription",
                  "Cardpoc é uma plataforma para descobrir, acompanhar e colecionar criadores de conteúdo através de cartas digitais."
                )}
              </p>

              <div className="mt-6 grid gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <p className="text-sm font-black uppercase tracking-[0.16em] text-cyan-100">
                    {translate(t, "homePageGuideDiscoverTitle", "Descubra")}
                  </p>
                  <p className="mt-1 text-sm text-white/55">
                    {translate(
                      t,
                      "homePageGuideDiscoverDescription",
                      "Encontre streamers, youtubers, tiktokers e criadores de diversas plataformas."
                    )}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <p className="text-sm font-black uppercase tracking-[0.16em] text-purple-100">
                    {translate(t, "homePageGuideCollectTitle", "Colecione")}
                  </p>
                  <p className="mt-1 text-sm text-white/55">
                    {translate(
                      t,
                      "homePageGuideCollectDescription",
                      "Ganhe cartas digitais, abra packs, siga criadores e complete sua coleção."
                    )}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <p className="text-sm font-black uppercase tracking-[0.16em] text-amber-100">
                    {translate(t, "homePageGuideFollowTitle", "Acompanhe")}
                  </p>
                  <p className="mt-1 text-sm text-white/55">
                    {translate(
                      t,
                      "homePageGuideFollowDescription",
                      "Veja lives, clips, estatísticas, redes sociais e evolução dos criadores em um só perfil."
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}