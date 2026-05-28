"use client";

import { User } from "lucide-react";

import { CreatorSearch } from "@/components/home/CreatorSearch";

type SiteHeaderProps = {
  search: string;
  onSearchChange: (value: string) => void;
};

export function SiteHeader({ search, onSearchChange }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/50 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:h-20 md:flex-row md:items-center md:justify-between md:gap-6 md:px-6 md:py-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.9)]" />

            <h1 className="text-sm font-black uppercase tracking-[0.25em] text-white sm:text-lg sm:tracking-[0.3em]">
              Creator Nexus
            </h1>
          </div>

          <button className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.06] md:hidden">
            <User size={16} />
            Entrar
          </button>
        </div>

        <div className="w-full md:max-w-md">
          <CreatorSearch value={search} onChange={onSearchChange} />
        </div>

        <button className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.06] md:flex">
          <User size={18} />
          Entrar
        </button>
      </div>
    </header>
  );
}