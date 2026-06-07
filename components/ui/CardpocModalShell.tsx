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
      className={`fixed inset-0 ${zIndexClassName} flex min-h-0 items-start justify-center overflow-hidden bg-black/70 p-2 text-white sm:p-3 lg:items-center lg:p-4`}
    >
      <motion.div
        initial={{ opacity: 0, y: 22, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.32, ease: "easeOut" }}
        onClick={(event) => event.stopPropagation()}
        className={`relative flex h-[calc(100dvh-1rem)] min-h-0 w-full max-w-7xl overflow-hidden rounded-[24px] border border-cyan-200/18 bg-[radial-gradient(circle_at_18%_0%,rgba(236,72,153,0.22),transparent_34%),radial-gradient(circle_at_85%_100%,rgba(34,211,238,0.24),transparent_36%),radial-gradient(circle_at_50%_8%,rgba(168,85,247,0.16),transparent_38%),linear-gradient(135deg,#101322_0%,#0b1020_46%,#050813_100%)] shadow-[0_0_70px_rgba(34,211,238,0.12),0_0_100px_rgba(0,0,0,0.82)] sm:h-[calc(100dvh-1.5rem)] sm:rounded-[30px] sm:shadow-[0_0_90px_rgba(34,211,238,0.13),0_0_120px_rgba(0,0,0,0.82)] lg:h-auto lg:max-h-[calc(100dvh-2rem)] lg:rounded-[34px] ${className}`}
      >
        <div className="pointer-events-none absolute inset-0 opacity-[0.24] [background-image:linear-gradient(rgba(255,255,255,0.085)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.085)_1px,transparent_1px)] [background-size:34px_34px] sm:opacity-[0.3] sm:[background-size:38px_38px] lg:opacity-[0.34] lg:[background-size:42px_42px]" />

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.08)_45%,rgba(0,0,0,0.42)_100%)]" />

        <div className="pointer-events-none absolute left-[-90px] top-[-90px] h-64 w-64 rounded-full bg-fuchsia-500/24 blur-[85px] sm:left-[-70px] sm:top-[-70px] sm:h-72 sm:w-72 sm:bg-fuchsia-500/26 sm:blur-[90px] lg:h-80 lg:w-80 lg:bg-fuchsia-500/28 lg:blur-[95px]" />
        <div className="pointer-events-none absolute bottom-[-90px] right-[-90px] h-64 w-64 rounded-full bg-cyan-400/22 blur-[85px] sm:bottom-[-80px] sm:right-[-80px] sm:h-72 sm:w-72 sm:bg-cyan-400/24 sm:blur-[90px] lg:h-80 lg:w-80 lg:bg-cyan-400/26 lg:blur-[95px]" />
        <div className="pointer-events-none absolute left-1/2 top-3 h-56 w-56 -translate-x-1/2 rounded-full bg-purple-500/14 blur-[105px] sm:top-4 sm:h-64 sm:w-64 sm:bg-purple-500/16 sm:blur-[110px] lg:h-72 lg:w-72 lg:bg-purple-500/18 lg:blur-[115px]" />

        <div
          className={`relative z-10 flex min-h-0 w-full flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden ${contentClassName}`}
        >
          {hasControls && (
            <div className="pointer-events-none sticky top-2 z-50 -mb-10 flex shrink-0 justify-end gap-2 pr-2 sm:top-3 sm:-mb-11 sm:gap-3 lg:top-4 lg:-mb-12">
              {showMinimizeButton && onMinimize && (
                <button
                  type="button"
                  onClick={onMinimize}
                  aria-label={minimizeLabel}
                  title={minimizeLabel}
                  className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-cyan-300/35 bg-black/75 text-cyan-100 shadow-[0_0_14px_rgba(34,211,238,0.42),0_0_28px_rgba(34,211,238,0.22)] backdrop-blur-md transition-all hover:scale-105 hover:border-cyan-200/70 hover:bg-cyan-500/20 hover:shadow-[0_0_18px_rgba(34,211,238,0.72),0_0_44px_rgba(34,211,238,0.42)] sm:h-11 sm:w-11 lg:h-12 lg:w-12"
                >
                  <Minus
                    size={20}
                    strokeWidth={3}
                    className="sm:h-[21px] sm:w-[21px] lg:h-[22px] lg:w-[22px]"
                  />
                </button>
              )}

              {showCloseButton && onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={closeLabel}
                  title={closeLabel}
                  className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-red-300/45 bg-black/75 text-red-100 shadow-[0_0_14px_rgba(248,113,113,0.55),0_0_34px_rgba(248,113,113,0.32)] backdrop-blur-md transition-all hover:scale-105 hover:border-red-200/70 hover:bg-red-500/20 hover:shadow-[0_0_18px_rgba(248,113,113,0.75),0_0_46px_rgba(248,113,113,0.45)] sm:h-11 sm:w-11 lg:h-12 lg:w-12"
                >
                  <X
                    size={20}
                    strokeWidth={3}
                    className="sm:h-[21px] sm:w-[21px] lg:h-[22px] lg:w-[22px]"
                  />
                </button>
              )}
            </div>
          )}

          <div className="min-h-0 w-full flex-1">{children}</div>
        </div>
      </motion.div>
    </motion.div>
  );
}