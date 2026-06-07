"use client";

import { useEffect, useState } from "react";
import {
  Archive,
  LogOut,
  Link2,
  Package,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";

import { AdminPanelModal } from "@/components/admin/AdminPanelModal";
import { CardpocModalShell } from "@/components/ui/CardpocModalShell";
import { CollectionModal } from "@/components/collection/CollectionModal";
import { CreatorRequestModal } from "@/components/creator-request/CreatorRequestModal";
import { UserProfileModal } from "@/components/account/UserProfileModal";
import { MissionsModal } from "@/components/missions/MissionsModal";
import { PacksModal } from "@/components/packs/PacksModal";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase/client";

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
  const [accountStats, setAccountStats] = useState<AccountStats>({
    xp: profile?.xp ?? 0,
    level: profile?.level ?? 1,
    cards: 0,
  });

  const { t } = useLanguage();

  useEffect(() => {
    function handleOpenCollectionCard(event: Event) {
      const detail =
        event instanceof CustomEvent && event.detail ? event.detail : {};

      setRequestOpen(false);
      setAdminOpen(false);
      setProfileOpen(false);
      setMissionsOpen(false);
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
            contentClassName="hide-scrollbar overflow-y-auto p-4 pb-4 sm:p-5 sm:pb-5 lg:p-6 xl:p-8 [@media(max-height:760px)]:p-4 [@media(max-height:760px)]:pb-4"
          >
            <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-cyan-100">
              {translate(t, "myAccount", "Minha Conta")}
            </div>

            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center lg:mt-7 lg:gap-6 [@media(max-height:760px)]:mt-4 [@media(max-height:760px)]:gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] lg:h-24 lg:w-24 [@media(max-height:760px)]:h-18 [@media(max-height:760px)]:w-18">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.display_name || "Avatar"}
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

                  <span className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-1 text-sm text-cyan-100">
                    {translate(t, "level", "Nível")} {accountStats.level}
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

            <div className="mt-5 grid gap-3 md:grid-cols-2 2xl:grid-cols-3 lg:mt-6 [@media(max-height:760px)]:mt-4">
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
                onClick={() => setProfileOpen(true)}
              />

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
                onClick={() => setMissionsOpen(true)}
              />

              <AccountActionCard
                icon={<Link2 size={21} />}
                title={translate(t, "linkedAccountsTitle", "Contas Linkadas")}
                description={translate(
                  t,
                  "linkedAccountsProfileDescription",
                  "Conecte Kick e Twitch para participar de drops, missões e recompensas automáticas.",
                )}
                buttonLabel={translate(t, "linkedAccountsManage", "Gerenciar")}
                variant="cyan"
                onClick={() => {
                  setProfileOpen(true);
                  window.setTimeout(() => {
                    window.dispatchEvent(
                      new CustomEvent("creator-nexus:open-linked-accounts"),
                    );
                  }, 80);
                }}
              />

              <div className="flex min-h-[156px] flex-col rounded-3xl border border-cyan-300/15 bg-cyan-300/[0.04] p-4 lg:min-h-[176px] [@media(max-height:760px)]:min-h-[138px] [@media(max-height:760px)]:p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100 lg:h-11 lg:w-11 [@media(max-height:760px)]:h-9 [@media(max-height:760px)]:w-9">
                    <ShieldCheck size={21} />
                  </div>

                  <h3 className="font-bold leading-tight">
                    {translate(
                      t,
                      "requestCreatorProfile",
                      "Solicitar perfil de criador",
                    )}
                  </h3>
                </div>

                <p className="mt-2 flex-1 overflow-hidden text-sm leading-relaxed text-white/55 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] [@media(max-height:760px)]:text-xs [@media(max-height:760px)]:leading-relaxed">
                  {translate(
                    t,
                    "requestCreatorProfileDescription",
                    "Envie seus dados, redes sociais e prova de posse do canal para entrar na fila de aprovação.",
                  )}
                </p>

                <button
                  type="button"
                  onClick={() => setRequestOpen(true)}
                  className="mt-3 w-fit rounded-full bg-cyan-300 px-5 py-2 text-sm font-bold text-black transition hover:scale-105 [@media(max-height:760px)]:px-4 [@media(max-height:760px)]:py-1.5 [@media(max-height:760px)]:text-xs"
                >
                  {translate(t, "startRequest", "Começar solicitação")}
                </button>
              </div>
            </div>

            <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.035] p-4 [@media(max-height:760px)]:p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-yellow-300/20 bg-yellow-300/10 text-yellow-100">
                    <Sparkles size={19} />
                  </div>

                  <div>
                    <p className="font-bold text-white">
                      {translate(
                        t,
                        "accountHubTipTitle",
                        "Hub do colecionador",
                      )}
                    </p>
                    <p className="text-sm text-white/45">
                      {translate(
                        t,
                        "accountHubTipDescription",
                        "Suas badges agora aparecem dentro do Meu Perfil junto com sua progressão.",
                      )}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setProfileOpen(true)}
                  className="w-fit rounded-full border border-yellow-300/20 bg-yellow-300/10 px-4 py-2 text-sm font-bold text-yellow-100 transition hover:bg-yellow-300/20"
                >
                  {translate(t, "viewProgress", "Ver progresso")}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-red-300/20 bg-red-300/10 px-5 py-3 text-sm text-red-100 transition hover:bg-red-300/20 [@media(max-height:760px)]:mt-4 [@media(max-height:760px)]:py-2.5"
            >
              <LogOut size={18} />
              {translate(t, "logoutAccount", "Sair da conta")}
            </button>
          </CardpocModalShell>
        )}
      </AnimatePresence>

      <CreatorRequestModal
        open={requestOpen}
        email={email}
        onClose={() => setRequestOpen(false)}
      />

      <AdminPanelModal open={adminOpen} onClose={() => setAdminOpen(false)} />

      <UserProfileModal
        open={profileOpen}
        email={email}
        profile={profile}
        onClose={() => setProfileOpen(false)}
      />

      <CollectionModal
        open={collectionOpen}
        onClose={() => setCollectionOpen(false)}
      />

      <MissionsModal
        open={missionsOpen}
        onClose={() => setMissionsOpen(false)}
      />

      <PacksModal open={packsOpen} onClose={() => setPacksOpen(false)} />
    </>
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
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonLabel: string;
  variant: "cyan" | "purple" | "yellow" | "emerald" | "pink";
  disabled?: boolean;
  featured?: boolean;
  onClick?: () => void;
}) {
  const styles = {
    cyan: {
      card: "border-cyan-300/15 bg-cyan-300/[0.04]",
      icon: "border-cyan-300/20 bg-cyan-300/10 text-cyan-100",
      button: "border-cyan-300/20 bg-cyan-300/10 text-cyan-100",
    },
    purple: {
      card: "border-purple-300/15 bg-purple-300/[0.04]",
      icon: "border-purple-300/20 bg-purple-300/10 text-purple-100",
      button: "border-purple-300/20 bg-purple-300/10 text-purple-100",
    },
    yellow: {
      card: "border-yellow-300/15 bg-yellow-300/[0.04]",
      icon: "border-yellow-300/20 bg-yellow-300/10 text-yellow-100",
      button: "border-yellow-300/20 bg-yellow-300/10 text-yellow-100",
    },
    emerald: {
      card: "border-emerald-300/15 bg-emerald-300/[0.04]",
      icon: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
      button: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
    },
    pink: {
      card: "border-pink-300/15 bg-pink-300/[0.04]",
      icon: "border-pink-300/20 bg-pink-300/10 text-pink-100",
      button: "border-pink-300/20 bg-pink-300/10 text-pink-100",
    },
  }[variant];

  return (
    <div
      className={`flex min-h-[156px] flex-col rounded-3xl border p-4 lg:min-h-[176px] [@media(max-height:760px)]:min-h-[138px] [@media(max-height:760px)]:p-3 ${featured ? "shadow-[0_0_35px_rgba(34,211,238,0.10)]" : ""} ${styles.card}`}
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
        className={`mt-3 w-fit rounded-full border px-5 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-60 [@media(max-height:760px)]:px-4 [@media(max-height:760px)]:py-1.5 [@media(max-height:760px)]:text-xs ${styles.button}`}
      >
        {buttonLabel}
      </button>
    </div>
  );
}
