"use client";

import { LogOut, ShieldCheck, UserRound, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

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
  return (
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
            className="relative w-full max-w-xl overflow-hidden rounded-[32px] border border-white/15 bg-zinc-950 p-8 text-white shadow-[0_0_80px_rgba(0,0,0,0.9)]"
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

            <div className="relative z-10">
              <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-cyan-100">
                Minha Conta
              </div>

              <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
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

                <div>
                  <h2 className="text-3xl font-black leading-tight">
                    {profile?.display_name || "Creator"}
                  </h2>

                  <p className="mt-1 text-white/45">{email}</p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm text-white/60">
                      @{profile?.username || "sem_username"}
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

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-cyan-300/15 bg-cyan-300/[0.04] p-5">
                  <h3 className="font-bold">Solicitar perfil de criador</h3>

                  <p className="mt-2 text-sm text-white/55">
                    Envie seus dados, redes sociais e prova de posse do canal
                    para entrar na fila de aprovação.
                  </p>

                  <button className="mt-5 rounded-full bg-cyan-300 px-5 py-2 text-sm font-bold text-black transition hover:scale-105">
                    Começar solicitação
                  </button>
                </div>

                <div className="rounded-3xl border border-purple-300/15 bg-purple-300/[0.04] p-5">
                  <h3 className="font-bold">Coleção de creators</h3>

                  <p className="mt-2 text-sm text-white/55">
                    Em breve você poderá seguir, favoritar e colecionar cards de
                    creators.
                  </p>

                  <button className="mt-5 rounded-full border border-white/10 bg-white/[0.04] px-5 py-2 text-sm text-white/60">
                    Em breve
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
  );
}