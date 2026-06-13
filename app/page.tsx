"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { GlowBackground } from "@/components/effects/GlowBackground";
import { ParticleBackground } from "@/components/effects/ParticleBackground";
import { CreatorGrid } from "@/components/home/CreatorGrid";
import { LoadingScreen } from "@/components/loading/LoadingScreen";
import { CardpocModalShell } from "@/components/ui/CardpocModalShell";
import { useLanguage } from "@/contexts/LanguageContext";
import { translate } from "@/lib/i18n/translate";
import { supabase } from "@/lib/supabase/client";

type FaqArticle = {
  id: string;
  title: string;
  content: string;
  sort_order?: number | null;
  isCustom?: boolean;
};

export default function HomePage() {
  const [search, setSearch] = useState("");

  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [showCardpocGuide, setShowCardpocGuide] = useState(false);
  const [hasSeenCardpocGuide, setHasSeenCardpocGuide] = useState(false);
  const [guideSearch, setGuideSearch] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [customFaqArticles, setCustomFaqArticles] = useState<FaqArticle[]>([]);
  const [newFaqTitle, setNewFaqTitle] = useState("");
  const [newFaqContent, setNewFaqContent] = useState("");
  const [savingFaq, setSavingFaq] = useState(false);
  const [faqFeedback, setFaqFeedback] = useState("");

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

  useEffect(() => {
    setHasSeenCardpocGuide(localStorage.getItem("cardpoc-help-seen") === "true");
  }, []);

  function openCardpocGuide() {
    localStorage.setItem("cardpoc-help-seen", "true");
    setHasSeenCardpocGuide(true);
    setShowCardpocGuide(true);
  }


  useEffect(() => {
    function handleCreatorSearch(event: Event) {
      const customEvent = event as CustomEvent<{ value?: string }>;
      setSearch(customEvent.detail?.value ?? "");
    }

    window.addEventListener("cardpoc:creator-search", handleCreatorSearch);

    return () => {
      window.removeEventListener("cardpoc:creator-search", handleCreatorSearch);
    };
  }, []);


  useEffect(() => {
    let mounted = true;

    async function loadGuideData() {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;

      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .maybeSingle();

        if (mounted) {
          setIsAdmin(Boolean(profileData?.is_admin));
        }
      }

      const { data: faqData, error: faqError } = await supabase
        .from("faq_articles")
        .select("id,title,content,sort_order,is_active")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (!mounted || faqError) return;

      setCustomFaqArticles(
        (faqData ?? []).map((article) => ({
          id: article.id,
          title: article.title,
          content: article.content,
          sort_order: article.sort_order,
          isCustom: true,
        }))
      );
    }

    loadGuideData();

    return () => {
      mounted = false;
    };
  }, []);

  const defaultFaqArticles = useMemo<FaqArticle[]>(
    () => [
      {
        id: "what-is-cardpoc",
        title: translate(t, "homePageFaqWhatIsTitle", "O que é o Cardpoc?"),
        content: translate(
          t,
          "homePageFaqWhatIsContent",
          "Cardpoc é uma plataforma para descobrir, acompanhar e colecionar criadores de conteúdo através de cartas digitais. Cada criador funciona como um perfil vivo, com estatísticas, redes sociais, clips, cartas e evolução."
        ),
      },
      {
        id: "profiles",
        title: translate(t, "homePageFaqProfilesTitle", "O que são perfis de criadores?"),
        content: translate(
          t,
          "homePageFaqProfilesContent",
          "Perfis de criadores reúnem informações públicas como bio, links sociais, clips, lives, seguidores globais, cartas e histórico dentro do Cardpoc. Alguns perfis ainda podem estar sem dono até serem reivindicados ou aprovados."
        ),
      },
      {
        id: "get-profile",
        title: translate(t, "homePageFaqGetProfileTitle", "Como faço para ter um perfil?"),
        content: translate(
          t,
          "homePageFaqGetProfileContent",
          "Criadores podem solicitar um perfil ou reivindicar um perfil já existente. A equipe Cardpoc analisa a solicitação para evitar perfis falsos, dados incorretos ou uso indevido de imagem."
        ),
      },
      {
        id: "first-card",
        title: translate(t, "homePageFaqFirstCardTitle", "Como consigo uma carta comum?"),
        content: translate(
          t,
          "homePageFaqFirstCardContent",
          "A forma mais simples de conquistar uma carta comum é seguir um criador dentro do Cardpoc quando essa recompensa estiver disponível. Cartas comuns são a entrada da coleção e ajudam você a começar seu álbum de criadores."
        ),
      },
      {
        id: "cards-packs",
        title: translate(t, "homePageFaqCardsPacksTitle", "Como consigo cartas e pacotes?"),
        content: translate(
          t,
          "homePageFaqCardsPacksContent",
          "Você pode ganhar cartas e pacotes através de ações da plataforma, missões, eventos, recompensas, distribuições administrativas e futuras campanhas. Pacotes podem revelar cartas de diferentes raridades."
        ),
      },
      {
        id: "rarities",
        title: translate(t, "homePageFaqRaritiesTitle", "Como funcionam as raridades?"),
        content: translate(
          t,
          "homePageFaqRaritiesContent",
          "As cartas podem ser comuns, raras, épicas, lendárias ou míticas. Raridades maiores são mais especiais, podem ter visuais mais fortes e normalmente dependem de pacotes, eventos, recompensas ou distribuições específicas."
        ),
      },
      {
        id: "xp-levels",
        title: translate(t, "homePageFaqXpLevelsTitle", "Como ganho XP e subo de nível?"),
        content: translate(
          t,
          "homePageFaqXpLevelsContent",
          "XP pode ser ganho ao interagir com o Cardpoc, seguir criadores, conquistar cartas, abrir pacotes, completar missões e participar de ações futuras. O nível mostra sua evolução como colecionador dentro da plataforma."
        ),
      },
      {
        id: "login-needed",
        title: translate(t, "homePageFaqLoginTitle", "Preciso estar logado?"),
        content: translate(
          t,
          "homePageFaqLoginContent",
          "Você pode explorar perfis públicos sem login, mas precisa entrar para seguir criadores, guardar cartas na coleção, ganhar XP, abrir pacotes, receber notificações e participar da progressão."
        ),
      },
      {
        id: "plain-images",
        title: translate(t, "homePageFaqPlainImagesTitle", "Por que algumas cartas usam imagem comum?"),
        content: translate(
          t,
          "homePageFaqPlainImagesContent",
          "Algumas cartas podem usar imagem comum porque o criador ainda não aprovou ou autorizou o uso de uma arte editada para o Cardpoc. Nesses casos, a imagem pode ser atualizada depois com aprovação ou solicitação do próprio criador."
        ),
      },
      {
        id: "global-followers",
        title: translate(t, "homePageFaqGlobalFollowersTitle", "O que são seguidores globais?"),
        content: translate(
          t,
          "homePageFaqGlobalFollowersContent",
          "Seguidores globais são uma soma das audiências públicas do criador em plataformas conectadas ao perfil, como Twitch, YouTube, Kick, Instagram, TikTok e outras redes quando disponíveis."
        ),
      },
      {
        id: "support",
        title: translate(t, "homePageFaqSupportTitle", "Como falar com a equipe Cardpoc?"),
        content: translate(
          t,
          "homePageFaqSupportContent",
          "Usuários e criadores podem usar os canais de suporte dentro da plataforma para reportar bugs, pedir correções, tirar dúvidas, solicitar reivindicação de perfil ou falar sobre cartas e pacotes."
        ),
      },
    ],
    [t]
  );

  const faqArticles = useMemo(
    () => [...defaultFaqArticles, ...customFaqArticles],
    [customFaqArticles, defaultFaqArticles]
  );

  const filteredFaqArticles = useMemo(() => {
    const normalizedSearch = guideSearch.trim().toLowerCase();

    if (!normalizedSearch) return faqArticles;

    return faqArticles.filter((article) => {
      const searchable = `${article.title} ${article.content}`.toLowerCase();
      return searchable.includes(normalizedSearch);
    });
  }, [faqArticles, guideSearch]);

  async function handleCreateFaqArticle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = newFaqTitle.trim();
    const content = newFaqContent.trim();

    if (!title || !content) return;

    setSavingFaq(true);
    setFaqFeedback("");

    const nextSortOrder = customFaqArticles.length + defaultFaqArticles.length + 1;

    const { data, error } = await supabase
      .from("faq_articles")
      .insert({
        title,
        content,
        sort_order: nextSortOrder,
        is_active: true,
      })
      .select("id,title,content,sort_order")
      .single();

    setSavingFaq(false);

    if (error || !data) {
      setFaqFeedback(
        translate(
          t,
          "homePageFaqAdminError",
          "Não foi possível salvar. Confira se a tabela faq_articles existe no Supabase."
        )
      );
      return;
    }

    setCustomFaqArticles((current) => [
      ...current,
      {
        id: data.id,
        title: data.title,
        content: data.content,
        sort_order: data.sort_order,
        isCustom: true,
      },
    ]);
    setNewFaqTitle("");
    setNewFaqContent("");
    setFaqFeedback(translate(t, "homePageFaqAdminSuccess", "Tópico adicionado."));
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <AnimatePresence>
        {loading && <LoadingScreen />}
      </AnimatePresence>

      <GlowBackground />
      <ParticleBackground />

      <section className="relative z-10 mx-auto flex max-w-7xl flex-col px-6 pt-10">
        <div className="mx-auto flex flex-col items-center text-center">
          <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 py-2 text-xs uppercase tracking-[0.3em] text-cyan-100 backdrop-blur">
            {translate(t, "homePageBadge", "Conheça e colecione criadores")}
          </div>

          <p className="mt-5 max-w-2xl text-sm font-medium text-white/55 sm:text-base">
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

          <div className="mt-7 grid w-full max-w-5xl gap-3 text-left sm:grid-cols-3">
            <article className="rounded-3xl border border-cyan-300/15 bg-cyan-300/[0.055] p-4 shadow-[0_0_26px_rgba(34,211,238,0.08)] backdrop-blur-xl">
              <span className="text-lg">🎴</span>
              <h2 className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-cyan-100">
                {translate(t, "homePageSeoCollectTitle", "Colecione criadores")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/55">
                {translate(
                  t,
                  "homePageSeoCollectDescription",
                  "Ganhe cartas digitais de criadores de conteúdo, streamers e influenciadores favoritos."
                )}
              </p>
            </article>

            <article className="rounded-3xl border border-amber-300/15 bg-amber-300/[0.045] p-4 shadow-[0_0_26px_rgba(251,191,36,0.07)] backdrop-blur-xl">
              <span className="text-lg">🎁</span>
              <h2 className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-amber-100">
                {translate(t, "homePageSeoDropsTitle", "Participe de drops")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/55">
                {translate(
                  t,
                  "homePageSeoDropsDescription",
                  "Entre em drops ao vivo na Kick e Twitch, concorra a packs e fortaleça sua coleção."
                )}
              </p>
            </article>

            <article className="rounded-3xl border border-purple-300/15 bg-purple-400/[0.045] p-4 shadow-[0_0_26px_rgba(168,85,247,0.07)] backdrop-blur-xl">
              <span className="text-lg">🏆</span>
              <h2 className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-purple-100">
                {translate(t, "homePageSeoRankingsTitle", "Descubra rankings")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/55">
                {translate(
                  t,
                  "homePageSeoRankingsDescription",
                  "Acompanhe estatísticas, rankings e criadores em alta na Twitch, Kick e YouTube."
                )}
              </p>
            </article>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/album"
              className="group relative overflow-hidden rounded-2xl border border-cyan-300/30 bg-cyan-300 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-black shadow-[0_0_28px_rgba(34,211,238,0.18)] transition hover:-translate-y-0.5 hover:bg-cyan-200"
            >
              {translate(t, "homePageStartCollectionCta", "Começar minha coleção")}
            </Link>

            <a
              href="#criadores"
              className="rounded-2xl border border-white/12 bg-white/[0.04] px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white/70 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-purple-300/35 hover:text-white"
            >
              {translate(t, "homePageDiscoverCreatorsCta", "Descobrir criadores")}
            </a>
          </div>
        </div>
      </section>

      <div className="relative z-10 mx-auto mt-6 flex max-w-7xl justify-end px-6">
        <Link
          href="/album"
          className="group relative overflow-hidden rounded-2xl border border-cyan-300/25 bg-black/55 px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-cyan-100 shadow-[0_0_28px_rgba(34,211,238,0.14)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-purple-300/45 hover:text-white hover:shadow-[0_0_34px_rgba(168,85,247,0.22)]"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 via-transparent to-purple-500/10 opacity-80 transition group-hover:opacity-100" />
          <span className="relative flex items-center gap-2">
            <span className="text-sm">▣</span>
            {translate(t, "homePageAlbumButton", "Álbum Premium")}
          </span>
        </Link>
      </div>

      <div id="criadores">
        <CreatorGrid search={search} />
      </div>

      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2">
        {!hasSeenCardpocGuide && (
          <button
            type="button"
            onClick={openCardpocGuide}
            className="relative rounded-full border border-amber-200/35 bg-amber-300 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-black shadow-[0_0_26px_rgba(251,191,36,0.22)] transition hover:-translate-y-0.5 hover:bg-amber-200"
          >
            {translate(t, "homePageGuideBubble", "Dúvidas?")}
            <span className="absolute -bottom-1.5 right-5 h-3 w-3 rotate-45 border-b border-r border-amber-200/35 bg-amber-300" />
          </button>
        )}

        <button
          type="button"
          onClick={openCardpocGuide}
          className="group relative flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/25 bg-black/70 text-cyan-100 shadow-[0_0_28px_rgba(34,211,238,0.18)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-purple-300/40 hover:text-white hover:shadow-[0_0_34px_rgba(168,85,247,0.25)]"
          aria-label={translate(t, "homePageGuideOpenAria", "Entender o Cardpoc")}
        >
          <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-400/10 via-transparent to-purple-500/10 opacity-80" />
          <span className="relative text-lg">◈</span>
          <span className="pointer-events-none absolute bottom-full right-0 mb-3 hidden whitespace-nowrap rounded-full border border-white/10 bg-black/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/70 shadow-2xl backdrop-blur-xl group-hover:block">
            {translate(t, "homePageGuideTooltip", "O que é o Cardpoc?")}
          </span>
        </button>
      </div>

      {showCardpocGuide && (
        <CardpocModalShell
          onClose={() => setShowCardpocGuide(false)}
          showCloseButton
          closeLabel={translate(t, "close", "Fechar")}
          zIndexClassName="z-50"
          className="max-w-4xl"
          contentClassName="flex max-h-[calc(100vh-1.5rem)] flex-col overflow-hidden"
        >
          <div
            className="flex min-h-0 flex-col"
            role="dialog"
            aria-modal="true"
            aria-label={translate(t, "homePageGuideTitle", "Central de Ajuda Cardpoc")}
          >
            <div className="relative border-b border-white/10 p-6 pr-16 sm:p-8 sm:pr-20">
              <div className="mb-5 inline-flex items-center gap-3 rounded-full border border-cyan-300/15 bg-cyan-300/5 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-100">
                <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)]" />
                {translate(t, "homePageGuideBadge", "Central de ajuda")}
              </div>

              <h2 className="text-2xl font-black uppercase tracking-[0.12em] text-white sm:text-4xl">
                {translate(t, "homePageGuideTitle", "Central de Ajuda Cardpoc")}
              </h2>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">
                {translate(
                  t,
                  "homePageGuideDescription",
                  "Tire dúvidas sobre cartas, pacotes, XP, níveis, raridades, perfis de criadores e como participar do Cardpoc."
                )}
              </p>

              <label className="mt-6 block">
                <span className="sr-only">
                  {translate(t, "homePageFaqSearchLabel", "Pesquisar no guia")}
                </span>
                <input
                  value={guideSearch}
                  onChange={(event) => setGuideSearch(event.target.value)}
                  placeholder={translate(t, "homePageFaqSearchPlaceholder", "Pesquisar por XP, cartas, pacotes, perfil...")}
                  className="w-full rounded-2xl border border-white/10 bg-black/35 px-5 py-4 text-sm font-semibold text-white outline-none transition placeholder:text-white/28 focus:border-cyan-300/40 focus:bg-cyan-300/[0.04]"
                />
              </label>
            </div>

            <div className="relative flex-1 hide-scrollbar overflow-y-auto p-6 sm:p-8">
              {filteredFaqArticles.length > 0 ? (
                <div className="grid gap-3">
                  {filteredFaqArticles.map((article) => (
                    <details
                      key={article.id}
                      className="group rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition open:border-cyan-300/25 open:bg-cyan-300/[0.045]"
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left">
                        <span className="text-sm font-black uppercase tracking-[0.12em] text-white">
                          {article.title}
                        </span>
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/25 text-white/50 transition group-open:rotate-45 group-open:text-cyan-100">
                          +
                        </span>
                      </summary>
                      <p className="mt-3 text-sm leading-6 text-white/58">
                        {article.content}
                      </p>
                    </details>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 text-sm font-semibold text-white/55">
                  {translate(t, "homePageFaqNoResults", "Nenhum tópico encontrado para essa busca.")}
                </div>
              )}

              {isAdmin && (
                <form
                  onSubmit={handleCreateFaqArticle}
                  className="mt-6 rounded-3xl border border-amber-300/20 bg-amber-300/[0.04] p-5"
                >
                  <div className="mb-4">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-100">
                      {translate(t, "homePageFaqAdminTitle", "Administração do FAQ")}
                    </p>
                    <p className="mt-2 text-sm text-white/52">
                      {translate(
                        t,
                        "homePageFaqAdminDescription",
                        "Adicione novas explicações para usuários sem precisar alterar o código da home."
                      )}
                    </p>
                  </div>

                  <div className="grid gap-3">
                    <input
                      value={newFaqTitle}
                      onChange={(event) => setNewFaqTitle(event.target.value)}
                      placeholder={translate(t, "homePageFaqAdminTitlePlaceholder", "Título do tópico")}
                      className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-white/28 focus:border-amber-200/35"
                    />
                    <textarea
                      value={newFaqContent}
                      onChange={(event) => setNewFaqContent(event.target.value)}
                      placeholder={translate(t, "homePageFaqAdminContentPlaceholder", "Explicação do tópico")}
                      rows={4}
                      className="resize-none rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm font-semibold leading-6 text-white outline-none transition placeholder:text-white/28 focus:border-amber-200/35"
                    />
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="submit"
                        disabled={savingFaq || !newFaqTitle.trim() || !newFaqContent.trim()}
                        className="rounded-full bg-cyan-300 px-5 py-3 text-sm font-black text-black transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {savingFaq
                          ? translate(t, "homePageFaqAdminSaving", "Salvando...")
                          : translate(t, "homePageFaqAdminAdd", "Adicionar tópico")}
                      </button>
                      {faqFeedback && (
                        <span className="text-sm font-semibold text-white/55">
                          {faqFeedback}
                        </span>
                      )}
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </CardpocModalShell>
      )}
    </main>
  );
}
