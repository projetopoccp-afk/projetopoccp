"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Gift, Package, Sparkles, X } from "lucide-react";

import {
  getUserPacks,
  openUserPack,
  type PackOpeningResult,
  type UserPack,
} from "@/lib/packs/user-packs";

type PacksModalProps = {
  open: boolean;
  onClose: () => void;
};

type OpeningStep = "idle" | "opening" | "revealed";

export function PacksModal({ open, onClose }: PacksModalProps) {
  const [loading, setLoading] = useState(false);
  const [packs, setPacks] = useState<UserPack[]>([]);
  const [selectedPack, setSelectedPack] = useState<UserPack | null>(null);
  const [openingStep, setOpeningStep] = useState<OpeningStep>("idle");
  const [openingResult, setOpeningResult] = useState<PackOpeningResult | null>(
    null
  );

  useEffect(() => {
    if (!open) return;

    loadPacks();

    function handlePacksUpdated() {
      loadPacks();
    }

    window.addEventListener("creator-nexus:packs-updated", handlePacksUpdated);

    return () => {
      window.removeEventListener(
        "creator-nexus:packs-updated",
        handlePacksUpdated
      );
    };
  }, [open]);

  async function loadPacks() {
    setLoading(true);
    const data = await getUserPacks();
    setPacks(data);
    setLoading(false);
  }

  async function handleOpenPack(pack: UserPack) {
    if (openingStep === "opening") return;

    setSelectedPack(pack);
    setOpeningResult(null);
    setOpeningStep("opening");

    const result = await openUserPack(pack.id);

    setTimeout(async () => {
      setOpeningResult(result);
      setOpeningStep("revealed");

      if (result) {
        setPacks((current) => current.filter((item) => item.id !== pack.id));
      }

      await loadPacks();
    }, 1300);
  }

  function resetOpening() {
    setSelectedPack(null);
    setOpeningResult(null);
    setOpeningStep("idle");
  }

  const packCountLabel = useMemo(() => {
    if (packs.length === 1) return "1 pacote disponível";
    return `${packs.length} pacotes disponíveis`;
  }, [packs.length]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
          animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          className="fixed inset-0 z-[130] flex items-center justify-center bg-black/80 p-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.94 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
            className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto overflow-x-hidden rounded-[32px] border border-white/15 bg-zinc-950 text-white shadow-[0_0_80px_rgba(0,0,0,0.9)]"
          >
            <div className="pointer-events-none absolute -left-24 -top-24 h-56 w-56 rounded-full bg-pink-500/20 blur-[90px]" />
            <div className="pointer-events-none absolute -bottom-24 -right-24 h-56 w-56 rounded-full bg-cyan-600/20 blur-[90px]" />

            <button
              type="button"
              onClick={onClose}
              className="absolute right-5 top-5 z-20 rounded-full border border-white/10 bg-white/5 p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
              aria-label="Fechar pacotes"
            >
              <X size={18} />
            </button>

            <div className="relative z-10 p-6 md:p-8">
              <div className="inline-flex items-center gap-3 rounded-full border border-pink-300/20 bg-pink-300/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-pink-100">
                <Package size={14} />
                Pacotes
              </div>

              <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.05fr] lg:items-start">
                <div>
                  <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                      <h2 className="text-3xl font-black md:text-5xl">
                        Abrir Pacotes
                      </h2>

                      <p className="mt-4 text-sm leading-relaxed text-white/50">
                        Escolha um pacote, rasgue o envelope Nexus e revele uma
                        carta para sua coleção.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Gift className="text-yellow-100" size={20} />
                        <p className="font-bold">Inventário de pacotes</p>
                      </div>

                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/50">
                        {loading ? "Carregando..." : packCountLabel}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-3">
                      {loading && (
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/45">
                          Buscando seus pacotes...
                        </div>
                      )}

                      {!loading && packs.length === 0 && (
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/45">
                          Você ainda não tem pacotes. Complete missões para
                          receber novos pacotes.
                        </div>
                      )}

                      {!loading &&
                        packs.map((pack) => (
                          <PackInventoryItem
                            key={pack.id}
                            pack={pack}
                            disabled={openingStep === "opening"}
                            onOpen={() => handleOpenPack(pack)}
                          />
                        ))}
                    </div>
                  </div>
                </div>

                <PackOpeningStage
                  selectedPack={selectedPack}
                  openingStep={openingStep}
                  openingResult={openingResult}
                  onReset={resetOpening}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PackInventoryItem({
  pack,
  disabled,
  onOpen,
}: {
  pack: UserPack;
  disabled: boolean;
  onOpen: () => void;
}) {
  const packInfo = pack.packs;
  const rarity = packInfo?.rarity || "common";

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${getRarityBoxClass(
              rarity
            )}`}
          >
            <Package size={22} />
          </div>

          <div>
            <h3 className="font-black">{packInfo?.name || "Pacote"}</h3>
            <p className="mt-1 text-xs text-white/45">
              {packInfo?.description || "Pacote disponível para abertura."}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-white/30">
              origem: {pack.source || "sistema"}
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={onOpen}
          className="w-fit rounded-full bg-pink-300 px-5 py-2 text-sm font-black text-black transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >
          Abrir pacote
        </button>
      </div>
    </div>
  );
}

function PackOpeningStage({
  selectedPack,
  openingStep,
  openingResult,
  onReset,
}: {
  selectedPack: UserPack | null;
  openingStep: OpeningStep;
  openingResult: PackOpeningResult | null;
  onReset: () => void;
}) {
  const packName = selectedPack?.packs?.name || "Pacote Nexus";
  const revealed = openingStep === "revealed" && openingResult;

  return (
    <div className="flex min-h-[640px] flex-col items-center justify-center rounded-[32px] border border-white/10 bg-black/30 p-6">
      <div className="relative flex min-h-[480px] w-full items-center justify-center overflow-visible rounded-[28px] border border-white/10 bg-zinc-950/70 px-4 py-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.16),transparent_55%)]" />

        <AnimatePresence mode="wait">
          {openingStep === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.95 }}
              className="relative flex flex-col items-center text-center"
            >
              <IdlePack />
              <p className="mt-6 text-sm font-bold text-white/70">
                Selecione um pacote para começar.
              </p>
              <p className="mt-1 text-xs text-white/35">
                A carta será adicionada automaticamente à sua coleção.
              </p>
            </motion.div>
          )}

          {openingStep === "opening" && (
            <motion.div
              key="opening"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="relative flex h-full w-full items-center justify-center"
            >
              <TearingPack packName={packName} />
            </motion.div>
          )}

          {revealed && (
            <motion.div
              key="revealed"
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.96 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="relative flex flex-col items-center text-center"
            >
              <RevealedCard rarity={openingResult.rarity} />

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="mt-6"
              >
                <p className="text-xs uppercase tracking-[0.35em] text-pink-100">
                  {openingResult.duplicate ? "Carta repetida" : "Carta revelada"}
                </p>
                <h3 className="mt-2 text-2xl font-black capitalize">
                  {openingResult.creatorName || openingResult.rarity}
                </h3>
                <p className="mt-2 max-w-sm text-sm text-white/45">
                  {openingResult.duplicate
                    ? `Você já tinha a carta ${openingResult.creatorName || "desse creator"} nessa raridade. Ela foi convertida em +${openingResult.duplicateXp || 0} XP.`
                    : `Você recebeu uma carta ${openingResult.rarity}. Ela foi enviada para sua coleção e o XP foi contabilizado.`}
                </p>
              </motion.div>
            </motion.div>
          )}

          {openingStep === "revealed" && !openingResult && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-red-300/20 bg-red-300/10 p-6 text-center"
            >
              <p className="font-bold text-red-100">
                Não foi possível abrir o pacote.
              </p>
              <p className="mt-2 text-sm text-white/45">
                Tente novamente em alguns instantes.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-5 flex w-full items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-white/35">
            Animação
          </p>
          <p className="mt-1 text-sm text-white/60">
            pacote rasgando → brilho → carta saindo
          </p>
        </div>

        <button
          type="button"
          onClick={onReset}
          disabled={openingStep === "opening" || openingStep === "idle"}
          className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2 text-sm font-bold text-white/60 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Abrir outro
        </button>
      </div>
    </div>
  );
}

function IdlePack() {
  return (
    <div className="relative h-64 w-44">
      <motion.div
        animate={{ y: [0, -8, 0], rotate: [-1, 1, -1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 rounded-[28px] border border-pink-300/30 bg-gradient-to-br from-pink-400/20 via-purple-500/20 to-cyan-300/20 shadow-[0_0_60px_rgba(236,72,153,0.25)]"
      >
        <div className="absolute inset-4 rounded-[22px] border border-white/10 bg-black/30" />
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/20" />
        <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center">
          <div className="rounded-full border border-yellow-300/20 bg-yellow-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-yellow-100">
            Nexus
          </div>
        </div>
      </motion.div>

      <motion.div
        animate={{ opacity: [0.25, 0.8, 0.25], scale: [0.92, 1.08, 0.92] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 rounded-[32px] bg-pink-300/20 blur-2xl"
      />
    </div>
  );
}

function TearingPack({ packName }: { packName: string }) {
  return (
    <div className="relative h-72 w-56">
      <motion.div
        initial={{ opacity: 0.15, scale: 0.8 }}
        animate={{ opacity: [0.2, 0.9, 0.2], scale: [0.85, 1.25, 0.85] }}
        transition={{ duration: 0.65, repeat: 2, ease: "easeInOut" }}
        className="absolute inset-0 rounded-full bg-pink-300/30 blur-3xl"
      />

      <motion.div
        initial={{ x: 0, rotate: 0 }}
        animate={{ x: -62, rotate: -12 }}
        transition={{ delay: 0.45, duration: 0.7, ease: "easeInOut" }}
        className="absolute left-0 top-0 h-full w-1/2 origin-right overflow-hidden rounded-l-[30px] border-y border-l border-pink-300/30 bg-gradient-to-br from-pink-400/25 via-purple-500/25 to-cyan-300/20 shadow-[0_0_50px_rgba(236,72,153,0.25)]"
      >
        <div className="absolute inset-4 rounded-l-[22px] border-y border-l border-white/10 bg-black/30" />
        <div className="absolute right-0 top-0 h-full w-[2px] bg-white/20" />
      </motion.div>

      <motion.div
        initial={{ x: 0, rotate: 0 }}
        animate={{ x: 62, rotate: 12 }}
        transition={{ delay: 0.45, duration: 0.7, ease: "easeInOut" }}
        className="absolute right-0 top-0 h-full w-1/2 origin-left overflow-hidden rounded-r-[30px] border-y border-r border-pink-300/30 bg-gradient-to-bl from-cyan-300/20 via-purple-500/25 to-pink-400/25 shadow-[0_0_50px_rgba(236,72,153,0.25)]"
      >
        <div className="absolute inset-4 rounded-r-[22px] border-y border-r border-white/10 bg-black/30" />
        <div className="absolute left-0 top-0 h-full w-[2px] bg-white/20" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 70, scale: 0.78, rotate: -5 }}
        animate={{ opacity: 1, y: -24, scale: 1, rotate: 0 }}
        transition={{ delay: 0.95, duration: 0.65, ease: "easeOut" }}
        className="absolute left-1/2 top-1/2 h-48 w-32 -translate-x-1/2 -translate-y-1/2 rounded-[22px] border border-white/15 bg-black/70 shadow-[0_0_70px_rgba(255,255,255,0.18)]"
      >
        <div className="absolute inset-3 rounded-[16px] border border-white/10 bg-white/[0.04]" />
        <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center px-4 text-center">
          <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white/60">
            Revelando
          </span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: [0, 1, 0], scale: [0.7, 1.4, 1.8] }}
        transition={{ delay: 0.9, duration: 0.8, ease: "easeOut" }}
        className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border border-yellow-200/30"
      />

      <div className="absolute -bottom-12 left-1/2 w-72 -translate-x-1/2 text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-pink-100">
          Rasgando {packName}
        </p>
      </div>
    </div>
  );
}

function RevealedCard({ rarity }: { rarity: string }) {
  return (
    <motion.div
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      className={`relative h-64 w-44 rounded-[28px] border p-3 shadow-[0_0_80px_rgba(255,255,255,0.16)] ${getRarityCardClass(
        rarity
      )}`}
    >
      <motion.div
        animate={{ opacity: [0.25, 0.85, 0.25], scale: [0.9, 1.08, 0.9] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 rounded-[28px] bg-white/20 blur-2xl"
      />

      <div className="relative flex h-full flex-col rounded-[22px] border border-white/15 bg-black/55 p-4">
        <div className="flex items-center justify-between">
          <span className="rounded-full border border-white/10 bg-white/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
            {rarity}
          </span>
          <Sparkles size={16} className="text-yellow-100" />
        </div>

        <div className="mt-5 flex flex-1 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
          <Package size={42} className="text-white/50" />
        </div>

        <p className="mt-4 text-center text-sm font-black">Nova Carta</p>
      </div>
    </motion.div>
  );
}

function getRarityBoxClass(rarity: string) {
  if (rarity === "legendary") {
    return "border-yellow-300/30 bg-yellow-300/10 text-yellow-100";
  }

  if (rarity === "epic") {
    return "border-purple-300/30 bg-purple-300/10 text-purple-100";
  }

  if (rarity === "rare") {
    return "border-cyan-300/30 bg-cyan-300/10 text-cyan-100";
  }

  return "border-white/10 bg-white/[0.04] text-white/60";
}

function getRarityCardClass(rarity: string) {
  if (rarity === "legendary") {
    return "border-yellow-300/35 bg-yellow-300/15";
  }

  if (rarity === "epic") {
    return "border-purple-300/35 bg-purple-300/15";
  }

  if (rarity === "rare") {
    return "border-cyan-300/35 bg-cyan-300/15";
  }

  return "border-white/15 bg-white/[0.04]";
}
