"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2, ShieldCheck } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { translate } from "@/lib/i18n/translate";
import { supabase } from "@/lib/supabase/client";

const AdminPanelModal = dynamic(
  () =>
    import("@/components/admin/AdminPanelModal").then(
      (module) => module.AdminPanelModal,
    ),
  {
    ssr: false,
    loading: () => null,
  },
);

export function AdminFloatingButton() {
  const { t } = useLanguage();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadAdminStatus(userId?: string | null) {
      if (!userId) {
        if (!mounted) return;
        setIsAdmin(false);
        setCheckingAdmin(false);
        return;
      }

      if (!mounted) return;
      setCheckingAdmin(true);

      const { data, error } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", userId)
        .maybeSingle();

      if (!mounted) return;

      setIsAdmin(!error && Boolean(data?.is_admin));
      setCheckingAdmin(false);
    }

    supabase.auth
      .getSession()
      .then(({ data }) => loadAdminStatus(data.session?.user.id ?? null))
      .catch(() => {
        if (!mounted) return;
        setIsAdmin(false);
        setCheckingAdmin(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void loadAdminStatus(session?.user.id ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (checkingAdmin || !isAdmin) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setPanelOpen(true)}
        aria-label={translate(t, "adminOpenPanel", "Abrir painel admin")}
        title={translate(t, "adminPanelTitle", "Painel Admin")}
        className="fixed bottom-5 left-5 z-[70] inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/25 bg-black/70 text-cyan-100 shadow-[0_0_28px_rgba(34,211,238,0.22)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-cyan-200/45 hover:bg-cyan-300/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/40 active:translate-y-0 sm:h-14 sm:w-14"
      >
        <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-300/12 via-transparent to-fuchsia-400/10" />
        <span className="relative">
          {panelOpen ? (
            <Loader2 size={21} className="animate-spin" />
          ) : (
            <ShieldCheck size={22} />
          )}
        </span>
      </button>

      {panelOpen && (
        <AdminPanelModal open={panelOpen} onClose={() => setPanelOpen(false)} />
      )}
    </>
  );
}
