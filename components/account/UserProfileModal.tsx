"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  BadgeCheck,
  CalendarDays,
  Crown,
  Gem,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  UserRound,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { useLanguage } from "@/contexts/LanguageContext";
import { getRarityLabel } from "@/lib/rarity";
import { supabase } from "@/lib/supabase/client";
import { CardpocModalShell } from "@/components/ui/CardpocModalShell";

type AccountProfile = {
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  is_admin: boolean | null;
  xp?: number | null;
  level?: number | null;
};

type UserProfileModalProps = {
  open: boolean;
  email: string;
  profile: AccountProfile | null;
  onClose: () => void;
};

type UserCard = {
  id: string;
  rarity: string;
  source: string;
  obtained_at: string;
};

type ProfileXp = {
  xp: number;
  level: number;
};

type TranslateFunction = (key: any) => string;

function translate(t: TranslateFunction, key: string, fallback: string) {
  const value = t(key);

  return value && value !== key ? value : fallback;
}

function getDateLocale(language: string) {
  if (language === "en") return "en-US";
  if (language === "es") return "es-ES";

  return "pt-BR";
}

function getTranslatedRarityLabel(rarity: string, t: TranslateFunction) {
  return translate(t, rarity.toLowerCase(), getRarityLabel(rarity));
}

function normalizeRarity(rarity: string) {
  return rarity.toLowerCase().trim();
}

function getRarityRank(rarity: string) {
  const normalized = normalizeRarity(rarity);

  if (normalized === "legendary") return 4;
  if (normalized === "epic") return 3;
  if (normalized === "rare") return 2;

  return 1;
}

function formatCountLabel(
  t: TranslateFunction,
  count: number,
  singularKey: string,
  singularFallback: string,
  pluralKey: string,
  pluralFallback: string,
) {
  const template =
    count === 1
      ? translate(t, singularKey, singularFallback)
      : translate(t, pluralKey, pluralFallback);

  return template.replace("{count}", String(count));
}

function getLevelProgress(xp: number, level: number) {
  const safeLevel = Math.max(1, level);
  const currentLevelXp = Math.pow(safeLevel - 1, 2) * 100;
  const nextLevelXp = Math.pow(safeLevel, 2) * 100;
  const xpInsideLevel = Math.max(0, xp - currentLevelXp);
  const xpNeededForLevel = Math.max(1, nextLevelXp - currentLevelXp);
  const percentage = Math.min(
    100,
    Math.round((xpInsideLevel / xpNeededForLevel) * 100),
  );

  return {
    currentLevelXp,
    nextLevelXp,
    xpInsideLevel,
    xpNeededForLevel,
    remainingXp: Math.max(0, nextLevelXp - xp),
    percentage,
  };
}

export function UserProfileModal({
  open,
  email,
  profile,
  onClose,
}: UserProfileModalProps) {
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<UserCard[]>([]);
  const [profileXp, setProfileXp] = useState<ProfileXp>({
    xp: profile?.xp ?? 0,
    level: profile?.level ?? 1,
  });
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [highlightLevelUp, setHighlightLevelUp] = useState(false);
  const { language, t } = useLanguage();

  const isVisible = open || notificationOpen;

  function handleClose() {
    setNotificationOpen(false);
    setHighlightLevelUp(false);
    onClose();
  }

  useEffect(() => {
    function handleOpenUserProfile(event: Event) {
      const customEvent = event as CustomEvent<{
        type?: string;
        level?: number;
        xp?: number;
      }>;

      if (customEvent.detail?.level) {
        setHighlightLevelUp(true);
      }

      setNotificationOpen(true);
    }

    window.addEventListener(
      "creator-nexus:open-user-profile",
      handleOpenUserProfile,
    );

    return () => {
      window.removeEventListener(
        "creator-nexus:open-user-profile",
        handleOpenUserProfile,
      );
    };
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    async function loadProfileStats() {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("Erro ao buscar usuário:", userError);
        setCards([]);
        setLoading(false);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("xp, level")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Erro ao buscar XP do perfil:", profileError);
      }

      setProfileXp({
        xp: profileData?.xp ?? profile?.xp ?? 0,
        level: profileData?.level ?? profile?.level ?? 1,
      });

      void loadLinkedAccounts();

      const { data, error } = await supabase
        .from("user_cards")
        .select("id, rarity, source, obtained_at")
        .eq("user_id", user.id)
        .order("obtained_at", { ascending: false });

      if (error) {
        console.error(error);
        setCards([]);
        setLoading(false);
        return;
      }

      setCards(data || []);
      setLoading(false);
    }

    loadProfileStats();
  }, [isVisible, profile?.level, profile?.xp]);

  const stats = useMemo(() => {
    const total = cards.length;
    const common = cards.filter(
      (card) => normalizeRarity(card.rarity) === "common",
    ).length;
    const rare = cards.filter(
      (card) => normalizeRarity(card.rarity) === "rare",
    ).length;
    const epic = cards.filter(
      (card) => normalizeRarity(card.rarity) === "epic",
    ).length;
    const legendary = cards.filter(
      (card) => normalizeRarity(card.rarity) === "legendary",
    ).length;

    return {
      total,
      common,
      rare,
      epic,
      legendary,
      badges: total > 0 ? 1 : 0,
    };
  }, [cards]);

  const levelProgress = useMemo(() => {
    return getLevelProgress(profileXp.xp, profileXp.level);
  }, [profileXp.level, profileXp.xp]);

  const rarestCard = useMemo(() => {
    return [...cards].sort((a, b) => {
      const rarityDifference =
        getRarityRank(b.rarity) - getRarityRank(a.rarity);

      if (rarityDifference !== 0) return rarityDifference;

      return (
        new Date(b.obtained_at).getTime() - new Date(a.obtained_at).getTime()
      );
    })[0];
  }, [cards]);

  const collectorTitle = useMemo(() => {
    if (profileXp.level >= 25) {
      return translate(t, "collectorTitleLegend", "Lenda Cardpoc");
    }

    if (profileXp.level >= 15) {
      return translate(t, "collectorTitleElite", "Colecionador Elite");
    }

    if (profileXp.level >= 10) {
      return translate(t, "collectorTitleEpic", "Caçador Épico");
    }

    if (profileXp.level >= 5) {
      return translate(t, "collectorTitleCollector", "Colecionador");
    }

    return translate(t, "collectorTitleRookie", "Recruta Cardpoc");
  }, [profileXp.level, t]);

  const achievements = useMemo(
    () => [
      {
        key: "firstCard",
        title: translate(t, "firstCard", "Primeira Carta"),
        description: translate(
          t,
          "firstCardDescription",
          "Conquiste sua primeira carta no Cardpoc.",
        ),
        unlocked: stats.total > 0,
      },
      {
        key: "rareCollector",
        title: translate(t, "rareCollector", "Colecionador Raro"),
        description: translate(
          t,
          "rareCollectorDescription",
          "Tenha pelo menos uma carta rara ou superior.",
        ),
        unlocked: stats.rare + stats.epic + stats.legendary > 0,
      },
      {
        key: "epicHunter",
        title: translate(t, "epicHunter", "Caçador Épico"),
        description: translate(
          t,
          "epicHunterDescription",
          "Conquiste uma carta épica ou superior.",
        ),
        unlocked: stats.epic + stats.legendary > 0,
      },
      {
        key: "legendaryHunter",
        title: translate(t, "legendaryHunter", "Caçador de Lendárias"),
        description: translate(
          t,
          "legendaryHunterDescription",
          "Adicione uma carta lendária à sua coleção.",
        ),
        unlocked: stats.legendary > 0,
      },
      {
        key: "levelTen",
        title: translate(t, "levelTen", "Nível 10"),
        description: translate(
          t,
          "levelTenDescription",
          "Alcance o nível 10 como colecionador.",
        ),
        unlocked: profileXp.level >= 10,
      },
      {
        key: "cardHoarder",
        title: translate(t, "cardHoarder", "50 Cartas"),
        description: translate(
          t,
          "cardHoarderDescription",
          "Colecione 50 cartas no Cardpoc.",
        ),
        unlocked: stats.total >= 50,
      },
    ],
    [profileXp.level, stats.epic, stats.legendary, stats.rare, stats.total, t],
  );

  const unlockedAchievements = achievements.filter(
    (achievement) => achievement.unlocked,
  ).length;

  return (
    <AnimatePresence>
      {isVisible && (
        <CardpocModalShell
          onClose={handleClose}
          showCloseButton
          closeLabel={translate(t, "closeProfile", "Fechar perfil")}
          zIndexClassName="z-[110]"
          className="max-w-6xl"
          contentClassName="overflow-y-auto p-4 pb-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:p-5 md:p-6 lg:p-7 [@media(max-height:760px)]:p-4"
        >
          <div className="relative pr-10">
            <div className="inline-flex items-center gap-3 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-cyan-100">
              <UserRound size={14} />
              {translate(t, "collectorProfile", "Perfil de Colecionador")}
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_0.9fr] [@media(max-height:760px)]:mt-4 [@media(max-height:760px)]:gap-4">
              <div className="relative overflow-hidden rounded-[28px] border border-cyan-300/15 bg-white/[0.045] p-5 shadow-[0_0_50px_rgba(34,211,238,0.08)] [@media(max-height:760px)]:p-4">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.18),transparent_50%)]" />

                <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-black/25 lg:h-24 lg:w-24 [@media(max-height:760px)]:h-18 [@media(max-height:760px)]:w-18">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.display_name || "Avatar"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserRound className="text-white/40" size={42} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-black leading-tight text-white lg:text-3xl">
                      {profile?.display_name ||
                        translate(t, "creator", "Creator")}
                    </h2>

                    <p className="mt-1 break-all text-sm text-white/45 sm:text-base">
                      {email}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-sm text-white/60">
                        @
                        {profile?.username ||
                          translate(t, "noUsername", "sem_username")}
                      </span>

                      <span className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-1 text-sm font-bold text-cyan-100">
                        LVL {loading ? "..." : profileXp.level} •{" "}
                        {collectorTitle}
                      </span>

                      {highlightLevelUp && (
                        <span className="rounded-full border border-emerald-300/15 bg-emerald-300/10 px-3 py-1 text-sm font-bold text-emerald-100">
                          {translate(t, "recentLevelUp", "Level up recente")}
                        </span>
                      )}

                      {profile?.is_admin && (
                        <span className="inline-flex items-center gap-2 rounded-full border border-yellow-300/20 bg-yellow-300/10 px-3 py-1 text-sm text-yellow-100">
                          <ShieldCheck size={14} />
                          {translate(t, "admin", "Admin")}
                        </span>
                      )}
                    </div>

                    <div className="mt-5 max-w-2xl">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-white/45">
                        <span>
                          {loading ? "..." : profileXp.xp} /{" "}
                          {levelProgress.nextLevelXp} XP
                        </span>
                        <span>
                          {levelProgress.percentage}% •{" "}
                          {translate(t, "level", "Nível")} {profileXp.level + 1}
                        </span>
                      </div>

                      <div className="h-3 overflow-hidden rounded-full border border-white/10 bg-black/25">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${levelProgress.percentage}%` }}
                          transition={{ duration: 0.7, ease: "easeOut" }}
                          className="h-full rounded-full bg-cyan-300 shadow-[0_0_22px_rgba(34,211,238,0.85)]"
                        />
                      </div>

                      <p className="mt-2 text-xs text-white/45">
                        {translate(t, "remainingXpPrefix", "Faltam")}{" "}
                        {levelProgress.remainingXp} XP{" "}
                        {translate(
                          t,
                          "remainingXpSuffix",
                          "para o próximo nível.",
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {highlightLevelUp && (
              <div className="mt-5 rounded-3xl border border-emerald-300/15 bg-emerald-300/[0.05] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-100">
                    <Trophy size={22} />
                  </div>

                  <div>
                    <p className="font-bold text-emerald-100">
                      {translate(t, "levelUpTitle", "Você subiu de nível!")}
                    </p>
                    <p className="text-sm text-white/45">
                      {translate(
                        t,
                        "levelUpDescription",
                        "Continue seguindo criadores, compartilhando e colecionando cartas para ganhar mais XP.",
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 [@media(max-height:760px)]:mt-4">
              <ProfileStatCard
                icon={<Archive size={18} />}
                label={translate(t, "cardsTitle", "Cartas")}
                value={loading ? "..." : String(stats.total)}
                tone="purple"
              />

              <ProfileStatCard
                icon={<Star size={18} />}
                label="XP"
                value={loading ? "..." : String(profileXp.xp)}
                tone="yellow"
              />

              <ProfileStatCard
                icon={<Trophy size={18} />}
                label={translate(t, "badges", "Badges")}
                value={loading ? "..." : String(unlockedAchievements)}
                tone="cyan"
              />

              <ProfileStatCard
                icon={<Crown size={18} />}
                label={translate(t, "legendaryPlural", "Lendárias")}
                value={loading ? "..." : String(stats.legendary)}
                tone="pink"
              />
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 [@media(max-height:760px)]:p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-yellow-300/20 bg-yellow-300/10 text-yellow-100">
                    <Gem size={22} />
                  </div>

                  <div>
                    <p className="font-bold">
                      {translate(
                        t,
                        "profileHighlightTitle",
                        "Destaque da coleção",
                      )}
                    </p>
                    <p className="text-sm text-white/45">
                      {translate(
                        t,
                        "profileHighlightDescription",
                        "Sua carta de maior raridade conquistada até agora.",
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                  {rarestCard ? (
                    <div className="flex items-center gap-3">
                      <Sparkles className="text-cyan-200" size={20} />
                      <div>
                        <p className="text-sm font-bold text-white">
                          {getTranslatedRarityLabel(rarestCard.rarity, t)}
                        </p>
                        <p className="mt-1 text-xs text-white/45">
                          {translate(t, "obtainedFrom", "Origem")}:{" "}
                          {rarestCard.source} •{" "}
                          {new Date(rarestCard.obtained_at).toLocaleDateString(
                            getDateLocale(language),
                          )}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-white/45">
                      {translate(
                        t,
                        "profileHighlightEmpty",
                        "Sua carta destaque aparecerá aqui quando você começar a colecionar.",
                      )}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <ProfileStatCard
                  icon={<Sparkles size={18} />}
                  label={translate(t, "commonPlural", "Comuns")}
                  value={loading ? "..." : String(stats.common)}
                  tone="cyan"
                />

                <ProfileStatCard
                  icon={<Gem size={18} />}
                  label={translate(t, "rarePlural", "Raras")}
                  value={loading ? "..." : String(stats.rare)}
                  tone="purple"
                />

                <ProfileStatCard
                  icon={<Zap size={18} />}
                  label={translate(t, "epicPlural", "Épicas")}
                  value={loading ? "..." : String(stats.epic)}
                  tone="yellow"
                />

                <ProfileStatCard
                  icon={<Crown size={18} />}
                  label={translate(t, "legendaryPlural", "Lendárias")}
                  value={loading ? "..." : String(stats.legendary)}
                  tone="pink"
                />
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 [@media(max-height:760px)]:p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-yellow-300/20 bg-yellow-300/10 text-yellow-100">
                    <BadgeCheck size={22} />
                  </div>

                  <div>
                    <p className="font-bold">
                      {translate(t, "achievements", "Conquistas")}
                    </p>
                    <p className="text-sm text-white/45">
                      {formatCountLabel(
                        t,
                        unlockedAchievements,
                        "unlockedAchievementSingular",
                        "{count} conquista desbloqueada",
                        "unlockedAchievementPlural",
                        "{count} conquistas desbloqueadas",
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.key}
                      className={`rounded-2xl border p-3 ${
                        achievement.unlocked
                          ? "border-cyan-300/15 bg-cyan-300/[0.055]"
                          : "border-white/10 bg-black/20 opacity-60"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border ${
                            achievement.unlocked
                              ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-100"
                              : "border-white/10 bg-white/[0.04] text-white/35"
                          }`}
                        >
                          {achievement.unlocked ? (
                            <Trophy size={17} />
                          ) : (
                            <ShieldCheck size={17} />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white">
                            {achievement.title}
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-white/45">
                            {achievement.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 [@media(max-height:760px)]:p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
                    <CalendarDays size={22} />
                  </div>

                  <div>
                    <p className="font-bold">
                      {translate(t, "recentActivity", "Atividade recente")}
                    </p>
                    <p className="text-sm text-white/45">
                      {translate(
                        t,
                        "recentActivityDescription",
                        "Últimas ações da sua coleção.",
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {cards.slice(0, 4).map((card) => (
                    <div
                      key={card.id}
                      className="rounded-2xl border border-white/10 bg-black/20 p-4"
                    >
                      <p className="text-sm font-bold text-white">
                        {translate(t, "cardCollected", "Carta conquistada")}
                      </p>

                      <p className="mt-1 text-xs text-white/45">
                        {getTranslatedRarityLabel(card.rarity, t)} •{" "}
                        {card.source} •{" "}
                        {new Date(card.obtained_at).toLocaleDateString(
                          getDateLocale(language),
                        )}
                      </p>
                    </div>
                  ))}

                  {!loading && cards.length === 0 && (
                    <p className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/45">
                      {translate(
                        t,
                        "noActivityYet",
                        "Nenhuma atividade por enquanto.",
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardpocModalShell>
      )}
    </AnimatePresence>
  );
}

function ProfileStatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "cyan" | "purple" | "yellow" | "pink";
}) {
  const styles = {
    cyan: "border-cyan-300/15 bg-cyan-300/[0.04] text-cyan-100",
    purple: "border-purple-300/15 bg-purple-300/[0.04] text-purple-100",
    yellow: "border-yellow-300/15 bg-yellow-300/[0.04] text-yellow-100",
    pink: "border-pink-300/15 bg-pink-300/[0.04] text-pink-100",
  }[tone];

  return (
    <div className={`rounded-3xl border p-4 ${styles}`}>
      <div className="flex items-center justify-between text-white/45">
        {icon}

        <span className="text-xs uppercase tracking-[0.25em]">{label}</span>
      </div>

      <p className="mt-4 text-3xl font-black text-white">{value}</p>
    </div>
  );
}
