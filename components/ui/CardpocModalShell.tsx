"use client";

import type { ReactNode } from "react";
import { Minus, X } from "lucide-react";
import { motion } from "framer-motion";

type CardpocModalShellProps = {
  children: ReactNode;
  onClose?: () => void;
  onMinimize?: () => void;
  showCloseButton?: boolean;
  showMinimizeButton?: boolean;
  closeLabel?: string;
  minimizeLabel?: string;
  className?: string;
  contentClassName?: string;
  zIndexClassName?: string;
};

export function CardpocModalShell({
  children,
  onClose,
  onMinimize,
  showCloseButton = false,
  showMinimizeButton = false,
  closeLabel = "Fechar",
  minimizeLabel = "Minimizar",
  className = "",
  contentClassName = "",
  zIndexClassName = "z-[130]",
}: CardpocModalShellProps) {
  const hasControls =
    (showMinimizeButton && onMinimize) || (showCloseButton && onClose);

  return (
    <motion.div
      initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
      animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
      exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
      transition={{ duration: 0.25 }}
      onClick={onClose}
      className={`fixed inset-0 ${zIndexClassName} flex items-center justify-center overflow-hidden bg-black/70 p-3 text-white sm:p-4`}
    >
      <motion.div
        initial={{ opacity: 0, y: 26, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.96 }}
        transition={{ duration: 0.32, ease: "easeOut" }}
        onClick={(event) => event.stopPropagation()}
        className={`relative flex max-h-[calc(100vh-1.5rem)] w-full max-w-7xl overflow-hidden rounded-[34px] border border-cyan-200/18 bg-[radial-gradient(circle_at_18%_0%,rgba(236,72,153,0.22),transparent_34%),radial-gradient(circle_at_85%_100%,rgba(34,211,238,0.24),transparent_36%),radial-gradient(circle_at_50%_8%,rgba(168,85,247,0.16),transparent_38%),linear-gradient(135deg,#101322_0%,#0b1020_46%,#050813_100%)] shadow-[0_0_90px_rgba(34,211,238,0.13),0_0_120px_rgba(0,0,0,0.82)] ${className}`}
      >
        <div className="pointer-events-none absolute inset-0 opacity-[0.34] [background-image:linear-gradient(rgba(255,255,255,0.085)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.085)_1px,transparent_1px)] [background-size:42px_42px]" />

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.08)_45%,rgba(0,0,0,0.42)_100%)]" />

        <div className="pointer-events-none absolute left-[-70px] top-[-70px] h-80 w-80 rounded-full bg-fuchsia-500/28 blur-[95px]" />
        <div className="pointer-events-none absolute bottom-[-80px] right-[-80px] h-80 w-80 rounded-full bg-cyan-400/26 blur-[95px]" />
        <div className="pointer-events-none absolute left-1/2 top-4 h-72 w-72 -translate-x-1/2 rounded-full bg-purple-500/18 blur-[115px]" />

        <div className={`relative z-10 min-h-0 w-full ${contentClassName}`}>
          {hasControls && (
            <div className="sticky top-4 z-50 -mb-12 flex justify-end gap-3 pr-2 pointer-events-none">
              {showMinimizeButton && onMinimize && (
                <button
                  type="button"
                  onClick={onMinimize}
                  aria-label={minimizeLabel}
                  title={minimizeLabel}
                  className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-cyan-300/25 bg-black/70 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.16)] backdrop-blur-md transition-all hover:scale-105 hover:border-cyan-300/40 hover:bg-cyan-500/15"
                >
                  <Minus size={22} strokeWidth={3} />
                </button>
              )}

              {showCloseButton && onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={closeLabel}
                  title={closeLabel}
                  className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-red-300/45 bg-black/75 text-red-100 shadow-[0_0_14px_rgba(248,113,113,0.55),0_0_34px_rgba(248,113,113,0.32)] backdrop-blur-md transition-all hover:scale-105 hover:border-red-200/70 hover:bg-red-500/20 hover:shadow-[0_0_18px_rgba(248,113,113,0.75),0_0_46px_rgba(248,113,113,0.45)]"
                >
                  <X size={22} strokeWidth={3} />
                </button>
              )}
            </div>
          )}

          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}