"use client";

import { Search } from "lucide-react";

type CreatorSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

export function CreatorSearch({ value, onChange }: CreatorSearchProps) {
  return (
    <div className="relative w-full max-w-md">
      <Search
        size={18}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
      />

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Buscar creators, ranks, tags..."
        className="w-full rounded-full border border-white/10 bg-white/[0.03] py-3 pl-11 pr-4 text-sm text-white outline-none backdrop-blur-xl transition placeholder:text-white/40 focus:border-cyan-300/40 focus:bg-cyan-300/10"
      />
    </div>
  );
}