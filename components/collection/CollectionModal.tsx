"use client";

import { useEffect, useMemo, useState } from "react";
import { Archive, Crown, Gem, Sparkles, X, Zap } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { supabase } from "@/lib/supabase/client";

type CollectionModalProps = {
  open: boolean;
  onClose: () => void;
};

type UserCard = {
  id: string;
  rarity: string;
  source: string;
  obtained_at: string;
};

export function CollectionModal({ open, onClose }: CollectionModalProps) {
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<UserCard[]>([]);

  useEffect(() => {
    if (!open) return;

    async function loadCollection() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setCards([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_cards")
        .select("id, rarity, source, obtained_at")
        .eq("user_id", user.id)
        .order("obtained_at", { ascending: false });

      if (error) {
        console.error(error);
        setCards([]);
        setLoading(false);
        return;
      }

      setCards(data || []);
      setLoading(false);
    }

    loadCollection();
  }, [open]);

  const stats = useMemo(() => {
    return {
      total: cards.length,
      common: cards.filter((card) => card.rarity === "common").length,
      rare: cards.filter((card) => card.rarity === "rare").length,
      epic: cards.filter((card) => card.rarity === "epic").length,
      legendary: cards.filter((card) => card.rarity === "legendary").length,
    };
  }, [cards]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
          animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
        >
          <button
            onClick={onClose}
            className="absolute inset-0"
            aria-label="Fechar coleção"
          />

          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.94 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="hide-scrollbar relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[32px] border border-white/15 bg-zinc-950 p-8 text-white shadow-[0_0_80px_rgba(0,0,0,0.9)]"
          >
            <div className="absolute -left-24 -top-24 h-56 w-56 rounded-full bg-cyan-500/20 blur-[90px]" />
            <div className="absolute -bottom-24 -right-24 h-56 w-56 rounded-full bg-purple-600/20 blur-[90px]" />

            <button
              onClick={onClose}
              className="absolute right-5 top-5 z-10 rounded-full border border-white/10 bg-white/5 p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>

            <div className="relative z-10">
              <div className="inline-flex items-center gap-3 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-cyan-100">
                <Archive size={14} />
                Minha Coleção
              </div>

              <h2 className="mt-5 text-3xl font-black">
                Suas cartas do Nexus
              </h2>

              <p className="mt-3 max-w-2xl text-sm text-white/45">
                Aqui ficam as cartas de creators conquistadas por follows,
                pacotes, missões e eventos.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <StatCard
                  icon={<Archive size={18} />}
                  label="Total"
                  value={stats.total}
                />

                <StatCard
                  icon={<Sparkles size={18} />}
                  label="Comuns"
                  value={stats.common}
                />

                <StatCard
                  icon={<Gem size={18} />}
                  label="Raras"
                  value={stats.rare}
                />

                <StatCard
                  icon={<Zap size={18} />}
                  label="Épicas"
                  value={stats.epic}
                />

                <StatCard
                  icon={<Crown size={18} />}
                  label="Lendárias"
                  value={stats.legendary}
                />
              </div>

              {loading ? (
                <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center text-white/50">
                  Carregando coleção...
                </div>
              ) : cards.length === 0 ? (
                <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-8 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
                    <Archive size={28} />
                  </div>

                  <p className="mt-5 text-lg font-bold text-white">
                    Coleção vazia por enquanto
                  </p>

                  <p className="mx-auto mt-3 max-w-xl text-sm text-white/45">
                    Em breve você poderá conquistar cartas seguindo creators,
                    abrindo pacotes e completando missões dentro do Creator Nexus.
                  </p>
                </div>
              ) : (
                <div className="mt-8 grid gap-4">
                  {cards.map((card) => (
                    <div
                      key={card.id}
                      className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-bold text-white">
                          Carta conquistada
                        </p>

                        <p className="mt-1 text-xs text-white/40">
                          Fonte: {card.source} •{" "}
                          {new Date(card.obtained_at).toLocaleDateString(
                            "pt-BR"
                          )}
                        </p>
                      </div>

                      <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-100">
                        {card.rarity}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center justify-between text-white/45">
        {icon}

        <span className="text-xs uppercase tracking-[0.25em]">{label}</span>
      </div>

      <p className="mt-4 text-3xl font-black text-cyan-100">{value}</p>
    </div>
  );
}