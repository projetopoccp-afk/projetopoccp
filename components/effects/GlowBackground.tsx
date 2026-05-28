"use client";

export function GlowBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-black" />

      <div className="absolute -left-32 -top-32 h-[620px] w-[620px] animate-pulse rounded-full bg-cyan-500/15 blur-[150px]" />

      <div className="absolute -bottom-40 -right-32 h-[680px] w-[680px] animate-pulse rounded-full bg-purple-600/18 blur-[170px]" />

      <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-500/10 blur-[160px]" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(34,211,238,0.10),transparent_28%),radial-gradient(circle_at_20%_80%,rgba(168,85,247,0.12),transparent_28%),radial-gradient(circle_at_80%_70%,rgba(236,72,153,0.10),transparent_30%)]" />

      <div className="absolute inset-0 opacity-[0.09] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:90px_90px]" />

      <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(34,211,238,0.25)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.25)_1px,transparent_1px)] [background-size:180px_180px]" />

      <div className="absolute left-1/2 top-0 h-full w-px bg-gradient-to-b from-transparent via-cyan-300/20 to-transparent" />

      <div className="absolute top-1/2 h-px w-full bg-gradient-to-r from-transparent via-purple-300/20 to-transparent" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent,rgba(0,0,0,0.78)_72%)]" />
    </div>
  );
}