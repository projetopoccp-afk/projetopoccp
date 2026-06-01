"use client";

import { motion } from "framer-motion";
import { Sparkles, UserRound } from "lucide-react";

export function LoadingScreen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed inset-0 z-[999] flex items-center justify-center overflow-hidden bg-black text-white"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.16),transparent_48%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(88,28,135,0.16))]" />

      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        className="absolute h-[420px] w-[420px] rounded-full border border-cyan-300/10"
      />

      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
        className="absolute h-[300px] w-[300px] rounded-full border border-purple-300/10"
      />

      <div className="relative flex w-full max-w-xl flex-col items-center px-6 text-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative flex h-24 w-24 items-center justify-center rounded-[32px] border border-cyan-300/20 bg-cyan-300/10 shadow-[0_0_80px_rgba(34,211,238,0.35)]"
        >
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.35, 0.75, 0.35],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-[32px] bg-cyan-300/20 blur-xl"
          />

          <motion.div
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-black/40"
          >
            <UserRound className="text-cyan-100" size={30} />
          </motion.div>

          <motion.div
            animate={{ y: [-4, 4, -4], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-2 -top-2 rounded-full border border-yellow-300/20 bg-yellow-300/10 p-2 text-yellow-100"
          >
            <Sparkles size={16} />
          </motion.div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 text-xs uppercase tracking-[0.45em] text-cyan-100"
        >
          Creator Nexus
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-4 text-3xl font-black tracking-tight md:text-5xl"
        >
          Preparando seu universo
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.45, 1, 0.45] }}
          transition={{ delay: 0.7, duration: 1.8, repeat: Infinity }}
          className="mt-4 text-sm text-white/45"
        >
          Sincronizando creators, cartas e conquistas...
        </motion.p>

        <div className="mt-8 h-2 w-full max-w-xs overflow-hidden rounded-full border border-white/10 bg-white/5">
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="h-full w-1/2 rounded-full bg-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.8)]"
          />
        </div>
      </div>
    </motion.div>
  );
}