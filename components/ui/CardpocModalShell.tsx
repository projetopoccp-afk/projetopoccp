"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

type CardpocModalShellProps = {
  children: ReactNode;
  onClose?: () => void;
  className?: string;
  contentClassName?: string;
  zIndexClassName?: string;
};

export function CardpocModalShell({
  children,
  onClose,
  className = "",
  contentClassName = "",
  zIndexClassName = "z-[130]",
}: CardpocModalShellProps) {
  return (
    <motion.div
      initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
      animate={{ opacity: 1, backdropFilter: "blur(14px)" }}
      exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
      transition={{ duration: 0.25 }}
      onClick={onClose}
      className={`fixed inset-0 ${zIndexClassName} flex items-center justify-center overflow-hidden bg-black/82 p-3 text-white sm:p-4`}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.94 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        onClick={(event) => event.stopPropagation()}
        className={`relative flex h-[calc(100vh-1.5rem)] max-h-[790px] w-full max-w-7xl overflow-hidden rounded-[34px] border border-white/15 bg-[radial-gradient(circle_at_top_left,rgba(236,72,153,0.13),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.14),transparent_34%),linear-gradient(135deg,#06070b_0%,#07080d_48%,#02040a_100%)] shadow-[0_0_90px_rgba(0,0,0,0.92)] ${className}`}
      >
        <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:48px_48px]" />
        <div className="pointer-events-none absolute left-[-80px] top-[-80px] h-72 w-72 rounded-full bg-fuchsia-500/20 blur-[100px]" />
        <div className="pointer-events-none absolute bottom-[-90px] right-[-90px] h-72 w-72 rounded-full bg-cyan-400/18 blur-[100px]" />
        <div className="pointer-events-none absolute left-1/2 top-8 h-1/3 w-1/3 -translate-x-1/2 rounded-full bg-purple-500/10 blur-[120px]" />

        <div className={`relative z-10 h-full w-full ${contentClassName}`}>
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}