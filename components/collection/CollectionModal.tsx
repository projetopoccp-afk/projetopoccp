"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type CollectionModalProps = {
  open: boolean;
  onClose: () => void;
};

export function CollectionModal({ open, onClose }: CollectionModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
          <button onClick={onClose} className="absolute inset-0" />

          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.94 }}
            className="relative w-full max-w-5xl rounded-[32px] border border-white/15 bg-zinc-950 p-8 text-white"
          >
            <button
              onClick={onClose}
              className="absolute right-5 top-5 rounded-full border border-white/10 bg-white/5 p-2 text-white/60"
            >
              <X size={18} />
            </button>

            <p className="text-xs uppercase tracking-[0.35em] text-cyan-200">
              Minha Coleção
            </p>

            <h2 className="mt-4 text-3xl font-black">
              Suas cartas do Nexus
            </h2>

            <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center text-white/50">
              Coleção vazia por enquanto.
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}