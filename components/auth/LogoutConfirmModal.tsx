"use client";

import { LogOut, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

type LogoutConfirmModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
};

type TranslateFunction = (key: any) => string;

function translate(t: TranslateFunction, key: string, fallback: string) {
  const value = t(key);

  return value && value !== key ? value : fallback;
}

export function LogoutConfirmModal({
  open,
  onClose,
  onConfirm,
}: LogoutConfirmModalProps) {
  const { t } = useLanguage();

  async function handleConfirm() {
    await onConfirm();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 backdrop-blur-xl"
          initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
          animate={{ opacity: 1, backdropFilter: "blur(18px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          onMouseDown={onClose}
        >
          <motion.div
            className="relative w-full max-w-sm overflow-hidden rounded-[2rem] border border-white/10 bg-[#070915]/95 p-6 text-white shadow-2xl shadow-black/60"
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-red-500/20 blur-3xl" />
            <div className="absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-cyan-400/10 blur-3xl" />

            <button
              type="button"
              onClick={onClose}
              aria-label={translate(t, "logoutConfirmClose", "Fechar confirmação")}
              className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/5 p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="relative">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-red-300/20 bg-red-300/10 text-red-100">
                <LogOut size={22} />
              </div>

              <h2 className="text-xl font-black text-white">
                {translate(t, "logoutConfirmTitle", "Deseja realmente sair?")}
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-white/60">
                {translate(
                  t,
                  "logoutConfirmDescription",
                  "Você precisará entrar novamente para acessar sua conta, coleção e notificações."
                )}
              </p>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-bold text-white/80 transition hover:bg-white/10 hover:text-white"
                >
                  {translate(t, "logoutConfirmCancel", "Cancelar")}
                </button>

                <button
                  type="button"
                  onClick={handleConfirm}
                  className="rounded-full border border-red-300/30 bg-red-400/15 px-5 py-3 text-sm font-black text-red-100 transition hover:bg-red-400/25"
                >
                  {translate(t, "logoutConfirmAction", "Sair")}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
