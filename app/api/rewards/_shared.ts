import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type PackType = "common_pack" | "rare_pack" | "epic_pack" | "legendary_pack" | "random_pack";

export const REWARD_TIME_ZONE = "America/Sao_Paulo";
export const ACTIVITY_MINUTES_PER_CYCLE = 20;
export const ACTIVITY_XP_PER_CYCLE = 25;
export const ACTIVITY_MAX_CYCLES_PER_DAY = 6;
export const ACTIVITY_MAX_XP_PER_DAY = ACTIVITY_XP_PER_CYCLE * ACTIVITY_MAX_CYCLES_PER_DAY;

export function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export function getSupabaseClients(authorizationHeader: string | null) {
  const supabaseUrl = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseAnonKey = getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const supabaseServiceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: authorizationHeader
        ? {
            Authorization: authorizationHeader,
          }
        : undefined,
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return { userClient, adminClient };
}

export async function getAuthenticatedUser(userClient: SupabaseClient) {
  const {
    data: { user },
    error,
  } = await userClient.auth.getUser();

  if (error || !user) {
    return { user: null, error };
  }

  return { user, error: null };
}

export function getRewardDate(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: REWARD_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(date);
}

export function getNextRewardDateStartIso(date = new Date()) {
  const rewardDate = getRewardDate(date);
  const [year, month, day] = rewardDate.split("-").map(Number);
  const nextUtc = new Date(Date.UTC(year, month - 1, day + 1, 3, 0, 0));
  return nextUtc.toISOString();
}

export function rollDailyPackType(): PackType {
  const roll = Math.random() * 100;

  if (roll < 1) return "legendary_pack";
  if (roll < 5) return "epic_pack";
  if (roll < 20) return "rare_pack";
  return "common_pack";
}

export async function createRewardEvent(
  adminClient: SupabaseClient,
  input: {
    userId: string;
    type: string;
    amount?: number;
    metadata?: Record<string, unknown>;
  },
) {
  const { error } = await adminClient.from("reward_events").insert({
    user_id: input.userId,
    type: input.type,
    amount: input.amount ?? 0,
    metadata: input.metadata ?? {},
  });

  if (error) {
    console.error("Erro ao registrar reward_event:", error);
  }
}

export async function createUserNotification(
  adminClient: SupabaseClient,
  input: {
    userId: string;
    type: string;
    title: string;
    message: string;
    metadata?: Record<string, unknown>;
  },
) {
  const { error } = await adminClient.from("user_notifications").insert({
    user_id: input.userId,
    type: input.type,
    title: input.title,
    message: input.message,
    metadata: input.metadata ?? {},
  });

  if (error) {
    console.error("Erro ao criar notificação de recompensa:", error);
  }
}

export async function getActivityStatus(adminClient: SupabaseClient, userId: string, rewardDate: string) {
  const { data, error } = await adminClient
    .from("user_activity_rewards")
    .select("minutes_active, xp_granted, reward_cycles, last_ping_at")
    .eq("user_id", userId)
    .eq("reward_date", rewardDate)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const minutesActive = Number(data?.minutes_active ?? 0);
  const xpGranted = Number(data?.xp_granted ?? 0);
  const rewardCycles = Number(data?.reward_cycles ?? 0);
  const dailyLimitReached = rewardCycles >= ACTIVITY_MAX_CYCLES_PER_DAY || xpGranted >= ACTIVITY_MAX_XP_PER_DAY;
  const currentCycleMinutes = minutesActive % ACTIVITY_MINUTES_PER_CYCLE;
  const nextRewardInMinutes = dailyLimitReached
    ? 0
    : Math.max(1, ACTIVITY_MINUTES_PER_CYCLE - currentCycleMinutes);

  return {
    minutesActive,
    xpGranted,
    rewardCycles,
    maxCycles: ACTIVITY_MAX_CYCLES_PER_DAY,
    minutesPerCycle: ACTIVITY_MINUTES_PER_CYCLE,
    xpPerCycle: ACTIVITY_XP_PER_CYCLE,
    nextRewardInMinutes,
    dailyLimitReached,
    lastPingAt: data?.last_ping_at ?? null,
  };
}
