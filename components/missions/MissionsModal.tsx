"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Gift,
  Package,
  Share2,
  Sparkles,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";

import { useLanguage } from "@/contexts/LanguageContext";
import { translate } from "@/lib/i18n/translate";
import { supabase } from "@/lib/supabase/client";
import { addUserXp } from "@/lib/xp/user-xp";
import { createUserNotification } from "@/lib/notifications/user-notifications";
import { CardpocModalShell } from "@/components/ui/CardpocModalShell";

type Mission = {
  id: string;
  title: string;
  description: string | null;
  mission_type: string;
  target_amount: number;
  reward_xp: number;
  reward_type: string | null;
  is_active: boolean | null;
};

type UserMission = {
  id: string;
  mission_id: string;
  progress: number;
  completed_at: string | null;
  claimed_at: string | null;
};

type MissionWithProgress = Mission & {
  userMission: UserMission | null;
};

type MissionsModalProps = {
  open: boolean;
  onClose: () => void;
};

type OpenMissionsEventDetail = {
  notificationId?: string | null;
  missionId?: string | null;
};

function normalizeMissionText(value: string | null | undefined) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getMissionTranslationKey(
  mission: Mission,
  field: "title" | "description",
) {
  const title = normalizeMissionText(mission.title);
  const description = normalizeMissionText(mission.description);
  const missionType = normalizeMissionText(mission.mission_type);

  if (
    title.includes("primeiro follow") ||
    title.includes("first follow") ||
    title.includes("primer follow") ||
    description.includes("siga seu primeiro") ||
    missionType.includes("first_follow")
  ) {
    return field === "title"
      ? "missionFirstFollowTitle"
      : "missionFirstFollowDescription";
  }

  if (
    title.includes("colecionador iniciante") ||
    title.includes("beginner collector") ||
    title.includes("coleccionista principiante") ||
    description.includes("conquiste 3") ||
    description.includes("collect 3") ||
    missionType.includes("beginner_collector")
  ) {
    return field === "title"
      ? "missionBeginnerCollectorTitle"
      : "missionBeginnerCollectorDescription";
  }

  if (
    title.includes("social nexus") ||
    description.includes("compartilhe 2") ||
    description.includes("share 2") ||
    missionType.includes("social")
  ) {
    return field === "title"
      ? "missionSocialNexusTitle"
      : "missionSocialNexusDescription";
  }

  if (
    title.includes("cacador de cartas") ||
    title.includes("card hunter") ||
    title.includes("cazador de cartas") ||
    description.includes("conquiste 10") ||
    description.includes("collect 10") ||
    missionType.includes("card_hunter")
  ) {
    return field === "title"
      ? "missionCardHunterTitle"
      : "missionCardHunterDescription";
  }

  return null;
}

function getMissionTitle(t: any, mission: Mission) {
  const key = getMissionTranslationKey(mission, "title");

  if (!key) {
    return mission.title;
  }

  return translate(t, key, mission.title);
}

function getMissionDescription(t: any, mission: Mission) {
  const key = getMissionTranslationKey(mission, "description");

  if (!key) {
    return mission.description || "";
  }

  return translate(t, key, mission.description || "");
}

function getMissionCategory(mission: Mission) {
  const title = normalizeMissionText(mission.title);
  const description = normalizeMissionText(mission.description);
  const missionType = normalizeMissionText(mission.mission_type);

  if (
    missionType.includes("follow") ||
    title.includes("follow") ||
    title.includes("fa dedicado") ||
    title.includes("rede de contatos") ||
    description.includes("siga")
  ) {
    return {
      label: "Criadores",
      className: "border-cyan-300/20 bg-cyan-300/10 text-cyan-100",
      Icon: Users,
    };
  }

  if (
    missionType.includes("share") ||
    missionType.includes("social") ||
    title.includes("social") ||
    title.includes("influenciador") ||
    description.includes("compartilhe")
  ) {
    return {
      label: "Social",
      className: "border-fuchsia-300/20 bg-fuchsia-300/10 text-fuchsia-100",
      Icon: Share2,
    };
  }

  if (
    missionType.includes("pack") ||
    title.includes("pack") ||
    title.includes("abertura") ||
    description.includes("pacote") ||
    description.includes("pack")
  ) {
    return {
      label: "Packs",
      className: "border-violet-300/20 bg-violet-300/10 text-violet-100",
      Icon: Package,
    };
  }

  if (
    missionType.includes("rarity") ||
    missionType.includes("rare") ||
    missionType.includes("epic") ||
    missionType.includes("legendary") ||
    missionType.includes("mythic") ||
    title.includes("rara") ||
    title.includes("epica") ||
    title.includes("lenda") ||
    title.includes("mito")
  ) {
    return {
      label: "Raridades",
      className: "border-yellow-300/20 bg-yellow-300/10 text-yellow-100",
      Icon: Sparkles,
    };
  }

  if (
    missionType.includes("collect") ||
    missionType.includes("card") ||
    title.includes("colecionador") ||
    title.includes("cartas") ||
    description.includes("carta")
  ) {
    return {
      label: "Coleção",
      className: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
      Icon: Trophy,
    };
  }

  return {
    label: "Iniciante",
    className: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
    Icon: Target,
  };
}

function getMissionSortWeight(mission: Mission) {
  const category = getMissionCategory(mission).label;

  const weights: Record<string, number> = {
    Iniciante: 0,
    Criadores: 1,
    Social: 2,
    Coleção: 3,
    Raridades: 4,
    Packs: 5,
  };

  return weights[category] ?? 99;
}

export function MissionsModal({ open, onClose }: MissionsModalProps) {
  const { t } = useLanguage();

  const [loading, setLoading] = useState(false);
  const [claimingMissionId, setClaimingMissionId] = useState<string | null>(
    null,
  );
  const [missions, setMissions] = useState<MissionWithProgress[]>([]);
  const [eventOpen, setEventOpen] = useState(false);
  const [highlightMissionId, setHighlightMissionId] = useState<string | null>(
    null,
  );

  const visible = open || eventOpen;

  useEffect(() => {
    const handleOpenMissions = (event: Event) => {
      const customEvent = event as CustomEvent<OpenMissionsEventDetail>;
      const missionId = customEvent.detail?.missionId || null;

      setEventOpen(true);
      setHighlightMissionId(missionId);
    };

    window.addEventListener("creator-nexus:open-missions", handleOpenMissions);

    return () => {
      window.removeEventListener(
        "creator-nexus:open-missions",
        handleOpenMissions,
      );
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    loadMissions();
  }, [visible]);

  function handleClose() {
    setEventOpen(false);
    setHighlightMissionId(null);
    onClose();
  }

  async function loadMissions() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMissions([]);
      setLoading(false);
      return;
    }

    const { data: missionData, error: missionError } = await supabase
      .from("missions")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (missionError) {
      console.error("Erro ao carregar missões:", missionError);
      setLoading(false);
      return;
    }

    const { data: userMissionData, error: userMissionError } = await supabase
      .from("user_missions")
      .select("*")
      .eq("user_id", user.id);

    if (userMissionError) {
      console.error("Erro ao carregar progresso:", userMissionError);
      setLoading(false);
      return;
    }

    const progressMap = new Map(
      (userMissionData || []).map((item) => [item.mission_id, item]),
    );

    setMissions(
      (missionData || []).map((mission) => ({
        ...mission,
        userMission: progressMap.get(mission.id) || null,
      })),
    );

    setLoading(false);
  }

  async function claimMissionReward(mission: MissionWithProgress) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const progress = mission.userMission?.progress || 0;
    const isCompleted = progress >= mission.target_amount;

    if (!isCompleted || mission.userMission?.claimed_at) return;

    const now = new Date().toISOString();

    setClaimingMissionId(mission.id);

    const { error } = await supabase
      .from("user_missions")
      .update({
        completed_at: mission.userMission?.completed_at || now,
        claimed_at: now,
      })
      .eq("user_id", user.id)
      .eq("mission_id", mission.id);

    if (error) {
      console.error("Erro ao resgatar missão:", error);
      setClaimingMissionId(null);
      return;
    }

    setMissions((currentMissions) =>
      currentMissions.map((currentMission) =>
        currentMission.id === mission.id
          ? {
              ...currentMission,
              userMission: currentMission.userMission
                ? {
                    ...currentMission.userMission,
                    completed_at:
                      currentMission.userMission.completed_at || now,
                    claimed_at: now,
                  }
                : {
                    id: "",
                    mission_id: mission.id,
                    progress: mission.target_amount,
                    completed_at: now,
                    claimed_at: now,
                  },
            }
          : currentMission,
      ),
    );

    const translatedMissionTitle = getMissionTitle(t, mission);

    if (mission.reward_xp > 0) {
      await addUserXp("complete_mission", {
        mission_id: mission.id,
        mission_title: translatedMissionTitle,
      });
    }

    await createUserNotification({
      type: "mission_completed",
      title: translate(
        t,
        "missionsModalNotificationTitle",
        "Missão concluída!",
      ),
      message: translate(
        t,
        "missionsModalNotificationMessage",
        `Você concluiu "${mission.title}" e recebeu ${mission.reward_xp} XP.`,
      )
        .replace("{missionTitle}", translatedMissionTitle)
        .replace("{rewardXp}", String(mission.reward_xp)),
      metadata: {
        mission_id: mission.id,
        reward_xp: mission.reward_xp,
      },
    });

    setClaimingMissionId(null);
  }

  const completedCount = useMemo(() => {
    return missions.filter(
      (mission) =>
        (mission.userMission?.progress || 0) >= mission.target_amount,
    ).length;
  }, [missions]);

  const sortedMissions = useMemo(() => {
    return [...missions].sort((a, b) => {
      const categoryDiff = getMissionSortWeight(a) - getMissionSortWeight(b);

      if (categoryDiff !== 0) return categoryDiff;

      return a.target_amount - b.target_amount;
    });
  }, [missions]);

  return (
    <AnimatePresence>
      {visible && (
        <CardpocModalShell
          onClose={handleClose}
          showCloseButton
          closeLabel={translate(t, "missionsModalCloseAria", "Fechar missões")}
          zIndexClassName="z-[120]"
          className="max-w-6xl"
          contentClassName="hide-scrollbar max-h-[calc(100vh-1.5rem)] overflow-y-auto p-6 md:p-8"
        >
          <div className="relative z-10">
            <div className="inline-flex items-center gap-3 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.3em] text-cyan-100 shadow-lg shadow-cyan-500/10">
              <Target size={14} />
              {translate(t, "missionsModalBadge", "Missões")}
            </div>

            <div className="mt-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-4xl font-black tracking-tight md:text-6xl">
                  {translate(t, "missionsModalTitle", "Desafios do Nexus")}
                </h2>
                <p className="mt-3 max-w-2xl text-sm text-white/50">
                  {translate(
                    t,
                    "missionsModalDescription",
                    "Complete objetivos, ganhe XP e desbloqueie recompensas para evoluir sua conta.",
                  )}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.05] px-6 py-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.25em] text-white/40">
                  {translate(t, "missionsModalProgressLabel", "Progresso")}
                </p>
                <p className="mt-1 text-2xl font-black">
                  {completedCount}/{missions.length}
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4">
              {loading && (
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm text-white/50">
                  {translate(
                    t,
                    "missionsModalLoading",
                    "Carregando missões...",
                  )}
                </div>
              )}

              {!loading && missions.length === 0 && (
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm text-white/50">
                  {translate(
                    t,
                    "missionsModalEmpty",
                    "Nenhuma missão ativa por enquanto.",
                  )}
                </div>
              )}

              {!loading &&
                sortedMissions.map((mission) => {
                  const progress = mission.userMission?.progress || 0;
                  const percentage = Math.min(
                    100,
                    Math.round((progress / mission.target_amount) * 100),
                  );
                  const completed = progress >= mission.target_amount;
                  const claimed = Boolean(mission.userMission?.claimed_at);
                  const claiming = claimingMissionId === mission.id;
                  const category = getMissionCategory(mission);
                  const CategoryIcon = category.Icon;

                  return (
                    <div
                      key={mission.id}
                      className={`group relative overflow-hidden rounded-3xl border p-5 shadow-xl shadow-black/20 backdrop-blur-xl transition duration-300 hover:border-cyan-200/20 hover:bg-white/[0.065] ${
                        highlightMissionId === mission.id
                          ? "border-cyan-200/40 bg-cyan-300/[0.08] ring-2 ring-cyan-300/20"
                          : "border-white/10 bg-white/[0.045]"
                      }`}
                    >
                      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-cyan-400/10 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
                      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-start gap-4">
                          <div
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
                              completed
                                ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"
                                : category.className
                            }`}
                          >
                            {completed ? (
                              <CheckCircle2 size={24} />
                            ) : (
                              <CategoryIcon size={24} />
                            )}
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-black">
                                {getMissionTitle(t, mission)}
                              </h3>
                              <span
                                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${category.className}`}
                              >
                                {category.label}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-white/50">
                              {getMissionDescription(t, mission)}
                            </p>

                            <div className="mt-4 h-2 w-full max-w-md overflow-hidden rounded-full bg-white/10">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-cyan-300 to-fuchsia-300 shadow-[0_0_18px_rgba(45,212,191,0.35)]"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>

                            <p className="mt-2 text-xs text-white/40">
                              {translate(
                                t,
                                "missionsModalProgressCount",
                                "{progress}/{target} concluído",
                              )
                                .replace("{current}", String(progress))
                                .replace("{progress}", String(progress))
                                .replace(
                                  "{target}",
                                  String(mission.target_amount),
                                )}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-col items-start gap-3 md:items-end">
                          <span className="inline-flex items-center gap-2 rounded-full border border-yellow-300/20 bg-yellow-300/10 px-3 py-1 text-sm font-bold text-yellow-100">
                            <Gift size={14} />+{mission.reward_xp} XP
                          </span>

                          <button
                            type="button"
                            disabled={!completed || claimed || claiming}
                            onClick={() => claimMissionReward(mission)}
                            className="rounded-full bg-emerald-300 px-5 py-2 text-sm font-black text-black transition hover:scale-105 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35 disabled:hover:scale-100"
                          >
                            {claiming
                              ? translate(
                                  t,
                                  "missionsModalClaiming",
                                  "Resgatando...",
                                )
                              : claimed
                                ? translate(
                                    t,
                                    "missionsModalClaimed",
                                    "Resgatado",
                                  )
                                : completed
                                  ? translate(
                                      t,
                                      "missionsModalClaim",
                                      "Resgatar",
                                    )
                                  : translate(
                                      t,
                                      "missionsModalInProgress",
                                      "Em progresso",
                                    )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </CardpocModalShell>
      )}
    </AnimatePresence>
  );
}
