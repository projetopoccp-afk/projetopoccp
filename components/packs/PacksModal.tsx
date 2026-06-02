"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Gift, Package, Sparkles, X } from "lucide-react";

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

export function PacksModal({ open, onClose }: PacksModalProps) {
  const { t } = useLanguage();

  const [loading, setLoading] = useState(false);
  const [packs, setPacks] = useState<UserPack[]>([]);
  const [selectedPack, setSelectedPack] = useState<UserPack | null>(null);
  const [openingStep, setOpeningStep] = useState<OpeningStep>("idle");
  const [openingResult, setOpeningResult] = useState<PackOpeningResult | null>(
    null
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
    if (packs.length === 1) {
      return translate(t, "packsModalPackCountSingular", "{count} pack available").replace(
        "{count}",
        String(packs.length)
      );
    }

    return translate(t, "packsModalPackCountPlural", "{count} packs available").replace(
      "{count}",
      String(packs.length)
    );
  }, [packs.length, t]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
          animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          className="fixed inset-0 z-[130] flex items-center justify-center overflow-hidden bg-black/80 p-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.94 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
            className="relative flex h-[calc(100vh-2rem)] max-h-[760px] w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/15 bg-zinc-950 text-white shadow-[0_0_80px_rgba(0,0,0,0.9)]"
          >
            <div className="pointer-events-none absolute -left-24 -top-24 h-56 w-56 rounded-full bg-pink-500/20 blur-[90px]" />
            <div className="pointer-events-none absolute -bottom-24 -right-24 h-56 w-56 rounded-full bg-cyan-600/20 blur-[90px]" />

            <button
              type="button"
              onClick={onClose}
              className="absolute right-5 top-5 z-20 rounded-full border border-white/10 bg-white/5 p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
              aria-label={translate(t, "packsModalCloseAria", "Close packs")}
            >
              <X size={18} />
            </button>

            <div className="relative z-10 flex h-full min-h-0 w-full flex-col p-6 md:p-8">
              <div className="inline-flex items-center gap-3 rounded-full border border-pink-300/20 bg-pink-300/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-pink-100">
                <Package size={14} />
                {translate(t, "packsModalBadge", "Packs")}
              </div>

              <div className="mt-8 grid min-h-0 flex-1 gap-8 lg:grid-cols-[1fr_1.05fr] lg:items-stretch">
                <div className="flex min-h-0 flex-col">
                  <div className="shrink-0 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                      <h2 className="text-3xl font-black md:text-5xl">
                        {translate(t, "packsModalTitle", "Open Packs")}
                      </h2>

                      <p className="mt-4 text-sm leading-relaxed text-white/50">
                        {translate(
                          t,
                          "packsModalDescription",
                          "Choose a pack, tear open the Nexus envelope and reveal a card for your collection."
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex min-h-0 flex-1 flex-col rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Gift className="text-yellow-100" size={20} />
                        <p className="font-bold">
                          {translate(t, "packsModalInventoryTitle", "Pack inventory")}
                        </p>
                      </div>

                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/50">
                        {loading
                          ? translate(t, "packsModalLoading", "Loading...")
                          : packCountLabel}
                      </span>
                    </div>

                    <div className="mt-5 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                      {loading && (
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/45">
                          {translate(t, "packsModalSearching", "Searching your packs...")}
                        </div>
                      )}

                      {!loading && packs.length === 0 && (
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/45">
                          {translate(
                            t,
                            "packsModalEmpty",
                            "You do not have any packs yet. Complete missions to receive new packs."
                          )}
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
  const { t } = useLanguage();

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
            <h3 className="font-black">
              {getTranslatedPackName(t, pack)}
            </h3>
            <p className="mt-1 text-xs text-white/45">
              {getTranslatedPackDescription(t, pack)}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-white/30">
              {translate(t, "packsModalOriginLabel", "Origin")}: {" "}
              {getTranslatedPackSource(t, pack.source)}
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={onOpen}
          className="w-fit rounded-full bg-pink-300 px-5 py-2 text-sm font-black text-black transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >
          {translate(t, "packsModalOpenPackButton", "Open pack")}
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
  const { t } = useLanguage();

  const packName = selectedPack
    ? getTranslatedPackName(t, selectedPack)
    : translate(t, "packsModalDefaultNexusPack", "Nexus Pack");
  const revealed = openingStep === "revealed" && openingResult;

  return (
    <div className="flex h-full min-h-[560px] flex-col items-center justify-center rounded-[32px] border border-white/10 bg-black/30 p-6">
      <div className="relative flex min-h-[430px] w-full items-center justify-center overflow-visible rounded-[28px] border border-white/10 bg-zinc-950/70 px-4 py-8">
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
                {translate(t, "packsModalIdleTitle", "Select a pack to begin.")}
              </p>
              <p className="mt-1 text-xs text-white/35">
                {translate(
                  t,
                  "packsModalIdleDescription",
                  "The card will be automatically added to your collection."
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
                  {openingResult.duplicate
                    ? translate(t, "packsModalDuplicateCard", "Duplicate card")
                    : translate(t, "packsModalRevealedCard", "Revealed card")}
                </p>
                <h3 className="mt-2 text-2xl font-black capitalize">
                  {openingResult.creatorName || openingResult.rarity}
                </h3>
                <p className="mt-2 max-w-sm text-sm text-white/45">
                  {openingResult.duplicate
                    ? translate(
                        t,
                        "packsModalDuplicateDescription",
                        "You already had the card {creator} in this rarity. It was converted into +{xp} XP."
                      )
                        .replace(
                          "{creator}",
                          openingResult.creatorName ||
                            translate(t, "packsModalThisCreator", "this creator")
                        )
                        .replace("{xp}", String(openingResult.duplicateXp || 0))
                    : translate(
                        t,
                        "packsModalReceivedDescription",
                        "You received a {rarity} card. It was sent to your collection and the XP was counted."
                      ).replace(
                        "{rarity}",
                        getTranslatedRarityLabel(t, openingResult.rarity)
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
                {translate(t, "packsModalOpenErrorTitle", "Could not open the pack.")}
              </p>
              <p className="mt-2 text-sm text-white/45">
                {translate(
                  t,
                  "packsModalOpenErrorDescription",
                  "Try again in a few moments."
                )}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-5 flex w-full items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-white/35">
            {translate(t, "packsModalAnimationLabel", "Animation")}
          </p>
          <p className="mt-1 text-sm text-white/60">
            {translate(
              t,
              "packsModalAnimationDescription",
              "pack tearing → glow → card coming out"
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={onReset}
          disabled={openingStep === "opening" || openingStep === "idle"}
          className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2 text-sm font-bold text-white/60 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {translate(t, "packsModalOpenAnother", "Open another")}
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
  const { t } = useLanguage();

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
            {translate(t, "packsModalRevealing", "Revealing")}
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
          {translate(t, "packsModalTearingPack", "Tearing {packName}").replace(
            "{packName}",
            packName
          )}
        </p>
      </div>
    </div>
  );
}

function RevealedCard({ rarity }: { rarity: string }) {
  const { t } = useLanguage();

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
            {getTranslatedRarityLabel(t, rarity)}
          </span>
          <Sparkles size={16} className="text-yellow-100" />
        </div>

        <div className="mt-5 flex flex-1 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
          <Package size={42} className="text-white/50" />
        </div>

        <p className="mt-4 text-center text-sm font-black">
          {translate(t, "packsModalNewCard", "New Card")}
        </p>
      </div>
    </motion.div>
  );
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
  pack: UserPack
) {
  const packInfo = pack.packs;
  const name = packInfo?.name || "";
  const rarity = packInfo?.rarity || "common";
  const normalizedName = normalizeTranslationMatch(name);

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

  return name || translate(t, "packsModalDefaultPackName", "Pack");
}

function getTranslatedPackDescription(
  t: ReturnType<typeof useLanguage>["t"],
  pack: UserPack
) {
  const packInfo = pack.packs;
  const description = packInfo?.description || "";
  const rarity = packInfo?.rarity || "common";
  const normalizedDescription = normalizeTranslationMatch(description);

  if (
    rarity === "legendary" ||
    normalizedDescription.includes("chance elevada") ||
    normalizedDescription.includes("carta lendaria")
  ) {
    return translate(
      t,
      "packsModalLegendaryPackDescription",
      "A special pack with an increased chance of a legendary card."
    );
  }

  if (rarity === "epic" || normalizedDescription.includes("epic")) {
    return translate(
      t,
      "packsModalEpicPackDescription",
      "An enhanced pack with a higher chance of epic cards."
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
      "An improved pack with better chances of rare cards."
    );
  }

  if (rarity === "common") {
    return translate(
      t,
      "packsModalCommonPackDescription",
      "A basic pack with creator cards for your collection."
    );
  }

  return (
    description ||
    translate(t, "packsModalDefaultPackDescription", "Pack available to open.")
  );
}

function getTranslatedPackSource(
  t: ReturnType<typeof useLanguage>["t"],
  source?: string | null
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
  rarity: string
) {
  if (rarity === "legendary") return translate(t, "legendary", "Legendary");
  if (rarity === "epic") return translate(t, "epic", "Epic");
  if (rarity === "rare") return translate(t, "rare", "Rare");
  if (rarity === "common") return translate(t, "common", "Common");

  return rarity;
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
