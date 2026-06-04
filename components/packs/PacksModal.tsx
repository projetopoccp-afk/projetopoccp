"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Gift, Info, Package, Plus, Sparkles, Star, X, Zap } from "lucide-react";
import { CreatorCard } from "@/components/cards/CreatorCard";

import { useLanguage } from "@/contexts/LanguageContext";
import { translate } from "@/lib/i18n/translate";
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

type PackRarity =
  | "random"
  | "common"
  | "rare"
  | "epic"
  | "legendary"
  | "mythic"
  | string;

export function PacksModal({ open, onClose }: PacksModalProps) {
  const { t } = useLanguage();

  const [loading, setLoading] = useState(false);
  const [packs, setPacks] = useState<UserPack[]>([]);
  const [selectedPack, setSelectedPack] = useState<UserPack | null>(null);
  const [openingStep, setOpeningStep] = useState<OpeningStep>("idle");
  const [openingResult, setOpeningResult] = useState<PackOpeningResult | null>(
    null,
  );

  useEffect(() => {
    if (!open) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [open]);

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
        handlePacksUpdated,
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
    }, 2600);
  }

  function resetOpening() {
    setSelectedPack(null);
    setOpeningResult(null);
    setOpeningStep("idle");
  }

  const packCountLabel = useMemo(() => {
    if (packs.length === 1) {
      return translate(
        t,
        "packsModalPackCountSingular",
        "{count} pack available",
      ).replace("{count}", String(packs.length));
    }

    return translate(
      t,
      "packsModalPackCountPlural",
      "{count} packs available",
    ).replace("{count}", String(packs.length));
  }, [packs.length, t]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
          animate={{ opacity: 1, backdropFilter: "blur(14px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          className="fixed inset-0 z-[130] flex items-center justify-center overflow-hidden bg-black/82 p-3 text-white sm:p-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.94 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
            className="relative flex h-[calc(100vh-1.5rem)] max-h-[790px] w-full max-w-7xl overflow-hidden rounded-[34px] border border-white/15 bg-[radial-gradient(circle_at_top_left,rgba(236,72,153,0.13),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.14),transparent_34%),linear-gradient(135deg,#06070b_0%,#07080d_48%,#02040a_100%)] shadow-[0_0_90px_rgba(0,0,0,0.92)]"
          >
            <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:48px_48px]" />
            <div className="pointer-events-none absolute left-[-80px] top-[-80px] h-72 w-72 rounded-full bg-fuchsia-500/20 blur-[100px]" />
            <div className="pointer-events-none absolute bottom-[-90px] right-[-90px] h-72 w-72 rounded-full bg-cyan-400/18 blur-[100px]" />
            <div className="pointer-events-none absolute left-1/2 top-8 h-1/3 w-1/3 -translate-x-1/2 rounded-full bg-purple-500/10 blur-[120px]" />

            <button
              type="button"
              onClick={onClose}
              className="absolute right-5 top-5 z-30 grid h-12 w-12 place-items-center rounded-full border border-white/15 bg-black/50 text-white/70 shadow-[0_0_28px_rgba(168,85,247,0.28)] backdrop-blur-xl transition hover:border-pink-200/40 hover:bg-pink-500/15 hover:text-white hover:shadow-[0_0_34px_rgba(236,72,153,0.35)]"
              aria-label={translate(t, "packsModalCloseAria", "Close packs")}
            >
              <X size={22} />
            </button>

            <div className="relative z-10 flex h-full min-h-0 w-full flex-col p-5 sm:p-6 md:p-8">
              <div className="flex shrink-0 items-center justify-between gap-4 pr-12">
                <div className="inline-flex items-center gap-3 rounded-full border border-cyan-300/20 bg-cyan-300/[0.08] px-4 py-2 text-[11px] font-black uppercase tracking-[0.32em] text-cyan-100 shadow-[0_0_28px_rgba(34,211,238,0.08)]">
                  <Package size={15} />
                  {translate(t, "packsModalBadge", "Packs")}
                </div>
              </div>

              <div className="mt-7 grid min-h-0 flex-1 gap-7 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
                <div className="flex min-h-0 flex-col">
                  <div className="shrink-0">
                    <h2 className="text-4xl font-black tracking-[-0.06em] text-white md:text-6xl">
                      {translate(t, "packsModalTitle", "Open Packs")}
                    </h2>

                    <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/55 md:text-base">
                      {translate(
                        t,
                        "packsModalDescription",
                        "Open packs and discover new creators for your collection.",
                      )}
                    </p>
                  </div>

                  <div className="mt-6 flex min-h-0 flex-1 flex-col rounded-[30px] border border-white/10 bg-white/[0.035] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-2xl border border-purple-200/15 bg-purple-300/10 text-purple-100">
                          <Gift size={19} />
                        </div>
                        <div>
                          <p className="font-black text-white">
                            {translate(
                              t,
                              "packsModalInventoryTitle",
                              "Pack inventory",
                            )}
                          </p>
                          <p className="mt-0.5 text-xs text-white/35">
                            {translate(
                              t,
                              "packsModalInventoryHint",
                              "Choose a pack to start the reveal.",
                            )}
                          </p>
                        </div>
                      </div>

                      <span className="shrink-0 rounded-full border border-white/10 bg-black/35 px-3 py-1 text-xs font-bold text-white/55">
                        {loading
                          ? translate(t, "packsModalLoading", "Loading...")
                          : packCountLabel}
                      </span>
                    </div>

                    <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                      {loading && (
                        <div className="rounded-3xl border border-white/10 bg-black/25 p-5 text-sm text-white/45">
                          {translate(
                            t,
                            "packsModalSearching",
                            "Searching your packs...",
                          )}
                        </div>
                      )}

                      {!loading && packs.length === 0 && (
                        <div className="rounded-3xl border border-white/10 bg-black/25 p-5 text-sm text-white/45">
                          {translate(
                            t,
                            "packsModalEmpty",
                            "You do not have any packs yet. Complete missions to receive new packs.",
                          )}
                        </div>
                      )}

                      {!loading && packs.length > 0 && (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                          {packs.map((pack) => (
                            <PackInventoryItem
                              key={pack.id}
                              pack={pack}
                              selected={selectedPack?.id === pack.id}
                              disabled={openingStep === "opening"}
                              onOpen={() => handleOpenPack(pack)}
                            />
                          ))}

                          <div className="hidden min-h-[220px] flex-col items-center justify-center rounded-[28px] border border-dashed border-white/10 bg-black/15 text-center text-white/30 sm:flex">
                            <Plus size={24} />
                            <p className="mt-3 max-w-[8rem] text-xs leading-relaxed">
                              {translate(
                                t,
                                "packsModalMorePacksSoon",
                                "More packs soon.",
                              )}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 flex items-start gap-3 rounded-2xl border border-white/10 bg-black/25 p-4 text-xs leading-relaxed text-white/45">
                      <Info className="mt-0.5 shrink-0 text-cyan-100" size={16} />
                      <p>
                        {translate(
                          t,
                          "packsModalCollectionNote",
                          "Packs can be earned through missions, events and Cardpoc rewards.",
                        )}
                      </p>
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
  selected,
  disabled,
  onOpen,
}: {
  pack: UserPack;
  selected: boolean;
  disabled: boolean;
  onOpen: () => void;
}) {
  const { t } = useLanguage();

  const rarity = getPackRarity(pack);
  const theme = getRarityTheme(rarity);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onOpen}
      className={`group relative min-h-[220px] overflow-hidden rounded-[28px] border p-3 text-left transition duration-300 hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 ${
        selected ? theme.selectedCard : theme.card
      }`}
      aria-label={`${translate(t, "packsModalOpenPackAria", "Open pack")}: ${getTranslatedPackName(t, pack)}`}
    >
      <div className="pointer-events-none absolute inset-0 opacity-70 transition duration-500 group-hover:opacity-100">
        <div className={`absolute -right-10 -top-12 h-28 w-28 rounded-full blur-3xl ${theme.glow}`} />
        <div className="absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-cyan-300/10 blur-3xl" />
      </div>

      <div className="relative flex h-full flex-col items-center justify-between gap-3">
        <HolographicPack rarity={rarity} compact />

        <div className="w-full text-center">
          <div className={`mx-auto inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${theme.badge}`}>
            {getTranslatedRarityLabel(t, rarity)}
          </div>

          <h3 className="mt-2 line-clamp-2 text-sm font-black leading-tight text-white">
            {getTranslatedPackName(t, pack)}
          </h3>

          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-white/40">
            {getTranslatedPackDescription(t, pack)}
          </p>
        </div>
      </div>
    </button>
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
  const { t } = useLanguage();

  const packName = selectedPack
    ? getTranslatedPackName(t, selectedPack)
    : translate(t, "packsModalDefaultNexusPack", "Cardpoc Pack");
  const packRarity = selectedPack ? getPackRarity(selectedPack) : "random";
  const revealed = openingStep === "revealed" && openingResult;

  return (
    <div className="flex h-full min-h-[560px] flex-col rounded-[32px] border border-white/10 bg-black/28 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="relative flex min-h-[440px] flex-1 items-center justify-center overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.18),transparent_50%),linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.01))] px-4 py-8">
        <div className="pointer-events-none absolute inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:36px_36px]" />
        <div className="pointer-events-none absolute bottom-12 left-1/2 h-24 w-72 -translate-x-1/2 rounded-full border border-cyan-300/20 bg-cyan-300/10 blur-sm" />
        <div className="pointer-events-none absolute bottom-14 left-1/2 h-px w-72 -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-200/50 to-transparent" />

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
              <p className="mt-7 text-base font-black uppercase tracking-[0.2em] text-white">
                {translate(t, "packsModalIdleTitle", "Select a pack")}
              </p>
              <p className="mt-2 max-w-sm text-xs leading-relaxed text-white/42">
                {translate(
                  t,
                  "packsModalIdleDescription",
                  "Choose a pack from your inventory to start the opening.",
                )}
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
              <TearingPack packName={packName} rarity={packRarity} />
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
              <RevealedCard openingResult={openingResult} />

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="mt-5"
              >
                <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-100">
                  {openingResult.duplicate
                    ? translate(t, "packsModalDuplicateCard", "Duplicate card")
                    : translate(t, "packsModalRevealedCard", "Revealed card")}
                </p>
                <h3 className="mt-2 text-2xl font-black capitalize tracking-[-0.04em]">
                  {openingResult.creatorName || openingResult.rarity}
                </h3>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/45">
                  {openingResult.duplicate
                    ? translate(
                        t,
                        "packsModalDuplicateDescription",
                        "You already had the card {creator} in this rarity. It was converted into +{xp} XP.",
                      )
                        .replace(
                          "{creator}",
                          openingResult.creatorName ||
                            translate(
                              t,
                              "packsModalThisCreator",
                              "this creator",
                            ),
                        )
                        .replace("{xp}", String(openingResult.duplicateXp || 0))
                    : translate(
                        t,
                        "packsModalReceivedDescription",
                        "You received a {rarity} card. It was sent to your collection and the XP was counted.",
                      ).replace(
                        "{rarity}",
                        getTranslatedRarityLabel(t, openingResult.rarity),
                      )}
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
                {translate(
                  t,
                  "packsModalOpenErrorTitle",
                  "Could not open the pack.",
                )}
              </p>
              <p className="mt-2 text-sm text-white/45">
                {translate(
                  t,
                  "packsModalOpenErrorDescription",
                  "Try again in a few moments.",
                )}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-5 flex w-full items-center justify-between gap-4 rounded-[24px] border border-white/10 bg-black/25 p-4">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-100">
            {translate(t, "packsModalAnimationLabel", "Reveal in progress")}
          </p>
          <p className="mt-1 text-sm text-white/55">
            {translate(
              t,
              "packsModalAnimationDescription",
              "Pack glow → tear → flash → card reveal",
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={onReset}
          disabled={openingStep === "opening" || openingStep === "idle"}
          className="shrink-0 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-white/60 transition hover:border-cyan-200/20 hover:bg-cyan-300/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
        >
          {translate(t, "packsModalOpenAnother", "Open another")}
        </button>
      </div>
    </div>
  );
}

function IdlePack() {
  return (
    <div className="relative h-72 w-52">
      <motion.div
        animate={{ y: [0, -10, 0], rotate: [-1, 1, -1] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0"
      >
        <HolographicPack rarity="random" />
      </motion.div>

      <motion.div
        animate={{ opacity: [0.22, 0.75, 0.22], scale: [0.9, 1.08, 0.9] }}
        transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 rounded-[36px] bg-purple-300/25 blur-3xl"
      />
    </div>
  );
}

function TearingPack({ packName, rarity }: { packName: string; rarity: string }) {
  const { t } = useLanguage();
  const theme = getRarityTheme(rarity);

  return (
    <div className="relative h-80 w-64">
      <motion.div
        initial={{ opacity: 0.1, scale: 0.72 }}
        animate={{ opacity: [0.14, 0.95, 0.25], scale: [0.75, 1.45, 1.9] }}
        transition={{ duration: 1.8, ease: "easeInOut" }}
        className={`absolute inset-0 rounded-full blur-3xl ${theme.glow}`}
      />

      <motion.div
        initial={{ scale: 1, rotate: 0 }}
        animate={{ scale: [1, 1.05, 0.98, 1.08], rotate: [0, -2, 2, 0] }}
        transition={{ duration: 0.9, ease: "easeInOut" }}
        className="absolute inset-x-6 inset-y-0"
      >
        <HolographicPack rarity={rarity} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 0, rotate: 0 }}
        animate={{ opacity: [0, 1, 1], x: [-2, -74, -92], rotate: [0, -9, -17] }}
        transition={{ delay: 0.9, duration: 0.95, ease: "easeInOut" }}
        className={`absolute left-6 top-0 h-full w-[104px] origin-right overflow-hidden rounded-l-[32px] border-y border-l ${theme.packHalf}`}
      >
        <div className="absolute inset-4 rounded-l-[22px] border-y border-l border-white/10 bg-black/25" />
        <div className="absolute right-0 top-0 h-full w-[2px] bg-white/25" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 0, rotate: 0 }}
        animate={{ opacity: [0, 1, 1], x: [2, 74, 92], rotate: [0, 9, 17] }}
        transition={{ delay: 0.9, duration: 0.95, ease: "easeInOut" }}
        className={`absolute right-6 top-0 h-full w-[104px] origin-left overflow-hidden rounded-r-[32px] border-y border-r ${theme.packHalf}`}
      >
        <div className="absolute inset-4 rounded-r-[22px] border-y border-r border-white/10 bg-black/25" />
        <div className="absolute left-0 top-0 h-full w-[2px] bg-white/25" />
        <div className="absolute inset-0 bg-gradient-to-l from-white/10 to-transparent" />
      </motion.div>

      {Array.from({ length: 18 }).map((_, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, x: 0, y: 0, scale: 0.4 }}
          animate={{
            opacity: [0, 1, 0],
            x: (index % 2 === 0 ? 1 : -1) * (32 + index * 4),
            y: -40 + (index % 6) * 18,
            scale: [0.4, 1, 0.2],
          }}
          transition={{ delay: 1.1 + index * 0.015, duration: 0.9, ease: "easeOut" }}
          className={`absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full ${theme.particle}`}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 90, scale: 0.72, rotate: -5 }}
        animate={{ opacity: 1, y: -30, scale: 1, rotate: 0 }}
        transition={{ delay: 1.55, duration: 0.75, ease: "easeOut" }}
        className="absolute left-1/2 top-1/2 h-52 w-36 -translate-x-1/2 -translate-y-1/2 rounded-[24px] border border-white/15 bg-black/78 shadow-[0_0_80px_rgba(255,255,255,0.18)]"
      >
        <div className="absolute inset-3 rounded-[18px] border border-white/10 bg-white/[0.04]" />
        <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center px-4 text-center">
          <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white/60">
            {translate(t, "packsModalRevealing", "Revealing")}
          </span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: [0, 1, 0], scale: [0.7, 1.55, 2.1] }}
        transition={{ delay: 1.48, duration: 0.85, ease: "easeOut" }}
        className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-yellow-200/35"
      />

      <div className="absolute -bottom-12 left-1/2 w-80 -translate-x-1/2 text-center">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-white/70">
          {translate(t, "packsModalTearingPack", "Opening {packName}").replace(
            "{packName}",
            packName,
          )}
        </p>
      </div>
    </div>
  );
}

function HolographicPack({
  rarity,
  compact = false,
}: {
  rarity: PackRarity;
  compact?: boolean;
}) {
  const theme = getRarityTheme(rarity);

  return (
    <div className={`relative ${compact ? "h-28 w-20" : "h-full w-full"}`}>
      <div className={`absolute inset-0 rounded-[24px] border ${theme.pack} shadow-[0_0_40px_rgba(168,85,247,0.16)]`} />
      <div className="absolute inset-x-2 top-2 h-4 rounded-t-[18px] border border-white/10 bg-white/[0.08]" />
      <div className="absolute inset-x-2 bottom-2 h-4 rounded-b-[18px] border border-white/10 bg-black/20" />
      <div className="absolute inset-3 rounded-[18px] border border-white/10 bg-black/25" />
      <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/15" />
      <div className="absolute inset-0 rounded-[24px] bg-[linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.18)_42%,transparent_48%)] opacity-55" />

      <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center px-2 text-center">
        <div className={`grid ${compact ? "h-10 w-10" : "h-16 w-16"} place-items-center rounded-2xl border ${theme.symbol}`}>
          {rarity === "random" ? (
            <Sparkles size={compact ? 18 : 28} />
          ) : rarity === "legendary" || rarity === "mythic" ? (
            <Star size={compact ? 18 : 28} />
          ) : rarity === "epic" ? (
            <Zap size={compact ? 18 : 28} />
          ) : (
            <Package size={compact ? 18 : 28} />
          )}
        </div>
      </div>

      {!compact && (
        <div className="absolute inset-x-0 bottom-14 text-center">
          <p className="text-2xl font-black uppercase leading-none tracking-[0.1em] text-white drop-shadow-[0_0_18px_rgba(255,255,255,0.35)]">
            CARD
            <br />
            POC
          </p>
        </div>
      )}
    </div>
  );
}

function RevealedCard({ openingResult }: { openingResult: PackOpeningResult }) {
  const { t } = useLanguage();

  const creatorForReveal = {
    id: openingResult.creatorId,
    nickname:
      openingResult.creatorName ||
      translate(t, "packsModalUnknownCreator", "Unknown creator"),
    username: openingResult.creatorUsername || "creator",
    avatarUrl: openingResult.creatorAvatarUrl || "/default-avatar.png",
    rarity: openingResult.rarity,
    level: 1,
    category: translate(t, "packsModalCreatorCategory", "Creator"),
    bio: openingResult.duplicate
      ? translate(
          t,
          "packsModalDuplicateCardBio",
          "Duplicate converted into XP.",
        )
      : translate(
          t,
          "packsModalRevealedCardBio",
          "New card added to your collection.",
        ),
    rank: getTranslatedRarityLabel(t, openingResult.rarity),
  };

  return (
    <motion.div
      initial={{ rotateY: 88, scale: 0.78 }}
      animate={{ rotateY: 0, scale: 1, y: [0, -6, 0] }}
      transition={{ y: { duration: 2, repeat: Infinity, ease: "easeInOut" }, rotateY: { duration: 0.7, ease: "easeOut" }, scale: { duration: 0.45 } }}
      className="scale-[0.82] transform-gpu sm:scale-90"
    >
      <CreatorCard creator={creatorForReveal as any} onClick={() => undefined} />
    </motion.div>
  );
}

function getPackRarity(pack: UserPack): PackRarity {
  const packInfo = pack.packs;
  const normalizedName = normalizeTranslationMatch(packInfo?.name || "");
  const normalizedDescription = normalizeTranslationMatch(
    packInfo?.description || "",
  );
  const rarity = packInfo?.rarity || "common";

  if (
    packInfo?.pack_type === "random_pack" ||
    rarity === "random" ||
    normalizedName.includes("aleatorio") ||
    normalizedName.includes("misterioso") ||
    normalizedName.includes("mystery") ||
    normalizedDescription.includes("aleatorio") ||
    normalizedDescription.includes("mystery")
  ) {
    return "random";
  }

  return rarity;
}

function normalizeTranslationMatch(value?: string | null) {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function getTranslatedPackName(
  t: ReturnType<typeof useLanguage>["t"],
  pack: UserPack,
) {
  const packInfo = pack.packs;
  const name = packInfo?.name || "";
  const rarity = getPackRarity(pack);
  const normalizedName = normalizeTranslationMatch(name);

  if (rarity === "random") {
    return translate(t, "packsModalRandomPackName", "Mystery Pack");
  }

  if (rarity === "mythic" || normalizedName.includes("mitico")) {
    return translate(t, "packsModalMythicPackName", "Mythic Pack");
  }

  if (rarity === "legendary" || normalizedName.includes("lendario")) {
    return translate(t, "packsModalLegendaryPackName", "Legendary Pack");
  }

  if (rarity === "epic" || normalizedName.includes("epico")) {
    return translate(t, "packsModalEpicPackName", "Epic Pack");
  }

  if (rarity === "rare" || normalizedName.includes("raro")) {
    return translate(t, "packsModalRarePackName", "Rare Pack");
  }

  if (rarity === "common" || normalizedName.includes("comum")) {
    return translate(t, "packsModalCommonPackName", "Common Pack");
  }

  return name || translate(t, "packsModalDefaultPackName", "Cardpoc Pack");
}

function getTranslatedPackDescription(
  t: ReturnType<typeof useLanguage>["t"],
  pack: UserPack,
) {
  const packInfo = pack.packs;
  const description = packInfo?.description || "";
  const rarity = getPackRarity(pack);
  const normalizedDescription = normalizeTranslationMatch(description);

  if (rarity === "random") {
    return translate(
      t,
      "packsModalRandomPackDescription",
      "A mystery pack with a random chance for any rarity.",
    );
  }

  if (rarity === "mythic") {
    return translate(
      t,
      "packsModalMythicPackDescription",
      "An ultra rare pack with a chance for mythic cards.",
    );
  }

  if (
    rarity === "legendary" ||
    normalizedDescription.includes("chance elevada") ||
    normalizedDescription.includes("carta lendaria")
  ) {
    return translate(
      t,
      "packsModalLegendaryPackDescription",
      "A special pack with an increased chance of a legendary card.",
    );
  }

  if (rarity === "epic" || normalizedDescription.includes("epic")) {
    return translate(
      t,
      "packsModalEpicPackDescription",
      "An enhanced pack with a higher chance of epic cards.",
    );
  }

  if (
    rarity === "rare" ||
    normalizedDescription.includes("pacote melhorado") ||
    normalizedDescription.includes("maiores chances")
  ) {
    return translate(
      t,
      "packsModalRarePackDescription",
      "An improved pack with better chances of rare cards.",
    );
  }

  if (rarity === "common") {
    return translate(
      t,
      "packsModalCommonPackDescription",
      "A basic pack with creator cards for your collection.",
    );
  }

  return (
    description ||
    translate(t, "packsModalDefaultPackDescription", "Pack available to open.")
  );
}

function getTranslatedPackSource(
  t: ReturnType<typeof useLanguage>["t"],
  source?: string | null,
) {
  const normalizedSource = normalizeTranslationMatch(source);

  if (!source) {
    return translate(t, "packsModalSystemSource", "System");
  }

  if (normalizedSource === "manual_test") {
    return translate(t, "packsModalManualTestSource", "Manual test");
  }

  if (normalizedSource === "system") {
    return translate(t, "packsModalSystemSource", "System");
  }

  if (normalizedSource === "mission" || normalizedSource === "missions") {
    return translate(t, "packsModalMissionSource", "Mission");
  }

  return source;
}

function getTranslatedRarityLabel(
  t: ReturnType<typeof useLanguage>["t"],
  rarity: string,
) {
  if (rarity === "random") return translate(t, "packsModalRandomRarity", "Random");
  if (rarity === "mythic") return translate(t, "mythic", "Mythic");
  if (rarity === "legendary") return translate(t, "legendary", "Legendary");
  if (rarity === "epic") return translate(t, "epic", "Epic");
  if (rarity === "rare") return translate(t, "rare", "Rare");
  if (rarity === "common") return translate(t, "common", "Common");

  return rarity;
}

function getRarityTheme(rarity: PackRarity) {
  if (rarity === "random") {
    return {
      card: "border-fuchsia-200/18 bg-fuchsia-300/[0.035] hover:border-fuchsia-200/35",
      selectedCard: "border-fuchsia-200/45 bg-fuchsia-300/[0.08] shadow-[0_0_34px_rgba(217,70,239,0.18)]",
      badge: "border-fuchsia-200/25 bg-fuchsia-300/10 text-fuchsia-100",
      glow: "bg-fuchsia-300/25",
      particle: "bg-fuchsia-200 shadow-[0_0_16px_rgba(217,70,239,0.8)]",
      pack: "border-fuchsia-200/40 bg-gradient-to-br from-fuchsia-400/30 via-purple-400/20 to-cyan-300/24 text-fuchsia-100",
      packHalf: "border-fuchsia-200/35 bg-gradient-to-br from-fuchsia-400/24 via-purple-500/24 to-cyan-300/18 shadow-[0_0_50px_rgba(217,70,239,0.22)]",
      symbol: "border-fuchsia-200/25 bg-fuchsia-300/12 text-fuchsia-100",
    };
  }

  if (rarity === "mythic") {
    return {
      card: "border-amber-200/20 bg-amber-300/[0.04] hover:border-purple-200/35",
      selectedCard: "border-amber-200/45 bg-amber-300/[0.08] shadow-[0_0_34px_rgba(245,158,11,0.2)]",
      badge: "border-amber-200/30 bg-amber-300/12 text-amber-100",
      glow: "bg-amber-300/28",
      particle: "bg-amber-200 shadow-[0_0_16px_rgba(245,158,11,0.8)]",
      pack: "border-amber-200/45 bg-gradient-to-br from-amber-300/30 via-purple-500/22 to-fuchsia-400/20 text-amber-100",
      packHalf: "border-amber-200/35 bg-gradient-to-br from-amber-300/25 via-purple-500/24 to-fuchsia-400/20 shadow-[0_0_50px_rgba(245,158,11,0.24)]",
      symbol: "border-amber-200/30 bg-amber-300/14 text-amber-100",
    };
  }

  if (rarity === "legendary") {
    return {
      card: "border-yellow-200/18 bg-yellow-300/[0.035] hover:border-yellow-200/35",
      selectedCard: "border-yellow-200/45 bg-yellow-300/[0.08] shadow-[0_0_34px_rgba(250,204,21,0.18)]",
      badge: "border-yellow-200/25 bg-yellow-300/10 text-yellow-100",
      glow: "bg-yellow-300/25",
      particle: "bg-yellow-200 shadow-[0_0_16px_rgba(250,204,21,0.8)]",
      pack: "border-yellow-200/40 bg-gradient-to-br from-yellow-300/28 via-amber-500/18 to-black/30 text-yellow-100",
      packHalf: "border-yellow-200/35 bg-gradient-to-br from-yellow-300/24 via-amber-500/20 to-black/20 shadow-[0_0_50px_rgba(250,204,21,0.22)]",
      symbol: "border-yellow-200/25 bg-yellow-300/12 text-yellow-100",
    };
  }

  if (rarity === "epic") {
    return {
      card: "border-purple-200/18 bg-purple-300/[0.035] hover:border-purple-200/35",
      selectedCard: "border-purple-200/45 bg-purple-300/[0.08] shadow-[0_0_34px_rgba(168,85,247,0.18)]",
      badge: "border-purple-200/25 bg-purple-300/10 text-purple-100",
      glow: "bg-purple-300/25",
      particle: "bg-purple-200 shadow-[0_0_16px_rgba(168,85,247,0.8)]",
      pack: "border-purple-200/40 bg-gradient-to-br from-purple-400/28 via-fuchsia-500/16 to-black/30 text-purple-100",
      packHalf: "border-purple-200/35 bg-gradient-to-br from-purple-400/24 via-fuchsia-500/20 to-black/20 shadow-[0_0_50px_rgba(168,85,247,0.22)]",
      symbol: "border-purple-200/25 bg-purple-300/12 text-purple-100",
    };
  }

  if (rarity === "rare") {
    return {
      card: "border-cyan-200/18 bg-cyan-300/[0.035] hover:border-cyan-200/35",
      selectedCard: "border-cyan-200/45 bg-cyan-300/[0.08] shadow-[0_0_34px_rgba(34,211,238,0.18)]",
      badge: "border-cyan-200/25 bg-cyan-300/10 text-cyan-100",
      glow: "bg-cyan-300/25",
      particle: "bg-cyan-200 shadow-[0_0_16px_rgba(34,211,238,0.8)]",
      pack: "border-cyan-200/40 bg-gradient-to-br from-cyan-400/25 via-sky-500/18 to-black/30 text-cyan-100",
      packHalf: "border-cyan-200/35 bg-gradient-to-br from-cyan-400/22 via-sky-500/18 to-black/20 shadow-[0_0_50px_rgba(34,211,238,0.22)]",
      symbol: "border-cyan-200/25 bg-cyan-300/12 text-cyan-100",
    };
  }

  return {
    card: "border-white/10 bg-white/[0.025] hover:border-white/20",
    selectedCard: "border-white/30 bg-white/[0.06] shadow-[0_0_34px_rgba(255,255,255,0.09)]",
    badge: "border-white/15 bg-white/[0.06] text-white/70",
    glow: "bg-white/14",
    particle: "bg-white/80 shadow-[0_0_16px_rgba(255,255,255,0.55)]",
    pack: "border-white/20 bg-gradient-to-br from-slate-300/16 via-slate-500/10 to-black/35 text-white/70",
    packHalf: "border-white/18 bg-gradient-to-br from-slate-300/14 via-slate-500/12 to-black/25 shadow-[0_0_50px_rgba(255,255,255,0.08)]",
    symbol: "border-white/15 bg-white/[0.06] text-white/70",
  };
}
