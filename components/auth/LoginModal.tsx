"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase/client";
import { CardpocModalShell } from "@/components/ui/CardpocModalShell";

type LoginModalProps = {
  open: boolean;
  onClose: () => void;
};

export function LoginModal({ open, onClose }: LoginModalProps) {
  const { t } = useLanguage();
  const [banMessage, setBanMessage] = useState<string | null>(null);
  const [isCheckingBan, setIsCheckingBan] = useState(false);

  function tx(key: string, fallback: string) {
    const value = (t as (translationKey: any) => string)(key);

    return value && value !== key ? value : fallback;
  }

  const blockedAccountMessage = tx(
    "loginModalBannedAccountMessage",
    "Sua conta foi suspensa no Cardpoc. Para solicitar desbloqueio, entre em contato com um administrador.",
  );

  async function checkBannedAccount(userId: string) {
    setIsCheckingBan(true);

    const { data, error } = await supabase
      .from("profiles")
      .select("is_banned")
      .eq("id", userId)
      .maybeSingle();

    setIsCheckingBan(false);

    if (error) {
      return false;
    }

    if (data?.is_banned) {
      await supabase.auth.signOut();
      setBanMessage(blockedAccountMessage);

      return true;
    }

    setBanMessage(null);

    return false;
  }

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      const userId = data.session?.user.id;

      if (!isMounted || !userId) {
        return;
      }

      await checkBannedAccount(userId);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session?.user.id) {
        void checkBannedAccount(session.user.id);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [blockedAccountMessage]);

  function handleClose() {
    setBanMessage(null);
    onClose();
  }

  const shouldShowModal = open || Boolean(banMessage);

  return (
    <AnimatePresence>
      {shouldShowModal && (
        <CardpocModalShell
          onClose={handleClose}
          showCloseButton
          closeLabel={tx("close", "Fechar")}
          zIndexClassName="z-[80]"
          className="max-w-lg"
          contentClassName="hide-scrollbar max-h-[calc(100vh-1.5rem)] overflow-y-auto p-7 pb-12 sm:p-8 sm:pb-12"
        >
            <div className="relative z-10">
              <div className="flex items-start gap-4">
                <motion.div
                  animate={{ y: [0, -5, 0], rotate: [-2, 2, -2] }}
                  transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
                  className="relative hidden h-28 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[20px] border border-cyan-300/30 bg-[radial-gradient(circle_at_72%_18%,rgba(34,211,238,0.32),transparent_30%),radial-gradient(circle_at_18%_82%,rgba(217,70,239,0.22),transparent_34%),linear-gradient(145deg,rgba(255,255,255,0.12),rgba(255,255,255,0.02))] shadow-[0_0_48px_rgba(34,211,238,0.24)] sm:flex"
                >
                  <div className="absolute inset-2 rounded-[15px] border border-white/10 bg-black/48" />
                  <div className="absolute left-1/2 top-3 h-1.5 w-10 -translate-x-1/2 rounded-full bg-cyan-200/80 shadow-[0_0_16px_rgba(34,211,238,0.9)]" />
                  <div className="absolute bottom-3 left-3 h-2 w-2 rounded-full bg-fuchsia-300 shadow-[0_0_16px_rgba(217,70,239,0.85)]" />
                  <span className="relative text-4xl font-black text-white drop-shadow-[0_0_20px_rgba(34,211,238,0.55)]">
                    ◈
                  </span>
                  <motion.div
                    animate={{ x: ["-150%", "170%"] }}
                    transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-0 h-full w-9 rotate-12 bg-white/10 blur-md"
                  />
                </motion.div>

                <div className="min-w-0 flex-1">
                  <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-cyan-100">
                    {tx("loginModalBadge", "Acesso à coleção")}
                  </div>

                  <div className="mt-5 flex flex-col leading-none">
                    <div className="flex items-center gap-2">
                      <span className="h-px w-6 bg-cyan-300/70 shadow-[0_0_12px_rgba(34,211,238,0.85)]" />
                      <span className="bg-gradient-to-r from-cyan-100 via-white to-white bg-clip-text text-2xl font-black uppercase tracking-[0.25em] text-transparent">
                        Card
                      </span>
                    </div>

                    <div className="-mt-0.5 flex items-center gap-2 pl-10">
                      <span className="bg-gradient-to-r from-white via-fuchsia-100 to-cyan-100 bg-clip-text text-3xl font-black uppercase tracking-[0.18em] text-transparent">
                        Poc
                      </span>
                      <span className="h-2 w-2 rounded-full bg-fuchsia-200 shadow-[0_0_16px_rgba(217,70,239,0.9)]" />
                    </div>
                  </div>
                </div>
              </div>

              <h2 className="mt-7 text-3xl font-black leading-tight sm:text-4xl">
                {tx("loginModalTitle", "Colecione criadores.")}
              </h2>

              <p className="mt-3 text-sm leading-6 text-white/58">
                {tx("loginModalDescription",
                  "Entre para ganhar cartas, abrir packs, seguir seus criadores favoritos e completar sua coleção no Cardpoc."
                )}
              </p>

              {banMessage ? (
                <div className="mt-5 rounded-[22px] border border-red-300/25 bg-red-500/10 p-4 shadow-[0_0_28px_rgba(248,113,113,0.10)]">
                  <p className="text-sm font-black text-red-100">
                    {tx("loginModalBannedAccountTitle", "Conta suspensa")}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-red-100/70">
                    {banMessage}
                  </p>
                </div>
              ) : null}

              <div className="mt-6 grid gap-2 rounded-[22px] border border-white/10 bg-white/[0.035] p-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.045] p-3">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-100/80">
                    {tx("loginModalPillarCards", "Cartas")}
                  </p>
                  <p className="mt-1 text-xs text-white/45">
                    {tx("loginModalPillarCardsDescription", "Ganhe e evolua")}
                  </p>
                </div>

                <div className="rounded-2xl border border-fuchsia-300/10 bg-fuchsia-300/[0.045] p-3">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-fuchsia-100/80">
                    {tx("loginModalPillarPacks", "Packs")}
                  </p>
                  <p className="mt-1 text-xs text-white/45">
                    {tx("loginModalPillarPacksDescription", "Abra recompensas")}
                  </p>
                </div>

                <div className="rounded-2xl border border-yellow-300/10 bg-yellow-300/[0.045] p-3">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-yellow-100/80">
                    {tx("loginModalPillarCollection", "Coleção")}
                  </p>
                  <p className="mt-1 text-xs text-white/45">
                    {tx("loginModalPillarCollectionDescription", "Complete sua galeria")}
                  </p>
                </div>
              </div>

              <div className="mt-7 space-y-3">
                <button
                  onClick={async () => {
                    await supabase.auth.signInWithOAuth({
                      provider: "discord",
                      options: {
                        redirectTo: window.location.origin,
                      },
                    });
                  }}
                  className="group w-full rounded-2xl border border-indigo-300/25 bg-indigo-400/10 px-5 py-4 text-left transition hover:border-indigo-200/45 hover:bg-indigo-400/20 hover:shadow-[0_0_28px_rgba(129,140,248,0.14)]"
                >
                  <p className="font-bold text-white">
                    {tx("loginModalContinueDiscord", "Continuar com Discord")}
                  </p>

                  <p className="mt-1 text-xs text-white/45 transition group-hover:text-white/60">
                    {tx("loginModalDiscordDescription",
                      "Entre com sua comunidade e continue sua coleção."
                    )}
                  </p>
                </button>

                <button
                  onClick={async () => {
                    setBanMessage(null);

                    await supabase.auth.signInWithOAuth({
                      provider: "google",
                      options: {
                        redirectTo: window.location.origin,
                      },
                    });
                  }}
                  disabled={isCheckingBan}
                  className="group w-full rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-left transition hover:border-cyan-200/25 hover:bg-white/[0.08] hover:shadow-[0_0_28px_rgba(34,211,238,0.10)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <p className="font-bold text-white">
                    {tx("loginModalContinueGoogle", "Continuar com Google")}
                  </p>

                  <p className="mt-1 text-xs text-white/45 transition group-hover:text-white/60">
                    {tx("loginModalGoogleDescription",
                      "Acesso rápido para seguir criadores e gerenciar sua conta."
                    )}
                  </p>
                </button>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-cyan-100/45">
                  {tx("loginModalOnboardingLabel", "Criador no Cardpoc")}
                </p>

                <p className="mt-2 text-sm leading-6 text-white/55">
                  {tx("loginModalOnboardingDescription",
                    "Perfis de criadores passam por curadoria para manter cartas autênticas, raridades especiais e uma coleção premium."
                  )}
                </p>
              </div>

              <p className="mt-6 text-center text-xs text-white/35">
                {tx("loginModalSupabaseNotice",
                  "Seu progresso fica salvo com segurança na sua conta Cardpoc."
                )}
              </p>
            </div>
        </CardpocModalShell>
      )}
    </AnimatePresence>
  );
}
