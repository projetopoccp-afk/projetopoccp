"use client";

import Link from "next/link";
import { GlowBackground } from "@/components/effects/GlowBackground";
import { ParticleBackground } from "@/components/effects/ParticleBackground";
import { useLanguage } from "@/contexts/LanguageContext";
import { translate } from "@/lib/i18n/translate";

export default function TermsPage() {
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
          {translate(t, "termsPageTitle", "Termos de Serviço")}
        </h1>

        <p className="mt-4 text-sm leading-7 text-white/60">
          {translate(t, "legalLastUpdated", "Última atualização: Junho de 2026")}
        </p>

        <div className="mt-8 space-y-6 text-sm leading-7 text-white/65">
          <p>{translate(t, "termsPageIntro", "Estes Termos de Serviço regem o uso do Cardpoc.")}</p>

          <section>
            <h2 className="text-lg font-black uppercase tracking-[0.12em] text-white">
              {translate(t, "termsPurposeTitle", "Objetivo da plataforma")}
            </h2>
            <p className="mt-2">
              {translate(t, "termsPurposeText", "O Cardpoc permite descobrir criadores, visualizar perfis, colecionar cartas digitais e interagir com recursos de reputação.")}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black uppercase tracking-[0.12em] text-white">
              {translate(t, "termsCreatorProfilesTitle", "Perfis de criadores")}
            </h2>
            <p className="mt-2">
              {translate(t, "termsCreatorProfilesText", "Perfis de criadores podem ser criados, editados, aprovados, rejeitados, reivindicados ou removidos conforme as regras do Cardpoc.")}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black uppercase tracking-[0.12em] text-white">
              {translate(t, "termsUserAccountsTitle", "Contas de usuário")}
            </h2>
            <p className="mt-2">
              {translate(t, "termsUserAccountsText", "Usuários são responsáveis por manter suas contas seguras e usar a plataforma de forma legal e respeitosa.")}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black uppercase tracking-[0.12em] text-white">
              {translate(t, "termsDigitalCardsTitle", "Cartas digitais e recompensas")}
            </h2>
            <p className="mt-2">
              {translate(t, "termsDigitalCardsText", "Cartas digitais, pacotes, XP, níveis e conquistas fazem parte da experiência Cardpoc e não representam valor financeiro garantido.")}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black uppercase tracking-[0.12em] text-white">
              {translate(t, "termsThirdPartyTitle", "Plataformas de terceiros")}
            </h2>
            <p className="mt-2">
              {translate(t, "termsThirdPartyText", "O Cardpoc pode exibir links, estatísticas ou informações de plataformas externas, que são regidas por seus próprios termos.")}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black uppercase tracking-[0.12em] text-white">
              {translate(t, "termsChangesTitle", "Alterações nestes termos")}
            </h2>
            <p className="mt-2">
              {translate(t, "termsChangesText", "O Cardpoc pode atualizar estes Termos de Serviço conforme a plataforma evolui.")}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black uppercase tracking-[0.12em] text-white">
              {translate(t, "termsContactTitle", "Contato")}
            </h2>
            <p className="mt-2">
              {translate(t, "termsContactText", "Para dúvidas sobre estes termos, entre em contato com o Cardpoc pelo site oficial em www.cardpoc.com.")}
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
