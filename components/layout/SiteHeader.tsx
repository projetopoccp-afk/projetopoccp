"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import Link from "next/link";
import {
  Bell,
  ChevronRight,
  Globe2,
  LogOut,
  Package,
  Sparkles,
  Trophy,
  Trash2,
  User,
  X,
} from "lucide-react";
import { AccountModal } from "@/components/account/AccountModal";
import { CollectionModal } from "@/components/collection/CollectionModal";
import { LoginModal } from "@/components/auth/LoginModal";
import { LogoutConfirmModal } from "@/components/auth/LogoutConfirmModal";
import { CreatorSearch } from "@/components/home/CreatorSearch";
import { ensureProfile } from "@/lib/auth/ensure-profile";
import { supabase } from "@/lib/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

type SiteHeaderProps = {
  search?: string;
  onSearchChange?: (value: string) => void;
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

type SiteLanguage = "pt" | "en" | "es";

const SITE_LANGUAGES: {
  id: SiteLanguage;
  labelKey: "languagePortuguese" | "languageEnglish" | "languageSpanish";
  shortLabel: string;
  nativeLabel: string;
}[] = [
  {
    id: "pt",
    labelKey: "languagePortuguese",
    shortLabel: "PT",
    nativeLabel: "Português",
  },
  {
    id: "en",
    labelKey: "languageEnglish",
    shortLabel: "EN",
    nativeLabel: "English",
  },
  {
    id: "es",
    labelKey: "languageSpanish",
    shortLabel: "ES",
    nativeLabel: "Español",
  },
];

function getLanguageLabel(language: SiteLanguage) {
  return (
    SITE_LANGUAGES.find((item) => item.id === language)?.shortLabel || "PT"
  );
}

function getNotificationIcon(type: NotificationType) {
  if (type === "card_collected" || type === "card_won")
    return <Sparkles size={16} />;
  if (type === "level_up") return <Trophy size={16} />;
  if (type === "pack_received" || type === "pack_opened")
    return <Package size={16} />;

  return <Bell size={16} />;
}

function getNotificationTone(type: NotificationType) {
  if (type === "card_collected" || type === "card_won")
    return "border-cyan-300/20 bg-cyan-300/10 text-cyan-100";
  if (type === "level_up")
    return "border-yellow-300/20 bg-yellow-300/10 text-yellow-100";
  if (type === "pack_received" || type === "pack_opened") {
    return "border-purple-300/20 bg-purple-300/10 text-purple-100";
  }

  return "border-white/10 bg-white/[0.04] text-white";
}

type TranslateFunction = (key: any) => string;

function translate(t: TranslateFunction, key: string, fallback: string) {
  const value = t(key);

  return value && value !== key ? value : fallback;
}

function getDateLocale(language: SiteLanguage) {
  if (language === "en") return "en-US";
  if (language === "es") return "es-ES";

  return "pt-BR";
}

function formatNotificationDate(date: string, language: SiteLanguage) {
  return new Intl.DateTimeFormat(getDateLocale(language), {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function SiteHeader({ search, onSearchChange }: SiteHeaderProps = {}) {
  const [internalSearch, setInternalSearch] = useState("");
  const effectiveSearch = search ?? internalSearch;
  const handleSearchChange = onSearchChange ?? setInternalSearch;

  const [loginOpen, setLoginOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [collectionInitialCardId, setCollectionInitialCardId] = useState<
    string | null
  >(null);
  const [collectionInitialCreatorId, setCollectionInitialCreatorId] = useState<
    string | null
  >(null);
  const [languageOpen, setLanguageOpen] = useState(false);
  const notificationBoxRef = useRef<HTMLDivElement | null>(null);
  const languageBoxRef = useRef<HTMLDivElement | null>(null);
  const openCollectionCardTimeoutRef = useRef<number | null>(null);

  const { language, setLanguage, t } = useLanguage();

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read_at).length,
    [notifications],
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

  const channelName = `user-notifications-${user.id}`;

  // Remove canais antigos com o mesmo nome para evitar duplicação
  supabase
    .getChannels()
    .filter(
      (existingChannel) =>
        existingChannel.topic === `realtime:${channelName}`,
    )
    .forEach((existingChannel) => {
      supabase.removeChannel(existingChannel);
    });

  const channel = supabase
    .channel(channelName)
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
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const userId: string = user.id;

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
        const alreadyExists = current.some(
          (item) => item.id === notification.id,
        );

        if (alreadyExists) {
          return current;
        }

        return [notification, ...current].slice(0, 12);
      });
    }

    window.addEventListener(
      "creator-nexus:notifications-updated",
      handleNotificationsUpdated,
    );

    window.addEventListener(
      "creator-nexus:notification-created",
      handleNotificationCreated as EventListener,
    );

    return () => {
      window.removeEventListener(
        "creator-nexus:notifications-updated",
        handleNotificationsUpdated,
      );

      window.removeEventListener(
        "creator-nexus:notification-created",
        handleNotificationCreated as EventListener,
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

      if (
        languageBoxRef.current &&
        !languageBoxRef.current.contains(event.target as Node)
      ) {
        setLanguageOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (openCollectionCardTimeoutRef.current) {
        window.clearTimeout(openCollectionCardTimeoutRef.current);
      }
    };
  }, []);

  async function loadNotifications(userId: string) {
    const { data, error } = await supabase
      .from("user_notifications")
      .select(
        "id, user_id, type, title, message, metadata, read_at, created_at",
      )
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
          ? {
              ...notification,
              read_at: notification.read_at || new Date().toISOString(),
            }
          : notification,
      ),
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
      })),
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

  async function clearAllNotifications() {
    if (!user || notifications.length === 0) return;

    const confirmed = window.confirm(
      translate(
        t,
        "clearNotificationsConfirm",
        "Tem certeza que deseja limpar todas as suas notificações?",
      ),
    );

    if (!confirmed) return;

    const previousNotifications = notifications;

    setNotifications([]);

    const { error } = await supabase
      .from("user_notifications")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      console.error("Erro ao limpar notificações:", error);
      setNotifications(previousNotifications);
    }
  }

  function handleNotificationClick(notification: UserNotification) {
    markNotificationAsRead(notification.id);
    setNotificationsOpen(false);

    const metadata = notification.metadata || {};
    const cardId = metadata.card_id || metadata.user_card_id;
    const creatorId = metadata.creator_id;

    if (
      notification.type === "card_collected" ||
      notification.type === "card_won"
    ) {
      /*
        Importante:
        antes o SiteHeader disparava um window.dispatchEvent("creator-nexus:open-collection-card").
        Esse evento continuava sendo consumido pelo CollectionModal e podia reabrir a carta
        infinitamente ao fechar. Agora o fluxo é controlado por props: o header guarda qual
        carta deve abrir, passa isso para o CollectionModal e limpa esse estado assim que a
        carta é aberta.
      */
      setAccountOpen(false);
      setCollectionInitialCardId(typeof cardId === "string" ? cardId : null);
      setCollectionInitialCreatorId(
        typeof creatorId === "string" ? creatorId : null,
      );
      setCollectionOpen(true);

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
        }),
      );

      return;
    }

    setAccountOpen(true);
  }

  function handleLanguageChange(nextLanguage: SiteLanguage) {
    setLanguage(nextLanguage);
    setLanguageOpen(false);

    if (typeof window !== "undefined") {
      window.localStorage.setItem("creator-nexus-language", nextLanguage);

      window.dispatchEvent(
        new CustomEvent("creator-nexus:language-changed", {
          detail: {
            language: nextLanguage,
          },
        }),
      );
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setNotifications([]);
    setNotificationsOpen(false);
    setAccountOpen(false);
    setCollectionOpen(false);
    setLogoutConfirmOpen(false);
  }

  function requestLogout() {
    setLogoutConfirmOpen(true);
  }

  const displayName = profile?.display_name || user?.name || "Creator";

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/50 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:h-20 md:flex-row md:items-center md:justify-between md:gap-6 md:px-6 md:py-0">
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/"
              className="group relative flex items-center gap-3 rounded-3xl border border-white/0 px-1 py-1 transition hover:border-cyan-300/10 hover:bg-white/[0.025]"
              aria-label="Cardpoc"
            >
              <div className="pointer-events-none absolute -inset-3 rounded-[2rem] bg-[radial-gradient(circle_at_30%_30%,rgba(34,211,238,0.16),transparent_42%),radial-gradient(circle_at_80%_75%,rgba(217,70,239,0.14),transparent_42%)] opacity-0 blur-xl transition duration-300 group-hover:opacity-100" />

              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[1.25rem] border border-cyan-300/30 bg-[radial-gradient(circle_at_72%_18%,rgba(34,211,238,0.30),transparent_30%),radial-gradient(circle_at_22%_82%,rgba(217,70,239,0.20),transparent_34%),linear-gradient(145deg,rgba(255,255,255,0.10),rgba(255,255,255,0.015))] shadow-[0_0_34px_rgba(34,211,238,0.22)] transition duration-300 group-hover:-translate-y-0.5 group-hover:rotate-[-2deg] group-hover:border-cyan-200/60 group-hover:shadow-[0_0_48px_rgba(34,211,238,0.32)]">
                <div className="absolute inset-1.5 rounded-[0.95rem] border border-white/10 bg-black/45" />
                <div className="absolute left-1/2 top-1.5 h-1.5 w-7 -translate-x-1/2 rounded-full bg-cyan-200/70 shadow-[0_0_16px_rgba(34,211,238,0.9)]" />
                <div className="absolute bottom-2 left-2 h-2 w-2 rounded-full bg-fuchsia-300 shadow-[0_0_16px_rgba(217,70,239,0.85)]" />
                <div className="absolute right-2 top-2 h-2 w-2 rounded-full border border-cyan-100/50" />
                <div className="absolute -right-4 top-1/2 h-14 w-5 -translate-y-1/2 rotate-12 bg-white/10 blur-md transition duration-500 group-hover:right-10" />

                <span className="relative text-[21px] font-black leading-none text-white drop-shadow-[0_0_16px_rgba(34,211,238,0.45)]">
                  ◈
                </span>
              </div>

              <div className="relative flex min-w-[140px] flex-col leading-none sm:min-w-[168px]">
                <div className="flex items-center gap-2">
                  <span className="h-px w-4 bg-cyan-300/70 shadow-[0_0_12px_rgba(34,211,238,0.85)]" />
                  <span className="bg-gradient-to-r from-cyan-100 via-white to-white bg-clip-text text-[15px] font-black uppercase tracking-[0.28em] text-transparent sm:text-[18px] sm:tracking-[0.34em]">
                    Card
                  </span>
                </div>

                <div className="-mt-0.5 flex items-center gap-2 pl-7 sm:pl-8">
                  <span className="bg-gradient-to-r from-white via-fuchsia-100 to-cyan-100 bg-clip-text text-[17px] font-black uppercase tracking-[0.20em] text-transparent drop-shadow-[0_0_14px_rgba(217,70,239,0.22)] sm:text-[22px] sm:tracking-[0.26em]">
                    Poc
                  </span>
                  <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-200 shadow-[0_0_14px_rgba(217,70,239,0.85)]" />
                </div>

                <span className="mt-1 hidden text-[8px] font-bold uppercase tracking-[0.28em] text-cyan-100/45 sm:block">
                  {translate(t, "brandTaglineShort", "Colecione criadores")}
                </span>
              </div>
            </Link>

            {user ? (
              <div className="flex items-center gap-2 md:hidden">
                <div ref={notificationBoxRef} className="relative">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setNotificationsOpen((current) => !current);
                    }}
                    className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
                    aria-label={translate(
                      t,
                      "openNotifications",
                      "Abrir notificações",
                    )}
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
                    onClearAll={clearAllNotifications}
                    onNotificationClick={handleNotificationClick}
                  />
                </div>

                <button
                  onClick={() => setAccountOpen(true)}
                  className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100 transition hover:bg-cyan-300/20"
                >
                  {translate(t, "account", "Conta")}
                </button>

                <button
                  onClick={requestLogout}
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white transition hover:border-red-300/30 hover:bg-red-300/10"
                >
                  <LogOut size={16} />
                  {translate(t, "logout", "Sair")}
                </button>

                <LanguageSwitcher
                  language={language}
                  open={languageOpen}
                  boxRef={languageBoxRef}
                  buttonSize="mobile"
                  onToggle={() => setLanguageOpen((current) => !current)}
                  onChange={handleLanguageChange}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 md:hidden">
                <button
                  onClick={() => setLoginOpen(true)}
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.06]"
                >
                  <User size={16} />
                  {translate(t, "login", "Entrar")}
                </button>

                <LanguageSwitcher
                  language={language}
                  open={languageOpen}
                  boxRef={languageBoxRef}
                  buttonSize="mobile"
                  onToggle={() => setLanguageOpen((current) => !current)}
                  onChange={handleLanguageChange}
                />
              </div>
            )}
          </div>

          <div className="w-full md:max-w-md">
            <CreatorSearch
              value={effectiveSearch}
              onChange={handleSearchChange}
            />
          </div>

          {user ? (
            <div className="hidden items-center gap-3 md:flex">
              <div ref={notificationBoxRef} className="relative">
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setNotificationsOpen((current) => !current);
                  }}
                  className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
                  aria-label={translate(
                    t,
                    "openNotifications",
                    "Abrir notificações",
                  )}
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
                  onClearAll={clearAllNotifications}
                  onNotificationClick={handleNotificationClick}
                />
              </div>

              <button
                onClick={() => setAccountOpen(true)}
                className="group rounded-2xl px-2 py-1 text-right transition hover:bg-white/[0.04]"
                title={translate(t, "openPanel", "Clique para abrir o painel")}
              >
                <p className="text-sm font-semibold text-white transition group-hover:text-cyan-200">
                  {displayName}
                </p>

                <p className="text-xs text-cyan-100/55 transition group-hover:text-cyan-100">
                  {translate(t, "openPanel", "Clique para abrir o painel")}
                </p>
              </button>

              <button
                onClick={requestLogout}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm text-white transition hover:border-red-300/30 hover:bg-red-300/10"
              >
                <LogOut size={18} />
                {translate(t, "logout", "Sair")}
              </button>

              <LanguageSwitcher
                language={language}
                open={languageOpen}
                boxRef={languageBoxRef}
                buttonSize="desktop"
                onToggle={() => setLanguageOpen((current) => !current)}
                onChange={handleLanguageChange}
              />
            </div>
          ) : (
            <div className="hidden items-center gap-3 md:flex">
              <button
                onClick={() => setLoginOpen(true)}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.06]"
              >
                <User size={18} />
                {translate(t, "login", "Entrar")}
              </button>

              <LanguageSwitcher
                language={language}
                open={languageOpen}
                boxRef={languageBoxRef}
                buttonSize="desktop"
                onToggle={() => setLanguageOpen((current) => !current)}
                onChange={handleLanguageChange}
              />
            </div>
          )}
        </div>
      </header>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />

      <AccountModal
        open={accountOpen}
        email={user?.email || ""}
        profile={profile}
        onClose={() => setAccountOpen(false)}
        onLogout={requestLogout}
      />

      <LogoutConfirmModal
        open={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={handleLogout}
      />

      <CollectionModal
        open={collectionOpen}
        initialCardId={collectionInitialCardId}
        initialCreatorId={collectionInitialCreatorId}
        onInitialCardOpened={() => {
          setCollectionInitialCardId(null);
          setCollectionInitialCreatorId(null);
        }}
        onClose={() => {
          setCollectionOpen(false);
          setCollectionInitialCardId(null);
          setCollectionInitialCreatorId(null);

          if (openCollectionCardTimeoutRef.current) {
            window.clearTimeout(openCollectionCardTimeoutRef.current);
            openCollectionCardTimeoutRef.current = null;
          }
        }}
      />
    </>
  );
}

function LanguageSwitcher({
  language,
  open,
  boxRef,
  buttonSize,
  onToggle,
  onChange,
}: {
  language: SiteLanguage;
  open: boolean;
  boxRef: RefObject<HTMLDivElement | null>;
  buttonSize: "mobile" | "desktop";
  onToggle: () => void;
  onChange: (language: SiteLanguage) => void;
}) {
  const isDesktop = buttonSize === "desktop";
  const { t } = useLanguage();

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onToggle();
        }}
        className={`relative flex items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white transition hover:border-cyan-300/30 hover:bg-cyan-300/10 ${
          isDesktop ? "h-11 w-11" : "h-10 w-10"
        }`}
        aria-label={translate(t, "changeLanguage", "Alterar idioma")}
        title={translate(t, "changeLanguage", "Alterar idioma")}
      >
        <Globe2 size={isDesktop ? 18 : 17} />

        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan-300 px-1 text-[10px] font-black text-black">
          {getLanguageLabel(language)}
        </span>
      </button>

      {open && (
        <div
          onClick={(event) => event.stopPropagation()}
          className="absolute right-0 top-[calc(100%+12px)] z-[80] w-52 overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/95 text-white shadow-[0_24px_80px_rgba(0,0,0,0.85)] backdrop-blur-2xl"
        >
          <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-cyan-400/15 blur-[50px]" />

          <div className="relative z-10 border-b border-white/10 p-4">
            <p className="text-sm font-black">
              {translate(t, "language", "Idioma")}
            </p>
            <p className="mt-0.5 text-xs text-white/40">
              {translate(t, "chooseSiteLanguage", "Escolha o idioma do site")}
            </p>
          </div>

          <div className="relative z-10 p-2">
            {SITE_LANGUAGES.map((item) => {
              const selected = item.id === language;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onChange(item.id);
                  }}
                  className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left transition ${
                    selected
                      ? "bg-cyan-300/10 text-cyan-100"
                      : "text-white/65 hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  <span>
                    <span className="block text-sm font-bold">
                      {item.nativeLabel}
                    </span>
                    <span className="block text-xs text-white/35">
                      {translate(t, item.labelKey, item.nativeLabel)}
                    </span>
                  </span>

                  <span
                    className={`rounded-full border px-2 py-1 text-[10px] font-black ${
                      selected
                        ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100"
                        : "border-white/10 bg-white/[0.04] text-white/40"
                    }`}
                  >
                    {item.shortLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationsPopover({
  open,
  notifications,
  unreadCount,
  onClose,
  onMarkAllAsRead,
  onClearAll,
  onNotificationClick,
}: {
  open: boolean;
  notifications: UserNotification[];
  unreadCount: number;
  onClose: () => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onNotificationClick: (notification: UserNotification) => void;
}) {
  const { language, t } = useLanguage();

  if (!open) return null;

  return (
    <div
      onClick={(event) => event.stopPropagation()}
      className="absolute right-0 top-[calc(100%+12px)] z-[80] w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/95 text-white shadow-[0_24px_80px_rgba(0,0,0,0.85)] backdrop-blur-2xl"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-cyan-400/15 blur-[60px]" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-purple-600/15 blur-[70px]" />

      <div className="relative z-10 flex items-center justify-between border-b border-white/10 p-4">
        <div>
          <p className="text-sm font-black">
            {translate(t, "notifications", "Notificações")}
          </p>
          <p className="mt-0.5 text-xs text-white/40">
            {unreadCount > 0
              ? translate(
                  t,
                  "newNotificationsCount",
                  "{count} nova(s)",
                ).replace("{count}", String(unreadCount))
              : translate(t, "allCaughtUp", "Tudo em dia")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onMarkAllAsRead();
              }}
              className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-bold text-cyan-100 transition hover:bg-cyan-300/20"
            >
              {translate(t, "markAllRead", "Ler todas")}
            </button>
          )}

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onClearAll();
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-red-300/20 bg-red-300/10 px-3 py-1.5 text-xs font-bold text-red-100 transition hover:bg-red-300/20"
            >
              <Trash2 size={12} />
              {translate(t, "clearNotifications", "Limpar")}
            </button>
          )}

          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onClose();
            }}
            className="rounded-full border border-white/10 bg-white/[0.04] p-1.5 text-white/55 transition hover:bg-white/10 hover:text-white"
            aria-label={translate(
              t,
              "closeNotifications",
              "Fechar notificações",
            )}
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
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onNotificationClick(notification);
              }}
              className="group flex w-full items-start gap-3 rounded-2xl p-3 text-left transition hover:bg-white/[0.05]"
            >
              <div
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border ${getNotificationTone(
                  notification.type,
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
                  {formatNotificationDate(notification.created_at, language)}
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
              {translate(
                t,
                "noNotificationsTitle",
                "Sem notificações por enquanto",
              )}
            </p>

            <p className="mt-1 text-xs leading-relaxed text-white/40">
              {translate(
                t,
                "noNotificationsDescription",
                "Quando você ganhar cartas, pacotes, badges ou subir de nível, tudo aparecerá aqui.",
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
