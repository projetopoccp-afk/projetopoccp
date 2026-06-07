"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Gift,
  History,
  Loader2,
  Package,
  Percent,
  Radio,
  RefreshCw,
  Sparkles,
  Users,
  XCircle,
} from "lucide-react";

import { CardpocModalShell } from "@/components/ui/CardpocModalShell";
import { useLanguage } from "@/contexts/LanguageContext";
import { translate } from "@/lib/i18n/translate";
import { supabase } from "@/lib/supabase/client";

type LiveDropsModalProps = {
  open: boolean;
  onClose: () => void;
  creatorId: string;
  creatorName: string;
  platform: "kick" | "twitch";
  isLive: boolean;
  viewerCount: number;
  liveTitle?: string | null;
};

type RewardType = "xp" | "random_pack";

type DropEntryRecord = {
  id: string;
  drop_id: string;
  user_id: string;
  platform: string;
  platform_username: string | null;
  entered_at: string;
};

type DropClaimRecord = {
  id: string;
  drop_id: string;
  user_id: string;
  platform: string;
  platform_username: string | null;
  claimed_at: string;
};

type DropRecord = {
  id: string;
  creator_id: string;
  platform: string;
  keyword: string;
  reward_type: string;
  viewer_count_at_start: number;
  drop_percentage: number;
  max_claims: number;
  current_claims: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  created_at: string;
  entries?: DropEntryRecord[];
  claims?: DropClaimRecord[];
};

const DROP_PERCENTAGE = 15;
const DEFAULT_KEYWORD = "CARDPOC";

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatDateTime(value: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function isDropCurrentlyActive(drop: DropRecord, nowTime = Date.now()) {
  return drop.is_active && new Date(drop.ends_at).getTime() > nowTime;
}

function getRemainingSeconds(drop: DropRecord, nowTime = Date.now()) {
  const remainingMs = new Date(drop.ends_at).getTime() - nowTime;

  if (!Number.isFinite(remainingMs) || remainingMs <= 0) return 0;

  return Math.ceil(remainingMs / 1000);
}

function formatRemainingTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0",
    )}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0",
  )}`;
}

type TranslationFn = ReturnType<typeof useLanguage>["t"];

function getRewardLabel(t: TranslationFn, rewardType: string) {
  if (rewardType === "xp") return translate(t, "liveDropsRewardXp", "XP");
  if (rewardType === "random_pack") {
    return translate(t, "liveDropsRewardRandomPack", "Pack Aleatório");
  }

  return rewardType;
}

function getDurationLabel(t: TranslationFn, minutes: number) {
  return `${minutes} ${translate(t, "liveDropsMinutes", "min")}`;
}

function getPlatformLabel(platform: string) {
  const normalizedPlatform = platform.trim().toLowerCase();

  if (normalizedPlatform === "kick") return "Kick";
  if (normalizedPlatform === "twitch") return "Twitch";
  if (normalizedPlatform === "youtube") return "YouTube";
  if (normalizedPlatform === "tiktok") return "TikTok";
  if (normalizedPlatform === "instagram") return "Instagram";

  return platform || "Social";
}

function getVisibleEntries(entries?: DropEntryRecord[]) {
  return (entries || []).slice(-14);
}

function normalizeDropEntry(value: unknown): DropEntryRecord | null {
  if (!value || typeof value !== "object") return null;

  const entry = value as Partial<DropEntryRecord>;

  if (!entry.id || !entry.drop_id || !entry.user_id) return null;

  return {
    id: String(entry.id),
    drop_id: String(entry.drop_id),
    user_id: String(entry.user_id),
    platform: String(entry.platform || "kick"),
    platform_username: entry.platform_username
      ? String(entry.platform_username)
      : null,
    entered_at: entry.entered_at
      ? String(entry.entered_at)
      : new Date().toISOString(),
  };
}

function normalizeDropClaim(value: unknown): DropClaimRecord | null {
  if (!value || typeof value !== "object") return null;

  const claim = value as Partial<DropClaimRecord>;

  if (!claim.id || !claim.drop_id || !claim.user_id) return null;

  return {
    id: String(claim.id),
    drop_id: String(claim.drop_id),
    user_id: String(claim.user_id),
    platform: String(claim.platform || "kick"),
    platform_username: claim.platform_username
      ? String(claim.platform_username)
      : null,
    claimed_at: claim.claimed_at
      ? String(claim.claimed_at)
      : new Date().toISOString(),
  };
}

export function LiveDropsModal({
  open,
  onClose,
  creatorId,
  platform,
  isLive,
  viewerCount,
  liveTitle,
}: LiveDropsModalProps) {
  const { t } = useLanguage();
  const [rewardType, setRewardType] = useState<RewardType>("random_pack");
  const [durationMinutes, setDurationMinutes] = useState<number>(10);
  const [saving, setSaving] = useState(false);
  const [loadingDrops, setLoadingDrops] = useState(false);
  const [endingDropId, setEndingDropId] = useState<string | null>(null);
  const [simulatingDropId, setSimulatingDropId] = useState<string | null>(null);
  const [drops, setDrops] = useState<DropRecord[]>([]);
  const [selectedWinnersDrop, setSelectedWinnersDrop] =
    useState<DropRecord | null>(null);
  const [nowTime, setNowTime] = useState(() => Date.now());
  const [autoDrawTriggeredDropIds, setAutoDrawTriggeredDropIds] = useState<
    string[]
  >([]);
  const [autoOpenedWinnersDropIds, setAutoOpenedWinnersDropIds] = useState<
    string[]
  >([]);
  const previousClaimsByDropIdRef = useRef<Record<string, number>>({});
  const autoDrawInFlightDropIdsRef = useRef<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const normalizedViewerCount = Math.max(
    0,
    Math.floor(Number(viewerCount) || 0),
  );

  const maxClaims = useMemo(() => {
    if (!isLive || normalizedViewerCount <= 0) return 0;
    return Math.max(
      1,
      Math.floor(normalizedViewerCount * (DROP_PERCENTAGE / 100)),
    );
  }, [isLive, normalizedViewerCount]);

  const safeDurationMinutes = useMemo(() => {
    return Math.max(1, Math.floor(Number(durationMinutes) || 1));
  }, [durationMinutes]);

  const currentPlatformLabel = getPlatformLabel(platform);

  const activeDrops = useMemo(
    () => drops.filter((drop) => isDropCurrentlyActive(drop, nowTime)),
    [drops, nowTime],
  );

  const historyDrops = useMemo(
    () => drops.filter((drop) => !isDropCurrentlyActive(drop, nowTime)),
    [drops, nowTime],
  );

  const featuredActiveDrop = activeDrops[0];

  const visibleFeaturedEntries = useMemo(
    () => getVisibleEntries(featuredActiveDrop?.entries),
    [featuredActiveDrop?.entries],
  );

  const canActivate =
    isLive &&
    normalizedViewerCount > 0 &&
    maxClaims > 0 &&
    safeDurationMinutes >= 1 &&
    !saving;

  const getSessionAccessToken = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("missing_session");
    }

    return session.access_token;
  }, []);

  const loadDrops = useCallback(async () => {
    if (!open || !creatorId) return;

    setLoadingDrops(true);
    setError(null);

    try {
      const accessToken = await getSessionAccessToken();

      const response = await fetch("/api/drops/list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken,
          creatorId,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "drops_list_failed");
      }

      const payload = (await response.json()) as { drops?: DropRecord[] };
      const nextDrops = payload.drops || [];

      setDrops(nextDrops);

      return nextDrops;
    } catch (dropsError) {
      console.error("Erro ao carregar drops:", dropsError);
      setError(
        translate(
          t,
          "liveDropsListError",
          "Não foi possível carregar os drops agora.",
        ),
      );

      return null;
    } finally {
      setLoadingDrops(false);
    }
  }, [creatorId, getSessionAccessToken, open, t]);

  useEffect(() => {
    if (!open) return;

    setNowTime(Date.now());
    void loadDrops();

    const timeInterval = window.setInterval(() => {
      setNowTime(Date.now());
    }, 1000);

    const dropsInterval = window.setInterval(() => {
      void loadDrops();
    }, 3000);

    return () => {
      window.clearInterval(timeInterval);
      window.clearInterval(dropsInterval);
    };
  }, [loadDrops, open]);

  useEffect(() => {
    if (!selectedWinnersDrop) return;

    const updatedDrop = drops.find(
      (drop) => drop.id === selectedWinnersDrop.id,
    );

    if (updatedDrop) {
      setSelectedWinnersDrop(updatedDrop);
    }
  }, [drops, selectedWinnersDrop]);

  useEffect(() => {
    if (!open || drops.length === 0) return;

    const previousClaimsByDropId = previousClaimsByDropIdRef.current;
    let dropToOpen: DropRecord | null = null;

    for (const drop of drops) {
      const claimsCount = drop.claims?.length || 0;
      const previousClaimsCount = previousClaimsByDropId[drop.id];
      const wasAutoDrawTriggered = autoDrawTriggeredDropIds.includes(drop.id);

      if (
        claimsCount > 0 &&
        !autoOpenedWinnersDropIds.includes(drop.id) &&
        (wasAutoDrawTriggered ||
          (previousClaimsCount !== undefined &&
            claimsCount > previousClaimsCount))
      ) {
        dropToOpen = drop;
      }

      previousClaimsByDropId[drop.id] = claimsCount;
    }

    if (!dropToOpen) return;

    const dropToOpenId = dropToOpen.id;

    setSelectedWinnersDrop(dropToOpen);
    setAutoOpenedWinnersDropIds((currentIds) =>
      currentIds.includes(dropToOpenId)
        ? currentIds
        : [...currentIds, dropToOpenId],
    );
  }, [autoDrawTriggeredDropIds, autoOpenedWinnersDropIds, drops, open]);

  useEffect(() => {
    if (!open || drops.length === 0) return;

    const expiredPendingDrop = drops.find((drop) => {
      const hasParticipants = (drop.entries?.length || 0) > 0;
      const claimsCount = drop.claims?.length || 0;
      const maxClaimCount = Number(drop.max_claims || 0);
      const ended = getRemainingSeconds(drop, nowTime) <= 0;

      return (
        ended &&
        hasParticipants &&
        maxClaimCount > 0 &&
        claimsCount < maxClaimCount
      );
    });

    if (!expiredPendingDrop) return;
    if (autoDrawTriggeredDropIds.includes(expiredPendingDrop.id)) return;
    if (autoDrawInFlightDropIdsRef.current.has(expiredPendingDrop.id)) return;

    const dropIdToProcess = expiredPendingDrop.id;

    autoDrawInFlightDropIdsRef.current.add(dropIdToProcess);
    setAutoDrawTriggeredDropIds((currentIds) =>
      currentIds.includes(dropIdToProcess)
        ? currentIds
        : [...currentIds, dropIdToProcess],
    );

    let cancelled = false;

    async function runImmediateAutoDraw() {
      try {
        const response = await fetch(
          `/api/drops/auto-draw?source=live-drops-modal&drop_id=${dropIdToProcess}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

        if (!response.ok) {
          console.error(
            "Erro ao acionar sorteio automático do drop:",
            await response.text().catch(() => ""),
          );
        }

        for (let attempt = 0; attempt < 8; attempt += 1) {
          if (cancelled) return;

          const nextDrops = await loadDrops();
          const updatedDrop = nextDrops?.find((drop) => drop.id === dropIdToProcess);

          if ((updatedDrop?.claims?.length || 0) > 0) {
            setSelectedWinnersDrop(updatedDrop || null);
            setAutoOpenedWinnersDropIds((currentIds) =>
              currentIds.includes(dropIdToProcess)
                ? currentIds
                : [...currentIds, dropIdToProcess],
            );
            return;
          }

          await wait(900);
        }
      } catch (autoDrawError) {
        console.error(
          "Erro ao acionar sorteio automático do drop:",
          autoDrawError,
        );
      } finally {
        autoDrawInFlightDropIdsRef.current.delete(dropIdToProcess);
      }
    }

    void runImmediateAutoDraw();

    return () => {
      cancelled = true;
    };
  }, [autoDrawTriggeredDropIds, drops, loadDrops, nowTime, open]);

  const handleRealtimeEntryInsert = useCallback((entry: DropEntryRecord) => {
    setDrops((currentDrops) =>
      currentDrops.map((drop) => {
        if (drop.id !== entry.drop_id) return drop;

        const currentEntries = drop.entries || [];
        const alreadyExists = currentEntries.some(
          (item) => item.id === entry.id,
        );

        if (alreadyExists) {
          return {
            ...drop,
            entries: currentEntries.map((item) =>
              item.id === entry.id ? entry : item,
            ),
          };
        }

        return {
          ...drop,
          entries: [...currentEntries, entry].sort(
            (firstEntry, secondEntry) =>
              new Date(firstEntry.entered_at).getTime() -
              new Date(secondEntry.entered_at).getTime(),
          ),
        };
      }),
    );
  }, []);

  const handleRealtimeEntryDelete = useCallback((entry: DropEntryRecord) => {
    setDrops((currentDrops) =>
      currentDrops.map((drop) => {
        if (drop.id !== entry.drop_id) return drop;

        return {
          ...drop,
          entries: (drop.entries || []).filter((item) => item.id !== entry.id),
        };
      }),
    );
  }, []);

  const handleRealtimeClaimInsert = useCallback((claim: DropClaimRecord) => {
    setDrops((currentDrops) =>
      currentDrops.map((drop) => {
        if (drop.id !== claim.drop_id) return drop;

        const currentClaims = drop.claims || [];
        const alreadyExists = currentClaims.some(
          (item) => item.id === claim.id,
        );

        if (alreadyExists) {
          return {
            ...drop,
            claims: currentClaims.map((item) =>
              item.id === claim.id ? claim : item,
            ),
          };
        }

        return {
          ...drop,
          current_claims: Math.max(
            Number(drop.current_claims || 0),
            currentClaims.length + 1,
          ),
          claims: [...currentClaims, claim].sort(
            (firstClaim, secondClaim) =>
              new Date(firstClaim.claimed_at).getTime() -
              new Date(secondClaim.claimed_at).getTime(),
          ),
        };
      }),
    );
  }, []);

  useEffect(() => {
    if (!open || !featuredActiveDrop?.id) return;

    const channel = supabase
      .channel(`live-drop-realtime-${featuredActiveDrop.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "drop_entries",
          filter: `drop_id=eq.${featuredActiveDrop.id}`,
        },
        (payload) => {
          const entry = normalizeDropEntry(payload.new);
          if (!entry) return;
          handleRealtimeEntryInsert(entry);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "drop_entries",
          filter: `drop_id=eq.${featuredActiveDrop.id}`,
        },
        (payload) => {
          const entry = normalizeDropEntry(payload.new);
          if (!entry) return;
          handleRealtimeEntryInsert(entry);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "drop_entries",
          filter: `drop_id=eq.${featuredActiveDrop.id}`,
        },
        (payload) => {
          const entry = normalizeDropEntry(payload.old);
          if (!entry) return;
          handleRealtimeEntryDelete(entry);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "drop_claims",
          filter: `drop_id=eq.${featuredActiveDrop.id}`,
        },
        (payload) => {
          const claim = normalizeDropClaim(payload.new);
          if (!claim) return;
          handleRealtimeClaimInsert(claim);
          void loadDrops();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "creator_drops",
          filter: `id=eq.${featuredActiveDrop.id}`,
        },
        () => {
          void loadDrops();
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          void loadDrops();
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [
    featuredActiveDrop?.id,
    handleRealtimeClaimInsert,
    handleRealtimeEntryDelete,
    handleRealtimeEntryInsert,
    loadDrops,
    open,
  ]);

  async function handleActivateDrop() {
    if (!canActivate) return;

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const accessToken = await getSessionAccessToken();

      const response = await fetch("/api/drops/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken,
          creatorId,
          platform,
          keyword: DEFAULT_KEYWORD,
          rewardType,
          durationMinutes: safeDurationMinutes,
          viewerCount: normalizedViewerCount,
          dropPercentage: DROP_PERCENTAGE,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));

        if (payload?.error === "drop_cooldown_active") {
          const nextAvailableAt = payload?.nextAvailableAt
            ? formatDateTime(String(payload.nextAvailableAt))
            : "";

          throw new Error(
            nextAvailableAt
              ? `drop_cooldown_active:${nextAvailableAt}`
              : "drop_cooldown_active",
          );
        }

        throw new Error(payload?.error || "drop_create_failed");
      }

      setSuccessMessage(
        translate(
          t,
          "liveDropsCreatedDescription",
          "Drop ativado com sucesso. Os participantes entram pelo chat da Kick.",
        ).replace(/Kick/g, currentPlatformLabel),
      );
      await loadDrops();
    } catch (dropError) {
      console.error("Erro ao criar drop:", dropError);

      if (
        dropError instanceof Error &&
        dropError.message.startsWith("drop_cooldown_active")
      ) {
        const nextAvailableAt = dropError.message.split(":").slice(1).join(":");

        setError(
          nextAvailableAt
            ? `${translate(
                t,
                "liveDropsCooldownError",
                "Você já criou um drop recentemente. Próximo drop liberado às",
              )} ${nextAvailableAt}.`
            : translate(
                t,
                "liveDropsCooldownGenericError",
                "Você já criou um drop recentemente. Aguarde para criar outro.",
              ),
        );
      } else {
        setError(
          translate(
            t,
            "liveDropsCreateError",
            "Não foi possível ativar o drop agora.",
          ),
        );
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleEndDrop(dropId: string) {
    setEndingDropId(dropId);
    setError(null);
    setSuccessMessage(null);

    try {
      const accessToken = await getSessionAccessToken();

      const response = await fetch("/api/drops/end", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken,
          creatorId,
          dropId,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "drop_end_failed");
      }

      setSuccessMessage(
        translate(t, "liveDropsEnded", "Drop encerrado com sucesso."),
      );
      await loadDrops();
    } catch (endError) {
      console.error("Erro ao encerrar drop:", endError);
      setError(
        translate(
          t,
          "liveDropsEndError",
          "Não foi possível encerrar o drop agora.",
        ),
      );
    } finally {
      setEndingDropId(null);
    }
  }

  async function handleSimulateWinner(dropId: string) {
    setSimulatingDropId(dropId);
    setError(null);
    setSuccessMessage(null);

    try {
      const accessToken = await getSessionAccessToken();

      const response = await fetch("/api/drops/simulate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken,
          creatorId,
          dropId,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (payload?.error === "no_eligible_user") {
          throw new Error("no_eligible_user");
        }

        throw new Error(payload?.error || "drop_simulate_failed");
      }

      const username = String(
        payload?.winnerUsername || payload?.winnerEmail || "",
      ).trim();

      setSuccessMessage(
        username
          ? `${translate(
              t,
              "liveDropsSimulatedWinner",
              "Vencedor simulado com sucesso:",
            )} ${username}`
          : translate(
              t,
              "liveDropsSimulatedWinner",
              "Vencedor simulado com sucesso.",
            ),
      );

      await loadDrops();
    } catch (simulateError) {
      console.error("Erro ao simular vencedor:", simulateError);

      const message =
        simulateError instanceof Error &&
        simulateError.message === "no_eligible_user"
          ? translate(
              t,
              "liveDropsNoEligibleWinner",
              "Nenhum usuário elegível encontrado. O usuário precisa ter a plataforma vinculada e ainda não ter resgatado este drop.",
            )
          : translate(
              t,
              "liveDropsSimulateError",
              "Não foi possível simular um vencedor agora.",
            );

      setError(message);
    } finally {
      setSimulatingDropId(null);
    }
  }

  if (!open) return null;

  return (
    <CardpocModalShell
      onClose={onClose}
      showCloseButton
      closeLabel={translate(t, "liveDropsClose", "Fechar drops de live")}
      className="max-w-6xl"
      contentClassName="max-h-[calc(100dvh-1rem)] overflow-y-auto p-5 sm:p-7 lg:p-8 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
    >
      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-amber-100 shadow-[0_0_24px_rgba(251,191,36,0.12)]">
          <Gift className="h-4 w-4" />
          {translate(t, "liveDropsEyebrow", "Drops de Live")}
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-[28px] border border-white/10 bg-black/25 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-6">
            <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              {translate(t, "liveDropsTitle", "Ativar drop para a live")}
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
              {translate(
                t,
                "liveDropsDescription",
                "O Cardpoc usa 15% dos espectadores atuais da live como limite máximo de recompensas deste drop.",
              )}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-white/45">
                  <Radio
                    className={
                      isLive ? "h-4 w-4 text-red-200" : "h-4 w-4 text-white/35"
                    }
                  />
                  {translate(t, "liveDropsLiveStatus", "Status")}
                </div>
                <p
                  className={
                    isLive
                      ? "mt-3 text-lg font-black text-emerald-100"
                      : "mt-3 text-lg font-black text-white/45"
                  }
                >
                  {isLive
                    ? translate(t, "liveDropsOnline", "Ao vivo")
                    : translate(t, "liveDropsOffline", "Offline")}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-white/45">
                  <Users className="h-4 w-4 text-cyan-100" />
                  {translate(t, "liveDropsViewersNow", "Viewers agora")}
                </div>
                <p className="mt-3 text-lg font-black text-cyan-50">
                  {formatNumber(normalizedViewerCount)}
                </p>
              </div>

              <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-amber-100/70">
                  <Percent className="h-4 w-4 text-amber-100" />
                  {translate(t, "liveDropsPercentage", "Porcentagem")}
                </div>
                <p className="mt-3 text-lg font-black text-amber-50">
                  {DROP_PERCENTAGE}%
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-[24px] border border-emerald-300/20 bg-emerald-300/10 p-5">
              <div className="grid gap-4 md:grid-cols-[170px_minmax(0,1fr)] md:items-stretch">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-100/65">
                    {translate(t, "liveDropsAvailable", "Drops disponíveis")}
                  </p>
                  <p className="mt-2 text-4xl font-black text-emerald-50">
                    {formatNumber(maxClaims)}
                  </p>

                  {liveTitle ? (
                    <p className="mt-4 line-clamp-2 text-sm leading-6 text-white/55">
                      {liveTitle}
                    </p>
                  ) : null}

                  {featuredActiveDrop ? (
                    <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-emerald-100/60">
                      {translate(t, "liveDropsTimeRemaining", "Tempo restante")}
                      :{" "}
                      {formatRemainingTime(
                        getRemainingSeconds(featuredActiveDrop, nowTime),
                      )}
                    </p>
                  ) : null}
                </div>

                <div className="min-w-0 border-white/10 md:border-l md:pl-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">
                    {translate(t, "liveDropsParticipants", "Participantes")}
                  </p>

                  <div className="mt-3 h-[76px] overflow-hidden rounded-2xl border border-white/10 bg-black/10 p-3">
                    {visibleFeaturedEntries.length > 0 ? (
                      <div className="flex max-h-full flex-wrap content-start gap-2 overflow-hidden">
                        {visibleFeaturedEntries.map((entry) => (
                          <span
                            key={entry.id}
                            className="max-w-[160px] truncate rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-cyan-50"
                          >
                            {getPlatformLabel(entry.platform)} ·{" "}
                            {entry.platform_username ||
                              translate(t, "liveDropsUnknownUser", "Usuário")}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="flex h-full items-center text-sm font-bold text-white/45">
                        {translate(
                          t,
                          "liveDropsWaitingParticipants",
                          "Aguardando participantes no chat.",
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {!isLive ? (
              <div className="mt-5 flex gap-3 rounded-2xl border border-red-300/20 bg-red-500/10 p-4 text-sm leading-6 text-red-100/80">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                {translate(
                  t,
                  "liveDropsOfflineWarning",
                  "O criador precisa estar ao vivo na Kick para ativar drops.",
                ).replace(/Kick/g, currentPlatformLabel)}
              </div>
            ) : normalizedViewerCount <= 0 ? (
              <div className="mt-5 flex gap-3 rounded-2xl border border-yellow-300/20 bg-yellow-500/10 p-4 text-sm leading-6 text-yellow-100/80">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                {translate(
                  t,
                  "liveDropsNoViewersWarning",
                  "Não foi possível confirmar espectadores na live agora.",
                )}
              </div>
            ) : null}

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <section className="rounded-[24px] border border-white/10 bg-white/[0.035] p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-white/45">
                    <Gift className="h-4 w-4 text-emerald-100" />
                    {translate(t, "liveDropsActiveTitle", "Drops ativos")}
                  </p>

                  <button
                    type="button"
                    onClick={() => void loadDrops()}
                    disabled={loadingDrops}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-white/50 transition hover:bg-white/[0.06] disabled:opacity-50"
                  >
                    <RefreshCw
                      className={
                        loadingDrops
                          ? "h-3.5 w-3.5 animate-spin"
                          : "h-3.5 w-3.5"
                      }
                    />
                    {translate(t, "liveDropsRefresh", "Atualizar")}
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {loadingDrops && drops.length === 0 ? (
                    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/50">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {translate(t, "liveDropsLoading", "Carregando drops...")}
                    </div>
                  ) : activeDrops.length > 0 ? (
                    activeDrops.map((drop) => (
                      <article
                        key={drop.id}
                        className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-black text-emerald-50">
                              {getRewardLabel(t, drop.reward_type)}
                            </p>
                            <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-emerald-100/55">
                              {drop.keyword}
                            </p>
                            <p className="mt-2 text-sm font-bold text-emerald-50/80">
                              {formatNumber(drop.current_claims)} /{" "}
                              {formatNumber(drop.max_claims)}{" "}
                              {translate(
                                t,
                                "liveDropsClaimsLabel",
                                "resgatados",
                              )}
                            </p>
                          </div>

                          <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-emerald-100">
                            {translate(t, "liveDropsActiveStatus", "Ativo")}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-white/45">
                          <span>
                            {translate(
                              t,
                              "liveDropsTimeRemaining",
                              "Tempo restante",
                            )}
                            :{" "}
                            {formatRemainingTime(
                              getRemainingSeconds(drop, nowTime),
                            )}
                          </span>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => void handleSimulateWinner(drop.id)}
                              disabled={
                                simulatingDropId === drop.id ||
                                endingDropId === drop.id
                              }
                              className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-amber-100 transition hover:bg-amber-300/15 disabled:opacity-50"
                            >
                              {simulatingDropId === drop.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Gift className="h-3.5 w-3.5" />
                              )}
                              {simulatingDropId === drop.id
                                ? translate(
                                    t,
                                    "liveDropsSimulatingWinner",
                                    "Sorteando...",
                                  )
                                : translate(
                                    t,
                                    "liveDropsSimulateWinner",
                                    "Simular vencedor",
                                  )}
                            </button>

                            <button
                              type="button"
                              onClick={() => void handleEndDrop(drop.id)}
                              disabled={
                                endingDropId === drop.id ||
                                simulatingDropId === drop.id
                              }
                              className="inline-flex items-center gap-2 rounded-full border border-red-300/20 bg-red-500/10 px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-red-100 transition hover:bg-red-500/15 disabled:opacity-50"
                            >
                              {endingDropId === drop.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <XCircle className="h-3.5 w-3.5" />
                              )}
                              {translate(t, "liveDropsEnd", "Encerrar")}
                            </button>
                          </div>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/45">
                      {translate(
                        t,
                        "liveDropsNoActive",
                        "Nenhum drop ativo para este criador.",
                      )}
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-[24px] border border-white/10 bg-white/[0.035] p-5">
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-white/45">
                  <History className="h-4 w-4 text-cyan-100" />
                  {translate(t, "liveDropsHistoryTitle", "Últimos drops")}
                </p>

                <div className="mt-4 space-y-3">
                  {historyDrops.length > 0 ? (
                    historyDrops.slice(0, 3).map((drop) => (
                      <article
                        key={drop.id}
                        className="rounded-2xl border border-white/10 bg-black/20 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-black text-white/80">
                              {getRewardLabel(t, drop.reward_type)}
                            </p>
                            <p className="mt-2 text-sm font-bold text-white/65">
                              {formatNumber(drop.current_claims)} /{" "}
                              {formatNumber(drop.max_claims)}{" "}
                              {translate(
                                t,
                                "liveDropsClaimsLabel",
                                "resgatados",
                              )}
                            </p>
                            <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-white/35">
                              {translate(t, "liveDropsCreatedAt", "Criado")}:{" "}
                              {formatDateTime(drop.created_at)}
                            </p>
                          </div>

                          <div className="flex shrink-0 flex-col items-end gap-2">
                            <span className="rounded-full border border-emerald-300/15 bg-emerald-300/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-emerald-100/70">
                              {translate(
                                t,
                                "liveDropsCompletedStatus",
                                "Concluído",
                              )}
                            </span>

                            <button
                              type="button"
                              onClick={() => setSelectedWinnersDrop(drop)}
                              className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-cyan-100 transition hover:bg-cyan-300/15"
                            >
                              {translate(
                                t,
                                "liveDropsViewWinners",
                                "Ver vencedores",
                              )}
                            </button>
                          </div>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/45">
                      {translate(
                        t,
                        "liveDropsNoHistory",
                        "Nenhum drop encerrado ainda.",
                      )}
                    </div>
                  )}
                </div>
              </section>
            </div>
          </section>

          <aside className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5 sm:p-6">
            <div>
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-white/45">
                <Sparkles className="h-4 w-4 text-fuchsia-100" />
                {translate(t, "liveDropsReward", "Recompensa")}
              </p>

              <div className="mt-4 grid gap-3">
                <button
                  type="button"
                  onClick={() => setRewardType("random_pack")}
                  className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
                    rewardType === "random_pack"
                      ? "border-cyan-300/35 bg-cyan-300/12 text-cyan-50"
                      : "border-white/10 bg-black/20 text-white/60 hover:bg-white/[0.06]"
                  }`}
                >
                  <Package className="h-5 w-5 shrink-0" />
                  <span className="font-black">
                    {translate(
                      t,
                      "liveDropsRewardRandomPack",
                      "Pack Aleatório",
                    )}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRewardType("xp")}
                  className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
                    rewardType === "xp"
                      ? "border-fuchsia-300/35 bg-fuchsia-300/12 text-fuchsia-50"
                      : "border-white/10 bg-black/20 text-white/60 hover:bg-white/[0.06]"
                  }`}
                >
                  <Sparkles className="h-5 w-5 shrink-0" />
                  <span className="font-black">
                    {translate(t, "liveDropsRewardXp", "XP")}
                  </span>
                </button>
              </div>
            </div>

            <div className="mt-6">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-white/45">
                <Clock className="h-4 w-4 text-amber-100" />
                {translate(t, "liveDropsDuration", "Duração")}
              </p>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                <label className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    step={1}
                    inputMode="numeric"
                    value={durationMinutes}
                    onChange={(event) => {
                      const nextValue = Math.max(
                        1,
                        Math.floor(Number(event.target.value) || 1),
                      );

                      setDurationMinutes(nextValue);
                    }}
                    className="h-12 w-28 appearance-none rounded-2xl border border-amber-300/20 bg-black/30 px-4 text-center text-lg font-black text-amber-50 outline-none transition placeholder:text-white/25 focus:border-amber-200/45 focus:bg-amber-300/10 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />

                  <span className="text-sm font-black uppercase tracking-[0.18em] text-white/60">
                    {translate(t, "liveDropsMinutes", "min")}
                  </span>
                </label>

                <p className="mt-3 text-xs leading-5 text-white/40">
                  {translate(
                    t,
                    "liveDropsCustomDurationHint",
                    "Digite quantos minutos o drop ficará aberto. O criador só pode criar 1 drop a cada 2 horas.",
                  )}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-white/35">
                {translate(t, "liveDropsKeyword", "Palavra-chave")}
              </p>
              <p className="mt-2 text-2xl font-black tracking-[0.18em] text-white">
                {DEFAULT_KEYWORD}
              </p>
              <p className="mt-2 text-xs leading-5 text-white/40">
                {translate(
                  t,
                  "liveDropsFutureNote",
                  "Digite CARDPOC no chat da plataforma conectada para entrar no sorteio.",
                )}
              </p>
            </div>

            <div className="mt-6 rounded-[24px] border border-cyan-300/15 bg-cyan-300/[0.06] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-cyan-100/70">
                <CheckCircle2 className="h-4 w-4" />
                {translate(t, "liveDropsSummaryTitle", "Resumo do drop")}
              </p>

              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/35">
                    {translate(t, "liveDropsLiveStatus", "Status")}
                  </p>
                  <p
                    className={
                      isLive
                        ? "mt-2 font-black text-emerald-100"
                        : "mt-2 font-black text-white/45"
                    }
                  >
                    {isLive
                      ? translate(t, "liveDropsOnline", "Ao vivo")
                      : translate(t, "liveDropsOffline", "Offline")}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/35">
                    {translate(t, "liveDropsAvailable", "Drops disponíveis")}
                  </p>
                  <p className="mt-2 font-black text-cyan-50">
                    {formatNumber(maxClaims)} · {DROP_PERCENTAGE}%
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/35">
                    {translate(t, "liveDropsReward", "Recompensa")}
                  </p>
                  <p className="mt-2 font-black text-white/85">
                    {getRewardLabel(t, rewardType)}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/35">
                    {translate(t, "liveDropsDuration", "Duração")}
                  </p>
                  <p className="mt-2 font-black text-white/85">
                    {getDurationLabel(t, safeDurationMinutes)} ·{" "}
                    {DEFAULT_KEYWORD}
                  </p>
                </div>
              </div>
            </div>

            {successMessage ? (
              <div className="mt-5 flex gap-3 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm leading-6 text-emerald-100/85">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                {successMessage}
              </div>
            ) : null}

            {error ? (
              <div className="mt-5 flex gap-3 rounded-2xl border border-red-300/20 bg-red-500/10 p-4 text-sm leading-6 text-red-100/85">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                {error}
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleActivateDrop}
              disabled={!canActivate}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full border border-amber-200/30 bg-amber-300/15 px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-amber-50 transition hover:bg-amber-300/25 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Gift className="h-4 w-4" />
              )}
              {saving
                ? translate(t, "liveDropsActivating", "Ativando...")
                : translate(t, "liveDropsActivate", "Ativar drop")}
            </button>
          </aside>
        </div>
      </div>

      {selectedWinnersDrop ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-cyan-300/20 bg-[#07111c] p-5 shadow-[0_0_60px_rgba(34,211,238,0.16)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.14),transparent_38%)]" />

            <div className="relative z-10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-100/55">
                    {translate(t, "liveDropsWinnersEyebrow", "Resultado")}
                  </p>
                  <h3 className="mt-2 text-xl font-black text-white">
                    {translate(
                      t,
                      "liveDropsWinnersTitle",
                      "Vencedores do Drop",
                    )}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedWinnersDrop(null)}
                  className="rounded-full border border-white/10 bg-black/25 p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                  aria-label={translate(
                    t,
                    "liveDropsCloseWinners",
                    "Fechar vencedores",
                  )}
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-5 max-h-[320px] space-y-2 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {(selectedWinnersDrop.claims || []).length > 0 ? (
                  (selectedWinnersDrop.claims || []).map((claim) => (
                    <div
                      key={claim.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-300/15 bg-emerald-300/10 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-emerald-50">
                          {getPlatformLabel(claim.platform)} ·{" "}
                          {claim.platform_username ||
                            translate(t, "liveDropsUnknownUser", "Usuário")}
                        </p>
                        <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-100/45">
                          {formatDateTime(claim.claimed_at)}
                        </p>
                      </div>

                      <Gift className="h-4 w-4 shrink-0 text-emerald-100/70" />
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/50">
                    {translate(
                      t,
                      "liveDropsNoWinners",
                      "Nenhum vencedor neste drop.",
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </CardpocModalShell>
  );
}
