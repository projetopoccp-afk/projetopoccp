"use client";

import { useMemo, useState, type ComponentType } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Crown,
  Gem,
  Heart,
  Medal,
  PackageOpen,
  Sparkles,
  Star,
  Trophy,
  UserRound,
  Zap,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

type RankingTab = "creators" | "collectors";

type RankingItem = {
  id: string;
  name: string;
  username?: string;
  avatarUrl?: string;
  value: string;
  detail: string;
  href?: string;
};

type RankingBlock = {
  id: string;
  titleKey: string;
  titleFallback: string;
  descriptionKey: string;
  descriptionFallback: string;
  icon: ComponentType<{ className?: string }>;
  items: RankingItem[];
};

function translate(t: unknown, key: string, fallback: string) {
  try {
    const translateFn = t as (key: any, fallback?: string) => string;
    const value = translateFn(key as any, fallback);
    return value || fallback;
  } catch {
    return fallback;
  }
}

const creatorRankingBlocks: RankingBlock[] = [
  {
    id: "creator-level",
    titleKey: "rankingsCreatorHighestLevel",
    titleFallback: "Maior nível",
    descriptionKey: "rankingsCreatorHighestLevelDescription",
    descriptionFallback: "Criadores que mais evoluíram dentro do Cardpoc.",
    icon: Star,
    items: [
      {
        id: "stereonline-level",
        name: "StereOnline",
        username: "stereonline",
        value: "LVL 42",
        detail: "128.400 XP global",
        href: "/creator/stereonline",
      },
      {
        id: "zeusghostz-level",
        name: "ZeusGhostz",
        username: "zeusghostz",
        value: "LVL 39",
        detail: "116.900 XP global",
        href: "/creator/zeusghostz",
      },
      {
        id: "khoringatv-level",
        name: "KhorinGATv",
        username: "khoringatv",
        value: "LVL 35",
        detail: "98.200 XP global",
        href: "/creator/khoringatv",
      },
    ],
  },
  {
    id: "creator-collected",
    titleKey: "rankingsCreatorMostCollected",
    titleFallback: "Mais colecionado",
    descriptionKey: "rankingsCreatorMostCollectedDescription",
    descriptionFallback:
      "Quantidade total de cartas desse criador nas coleções.",
    icon: Sparkles,
    items: [
      {
        id: "zeusghostz-collected",
        name: "ZeusGhostz",
        username: "zeusghostz",
        value: "1.284",
        detail: "cartas coletadas",
        href: "/creator/zeusghostz",
      },
      {
        id: "stereonline-collected",
        name: "StereOnline",
        username: "stereonline",
        value: "1.109",
        detail: "cartas coletadas",
        href: "/creator/stereonline",
      },
      {
        id: "khoringatv-collected",
        name: "KhorinGATv",
        username: "khoringatv",
        value: "936",
        detail: "cartas coletadas",
        href: "/creator/khoringatv",
      },
    ],
  },
  {
    id: "creator-legendary",
    titleKey: "rankingsCreatorMostLegendaryCards",
    titleFallback: "Mais cartas lendárias",
    descriptionKey: "rankingsCreatorMostLegendaryCardsDescription",
    descriptionFallback: "Criadores com mais cartas lendárias distribuídas.",
    icon: Gem,
    items: [
      {
        id: "stereonline-legendary",
        name: "StereOnline",
        username: "stereonline",
        value: "47",
        detail: "lendárias em coleções",
        href: "/creator/stereonline",
      },
      {
        id: "sacizera-legendary",
        name: "SacizeraGames",
        username: "sacizeragames",
        value: "41",
        detail: "lendárias em coleções",
        href: "/creator/sacizeragames",
      },
      {
        id: "zeusghostz-legendary",
        name: "ZeusGhostz",
        username: "zeusghostz",
        value: "38",
        detail: "lendárias em coleções",
        href: "/creator/zeusghostz",
      },
    ],
  },
  {
    id: "creator-searched",
    titleKey: "rankingsCreatorMostSearched",
    titleFallback: "Mais procurado",
    descriptionKey: "rankingsCreatorMostSearchedDescription",
    descriptionFallback:
      "Perfis de criadores mais visitados nos últimos 30 dias.",
    icon: Zap,
    items: [
      {
        id: "zeusghostz-searched",
        name: "ZeusGhostz",
        username: "zeusghostz",
        value: "8.920",
        detail: "visitas em 30 dias",
        href: "/creator/zeusghostz",
      },
      {
        id: "khoringatv-searched",
        name: "KhorinGATv",
        username: "khoringatv",
        value: "7.480",
        detail: "visitas em 30 dias",
        href: "/creator/khoringatv",
      },
      {
        id: "stereonline-searched",
        name: "StereOnline",
        username: "stereonline",
        value: "6.735",
        detail: "visitas em 30 dias",
        href: "/creator/stereonline",
      },
    ],
  },
];

const collectorRankingBlocks: RankingBlock[] = [
  {
    id: "collector-xp",
    titleKey: "rankingsCollectorMostXp",
    titleFallback: "Mais XP",
    descriptionKey: "rankingsCollectorMostXpDescription",
    descriptionFallback: "Colecionadores com maior experiência acumulada.",
    icon: Zap,
    items: [
      {
        id: "jean-xp",
        name: "Jean Silva",
        username: "jean",
        value: "24.850 XP",
        detail: "nível 18",
      },
      {
        id: "collector-a-xp",
        name: "NexusHunter",
        username: "nexushunter",
        value: "21.300 XP",
        detail: "nível 16",
      },
      {
        id: "collector-b-xp",
        name: "CardMage",
        username: "cardmage",
        value: "19.760 XP",
        detail: "nível 15",
      },
    ],
  },
  {
    id: "collector-cards",
    titleKey: "rankingsCollectorMostCards",
    titleFallback: "Mais cartas",
    descriptionKey: "rankingsCollectorMostCardsDescription",
    descriptionFallback: "Usuários com mais cartas na coleção.",
    icon: Sparkles,
    items: [
      {
        id: "collector-a-cards",
        name: "NexusHunter",
        username: "nexushunter",
        value: "312",
        detail: "cartas coletadas",
      },
      {
        id: "jean-cards",
        name: "Jean Silva",
        username: "jean",
        value: "286",
        detail: "cartas coletadas",
      },
      {
        id: "collector-c-cards",
        name: "RareDropBR",
        username: "raredropbr",
        value: "241",
        detail: "cartas coletadas",
      },
    ],
  },
  {
    id: "collector-packs",
    titleKey: "rankingsCollectorMostOpenedPacks",
    titleFallback: "Mais pacotes abertos",
    descriptionKey: "rankingsCollectorMostOpenedPacksDescription",
    descriptionFallback: "Quem mais abriu pacotes dentro do Cardpoc.",
    icon: PackageOpen,
    items: [
      {
        id: "collector-c-packs",
        name: "RareDropBR",
        username: "raredropbr",
        value: "94",
        detail: "pacotes abertos",
      },
      {
        id: "jean-packs",
        name: "Jean Silva",
        username: "jean",
        value: "81",
        detail: "pacotes abertos",
      },
      {
        id: "collector-b-packs",
        name: "CardMage",
        username: "cardmage",
        value: "76",
        detail: "pacotes abertos",
      },
    ],
  },
  {
    id: "collector-following",
    titleKey: "rankingsCollectorMostFollowedCreators",
    titleFallback: "Mais criadores seguidos",
    descriptionKey: "rankingsCollectorMostFollowedCreatorsDescription",
    descriptionFallback:
      "Usuários que mais acompanham criadores na plataforma.",
    icon: Heart,
    items: [
      {
        id: "jean-following",
        name: "Jean Silva",
        username: "jean",
        value: "64",
        detail: "criadores seguidos",
      },
      {
        id: "collector-a-following",
        name: "NexusHunter",
        username: "nexushunter",
        value: "57",
        detail: "criadores seguidos",
      },
      {
        id: "collector-d-following",
        name: "PixelScout",
        username: "pixelscout",
        value: "52",
        detail: "criadores seguidos",
      },
    ],
  },
];

function getRankBadgeClass(position: number) {
  if (position === 1) {
    return "border-amber-300/70 bg-amber-300/15 text-amber-100 shadow-[0_0_28px_rgba(251,191,36,0.22)]";
  }

  if (position === 2) {
    return "border-slate-200/50 bg-slate-200/10 text-slate-100 shadow-[0_0_24px_rgba(226,232,240,0.12)]";
  }

  if (position === 3) {
    return "border-orange-300/50 bg-orange-300/10 text-orange-100 shadow-[0_0_24px_rgba(251,146,60,0.12)]";
  }

  return "border-cyan-300/30 bg-cyan-300/10 text-cyan-100";
}

function RankingCard({ block }: { block: RankingBlock }) {
  const { t } = useLanguage();
  const Icon = block.icon;

  return (
    <article className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/72 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.36)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-cyan-300/35 hover:shadow-[0_28px_110px_rgba(34,211,238,0.13)]">
      <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-cyan-400/12 blur-3xl transition duration-300 group-hover:bg-cyan-300/18" />
      <div className="pointer-events-none absolute -bottom-20 -left-16 h-40 w-40 rounded-full bg-violet-500/12 blur-3xl" />

      <div className="relative flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-100 shadow-[0_0_32px_rgba(34,211,238,0.16)]">
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-black tracking-tight text-white">
            {translate(t, block.titleKey, block.titleFallback)}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-400">
            {translate(t, block.descriptionKey, block.descriptionFallback)}
          </p>
        </div>
      </div>

      <div className="relative mt-5 space-y-3">
        {block.items.map((item, index) => {
          const position = index + 1;
          const content = (
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3 transition duration-300 hover:border-cyan-300/25 hover:bg-cyan-300/[0.055]">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border text-sm font-black ${getRankBadgeClass(
                  position,
                )}`}
              >
                #{position}
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-300/15 via-violet-400/10 to-fuchsia-500/15 text-sm font-black text-white">
                {item.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.avatarUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  item.name.slice(0, 2).toUpperCase()
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold text-white">
                  {item.name}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {item.username ? `@${item.username}` : item.detail}
                </p>
              </div>

              <div className="text-right">
                <p className="text-sm font-black text-cyan-100">{item.value}</p>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {item.detail}
                </p>
              </div>
            </div>
          );

          if (item.href) {
            return (
              <Link key={item.id} href={item.href} className="block">
                {content}
              </Link>
            );
          }

          return <div key={item.id}>{content}</div>;
        })}
      </div>
    </article>
  );
}

export default function RankingsPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<RankingTab>("creators");

  const activeBlocks = useMemo(() => {
    return activeTab === "creators"
      ? creatorRankingBlocks
      : collectorRankingBlocks;
  }, [activeTab]);

  const hallOfFame = useMemo(() => {
    const mostCollectedCreator = creatorRankingBlocks.find(
      (block) => block.id === "creator-collected",
    )?.items[0];

    const topCollector = collectorRankingBlocks.find(
      (block) => block.id === "collector-xp",
    )?.items[0];

    return { mostCollectedCreator, topCollector };
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#030712] px-4 pb-16 pt-28 text-white sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_34%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.16),transparent_30%),linear-gradient(180deg,rgba(15,23,42,0.58),rgba(2,6,23,0.98))]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.045)_1px,transparent_1px)] bg-[size:52px_52px] [mask-image:radial-gradient(circle_at_center,black,transparent_78%)]" />
      <div className="pointer-events-none absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl" />

      <section className="relative mx-auto max-w-7xl">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-100 shadow-[0_0_32px_rgba(34,211,238,0.13)]">
            <Trophy className="h-4 w-4" />
            {translate(t, "rankingsEyebrow", "Hall da fama Cardpoc")}
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            {translate(t, "rankingsPageTitle", "Rankings")}
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
            {translate(
              t,
              "rankingsPageDescription",
              "Veja quem domina o Cardpoc: criadores mais colecionados, cartas lendárias e colecionadores que mais evoluíram.",
            )}
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="relative overflow-hidden rounded-[2rem] border border-amber-300/20 bg-amber-300/[0.055] p-5 shadow-[0_24px_90px_rgba(251,191,36,0.08)] backdrop-blur-xl">
            <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-amber-300/15 blur-3xl" />
            <div className="relative flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-300/30 bg-amber-300/10 text-amber-100">
                <Crown className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-100/80">
                  {translate(
                    t,
                    "rankingsHallCreator",
                    "Criador mais colecionado",
                  )}
                </p>
                <p className="mt-1 truncate text-2xl font-black text-white">
                  {hallOfFame.mostCollectedCreator?.name ?? "Cardpoc"}
                </p>
                <p className="text-sm text-slate-400">
                  {hallOfFame.mostCollectedCreator?.value ?? "0"}{" "}
                  {translate(
                    t,
                    "rankingsCollectedCardsLabel",
                    "cartas coletadas",
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-cyan-300/[0.055] p-5 shadow-[0_24px_90px_rgba(34,211,238,0.08)] backdrop-blur-xl">
            <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-cyan-300/15 blur-3xl" />
            <div className="relative flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-300/10 text-cyan-100">
                <Medal className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-100/80">
                  {translate(
                    t,
                    "rankingsHallCollector",
                    "Colecionador com mais XP",
                  )}
                </p>
                <p className="mt-1 truncate text-2xl font-black text-white">
                  {hallOfFame.topCollector?.name ?? "Cardpoc"}
                </p>
                <p className="text-sm text-slate-400">
                  {hallOfFame.topCollector?.value ?? "0 XP"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-stretch justify-between gap-4 rounded-[2rem] border border-white/10 bg-white/[0.035] p-3 backdrop-blur-xl sm:flex-row sm:items-center">
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <button
              type="button"
              onClick={() => setActiveTab("creators")}
              className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition ${
                activeTab === "creators"
                  ? "border border-cyan-300/35 bg-cyan-300/12 text-cyan-50 shadow-[0_0_28px_rgba(34,211,238,0.13)]"
                  : "border border-transparent text-slate-400 hover:bg-white/[0.055] hover:text-white"
              }`}
            >
              <Star className="h-4 w-4" />
              {translate(t, "rankingsCreatorsTab", "Criadores")}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("collectors")}
              className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition ${
                activeTab === "collectors"
                  ? "border border-violet-300/35 bg-violet-300/12 text-violet-50 shadow-[0_0_28px_rgba(168,85,247,0.13)]"
                  : "border border-transparent text-slate-400 hover:bg-white/[0.055] hover:text-white"
              }`}
            >
              <UserRound className="h-4 w-4" />
              {translate(t, "rankingsCollectorsTab", "Colecionadores")}
            </button>
          </div>

          <p className="px-2 text-center text-xs font-semibold text-slate-500 sm:text-right">
            {translate(
              t,
              "rankingsMockNotice",
              "Dados temporários para validar o visual. A próxima etapa conecta ao Supabase.",
            )}
          </p>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {activeBlocks.map((block) => (
            <RankingCard key={block.id} block={block} />
          ))}
        </div>

        <div className="mt-8 rounded-[2rem] border border-white/10 bg-slate-950/70 p-5 backdrop-blur-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-white">
                {translate(t, "rankingsNextStepTitle", "Próximo passo")}
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-400">
                {translate(
                  t,
                  "rankingsNextStepDescription",
                  "Depois de aprovar o visual, conectamos XP, cartas, pacotes e seguidores usando os dados reais do Supabase.",
                )}
              </p>
            </div>

            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-300/25 bg-cyan-300/10 px-5 py-3 text-sm font-black text-cyan-50 transition hover:border-cyan-200/45 hover:bg-cyan-300/15"
            >
              {translate(t, "backToHome", "Voltar para Home")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}