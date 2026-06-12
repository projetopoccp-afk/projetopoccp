"use client";

import dynamic from "next/dynamic";
import { AnimatePresence } from "framer-motion";
import { ShieldCheck } from "lucide-react";

import { CardpocModalShell } from "@/components/ui/CardpocModalShell";
import {
  ADMIN_TABS,
  translate,
  translateExisting,
  useAdminPanelController,
  type AdminPanelModalProps,
} from "./hooks/useAdminPanelController";

const AdminRequestsTab = dynamic(() => import("./tabs/AdminRequestsTab"), { ssr: false });
const AdminUsersTab = dynamic(() => import("./tabs/AdminUsersTab"), { ssr: false });
const AdminCreatorsTab = dynamic(() => import("./tabs/AdminCreatorsTab"), { ssr: false });
const AdminCreatorDetectorTab = dynamic(() => import("./tabs/AdminCreatorDetectorTab"), { ssr: false });
const AdminCardsTab = dynamic(() => import("./tabs/AdminCardsTab"), { ssr: false });
const AdminClaimsTab = dynamic(() => import("./tabs/AdminClaimsTab"), { ssr: false });
const AdminPartnershipsTab = dynamic(() => import("./tabs/AdminPartnershipsTab"), { ssr: false });
const AdminConversationsTab = dynamic(() => import("./tabs/AdminConversationsTab"), { ssr: false });
const AdminLogsTab = dynamic(() => import("./tabs/AdminLogsTab"), { ssr: false });
const AdminStatisticsTab = dynamic(() => import("./tabs/AdminStatisticsTab"), { ssr: false });
const AdminGlobalOverlays = dynamic(() => import("./tabs/AdminGlobalOverlays"), { ssr: false });

export function AdminPanelModal({ open, onClose }: AdminPanelModalProps) {
  const ctx = useAdminPanelController({ open, onClose });
  const { activeTab, setActiveTab, loading, t, getTabCounter } = ctx;

  return (
    <AnimatePresence>
      {open && (
        <CardpocModalShell
          onClose={onClose}
          showCloseButton
          closeLabel={translate(t, "adminClosePanel", "Fechar painel admin")}
          zIndexClassName="z-[95]"
          className="max-w-7xl"
          contentClassName="no-scrollbar max-h-[calc(100vh-1.5rem)] overflow-y-auto p-6 md:p-8"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-300/20 bg-yellow-300/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-yellow-100">
            <ShieldCheck size={14} />
            {translate(t, "adminPanelBadge", "Admin Panel")}
          </div>

          <h2 className="mt-6 text-3xl font-black">
            {translate(t, "adminPanelTitle", "Painel Admin")}
          </h2>

          <p className="mt-2 text-sm text-white/50">
            {translate(t, "adminPanelDescription", "Gerencie solicitações, usuários, creators, reivindicações e atividades.")}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {ADMIN_TABS.map((tab) => {
              const counter = getTabCounter(tab.id);
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group flex min-h-[56px] min-w-0 items-center justify-between gap-2 rounded-2xl border px-4 py-2 text-left transition ${activeTab === tab.id ? "border-cyan-300 bg-cyan-300 text-black shadow-[0_0_28px_rgba(103,232,249,0.18)]" : "border-white/10 bg-white/[0.035] text-white/62 hover:border-white/18 hover:bg-white/[0.07] hover:text-white"}`}
                >
                  <span className="line-clamp-2 text-[12px] font-black leading-tight">
                    {translateExisting(t, tab.labelKey, tab.fallback)}
                  </span>
                  {counter !== null && (
                    <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-black leading-none ${activeTab === tab.id ? "bg-black/15 text-black" : "bg-white/10 text-white/70 group-hover:bg-white/15"}`}>
                      {counter}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {loading && (
            <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-white/60">
              {translate(t, "adminPanelLoading", "Carregando painel...")}
            </div>
          )}

          {!loading && activeTab === "requests" && <AdminRequestsTab ctx={ctx} />}
          {!loading && activeTab === "users" && <AdminUsersTab ctx={ctx} />}
          {!loading && activeTab === "creators" && <AdminCreatorsTab ctx={ctx} />}
          {!loading && activeTab === "creatorDetector" && <AdminCreatorDetectorTab ctx={ctx} />}
          {!loading && activeTab === "cards" && <AdminCardsTab ctx={ctx} />}
          {!loading && activeTab === "claims" && <AdminClaimsTab ctx={ctx} />}
          {!loading && activeTab === "partnerships" && <AdminPartnershipsTab ctx={ctx} />}
          {!loading && activeTab === "conversations" && <AdminConversationsTab ctx={ctx} />}
          {!loading && activeTab === "logs" && <AdminLogsTab ctx={ctx} />}
          {!loading && activeTab === "statistics" && <AdminStatisticsTab ctx={ctx} />}
          <AdminGlobalOverlays ctx={ctx} />
        </CardpocModalShell>
      )}
    </AnimatePresence>
  );
}
