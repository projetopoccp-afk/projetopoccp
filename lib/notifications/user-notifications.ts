import { supabase } from "@/lib/supabase/client";

export type UserNotificationType =
  | "card_collected"
  | "level_up"
  | "follow_creator"
  | "package_received"
  | "package_opened"
  | "mission_completed"
  | "badge_unlocked"
  | "generic";

export type UserNotification = {
  id: string;
  user_id: string;
  type: UserNotificationType;
  title: string;
  message: string | null;
  metadata: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};

export async function createUserNotification({
  type,
  title,
  message,
  metadata = {},
}: {
  type: UserNotificationType;
  title: string;
  message?: string;
  metadata?: Record<string, unknown>;
}) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return null;

  const { data, error } = await supabase
    .from("user_notifications")
    .insert({
      user_id: user.id,
      type,
      title,
      message: message ?? null,
      metadata,
    })
    .select("*")
    .single();

  if (error) {
    console.error("Erro ao criar notificação:", error);
    return null;
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("creator-nexus:notification-created", {
        detail: data,
      })
    );

    window.dispatchEvent(new Event("creator-nexus:notifications-updated"));
  }

  return data as UserNotification;
}

export async function getUserNotifications(limit = 10) {
  const { data, error } = await supabase
    .from("user_notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Erro ao buscar notificações:", error);
    return [];
  }

  return (data || []) as UserNotification[];
}

export async function markUserNotificationAsRead(notificationId: string) {
  const { error } = await supabase
    .from("user_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId);

  if (error) {
    console.error("Erro ao marcar notificação como lida:", error);
    return false;
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("creator-nexus:notifications-updated"));
  }

  return true;
}

export async function markAllUserNotificationsAsRead() {
  const { error } = await supabase
    .from("user_notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);

  if (error) {
    console.error("Erro ao marcar todas como lidas:", error);
    return false;
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("creator-nexus:notifications-updated"));
  }

  return true;
}