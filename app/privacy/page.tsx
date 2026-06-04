"use client";

import Link from "next/link";
import { GlowBackground } from "@/components/effects/GlowBackground";
import { ParticleBackground } from "@/components/effects/ParticleBackground";
import { useLanguage } from "@/contexts/LanguageContext";
import { translate } from "@/lib/i18n/translate";

export default function PrivacyPage() {
  const { t } = useLanguage();

  return (
    <main className="relative min-h-screen overflow-hidden bg-black px-6 py-16 text-white">
      <GlowBackground />
      <ParticleBackground />

      <section className="relative z-10 mx-auto max-w-4xl rounded-[32px] border border-cyan-300/15 bg-[#050812]/90 p-6 shadow-[0_0_60px_rgba(34,211,238,0.12)] backdrop-blur-xl sm:p-10">
        <Link
          href="/"
          className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-white/60 transition hover:border-cyan-300/30 hover:bg-cyan-300/10 hover:text-cyan-100"
        >
          ← {translate(t, "legalBackHome", "Voltar para o início")}
        </Link>

        <p className="mt-8 text-xs font-black uppercase tracking-[0.28em] text-cyan-200">
          {translate(t, "legalCardpocBadge", "Cardpoc")}
        </p>

        <h1 className="mt-4 bg-gradient-to-r from-white via-cyan-100 to-purple-200 bg-clip-text text-3xl font-black uppercase tracking-[0.12em] text-transparent sm:text-4xl">
          {translate(t, "privacyPageTitle", "Política de Privacidade")}
        </h1>

        <p className="mt-4 text-sm leading-7 text-white/60">
          {translate(t, "legalLastUpdated", "Última atualização: Junho de 2026")}
        </p>

        <div className="mt-8 space-y-6 text-sm leading-7 text-white/65">
          <p>{translate(t, "privacyPageIntro", "O Cardpoc é uma plataforma de reputação digital e perfis colecionáveis para criadores de conteúdo.")}</p>

          <section>
            <h2 className="text-lg font-black uppercase tracking-[0.12em] text-white">
              {translate(t, "privacyInformationTitle", "Informações que coletamos")}
            </h2>
            <p className="mt-2">
              {translate(t, "privacyInformationText", "Podemos coletar informações de conta, perfil, links sociais, coleção, XP, níveis e dados de uso da plataforma.")}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black uppercase tracking-[0.12em] text-white">
              {translate(t, "privacyConnectedServicesTitle", "Serviços conectados")}
            </h2>
            <p className="mt-2">
              {translate(t, "privacyConnectedServicesText", "O Cardpoc pode permitir que usuários e criadores conectem serviços de terceiros.")}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black uppercase tracking-[0.12em] text-white">
              {translate(t, "privacyUseTitle", "Como usamos as informações")}
            </h2>
            <p className="mt-2">
              {translate(t, "privacyUseText", "Usamos informações para operar perfis, exibir informações públicas, calcular estatísticas e manter contas seguras.")}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black uppercase tracking-[0.12em] text-white">
              {translate(t, "privacyPublicProfilesTitle", "Perfis públicos de criadores")}
            </h2>
            <p className="mt-2">
              {translate(t, "privacyPublicProfilesText", "Perfis de criadores podem exibir informações públicas fornecidas ou aprovadas na plataforma.")}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black uppercase tracking-[0.12em] text-white">
              {translate(t, "privacyRemovalTitle", "Remoção de dados")}
            </h2>
            <p className="mt-2">
              {translate(t, "privacyRemovalText", "Usuários e criadores podem solicitar remoção ou correção de seus dados pelos canais oficiais de suporte.")}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black uppercase tracking-[0.12em] text-white">
              {translate(t, "privacyContactTitle", "Contato")}
            </h2>
            <p className="mt-2">
              {translate(t, "privacyContactText", "Para dúvidas sobre privacidade, entre em contato com o Cardpoc pelo site oficial em www.cardpoc.com.")}
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
