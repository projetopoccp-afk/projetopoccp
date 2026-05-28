"use client";

import { motion } from "framer-motion";

export function LoadingScreen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black text-white"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.14),transparent_55%)]" />

      <div className="relative flex flex-col items-center text-center">
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="h-16 w-16 rounded-full border border-cyan-300/40 bg-cyan-300/10 shadow-[0_0_60px_rgba(34,211,238,0.45)]"
        />

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-8 text-xs uppercase tracking-[0.45em] text-cyan-100"
        >
          Initializing Creator Nexus
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mt-4 text-3xl font-black tracking-tight md:text-5xl"
        >
          Scanning digital identities
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.35, 1, 0.35] }}
          transition={{
            delay: 0.8,
            duration: 1.8,
            repeat: Infinity,
          }}
          className="mt-5 text-sm text-white/45"
        >
          Loading legendary creators...
        </motion.p>
      </div>
    </motion.div>
  );
}