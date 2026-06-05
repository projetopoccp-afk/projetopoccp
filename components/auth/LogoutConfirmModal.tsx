"use client";

import { LogOut, X } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { CardpocModalShell } from "@/components/ui/CardpocModalShell";

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
        <CardpocModalShell
          onClose={onClose}
          zIndexClassName="z-[90]"
          className="h-auto max-h-[calc(100vh-2rem)] max-w-sm"
          contentClassName="p-6"
        >
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
        </CardpocModalShell>
      )}
    </AnimatePresence>
  );
}
