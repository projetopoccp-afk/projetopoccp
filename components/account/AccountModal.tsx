"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  Archive,
  CheckCircle2,
  Link2,
  Loader2,
  LogOut,
  Package,
  RadioTower,
  ShieldCheck,
  Target,
  UserRound,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";

import { CardpocModalShell } from "@/components/ui/CardpocModalShell";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase/client";

const AdminPanelModal = dynamic(
  () =>
    import("@/components/admin/AdminPanelModal").then(
      (module) => module.AdminPanelModal,
    ),
  { ssr: false },
);

const CollectionModal = dynamic(
  () =>
    import("@/components/collection/CollectionModal").then(
      (module) => module.CollectionModal,
    ),
  { ssr: false },
);

const CreatorRequestModal = dynamic(
  () =>
    import("@/components/creator-request/CreatorRequestModal").then(
      (module) => module.CreatorRequestModal,
    ),
  { ssr: false },
);

const UserProfileModal = dynamic(
  () =>
    import("@/components/account/UserProfileModal").then(
      (module) => module.UserProfileModal,
    ),
  { ssr: false },
);

const MissionsModal = dynamic(
  () =>
    import("@/components/missions/MissionsModal").then(
      (module) => module.MissionsModal,
    ),
  { ssr: false },
);

const PacksModal = dynamic(
  () =>
    import("@/components/packs/PacksModal").then(
      (module) => module.PacksModal,
    ),
  { ssr: false },
);

type AccountProfile = {
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  is_admin: boolean | null;
  xp?: number | null;
  level?: number | null;
};

type AccountStats = {
  xp: number;
  level: number;
  cards: number;
};

type LinkedSocialAccount = {
  id: string;
  platform: string;
  platform_user_id: string | null;
  platform_username: string | null;
  verified_at: string | null;
  created_at: string | null;
};

type AccountModalProps = {
  open: boolean;
  email: string;
  profile: AccountProfile | null;
  onClose: () => void;
  onLogout: () => void;
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
    nextLevelXp,
    remainingXp: Math.max(0, nextLevelXp - xp),
    percentage,
  };
}

export function AccountModal({
  open,
  email,
  profile,
  onClose,
  onLogout,
}: AccountModalProps) {
  const [requestOpen, setRequestOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [missionsOpen, setMissionsOpen] = useState(false);
  const [packsOpen, setPacksOpen] = useState(false);
  const [linkedAccountsOpen, setLinkedAccountsOpen] = useState(false);
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedSocialAccount[]>(
    [],
  );
  const [linkedAccountsLoading, setLinkedAccountsLoading] = useState(false);
  const [accountStats, setAccountStats] = useState<AccountStats>({
    xp: profile?.xp ?? 0,
    level: profile?.level ?? 1,
    cards: 0,
  });

  const { language, t } = useLanguage();

  const levelProgress = useMemo(
    () => getLevelProgress(accountStats.xp, accountStats.level),
    [accountStats.level, accountStats.xp],
  );

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

  function openLinkedAccountsModal() {
    setLinkedAccountsOpen(true);
    void loadLinkedAccounts();
  }

  useEffect(() => {
    function handleOpenCollectionCard(event: Event) {
      const detail =
        event instanceof CustomEvent && event.detail ? event.detail : {};

      setRequestOpen(false);
      setAdminOpen(false);
      setProfileOpen(false);
      setMissionsOpen(false);
      setPacksOpen(false);
      setLinkedAccountsOpen(false);
      setCollectionOpen(true);

      window.setTimeout(() => {
        onClose();

        window.dispatchEvent(
          new CustomEvent("creator-nexus:focus-collection-card", {
            detail,
          }),
        );

        window.dispatchEvent(
          new CustomEvent("creator-nexus:open-collection-card", {
            detail,
          }),
        );
      }, 80);
    }

    function handleOpenUserProfile() {
      setCollectionOpen(false);
      setMissionsOpen(false);
      setPacksOpen(false);
      setLinkedAccountsOpen(false);
      setProfileOpen(true);
    }

    window.addEventListener(
      "creator-nexus:open-collection-card",
      handleOpenCollectionCard,
    );

    window.addEventListener(
      "creator-nexus:open-user-profile",
      handleOpenUserProfile,
    );

    return () => {
      window.removeEventListener(
        "creator-nexus:open-collection-card",
        handleOpenCollectionCard,
      );

      window.removeEventListener(
        "creator-nexus:open-user-profile",
        handleOpenUserProfile,
      );
    };
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    async function loadAccountStats() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("Erro ao buscar usuário:", userError);
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

      const { count, error: cardsError } = await supabase
        .from("user_cards")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (cardsError) {
        console.error("Erro ao contar cartas:", cardsError);
      }

      setAccountStats({
        xp: profileData?.xp ?? profile?.xp ?? 0,
        level: profileData?.level ?? profile?.level ?? 1,
        cards: count ?? 0,
      });
    }

    loadAccountStats();
  }, [open, profile?.level, profile?.xp]);

  return (
    <>
      <AnimatePresence>
        {open && (
          <CardpocModalShell
            onClose={onClose}
            showCloseButton
            closeLabel={translate(t, "close", "Fechar")}
            zIndexClassName="z-[80]"
            className="max-w-[96rem]"
            contentClassName="hide-scrollbar overflow-y-auto p-4 pb-12 sm:p-5 sm:pb-14 lg:p-6 lg:pb-16 xl:p-8 xl:pb-20 [@media(max-height:760px)]:p-4 [@media(max-height:760px)]:pb-14"
          >
            <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-cyan-100">
              {translate(t, "myAccount", "Minha Conta")}
            </div>

            <div className="mt-5 overflow-hidden rounded-[30px] border border-cyan-300/15 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.16),transparent_42%),rgba(255,255,255,0.035)] p-4 shadow-[0_0_45px_rgba(34,211,238,0.08)] sm:p-5 lg:mt-7 lg:p-6 [@media(max-height:760px)]:mt-4 [@media(max-height:760px)]:p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] lg:h-24 lg:w-24 [@media(max-height:760px)]:h-18 [@media(max-height:760px)]:w-18">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.display_name || "Avatar"}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserRound className="text-white/40" size={38} />
                    )}
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-2xl font-black leading-tight lg:text-3xl [@media(max-height:760px)]:text-2xl">
                      {profile?.display_name || "Creator"}
                    </h2>

                    <p className="mt-1 break-all text-sm text-white/45 sm:text-base">
                      {email}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm text-white/60">
                        @
                        {profile?.username ||
                          translate(t, "noUsername", "sem_username")}
                      </span>

                      <span className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-1 text-sm font-bold text-cyan-100">
                        LVL {accountStats.level} •{" "}
                        {translate(t, "collectorRole", "Colecionador")}
                      </span>

                      <span className="rounded-full border border-yellow-300/15 bg-yellow-300/10 px-3 py-1 text-sm text-yellow-100">
                        {accountStats.xp} XP
                      </span>

                      <span className="rounded-full border border-purple-300/15 bg-purple-300/10 px-3 py-1 text-sm text-purple-100">
                        {accountStats.cards} {translate(t, "cards", "cards")}
                      </span>

                      {profile?.is_admin && (
                        <span className="inline-flex items-center gap-2 rounded-full border border-yellow-300/20 bg-yellow-300/10 px-3 py-1 text-sm text-yellow-100">
                          <ShieldCheck size={14} />
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="min-w-0 lg:w-[360px]">
                  <div className="mb-2 flex items-center justify-between gap-2 text-xs text-white/45">
                    <span>
                      {translate(t, "accountHeroProgressLabel", "Progresso")}
                    </span>
                    <span>
                      {levelProgress.percentage}% • {accountStats.xp} /{" "}
                      {levelProgress.nextLevelXp} XP
                    </span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full border border-white/10 bg-black/25">
                    <div
                      className="h-full rounded-full bg-cyan-300 shadow-[0_0_22px_rgba(34,211,238,0.85)] transition-all duration-500"
                      style={{ width: `${levelProgress.percentage}%` }}
                    />
                  </div>

                  <p className="mt-2 text-xs text-white/45">
                    {translate(t, "remainingXpPrefix", "Faltam")}{" "}
                    {levelProgress.remainingXp} XP{" "}
                    {translate(t, "remainingXpSuffix", "para o próximo nível.")}
                  </p>
                </div>
              </div>
            </div>

            {profile?.is_admin && (
              <button
                type="button"
                onClick={() => setAdminOpen(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-full border border-yellow-300/20 bg-yellow-300/10 px-5 py-3 text-sm font-bold text-yellow-100 transition hover:bg-yellow-300/20 lg:mt-6 [@media(max-height:760px)]:mt-4 [@media(max-height:760px)]:py-2.5"
              >
                <ShieldCheck size={18} />
                {translate(t, "adminPanel", "Painel Admin")}
              </button>
            )}

            <div className="mt-5 space-y-4 lg:mt-6 [@media(max-height:760px)]:mt-4">
              <section>
                <AccountSectionTitle>
                  {translate(t, "accountSectionProgress", "Minha progressão")}
                </AccountSectionTitle>

                <AccountActionCard
                  icon={<UserRound size={21} />}
                  title={translate(t, "profile", "Meu Perfil")}
                  description={translate(
                    t,
                    "profileCardDescription",
                    "Veja seu nível, XP, progresso, conquistas e atividade dentro do Cardpoc.",
                  )}
                  buttonLabel={translate(t, "open", "Abrir")}
                  variant="cyan"
                  featured
                  wide
                  onClick={() => setProfileOpen(true)}
                />
              </section>

              <section>
                <AccountSectionTitle>
                  {translate(t, "accountSectionCollection", "Minha coleção")}
                </AccountSectionTitle>

                <div className="grid gap-3 lg:grid-cols-2">
                  <AccountActionCard
                    icon={<Archive size={21} />}
                    title={translate(t, "collection", "Minha Coleção")}
                    description={translate(
                      t,
                      "collectionCardDescription",
                      "Acesse suas cartas conquistadas, raridades, criadores favoritos e progresso da coleção.",
                    )}
                    buttonLabel={translate(t, "open", "Abrir")}
                    variant="purple"
                    onClick={() => setCollectionOpen(true)}
                  />

                  <AccountActionCard
                    icon={<Package size={21} />}
                    title={translate(t, "packs", "Pacotes")}
                    description={translate(
                      t,
                      "packsCardDescription",
                      "Abra pacotes diários, pacotes de missão e eventos para desbloquear novas cartas.",
                    )}
                    buttonLabel={translate(t, "open", "Abrir")}
                    variant="pink"
                    onClick={() => setPacksOpen(true)}
                  />
                </div>
              </section>

              <section>
                <AccountSectionTitle>
                  {translate(t, "accountSectionGameplay", "Objetivos")}
                </AccountSectionTitle>

                <AccountActionCard
                  icon={<Target size={21} />}
                  title={translate(t, "missions", "Missões")}
                  description={translate(
                    t,
                    "missionsCardDescription",
                    "Complete desafios para ganhar pacotes, cartas especiais e recompensas do Cardpoc.",
                  )}
                  buttonLabel={translate(t, "open", "Abrir")}
                  variant="emerald"
                  wide
                  onClick={() => setMissionsOpen(true)}
                />
              </section>

              <section>
                <AccountSectionTitle>
                  {translate(t, "accountSectionSettings", "Conta e criador")}
                </AccountSectionTitle>

                <div className="grid gap-3 lg:grid-cols-2">
                  <AccountActionCard
                    icon={<Link2 size={21} />}
                    title={translate(
                      t,
                      "linkedAccountsTitle",
                      "Contas Linkadas",
                    )}
                    description={translate(
                      t,
                      "linkedAccountsProfileDescription",
                      "Conecte Kick e Twitch para participar de drops, missões e recompensas automáticas.",
                    )}
                    buttonLabel={translate(
                      t,
                      "linkedAccountsManage",
                      "Gerenciar",
                    )}
                    variant="cyan"
                    onClick={openLinkedAccountsModal}
                  />

                  <AccountActionCard
                    icon={<ShieldCheck size={21} />}
                    title={translate(
                      t,
                      "requestCreatorProfile",
                      "Solicitar perfil de criador",
                    )}
                    description={translate(
                      t,
                      "requestCreatorProfileDescription",
                      "Envie seus dados, redes sociais e prova de posse do canal para entrar na fila de aprovação.",
                    )}
                    buttonLabel={translate(
                      t,
                      "startRequest",
                      "Começar solicitação",
                    )}
                    variant="yellow"
                    onClick={() => setRequestOpen(true)}
                  />
                </div>
              </section>
            </div>

            <div className="mt-6 pb-8 lg:mt-8 lg:pb-10">
  <button
    type="button"
    onClick={onLogout}
    className="inline-flex items-center gap-2 rounded-full border border-red-300/20 bg-red-300/10 px-5 py-3 text-sm text-red-100 transition hover:bg-red-300/20"
  >
                <LogOut size={18} />
                {translate(t, "logoutAccount", "Sair da conta")}
              </button>
            </div>
          </CardpocModalShell>
        )}
      </AnimatePresence>

      {requestOpen && (
        <CreatorRequestModal
          open={requestOpen}
          email={email}
          onClose={() => setRequestOpen(false)}
        />
      )}

      {adminOpen && (
        <AdminPanelModal open={adminOpen} onClose={() => setAdminOpen(false)} />
      )}

      {profileOpen && (
        <UserProfileModal
          open={profileOpen}
          email={email}
          profile={profile}
          onClose={() => setProfileOpen(false)}
        />
      )}

      {collectionOpen && (
        <CollectionModal
          open={collectionOpen}
          onClose={() => setCollectionOpen(false)}
        />
      )}

      {missionsOpen && (
        <MissionsModal
          open={missionsOpen}
          onClose={() => setMissionsOpen(false)}
        />
      )}

      {packsOpen && (
        <PacksModal open={packsOpen} onClose={() => setPacksOpen(false)} />
      )}

      <AnimatePresence>
        {linkedAccountsOpen && (
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
    </>
  );
}

function AccountSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-xs font-black uppercase tracking-[0.28em] text-white/35">
      {children}
    </p>
  );
}

function AccountActionCard({
  icon,
  title,
  description,
  buttonLabel,
  variant,
  disabled = false,
  featured = false,
  wide = false,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonLabel: string;
  variant: "cyan" | "purple" | "yellow" | "emerald" | "pink";
  disabled?: boolean;
  featured?: boolean;
  wide?: boolean;
  onClick?: () => void;
}) {
  const styles = {
    cyan: {
      card: "border-cyan-300/15 bg-cyan-300/[0.04]",
      icon: "border-cyan-300/20 bg-cyan-300/10 text-cyan-100",
      button:
        "border-cyan-300/20 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/15",
    },
    purple: {
      card: "border-purple-300/15 bg-purple-300/[0.04]",
      icon: "border-purple-300/20 bg-purple-300/10 text-purple-100",
      button:
        "border-purple-300/20 bg-purple-300/10 text-purple-100 hover:bg-purple-300/15",
    },
    yellow: {
      card: "border-yellow-300/15 bg-yellow-300/[0.04]",
      icon: "border-yellow-300/20 bg-yellow-300/10 text-yellow-100",
      button:
        "border-yellow-300/20 bg-yellow-300/10 text-yellow-100 hover:bg-yellow-300/15",
    },
    emerald: {
      card: "border-emerald-300/15 bg-emerald-300/[0.04]",
      icon: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
      button:
        "border-emerald-300/20 bg-emerald-300/10 text-emerald-100 hover:bg-emerald-300/15",
    },
    pink: {
      card: "border-pink-300/15 bg-pink-300/[0.04]",
      icon: "border-pink-300/20 bg-pink-300/10 text-pink-100",
      button:
        "border-pink-300/20 bg-pink-300/10 text-pink-100 hover:bg-pink-300/15",
    },
  }[variant];

  return (
    <div
      className={`flex min-h-[156px] flex-col rounded-3xl border p-4 lg:min-h-[176px] [@media(max-height:760px)]:min-h-[138px] [@media(max-height:760px)]:p-3 ${featured ? "shadow-[0_0_35px_rgba(34,211,238,0.10)]" : ""} ${wide ? "lg:min-h-[150px]" : ""} ${styles.card}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border lg:h-11 lg:w-11 [@media(max-height:760px)]:h-9 [@media(max-height:760px)]:w-9 ${styles.icon}`}
        >
          {icon}
        </div>

        <h3 className="font-bold leading-tight">{title}</h3>
      </div>

      <p className="mt-2 flex-1 overflow-hidden text-sm leading-relaxed text-white/55 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] [@media(max-height:760px)]:text-xs [@media(max-height:760px)]:leading-relaxed">
        {description}
      </p>

      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`mt-3 w-fit rounded-full border px-5 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 [@media(max-height:760px)]:px-4 [@media(max-height:760px)]:py-1.5 [@media(max-height:760px)]:text-xs ${styles.button}`}
      >
        {buttonLabel}
      </button>
    </div>
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
