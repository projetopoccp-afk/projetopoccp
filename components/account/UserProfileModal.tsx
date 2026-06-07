"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Crown,
  ExternalLink,
  Gem,
  Link2,
  Loader2,
  RadioTower,
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

type LinkedSocialAccount = {
  id: string;
  platform: string;
  platform_user_id: string | null;
  platform_username: string | null;
  verified_at: string | null;
  created_at: string | null;
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
  const [linkedAccountsOpen, setLinkedAccountsOpen] = useState(false);
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedSocialAccount[]>(
    [],
  );
  const [linkedAccountsLoading, setLinkedAccountsLoading] = useState(false);
  const { language, t } = useLanguage();

  const isVisible = open || notificationOpen;

  function handleClose() {
    setNotificationOpen(false);
    setHighlightLevelUp(false);
    setLinkedAccountsOpen(false);
    onClose();
  }

  async function loadLinkedAccounts() {
    setLinkedAccountsLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Erro ao buscar usuário para contas linkadas:", userError);
      setLinkedAccounts([]);
      setLinkedAccountsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("user_social_accounts")
      .select(
        "id, platform, platform_user_id, platform_username, verified_at, created_at",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar contas linkadas:", error);
      setLinkedAccounts([]);
      setLinkedAccountsLoading(false);
      return;
    }

    setLinkedAccounts(data || []);
    setLinkedAccountsLoading(false);
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
    function handleOpenLinkedAccounts() {
      setNotificationOpen(true);
      setLinkedAccountsOpen(true);
      void loadLinkedAccounts();
    }

    window.addEventListener(
      "creator-nexus:open-linked-accounts",
      handleOpenLinkedAccounts,
    );

    return () => {
      window.removeEventListener(
        "creator-nexus:open-linked-accounts",
        handleOpenLinkedAccounts,
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

              <button
                type="button"
                onClick={() => {
                  setLinkedAccountsOpen(true);
                  void loadLinkedAccounts();
                }}
                className="group relative overflow-hidden rounded-[28px] border border-cyan-300/20 bg-white/[0.055] p-5 text-left shadow-[0_0_45px_rgba(34,211,238,0.08)] transition hover:border-cyan-200/45 hover:bg-cyan-300/[0.08] [@media(max-height:760px)]:p-4"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_48%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.18),transparent_50%)] opacity-80 transition group-hover:opacity-100" />

                <div className="relative flex h-full flex-col justify-between gap-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-100 shadow-[0_0_22px_rgba(34,211,238,0.25)]">
                      <Link2 size={22} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-100">
                        {translate(t, "linkedAccountsTitle", "Contas Linkadas")}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-white/50">
                        {translate(
                          t,
                          "linkedAccountsProfileDescription",
                          "Conecte plataformas para drops, missões e recompensas.",
                        )}
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-bold text-white/70 transition group-hover:border-cyan-300/30 group-hover:text-cyan-100">
                    {translate(t, "linkedAccountsManage", "Gerenciar")}
                    <ExternalLink size={13} />
                  </span>
                </div>
              </button>
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

      {isVisible && linkedAccountsOpen && (
        <LinkedAccountsModal
          accounts={linkedAccounts}
          loading={linkedAccountsLoading}
          language={language}
          t={t}
          onClose={() => setLinkedAccountsOpen(false)}
          onRefresh={loadLinkedAccounts}
        />
      )}
    </AnimatePresence>
  );
}

function LinkedAccountsModal({
  accounts,
  loading,
  language,
  t,
  onClose,
  onRefresh,
}: {
  accounts: LinkedSocialAccount[];
  loading: boolean;
  language: string;
  t: TranslateFunction;
  onClose: () => void;
  onRefresh: () => Promise<void>;
}) {
  const [disconnectingPlatform, setDisconnectingPlatform] = useState<
    string | null
  >(null);
  const kickAccount = accounts.find((account) => account.platform === "kick");
  const twitchAccount = accounts.find(
    (account) => account.platform === "twitch",
  );

  async function handleConnectKick() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session?.access_token) {
      console.error("Erro ao iniciar conexão com a Kick:", error);
      return;
    }

    const response = await fetch("/api/auth/kick/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accessToken: session.access_token,
        returnTo: `${window.location.pathname}${window.location.search}`,
      }),
    });

    const payload = (await response.json().catch(() => null)) as {
      url?: string;
      error?: string;
    } | null;

    if (!response.ok || !payload?.url) {
      console.error("Erro ao iniciar OAuth Kick:", payload?.error);
      return;
    }

    window.sessionStorage.setItem("cardpoc-kick-linking", "1");
    window.location.href = payload.url;
  }

  async function handleConnectTwitch() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session?.access_token) {
      console.error("Erro ao iniciar conexão com a Twitch:", error);
      return;
    }

    const response = await fetch("/api/auth/twitch/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accessToken: session.access_token,
        returnTo: `${window.location.pathname}${window.location.search}`,
      }),
    });

    const payload = (await response.json().catch(() => null)) as {
      url?: string;
      error?: string;
    } | null;

    if (!response.ok || !payload?.url) {
      console.error("Erro ao iniciar OAuth Twitch:", payload?.error);
      return;
    }

    window.sessionStorage.setItem("cardpoc-twitch-linking", "1");
    window.location.href = payload.url;
  }

  async function handleDisconnect(platform: string) {
    setDisconnectingPlatform(platform);

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      console.error("Erro ao validar sessão:", sessionError);
      setDisconnectingPlatform(null);
      return;
    }

    const disconnectEndpoint =
      platform === "twitch"
        ? "/api/auth/twitch/disconnect"
        : "/api/auth/kick/disconnect";

    const response = await fetch(disconnectEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accessToken: session.access_token,
        platform,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      console.error("Erro ao desconectar conta:", payload?.error);
      setDisconnectingPlatform(null);
      return;
    }

    await onRefresh();
    setDisconnectingPlatform(null);
  }

  return (
    <CardpocModalShell
      onClose={onClose}
      showCloseButton
      closeLabel={translate(t, "linkedAccountsClose", "Fechar contas linkadas")}
      zIndexClassName="z-[140]"
      className="max-w-2xl"
      contentClassName="max-h-[calc(100vh-1.5rem)] overflow-y-auto p-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:p-6"
    >
      <div className="relative">
        <div className="inline-flex items-center gap-3 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-cyan-100">
          <Link2 size={14} />
          {translate(t, "linkedAccountsTitle", "Contas Linkadas")}
        </div>

        <h3 className="mt-5 text-2xl font-black text-white">
          {translate(t, "linkedAccountsModalTitle", "Conecte suas plataformas")}
        </h3>

        <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/50">
          {translate(
            t,
            "linkedAccountsModalDescription",
            "Conecte suas plataformas para participar de drops, missões e recompensas.",
          )}
        </p>

        <div className="mt-6 space-y-4">
          <PlatformLinkedAccountCard
            account={kickAccount}
            loading={loading}
            language={language}
            t={t}
            platform="kick"
            platformName="KICK"
            descriptionKey="linkedAccountsKickDescription"
            descriptionFallback="Conecte sua conta Kick para participar de drops via chat, eventos e recompensas automáticas."
            disconnecting={disconnectingPlatform === "kick"}
            onConnect={handleConnectKick}
            onDisconnect={() => handleDisconnect("kick")}
          />

          <PlatformLinkedAccountCard
            account={twitchAccount}
            loading={loading}
            language={language}
            t={t}
            platform="twitch"
            platformName="TWITCH"
            descriptionKey="linkedAccountsTwitchDescription"
            descriptionFallback="Conecte sua conta Twitch para participar dos mesmos drops via chat junto com a Kick."
            disconnecting={disconnectingPlatform === "twitch"}
            onConnect={handleConnectTwitch}
            onDisconnect={() => handleDisconnect("twitch")}
          />

          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-purple-300/20 bg-purple-300/10 text-purple-100">
                <RadioTower size={19} />
              </div>

              <div>
                <p className="font-bold text-white">
                  {translate(t, "linkedAccountsComingSoonTitle", "Em breve")}
                </p>
                <p className="text-sm text-white/45">
                  {translate(
                    t,
                    "linkedAccountsComingSoonDescription",
                    "Novas plataformas serão adicionadas para missões e eventos.",
                  )}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                ["YouTube", "youtube"],
                ["TikTok", "tiktok"],
                ["Instagram", "instagram"],
              ].map(([label, key]) => (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                >
                  <span className="text-sm font-bold text-white/75">
                    {label}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/35">
                    {translate(t, "soon", "Em breve")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </CardpocModalShell>
  );
}

function PlatformIcon({ platform }: { platform: "kick" | "twitch" }) {
  if (platform === "twitch") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-7 w-7 fill-current"
      >
        <path d="M4.4 3 3 6.7v12.8h4.5V22h2.8l2.5-2.5h3.8L21 15.1V3H4.4Zm14.7 11.1-2.6 2.6h-4.2l-2.5 2.5v-2.5H6V4.9h13.1v9.2ZM15.9 8.2h1.8v5.2h-1.8V8.2Zm-5 0h1.8v5.2h-1.8V8.2Z" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-7 w-7 fill-current"
    >
      <path d="M4 4h8.2v4.2h1.8L17.6 4H22l-5.2 6 5.4 10h-4.7l-3.5-6.4h-1.8V20H4V4Zm4.2 3.6v8.8h1.9V7.6H8.2Z" />
    </svg>
  );
}

function getPlatformStyles(platform: "kick" | "twitch") {
  if (platform === "twitch") {
    return {
      wrapper:
        "border-purple-300/15 bg-purple-300/[0.035] shadow-[0_0_40px_rgba(168,85,247,0.08)]",
      glow: "bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.20),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.10),transparent_50%)]",
      icon: "border-purple-300/25 bg-purple-300/10 text-purple-100 shadow-[0_0_24px_rgba(168,85,247,0.24)]",
      connected: "border-purple-300/20 bg-purple-300/10 text-purple-100",
      connect:
        "border-purple-300/25 bg-purple-300/10 text-purple-100 hover:border-purple-200/50 hover:bg-purple-300/15",
    };
  }

  return {
    wrapper:
      "border-emerald-300/15 bg-emerald-300/[0.035] shadow-[0_0_40px_rgba(16,185,129,0.08)]",
    glow: "bg-[radial-gradient(circle_at_top_right,rgba(83,252,24,0.16),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.12),transparent_50%)]",
    icon: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100 shadow-[0_0_24px_rgba(83,252,24,0.24)]",
    connected: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
    connect:
      "border-emerald-300/25 bg-emerald-300/10 text-emerald-100 hover:border-emerald-200/50 hover:bg-emerald-300/15",
  };
}

function PlatformLinkedAccountCard({
  account,
  loading,
  language,
  t,
  platform,
  platformName,
  descriptionKey,
  descriptionFallback,
  disconnecting,
  onConnect,
  onDisconnect,
}: {
  account?: LinkedSocialAccount;
  loading: boolean;
  language: string;
  t: TranslateFunction;
  platform: "kick" | "twitch";
  platformName: string;
  descriptionKey: string;
  descriptionFallback: string;
  disconnecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  const connectedDate = account?.verified_at || account?.created_at;
  const styles = getPlatformStyles(platform);

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border p-5 ${styles.wrapper}`}
    >
      <div className={`absolute inset-0 ${styles.glow}`} />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl border ${styles.icon}`}
          >
            <PlatformIcon platform={platform} />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-black text-white">{platformName}</p>

              {account && (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${styles.connected}`}
                >
                  <CheckCircle2 size={13} />
                  {translate(t, "linkedAccountsConnected", "Conectada")}
                </span>
              )}
            </div>

            {account ? (
              <div className="mt-3 space-y-2 text-sm text-white/50">
                <p>
                  <span className="text-white/35">
                    {translate(t, "linkedAccountsUser", "Usuário")}:
                  </span>{" "}
                  <span className="font-bold text-white/80">
                    {account.platform_username ||
                      account.platform_user_id ||
                      platformName}
                  </span>
                </p>

                <p>
                  <span className="text-white/35">
                    {translate(t, "linkedAccountsConnectedAt", "Conectada em")}:
                  </span>{" "}
                  <span className="font-bold text-white/70">
                    {connectedDate
                      ? new Date(connectedDate).toLocaleDateString(
                          getDateLocale(language),
                        )
                      : "-"}
                  </span>
                </p>
              </div>
            ) : (
              <p className="mt-2 max-w-md text-sm leading-relaxed text-white/50">
                {translate(t, descriptionKey, descriptionFallback)}
              </p>
            )}
          </div>
        </div>

        <div className="shrink-0">
          {loading ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-4 py-2 text-sm text-white/50">
              <Loader2 className="animate-spin" size={15} />
              {translate(t, "loading", "Carregando")}
            </span>
          ) : account ? (
            <button
              type="button"
              onClick={onDisconnect}
              disabled={disconnecting}
              className="inline-flex items-center justify-center rounded-full border border-red-300/20 bg-red-300/10 px-5 py-2 text-sm font-bold text-red-100 transition hover:border-red-200/40 hover:bg-red-300/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {disconnecting
                ? translate(
                    t,
                    "linkedAccountsDisconnecting",
                    "Desconectando...",
                  )
                : translate(t, "linkedAccountsDisconnect", "Desconectar")}
            </button>
          ) : (
            <button
              type="button"
              onClick={onConnect}
              className={`inline-flex items-center justify-center rounded-full border px-5 py-2 text-sm font-black transition ${styles.connect}`}
            >
              {translate(t, "linkedAccountsConnect", "Conectar conta")}
            </button>
          )}
        </div>
      </div>
    </div>
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
