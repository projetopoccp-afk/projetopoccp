"use client";

import { useEffect, useState } from "react";
import {
  Archive,
  BadgeCheck,
  LogOut,
  Package,
  ShieldCheck,
  Target,
  UserRound,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { AdminPanelModal } from "@/components/admin/AdminPanelModal";
import { CollectionModal } from "@/components/collection/CollectionModal";
import { CreatorRequestModal } from "@/components/creator-request/CreatorRequestModal";
import { UserProfileModal } from "@/components/account/UserProfileModal";
import { MissionsModal } from "@/components/missions/MissionsModal";
import { PacksModal } from "@/components/packs/PacksModal";
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


  useEffect(() => {
    function handleOpenCollectionCard(event: Event) {
      const detail =
        event instanceof CustomEvent && event.detail ? event.detail : {};

      setRequestOpen(false);
      setAdminOpen(false);
      setProfileOpen(false);
      setMissionsOpen(false);
      setCollectionOpen(true);

      /*
        Quando a notificação é clicada pelo Header, o AccountModal também pode
        abrir por causa do clique no bloco do usuário. Então fechamos a tela
        "Minha Conta" e deixamos somente a coleção/carta aberta.
      */
      window.setTimeout(() => {
        onClose();

        window.dispatchEvent(
          new CustomEvent("creator-nexus:focus-collection-card", {
            detail,
          })
        );

        /*
          Mantém compatibilidade com versões do CollectionModal que ainda escutam
          o evento antigo diretamente.
        */
        window.dispatchEvent(
          new CustomEvent("creator-nexus:open-collection-card", {
            detail,
          })
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
      handleOpenCollectionCard
    );

    window.addEventListener(
      "creator-nexus:open-user-profile",
      handleOpenUserProfile
    );

    return () => {
      window.removeEventListener(
        "creator-nexus:open-collection-card",
        handleOpenCollectionCard
      );

      window.removeEventListener(
        "creator-nexus:open-user-profile",
        handleOpenUserProfile
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
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4"
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
                onClick={onClose}
                className="absolute right-5 top-5 z-20 rounded-full border border-white/10 bg-white/5 p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>

              <div className="relative z-10 max-h-[90vh] overflow-y-auto p-6 pb-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:p-8 md:pb-6">
                <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-cyan-100">
                  Minha Conta
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

                  <div className="min-w-0">
                    <h2 className="text-3xl font-black leading-tight">
                      {profile?.display_name || "Creator"}
                    </h2>

                    <p className="mt-1 break-all text-white/45">{email}</p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm text-white/60">
                        @{profile?.username || "sem_username"}
                      </span>

                      <span className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-1 text-sm text-cyan-100">
                        Nível {accountStats.level}
                      </span>

                      <span className="rounded-full border border-yellow-300/15 bg-yellow-300/10 px-3 py-1 text-sm text-yellow-100">
                        {accountStats.xp} XP
                      </span>

                      <span className="rounded-full border border-purple-300/15 bg-purple-300/10 px-3 py-1 text-sm text-purple-100">
                        {accountStats.cards} cartas
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
                    className="mt-6 inline-flex items-center gap-2 rounded-full border border-yellow-300/20 bg-yellow-300/10 px-5 py-3 text-sm font-bold text-yellow-100 transition hover:bg-yellow-300/20"
                  >
                    <ShieldCheck size={18} />
                    Painel Admin
                  </button>
                )}

                <div className="mt-7 grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <AccountActionCard
                    icon={<UserRound size={22} />}
                    title="Meu Perfil"
                    description="Veja seu nível, XP, progresso, badges e atividade dentro do Creator Nexus."
                    buttonLabel="Abrir"
                    variant="cyan"
                    onClick={() => setProfileOpen(true)}
                  />

                  <AccountActionCard
                    icon={<Archive size={22} />}
                    title="Minha Coleção"
                    description="Acesse suas cartas conquistadas, raridades, criadoresfavoritos e progresso da coleção."
                    buttonLabel="Abrir"
                    variant="purple"
                    onClick={() => setCollectionOpen(true)}
                  />

                  <AccountActionCard
                    icon={<BadgeCheck size={22} />}
                    title="Minhas Badges"
                    description="Conquistas especiais por seguir criadores, compartilhar perfis e completar objetivos."
                    buttonLabel="Em breve"
                    variant="yellow"
                    disabled
                  />

                  <AccountActionCard
                    icon={<Target size={22} />}
                    title="Missões"
                    description="Complete desafios para ganhar pacotes, cartas especiais e recompensas do Nexus."
                    buttonLabel="Abrir"
                    variant="emerald"
                    onClick={() => setMissionsOpen(true)}
                  />

                  <AccountActionCard
                    icon={<Package size={22} />}
                    title="Pacotes"
                    description="Abra pacotes diários, pacotes de missão e eventos para desbloquear novas cartas."
                    buttonLabel="Abrir"
                    variant="pink"
                    onClick={() => setPacksOpen(true)}
                  />

                  <div className="flex h-full flex-col rounded-3xl border border-cyan-300/15 bg-cyan-300/[0.04] p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
                        <ShieldCheck size={22} />
                      </div>

                      <h3 className="font-bold">Solicitar perfil de criador</h3>
                    </div>

                    <p className="mt-2 flex-1 text-sm text-white/55">
                      Envie seus dados, redes sociais e prova de posse do canal
                      para entrar na fila de aprovação.
                    </p>

                    <button
                      type="button"
                      onClick={() => setRequestOpen(true)}
                      className="mt-4 w-fit rounded-full bg-cyan-300 px-5 py-2 text-sm font-bold text-black transition hover:scale-105"
                    >
                      Começar solicitação
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onLogout}
                  className="mt-6 inline-flex items-center gap-2 rounded-full border border-red-300/20 bg-red-300/10 px-5 py-3 text-sm text-red-100 transition hover:bg-red-300/20"
                >
                  <LogOut size={18} />
                  Sair da conta
                </button>
              </div>
            </motion.div>
          </motion.div>
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

      <PacksModal
        open={packsOpen}
        onClose={() => setPacksOpen(false)}
      />
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
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonLabel: string;
  variant: "cyan" | "purple" | "yellow" | "emerald" | "pink";
  disabled?: boolean;
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
    <div className={`flex h-full flex-col rounded-3xl border p-4 ${styles.card}`}>
      <div className="flex items-center gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${styles.icon}`}
        >
          {icon}
        </div>

        <h3 className="font-bold">{title}</h3>
      </div>

      <p className="mt-2 flex-1 text-sm text-white/55">{description}</p>

      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`mt-4 w-fit rounded-full border px-5 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${styles.button}`}
      >
        {buttonLabel}
      </button>
    </div>
  );
}
