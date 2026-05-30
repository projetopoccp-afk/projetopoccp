"use client";

import { useState } from "react";
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
import { CreatorRequestModal } from "@/components/creator-request/CreatorRequestModal";

type AccountProfile = {
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  is_admin: boolean | null;
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

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4"
          >
            <button
              onClick={onClose}
              className="absolute inset-0"
              aria-label="Fechar conta"
            />

            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.94 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-[32px] border border-white/15 bg-zinc-950 text-white shadow-[0_0_80px_rgba(0,0,0,0.9)]"
            >
              <div className="absolute -left-24 -top-24 h-56 w-56 rounded-full bg-cyan-500/20 blur-[90px]" />
              <div className="absolute -bottom-24 -right-24 h-56 w-56 rounded-full bg-purple-600/20 blur-[90px]" />

              <button
                onClick={onClose}
                className="absolute right-5 top-5 z-10 rounded-full border border-white/10 bg-white/5 p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>

              <div className="relative z-10 max-h-[90vh] overflow-y-auto p-8">
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
                        Nível 1
                      </span>

                      <span className="rounded-full border border-purple-300/15 bg-purple-300/10 px-3 py-1 text-sm text-purple-100">
                        0 cartas
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
                    onClick={() => setAdminOpen(true)}
                    className="mt-6 inline-flex items-center gap-2 rounded-full border border-yellow-300/20 bg-yellow-300/10 px-5 py-3 text-sm font-bold text-yellow-100 transition hover:bg-yellow-300/20"
                  >
                    <ShieldCheck size={18} />
                    Painel Admin
                  </button>
                )}

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <AccountActionCard
                    icon={<UserRound size={22} />}
                    title="Meu Perfil"
                    description="Veja seu nível, progresso, badges e atividade dentro do Creator Nexus."
                    buttonLabel="Em breve"
                    variant="cyan"
                    disabled
                  />

                  <AccountActionCard
                    icon={<Archive size={22} />}
                    title="Minha Coleção"
                    description="Acesse suas cartas conquistadas, raridades, creators favoritos e progresso da coleção."
                    buttonLabel="Em breve"
                    variant="purple"
                    disabled
                  />

                  <AccountActionCard
                    icon={<BadgeCheck size={22} />}
                    title="Minhas Badges"
                    description="Conquistas especiais por seguir creators, compartilhar perfis e completar objetivos."
                    buttonLabel="Em breve"
                    variant="yellow"
                    disabled
                  />

                  <AccountActionCard
                    icon={<Target size={22} />}
                    title="Missões"
                    description="Complete desafios para ganhar pacotes, cartas especiais e recompensas do Nexus."
                    buttonLabel="Em breve"
                    variant="emerald"
                    disabled
                  />

                  <AccountActionCard
                    icon={<Package size={22} />}
                    title="Pacotes"
                    description="Abra pacotes diários, pacotes de missão e eventos para desbloquear novas cartas."
                    buttonLabel="Em breve"
                    variant="pink"
                    disabled
                  />

                  <div className="rounded-3xl border border-cyan-300/15 bg-cyan-300/[0.04] p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
                        <ShieldCheck size={22} />
                      </div>

                      <h3 className="font-bold">Solicitar perfil de criador</h3>
                    </div>

                    <p className="mt-3 text-sm text-white/55">
                      Envie seus dados, redes sociais e prova de posse do canal
                      para entrar na fila de aprovação.
                    </p>

                    <button
                      onClick={() => setRequestOpen(true)}
                      className="mt-5 rounded-full bg-cyan-300 px-5 py-2 text-sm font-bold text-black transition hover:scale-105"
                    >
                      Começar solicitação
                    </button>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  className="mt-8 inline-flex items-center gap-2 rounded-full border border-red-300/20 bg-red-300/10 px-5 py-3 text-sm text-red-100 transition hover:bg-red-300/20"
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

      <AdminPanelModal
        open={adminOpen}
        onClose={() => setAdminOpen(false)}
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
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonLabel: string;
  variant: "cyan" | "purple" | "yellow" | "emerald" | "pink";
  disabled?: boolean;
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
    <div className={`rounded-3xl border p-5 ${styles.card}`}>
      <div className="flex items-center gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${styles.icon}`}
        >
          {icon}
        </div>

        <h3 className="font-bold">{title}</h3>
      </div>

      <p className="mt-3 text-sm text-white/55">{description}</p>

      <button
        disabled={disabled}
        className={`mt-5 rounded-full border px-5 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${styles.button}`}
      >
        {buttonLabel}
      </button>
    </div>
  );
}
