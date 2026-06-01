"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Gift, Target, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { supabase } from "@/lib/supabase/client";
import { addUserXp } from "@/lib/xp/user-xp";
import { createUserNotification } from "@/lib/notifications/user-notifications";

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

export function MissionsModal({ open, onClose }: MissionsModalProps) {
  const [loading, setLoading] = useState(false);
  const [missions, setMissions] = useState<MissionWithProgress[]>([]);

  useEffect(() => {
    if (!open) return;
    loadMissions();
  }, [open]);

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
      (userMissionData || []).map((item) => [item.mission_id, item])
    );

    setMissions(
      (missionData || []).map((mission) => ({
        ...mission,
        userMission: progressMap.get(mission.id) || null,
      }))
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
      return;
    }

    if (mission.reward_xp > 0) {
      await addUserXp("complete_mission", {
        mission_id: mission.id,
        mission_title: mission.title,
      });
    }

    await createUserNotification({
      type: "mission_completed",
      title: "Missão concluída!",
      message: `Você concluiu "${mission.title}" e recebeu ${mission.reward_xp} XP.`,
      metadata: {
        mission_id: mission.id,
        reward_xp: mission.reward_xp,
      },
    });

    await loadMissions();
  }

  const completedCount = useMemo(() => {
    return missions.filter(
      (mission) =>
        (mission.userMission?.progress || 0) >= mission.target_amount
    ).length;
  }, [missions]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
          animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.94 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
            className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-[32px] border border-white/15 bg-zinc-950 text-white shadow-[0_0_80px_rgba(0,0,0,0.9)]"
          >
            <div className="pointer-events-none absolute -left-24 -top-24 h-56 w-56 rounded-full bg-emerald-500/20 blur-[90px]" />
            <div className="pointer-events-none absolute -bottom-24 -right-24 h-56 w-56 rounded-full bg-cyan-600/20 blur-[90px]" />

            <button
              type="button"
              onClick={onClose}
              className="absolute right-5 top-5 z-20 rounded-full border border-white/10 bg-white/5 p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
              aria-label="Fechar missões"
            >
              <X size={18} />
            </button>

            <div className="relative z-10 max-h-[90vh] overflow-y-auto p-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:p-8">
              <div className="inline-flex items-center gap-3 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-emerald-100">
                <Target size={14} />
                Missões
              </div>

              <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-3xl font-black md:text-5xl">
                    Desafios do Nexus
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm text-white/50">
                    Complete objetivos, ganhe XP e desbloqueie recompensas para
                    evoluir sua conta.
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-white/40">
                    Progresso
                  </p>
                  <p className="mt-1 text-2xl font-black">
                    {completedCount}/{missions.length}
                  </p>
                </div>
              </div>

              <div className="mt-8 grid gap-4">
                {loading && (
                  <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm text-white/50">
                    Carregando missões...
                  </div>
                )}

                {!loading && missions.length === 0 && (
                  <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm text-white/50">
                    Nenhuma missão ativa por enquanto.
                  </div>
                )}

                {!loading &&
                  missions.map((mission) => {
                    const progress = mission.userMission?.progress || 0;
                    const percentage = Math.min(
                      100,
                      Math.round((progress / mission.target_amount) * 100)
                    );
                    const completed = progress >= mission.target_amount;
                    const claimed = Boolean(mission.userMission?.claimed_at);

                    return (
                      <div
                        key={mission.id}
                        className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
                      >
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div className="flex items-start gap-4">
                            <div
                              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
                                completed
                                  ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
                                  : "border-cyan-300/20 bg-cyan-300/10 text-cyan-100"
                              }`}
                            >
                              {completed ? (
                                <CheckCircle2 size={24} />
                              ) : (
                                <Target size={24} />
                              )}
                            </div>

                            <div>
                              <h3 className="text-lg font-black">
                                {mission.title}
                              </h3>
                              <p className="mt-1 text-sm text-white/50">
                                {mission.description}
                              </p>

                              <div className="mt-4 h-2 w-full max-w-md overflow-hidden rounded-full bg-white/10">
                                <div
                                  className="h-full rounded-full bg-emerald-300"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>

                              <p className="mt-2 text-xs text-white/40">
                                {progress}/{mission.target_amount} concluído
                              </p>
                            </div>
                          </div>

                          <div className="flex shrink-0 flex-col items-start gap-3 md:items-end">
                            <span className="inline-flex items-center gap-2 rounded-full border border-yellow-300/20 bg-yellow-300/10 px-3 py-1 text-sm font-bold text-yellow-100">
                              <Gift size={14} />
                              +{mission.reward_xp} XP
                            </span>

                            <button
                              type="button"
                              disabled={!completed || claimed}
                              onClick={() => claimMissionReward(mission)}
                              className="rounded-full bg-emerald-300 px-5 py-2 text-sm font-black text-black transition hover:scale-105 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35 disabled:hover:scale-100"
                            >
                              {claimed
                                ? "Resgatado"
                                : completed
                                  ? "Resgatar"
                                  : "Em progresso"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}