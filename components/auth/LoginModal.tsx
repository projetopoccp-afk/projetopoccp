"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

type LoginModalProps = {
  open: boolean;
  onClose: () => void;
};

export function LoginModal({ open, onClose }: LoginModalProps) {
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
            aria-label="Fechar login"
          />

          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.94 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-white/15 bg-zinc-950 p-8 text-white shadow-[0_0_80px_rgba(0,0,0,0.9)]"
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
                Creator Access
              </div>

              <h2 className="mt-6 text-3xl font-black leading-tight">
                Entre no seu perfil digital
              </h2>

              <p className="mt-3 text-sm text-white/55">
                Faça login para criar seu perfil, evoluir seu card,
                desbloquear achievements e participar da reputação digital.
              </p>

              <div className="mt-8 space-y-3">
                <button className="w-full rounded-2xl border border-indigo-300/20 bg-indigo-400/10 px-5 py-4 text-left transition hover:bg-indigo-400/20">
                  <p className="font-bold text-white">
                    Continuar com Discord
                  </p>
                  <p className="mt-1 text-xs text-white/45">
                    Ideal para creators, comunidades e servidores.
                  </p>
                </button>

                <button
  onClick={async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
  }}
  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-left transition hover:bg-white/[0.08]"
>
  <p className="font-bold text-white">
    Continuar com Google
  </p>

  <p className="mt-1 text-xs text-white/45">
    Acesso rápido para criar ou gerenciar seu perfil.
  </p>
</button>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-white/35">
                  Creator onboarding
                </p>

                <p className="mt-2 text-sm text-white/55">
                  Novos perfis passam por uma etapa de pré-cadastro e aprovação
                  para manter a plataforma segura, autêntica e premium.
                </p>
              </div>

              <p className="mt-6 text-center text-xs text-white/35">
                Login real será conectado ao Supabase Auth na próxima etapa.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}