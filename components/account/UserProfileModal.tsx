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
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { useLanguage } from "@/contexts/LanguageContext";
import { getRarityLabel } from "@/lib/rarity";
import { supabase } from "@/lib/supabase/client";

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

function getLevelProgress(xp: number, level: number) {
  const safeLevel = Math.max(1, level);
  const currentLevelXp = Math.pow(safeLevel - 1, 2) * 100;
  const nextLevelXp = Math.pow(safeLevel, 2) * 100;
  const xpInsideLevel = Math.max(0, xp - currentLevelXp);
  const xpNeededForLevel = Math.max(1, nextLevelXp - currentLevelXp);
  const percentage = Math.min(
    100,
    Math.round((xpInsideLevel / xpNeededForLevel) * 100)
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
      handleOpenUserProfile
    );

    return () => {
      window.removeEventListener(
        "creator-nexus:open-user-profile",
        handleOpenUserProfile
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
    const rare = cards.filter((card) => card.rarity === "rare").length;
    const epic = cards.filter((card) => card.rarity === "epic").length;
    const legendary = cards.filter(
      (card) => card.rarity === "legendary"
    ).length;

    return {
      total,
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
        <motion.div
          initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
          animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          transition={{ duration: 0.25 }}
          onClick={handleClose}
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.94 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
            className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-[32px] border border-white/15 bg-zinc-950 text-white shadow-[0_0_80px_rgba(0,0,0,0.9)]"
          >
            <div className="pointer-events-none absolute -left-24 -top-24 h-56 w-56 rounded-full bg-cyan-500/20 blur-[90px]" />
            <div className="pointer-events-none absolute -bottom-24 -right-24 h-56 w-56 rounded-full bg-purple-600/20 blur-[90px]" />

            <button
              type="button"
              onClick={handleClose}
              className="absolute right-5 top-5 z-20 rounded-full border border-white/10 bg-white/5 p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
              aria-label={translate(t, "closeProfile", "Fechar perfil")}
            >
              <X size={18} />
            </button>

            <div className="relative z-10 max-h-[90vh] overflow-y-auto p-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:p-8">
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
                      @{profile?.username || translate(t, "noUsername", "sem_username")}
                    </span>

                    <span className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-1 text-sm text-cyan-100">
                      {translate(t, "level", "Nível")} {loading ? "..." : profileXp.level}
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
                      {stats.total} {translate(t, "cards", "cartas")}
                    </span>

                    {profile?.is_admin && (
                      <span className="inline-flex items-center gap-2 rounded-full border border-yellow-300/20 bg-yellow-300/10 px-3 py-1 text-sm text-yellow-100">
                        <ShieldCheck size={14} />
                        Admin
                      </span>
                    )}
                  </div>

                  <div className="mt-5 max-w-xl">
                    <div className="mb-2 flex items-center justify-between text-xs text-white/45">
                      <span>
                        {translate(t, "progressToLevel", "Progresso para o nível")}{" "}
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
                          "Seu perfil foi aberto a partir de uma notificação de evolução. Continue seguindo criadores, compartilhando e colecionando cartas para ganhar mais XP."
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
                  icon={<Crown size={18} />}
                  label={translate(t, "legendaryPlural", "Lendárias")}
                  value={loading ? "..." : String(stats.legendary)}
                  tone="pink"
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
                        {stats.badges}{" "}
                        {translate(t, "unlockedAchievement", "conquista desbloqueada")}
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
                              "Você conquistou sua primeira carta no Nexus."
                            )}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-white/45">
                        {translate(
                          t,
                          "badgesEmptyDescription",
                          "Suas badges aparecerão aqui quando você completar objetivos."
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
                          "Últimas ações da sua coleção."
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
                            getDateLocale(language)
                          )}
                        </p>
                      </div>
                    ))}

                    {!loading && cards.length === 0 && (
                      <p className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/45">
                        {translate(
                          t,
                          "noActivityYet",
                          "Nenhuma atividade por enquanto."
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
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
