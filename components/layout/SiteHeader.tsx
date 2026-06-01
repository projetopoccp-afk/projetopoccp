"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, ChevronRight, LogOut, Package, Sparkles, Trophy, User, X } from "lucide-react";
import { AccountModal } from "@/components/account/AccountModal";
import { LoginModal } from "@/components/auth/LoginModal";
import { CollectionModal } from "@/components/collection/CollectionModal";
import { CreatorSearch } from "@/components/home/CreatorSearch";
import { ensureProfile } from "@/lib/auth/ensure-profile";
import { supabase } from "@/lib/supabase/client";

type SiteHeaderProps = {
  search: string;
  onSearchChange: (value: string) => void;
};

type AuthUser = {
  id: string;
  name: string;
  email: string;
};

type AccountProfile = {
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  is_admin: boolean | null;
};

type NotificationType =
  | "card_collected"
  | "card_won"
  | "level_up"
  | "pack_received"
  | "pack_opened"
  | "mission_completed"
  | "badge_unlocked"
  | "generic";

type UserNotification = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string | null;
  metadata: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
};

function getNotificationIcon(type: NotificationType) {
  if (type === "card_collected" || type === "card_won") return <Sparkles size={16} />;
  if (type === "level_up") return <Trophy size={16} />;
  if (type === "pack_received" || type === "pack_opened") return <Package size={16} />;

  return <Bell size={16} />;
}

function getNotificationTone(type: NotificationType) {
  if (type === "card_collected" || type === "card_won") return "border-cyan-300/20 bg-cyan-300/10 text-cyan-100";
  if (type === "level_up") return "border-yellow-300/20 bg-yellow-300/10 text-yellow-100";
  if (type === "pack_received" || type === "pack_opened") {
    return "border-purple-300/20 bg-purple-300/10 text-purple-100";
  }

  return "border-white/10 bg-white/[0.04] text-white";
}

function formatNotificationDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function SiteHeader({ search, onSearchChange }: SiteHeaderProps) {
  const [loginOpen, setLoginOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const notificationBoxRef = useRef<HTMLDivElement | null>(null);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read_at).length,
    [notifications]
  );

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setUser(null);
        setProfile(null);
        setNotifications([]);
        setNotificationsOpen(false);
        return;
      }

      await ensureProfile(user);

      setUser({
        id: user.id,
        name:
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          "Creator",
        email: user.email || "",
      });

      const { data } = await supabase
        .from("profiles")
        .select("display_name, username, avatar_url, is_admin")
        .eq("id", user.id)
        .single();

      setProfile(data);
      await loadNotifications(user.id);
    }

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      getUser();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadNotifications(user.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const userId = user.id;
    const interval = window.setInterval(() => {
      loadNotifications(userId);
    }, 2500);

    return () => {
      window.clearInterval(interval);
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const userId: string = user.id;

    function handleNotificationsUpdated() {
      loadNotifications(userId);
    }

    function handleNotificationCreated(event: Event) {
      const customEvent = event as CustomEvent<UserNotification>;
      const notification = customEvent.detail;

      if (!notification || notification.user_id !== userId) {
        loadNotifications(userId);
        return;
      }

      setNotifications((current) => {
        const alreadyExists = current.some((item) => item.id === notification.id);

        if (alreadyExists) {
          return current;
        }

        return [notification, ...current].slice(0, 12);
      });
    }

    window.addEventListener(
      "creator-nexus:notifications-updated",
      handleNotificationsUpdated
    );

    window.addEventListener(
      "creator-nexus:notification-created",
      handleNotificationCreated as EventListener
    );

    return () => {
      window.removeEventListener(
        "creator-nexus:notifications-updated",
        handleNotificationsUpdated
      );

      window.removeEventListener(
        "creator-nexus:notification-created",
        handleNotificationCreated as EventListener
      );
    };
  }, [user?.id]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationBoxRef.current &&
        !notificationBoxRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  async function loadNotifications(userId: string) {
    const { data, error } = await supabase
      .from("user_notifications")
      .select("id, user_id, type, title, message, metadata, read_at, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(12);

    if (error) {
      console.error("Erro ao carregar notificações:", error);
      setNotifications([]);
      return;
    }

    setNotifications((data || []) as UserNotification[]);
  }

  async function markNotificationAsRead(notificationId: string) {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read_at: notification.read_at || new Date().toISOString() }
          : notification
      )
    );

    const { error } = await supabase
      .from("user_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId);

    if (error) {
      console.error("Erro ao marcar notificação como lida:", error);
    }
  }

  async function markAllNotificationsAsRead() {
    if (!user) return;

    const now = new Date().toISOString();

    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read_at: notification.read_at || now,
      }))
    );

    const { error } = await supabase
      .from("user_notifications")
      .update({ read_at: now })
      .eq("user_id", user.id)
      .is("read_at", null);

    if (error) {
      console.error("Erro ao marcar todas as notificações como lidas:", error);
    }
  }

  function handleNotificationClick(notification: UserNotification) {
    markNotificationAsRead(notification.id);
    setNotificationsOpen(false);

    const metadata = notification.metadata || {};
    const cardId = metadata.card_id || metadata.user_card_id;
    const creatorId = metadata.creator_id;
    const creatorUsername = metadata.creator_username;

    if (notification.type === "card_collected" || notification.type === "card_won") {
      const detail = {
        card_id: typeof cardId === "string" ? cardId : undefined,
        creator_id: typeof creatorId === "string" ? creatorId : undefined,
        creator_username:
          typeof creatorUsername === "string" ? creatorUsername : undefined,
      };

      setCollectionOpen(true);

      window.setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("creator-nexus:open-collection-card", {
            detail,
          })
        );
      }, 120);

      return;
    }

    if (notification.type === "level_up") {
      setAccountOpen(true);

      window.dispatchEvent(
        new CustomEvent("creator-nexus:open-user-profile", {
          detail: {
            level:
              typeof metadata.new_level === "number" ||
              typeof metadata.new_level === "string"
                ? metadata.new_level
                : typeof metadata.level === "number" ||
                    typeof metadata.level === "string"
                  ? metadata.level
                  : undefined,
          },
        })
      );

      return;
    }

    setAccountOpen(true);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setNotifications([]);
    setNotificationsOpen(false);
    setAccountOpen(false);
  }

  const displayName = profile?.display_name || user?.name || "Creator";

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/50 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:h-20 md:flex-row md:items-center md:justify-between md:gap-6 md:px-6 md:py-0">
          <div className="flex items-center justify-between gap-3">
            <a href="/" className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.9)]" />

              <h1 className="text-sm font-black uppercase tracking-[0.25em] text-white sm:text-lg sm:tracking-[0.3em]">
                Creator Nexus
              </h1>
            </a>

            {user ? (
              <div className="flex items-center gap-2 md:hidden">
                <div ref={notificationBoxRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setNotificationsOpen((current) => !current)}
                    className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
                    aria-label="Abrir notificações"
                  >
                    <Bell size={17} />

                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan-300 px-1 text-[10px] font-black text-black">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  <NotificationsPopover
                    open={notificationsOpen}
                    notifications={notifications}
                    unreadCount={unreadCount}
                    onClose={() => setNotificationsOpen(false)}
                    onMarkAllAsRead={markAllNotificationsAsRead}
                    onNotificationClick={handleNotificationClick}
                  />
                </div>

                <button
                  onClick={() => setAccountOpen(true)}
                  className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100 transition hover:bg-cyan-300/20"
                >
                  Conta
                </button>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white transition hover:border-red-300/30 hover:bg-red-300/10"
                >
                  <LogOut size={16} />
                  Sair
                </button>
              </div>
            ) : (
              <button
                onClick={() => setLoginOpen(true)}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.06] md:hidden"
              >
                <User size={16} />
                Entrar
              </button>
            )}
          </div>

          <div className="w-full md:max-w-md">
            <CreatorSearch value={search} onChange={onSearchChange} />
          </div>

          {user ? (
            <div className="hidden items-center gap-3 md:flex">
              <div ref={notificationBoxRef} className="relative">
                <button
                  type="button"
                  onClick={() => setNotificationsOpen((current) => !current)}
                  className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
                  aria-label="Abrir notificações"
                >
                  <Bell size={18} />

                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan-300 px-1 text-[10px] font-black text-black">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                <NotificationsPopover
                  open={notificationsOpen}
                  notifications={notifications}
                  unreadCount={unreadCount}
                  onClose={() => setNotificationsOpen(false)}
                  onMarkAllAsRead={markAllNotificationsAsRead}
                  onNotificationClick={handleNotificationClick}
                />
              </div>

              <button
                onClick={() => setAccountOpen(true)}
                className="group rounded-2xl px-2 py-1 text-right transition hover:bg-white/[0.04]"
                title="Clique para abrir o painel"
              >
                <p className="text-sm font-semibold text-white transition group-hover:text-cyan-200">
                  {displayName}
                </p>

                <p className="text-xs text-cyan-100/55 transition group-hover:text-cyan-100">
                  Clique para abrir o painel
                </p>
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm text-white transition hover:border-red-300/30 hover:bg-red-300/10"
              >
                <LogOut size={18} />
                Sair
              </button>
            </div>
          ) : (
            <button
              onClick={() => setLoginOpen(true)}
              className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.06] md:flex"
            >
              <User size={18} />
              Entrar
            </button>
          )}
        </div>
      </header>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />

      <CollectionModal
        open={collectionOpen}
        onClose={() => setCollectionOpen(false)}
      />

      <AccountModal
        open={accountOpen}
        email={user?.email || ""}
        profile={profile}
        onClose={() => setAccountOpen(false)}
        onLogout={handleLogout}
      />
    </>
  );
}

function NotificationsPopover({
  open,
  notifications,
  unreadCount,
  onClose,
  onMarkAllAsRead,
  onNotificationClick,
}: {
  open: boolean;
  notifications: UserNotification[];
  unreadCount: number;
  onClose: () => void;
  onMarkAllAsRead: () => void;
  onNotificationClick: (notification: UserNotification) => void;
}) {
  if (!open) return null;

  return (
    <div className="absolute right-0 top-[calc(100%+12px)] z-[80] w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/95 text-white shadow-[0_24px_80px_rgba(0,0,0,0.85)] backdrop-blur-2xl">
      <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-cyan-400/15 blur-[60px]" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-purple-600/15 blur-[70px]" />

      <div className="relative z-10 flex items-center justify-between border-b border-white/10 p-4">
        <div>
          <p className="text-sm font-black">Notificações</p>
          <p className="mt-0.5 text-xs text-white/40">
            {unreadCount > 0
              ? `${unreadCount} nova${unreadCount > 1 ? "s" : ""}`
              : "Tudo em dia"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={onMarkAllAsRead}
              className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-bold text-cyan-100 transition hover:bg-cyan-300/20"
            >
              Ler todas
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/[0.04] p-1.5 text-white/55 transition hover:bg-white/10 hover:text-white"
            aria-label="Fechar notificações"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="relative z-10 max-h-[420px] overflow-y-auto p-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => onNotificationClick(notification)}
              className="group flex w-full items-start gap-3 rounded-2xl p-3 text-left transition hover:bg-white/[0.05]"
            >
              <div
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border ${getNotificationTone(
                  notification.type
                )}`}
              >
                {getNotificationIcon(notification.type)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-bold text-white">
                    {notification.title}
                  </p>

                  {!notification.read_at && (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.9)]" />
                  )}
                </div>

                {notification.message && (
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/45">
                    {notification.message}
                  </p>
                )}

                <p className="mt-2 text-[11px] text-white/30">
                  {formatNotificationDate(notification.created_at)}
                </p>
              </div>

              <ChevronRight
                size={16}
                className="mt-2 text-white/20 transition group-hover:text-cyan-100"
              />
            </button>
          ))
        ) : (
          <div className="p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/40">
              <Bell size={20} />
            </div>

            <p className="mt-4 text-sm font-bold text-white">
              Sem notificações por enquanto
            </p>

            <p className="mt-1 text-xs leading-relaxed text-white/40">
              Quando você ganhar cartas, pacotes, badges ou subir de nível,
              tudo aparecerá aqui.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
