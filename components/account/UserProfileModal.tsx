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

  return (
    <AnimatePresence>
      {isVisible && (
        <CardpocModalShell
          onClose={handleClose}
          showCloseButton
          closeLabel={translate(t, "closeProfile", "Fechar perfil")}
          zIndexClassName="z-[110]"
          className="max-w-4xl"
          contentClassName="max-h-[calc(100vh-1.5rem)] overflow-y-auto p-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:p-8"
        >
          <div className="relative">
            <div className="inline-flex items-center gap-3 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-cyan-100">
              <UserRound size={14} />
              {translate(t, "profile", "Meu Perfil")}
            </div>

            <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
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
                <h2 className="text-3xl font-black leading-tight">
                  {profile?.display_name || translate(t, "creator", "Creator")}
                </h2>

                <p className="mt-1 break-all text-white/45">{email}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm text-white/60">
                    @
                    {profile?.username ||
                      translate(t, "noUsername", "sem_username")}
                  </span>

                  <span className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-1 text-sm text-cyan-100">
                    {translate(t, "level", "Nível")}{" "}
                    {loading ? "..." : profileXp.level}
                  </span>

                  {highlightLevelUp && (
                    <span className="rounded-full border border-emerald-300/15 bg-emerald-300/10 px-3 py-1 text-sm text-emerald-100">
                      {translate(t, "recentLevelUp", "Level up recente")}
                    </span>
                  )}

                  <span className="rounded-full border border-yellow-300/15 bg-yellow-300/10 px-3 py-1 text-sm text-yellow-100">
                    {loading ? "..." : profileXp.xp} XP
                  </span>

                  <span className="rounded-full border border-purple-300/15 bg-purple-300/10 px-3 py-1 text-sm text-purple-100">
                    {formatCountLabel(
                      t,
                      stats.total,
                      "cardsCountSingular",
                      "{count} carta",
                      "cardsCountPlural",
                      "{count} cartas",
                    )}
                  </span>

                  {profile?.is_admin && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-yellow-300/20 bg-yellow-300/10 px-3 py-1 text-sm text-yellow-100">
                      <ShieldCheck size={14} />
                      {translate(t, "admin", "Admin")}
                    </span>
                  )}
                </div>

                <div className="mt-5 max-w-xl">
                  <div className="mb-2 flex items-center justify-between text-xs text-white/45">
                    <span>
                      {translate(
                        t,
                        "progressToLevel",
                        "Progresso para o nível",
                      )}{" "}
                      {profileXp.level + 1}
                    </span>
                    <span>{levelProgress.percentage}%</span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full border border-white/10 bg-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${levelProgress.percentage}%` }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                      className="h-full rounded-full bg-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.8)]"
                    />
                  </div>

                  <p className="mt-2 text-xs text-white/40">
                    {translate(t, "remainingXpPrefix", "Faltam")}{" "}
                    {levelProgress.remainingXp} XP{" "}
                    {translate(t, "remainingXpSuffix", "para o próximo nível.")}
                  </p>
                </div>
              </div>

              <div className="w-full sm:w-auto sm:min-w-[320px]">
                <button
                  type="button"
                  onClick={() => {
                    setLinkedAccountsOpen(true);
                    void loadLinkedAccounts();
                  }}
                  className="group relative w-full overflow-hidden rounded-3xl border border-cyan-300/20 bg-white/[0.06] p-5 text-left shadow-[0_0_40px_rgba(34,211,238,0.08)] transition hover:border-cyan-200/45 hover:bg-cyan-300/[0.08]"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_48%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.18),transparent_50%)] opacity-80 transition group-hover:opacity-100" />

                  <div className="relative flex items-start gap-4">
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

                      <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-bold text-white/70 transition group-hover:border-cyan-300/30 group-hover:text-cyan-100">
                        {translate(t, "linkedAccountsManage", "Gerenciar")}
                        <ExternalLink size={13} />
                      </span>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {highlightLevelUp && (
              <div className="mt-6 rounded-3xl border border-emerald-300/15 bg-emerald-300/[0.05] p-5">
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
                        "Seu perfil foi aberto a partir de uma notificação de evolução. Continue seguindo criadores, compartilhando e colecionando cartas para ganhar mais XP.",
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <ProfileStatCard
                icon={<Trophy size={18} />}
                label={translate(t, "level", "Nível")}
                value={loading ? "..." : String(profileXp.level)}
                tone="cyan"
              />

              <ProfileStatCard
                icon={<Star size={18} />}
                label="XP"
                value={loading ? "..." : String(profileXp.xp)}
                tone="yellow"
              />

              <ProfileStatCard
                icon={<Archive size={18} />}
                label={translate(t, "cardsTitle", "Cartas")}
                value={loading ? "..." : String(stats.total)}
                tone="purple"
              />

              <ProfileStatCard
                icon={<Sparkles size={18} />}
                label={translate(t, "commonPlural", "Comuns")}
                value={loading ? "..." : String(stats.common)}
                tone="cyan"
              />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

              <ProfileStatCard
                icon={<BadgeCheck size={18} />}
                label={translate(t, "badges", "Badges")}
                value={loading ? "..." : String(stats.badges)}
                tone="cyan"
              />
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-yellow-300/20 bg-yellow-300/10 text-yellow-100">
                    <BadgeCheck size={22} />
                  </div>

                  <div>
                    <p className="font-bold">
                      {translate(t, "badges", "Badges")}
                    </p>
                    <p className="text-sm text-white/45">
                      {formatCountLabel(
                        t,
                        stats.badges,
                        "unlockedAchievementSingular",
                        "{count} conquista desbloqueada",
                        "unlockedAchievementPlural",
                        "{count} conquistas desbloqueadas",
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                  {stats.badges > 0 ? (
                    <div className="flex items-center gap-3">
                      <Sparkles className="text-cyan-200" size={18} />
                      <div>
                        <p className="text-sm font-bold text-white">
                          {translate(t, "firstCard", "Primeira Carta")}
                        </p>
                        <p className="text-xs text-white/45">
                          {translate(
                            t,
                            "firstCardDescription",
                            "Você conquistou sua primeira carta no Nexus.",
                          )}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-white/45">
                      {translate(
                        t,
                        "badgesEmptyDescription",
                        "Suas badges aparecerão aqui quando você completar objetivos.",
                      )}
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
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
                  {cards.slice(0, 3).map((card) => (
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
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | { url?: string; error?: string }
      | null;

    if (!response.ok || !payload?.url) {
      console.error("Erro ao iniciar OAuth Kick:", payload?.error);
      return;
    }

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

    const response = await fetch("/api/auth/kick/disconnect", {
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
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

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
          <KickLinkedAccountCard
            account={kickAccount}
            loading={loading}
            language={language}
            t={t}
            disconnecting={disconnectingPlatform === "kick"}
            onConnect={handleConnectKick}
            onDisconnect={() => handleDisconnect("kick")}
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

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                ["Twitch", "twitch"],
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

function KickLinkedAccountCard({
  account,
  loading,
  language,
  t,
  disconnecting,
  onConnect,
  onDisconnect,
}: {
  account?: LinkedSocialAccount;
  loading: boolean;
  language: string;
  t: TranslateFunction;
  disconnecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  const connectedDate = account?.verified_at || account?.created_at;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-emerald-300/15 bg-emerald-300/[0.035] p-5 shadow-[0_0_40px_rgba(16,185,129,0.08)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(83,252,24,0.16),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.12),transparent_50%)]" />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl border border-emerald-300/25 bg-emerald-300/10 text-xl font-black text-emerald-100 shadow-[0_0_24px_rgba(83,252,24,0.24)]">
            K
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-black text-white">KICK</p>

              {account && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-100">
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
                      "Kick"}
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
                {translate(
                  t,
                  "linkedAccountsKickDescription",
                  "Conecte sua conta Kick para participar de drops via chat, eventos e recompensas automáticas.",
                )}
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
              className="inline-flex items-center justify-center rounded-full border border-emerald-300/25 bg-emerald-300/10 px-5 py-2 text-sm font-black text-emerald-100 transition hover:border-emerald-200/50 hover:bg-emerald-300/15"
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
