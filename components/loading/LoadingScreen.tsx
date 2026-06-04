"use client";

import { motion } from "framer-motion";

import { useLanguage } from "@/contexts/LanguageContext";
import { translate } from "@/lib/i18n/translate";

export function LoadingScreen() {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed inset-0 z-[999] flex items-center justify-center overflow-hidden bg-black text-white"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.18),transparent_46%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(217,70,239,0.16),transparent_32%),radial-gradient(circle_at_80%_78%,rgba(14,165,233,0.12),transparent_34%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:44px_44px] opacity-45" />
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-purple-950/35 to-transparent" />

      {[...Array(18)].map((_, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: [0.15, 0.75, 0.15], y: [18, -22, 18] }}
          transition={{
            duration: 3.2 + (index % 5) * 0.45,
            repeat: Infinity,
            delay: index * 0.16,
            ease: "easeInOut",
          }}
          className="absolute h-1 w-1 rounded-full bg-cyan-200 shadow-[0_0_14px_rgba(34,211,238,0.85)]"
          style={{
            left: `${8 + ((index * 17) % 84)}%`,
            top: `${12 + ((index * 23) % 74)}%`,
          }}
        />
      ))}

      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
        className="absolute h-[440px] w-[440px] rounded-full border border-cyan-300/10"
      />

      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="absolute h-[310px] w-[310px] rounded-full border border-fuchsia-300/10"
      />

      <div className="relative flex w-full max-w-xl flex-col items-center px-6 text-center">
        <motion.div
          initial={{ scale: 0.72, opacity: 0, y: 18, rotate: -8 }}
          animate={{ scale: 1, opacity: 1, y: 0, rotate: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative flex h-32 w-24 items-center justify-center rounded-[24px] border border-cyan-300/35 bg-[radial-gradient(circle_at_72%_18%,rgba(34,211,238,0.30),transparent_30%),radial-gradient(circle_at_18%_82%,rgba(217,70,239,0.22),transparent_34%),linear-gradient(145deg,rgba(255,255,255,0.13),rgba(255,255,255,0.025))] shadow-[0_0_90px_rgba(34,211,238,0.34)]"
        >
          <motion.div
            animate={{
              scale: [1, 1.16, 1],
              opacity: [0.35, 0.75, 0.35],
            }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -inset-5 rounded-[34px] bg-cyan-300/20 blur-2xl"
          />

          <motion.div
            animate={{ rotate: [0, 2.5, -2.5, 0], y: [0, -4, 0] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-2 rounded-[18px] border border-white/12 bg-black/50"
          />

          <div className="absolute left-1/2 top-4 h-1.5 w-12 -translate-x-1/2 rounded-full bg-cyan-200/80 shadow-[0_0_18px_rgba(34,211,238,0.95)]" />
          <div className="absolute bottom-4 left-4 h-2 w-2 rounded-full bg-fuchsia-300 shadow-[0_0_18px_rgba(217,70,239,0.9)]" />
          <div className="absolute right-4 top-5 h-2 w-2 rounded-full border border-cyan-100/55" />

          <motion.span
            animate={{ scale: [1, 1.08, 1], opacity: [0.9, 1, 0.9] }}
            transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }}
            className="relative text-5xl font-black leading-none text-white drop-shadow-[0_0_24px_rgba(34,211,238,0.65)]"
          >
            ◈
          </motion.span>

          <motion.div
            animate={{ x: ["-140%", "170%"] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 h-full w-10 rotate-12 bg-white/10 blur-md"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 flex flex-col items-center leading-none"
        >
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-cyan-300/70 shadow-[0_0_14px_rgba(34,211,238,0.85)]" />
            <span className="bg-gradient-to-r from-cyan-100 via-white to-fuchsia-100 bg-clip-text text-2xl font-black uppercase tracking-[0.34em] text-transparent md:text-4xl">
              Card
            </span>
          </div>

          <div className="-mt-1 flex items-center gap-3 pl-16">
            <span className="bg-gradient-to-r from-white via-fuchsia-100 to-cyan-100 bg-clip-text text-3xl font-black uppercase tracking-[0.24em] text-transparent md:text-5xl">
              Poc
            </span>
            <span className="h-2 w-2 rounded-full bg-fuchsia-200 shadow-[0_0_18px_rgba(217,70,239,0.9)]" />
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
          className="mt-5 text-xs font-bold uppercase tracking-[0.32em] text-cyan-100/65"
        >
          {translate(t, "brandTaglineShort", "Colecione criadores")}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-5 text-2xl font-black tracking-tight md:text-4xl"
        >
          {translate(t, "loadingScreenTitle", "Carregando sua coleção")}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.45, 1, 0.45] }}
          transition={{ delay: 0.8, duration: 1.8, repeat: Infinity }}
          className="mt-4 text-sm text-white/45"
        >
          {translate(t, "loadingScreenDescription", "Sincronizando cartas, packs e conquistas...")}
        </motion.p>

        <div className="mt-8 h-2 w-full max-w-xs overflow-hidden rounded-full border border-white/10 bg-white/5">
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 1.45, repeat: Infinity, ease: "easeInOut" }}
            className="h-full w-1/2 rounded-full bg-gradient-to-r from-cyan-300 via-white to-fuchsia-300 shadow-[0_0_24px_rgba(34,211,238,0.8)]"
          />
        </div>
      </div>
    </motion.div>
  );
}
