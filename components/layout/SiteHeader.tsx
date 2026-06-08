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
import { PacksModal } from "@/components/packs/PacksModal";
import { LogoutConfirmModal } from "@/components/auth/LogoutConfirmModal";
import { CreatorSearch } from "@/components/home/CreatorSearch";
import { ensureProfile } from "@/lib/auth/ensure-profile";
import { supabase } from "@/lib/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { MissionsModal } from "@/components/missions/MissionsModal";

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
  xp?: number | null;
  level?: number | null;
};

type NotificationType =
  | "card_collected"
  | "card_won"
  | "level_up"
  | "xp_gained"
  | "xp_reward"
  | "pack_received"
  | "pack_opened"
  | "package_received"
  | "package_opened"
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
  if (
    type === "pack_received" ||
    type === "pack_opened" ||
    type === "package_received" ||
    type === "package_opened"
  )
    return <Package size={16} />;

  return <Bell size={16} />;
}

function getNotificationTone(type: NotificationType) {
  if (type === "card_collected" || type === "card_won")
    return "border-cyan-300/20 bg-cyan-300/10 text-cyan-100";
  if (type === "level_up")
    return "border-yellow-300/20 bg-yellow-300/10 text-yellow-100";
  if (
    type === "pack_received" ||
    type === "pack_opened" ||
    type === "package_received" ||
    type === "package_opened"
  ) {
    return "border-purple-300/20 bg-purple-300/10 text-purple-100";
  }

  return "border-white/10 bg-white/[0.04] text-white";
}

type TranslateFunction = (key: any) => string;

function translate(t: TranslateFunction, key: string, fallback: string) {
  const value = t(key);

  return value && value !== key ? value : fallback;
}

function getNotificationActionLabel(
  type: NotificationType,
  t: TranslateFunction,
) {
  if (type === "card_collected" || type === "card_won") {
    return translate(t, "viewCard", "Ver carta");
  }

  if (
    type === "pack_received" ||
    type === "pack_opened" ||
    type === "package_received" ||
    type === "package_opened"
  ) {
    return translate(t, "openPack", "Abrir pacote");
  }

  if (type === "level_up") {
    return translate(t, "viewProgress", "Ver progresso");
  }

  if (type === "mission_completed") {
    return translate(t, "viewMissions", "Ver missões");
  }

  if (type === "badge_unlocked") {
    return translate(t, "viewBadge", "Ver badge");
  }

  return translate(t, "open", "Abrir");
}

function getNotificationToastTitle(
  type: NotificationType,
  t: TranslateFunction,
) {
  if (type === "card_collected" || type === "card_won") {
    return translate(t, "cardNotificationToast", "Nova carta");
  }

  if (type === "pack_received" || type === "package_received") {
    return translate(t, "packReceivedToast", "Pacote recebido");
  }

  if (type === "pack_opened" || type === "package_opened") {
    return translate(t, "packOpenedToast", "Pacote aberto");
  }

  if (type === "level_up") {
    return translate(t, "levelUpToast", "Level up");
  }

  if (type === "mission_completed") {
    return translate(t, "missionCompletedToast", "Missão completa");
  }

  if (type === "badge_unlocked") {
    return translate(t, "badgeUnlockedToast", "Badge desbloqueada");
  }

  return translate(t, "newNotification", "Nova notificação");
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

function getMetadataString(
  metadata: Record<string, unknown>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const value = metadata[key];

    if (typeof value === "string" && value.trim()) {
      return value;
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }

  return null;
}


function getMetadataBoolean(
  metadata: Record<string, unknown>,
  keys: string[],
): boolean {
  return keys.some((key) => {
    const value = metadata[key];

    if (typeof value === "boolean") return value;

    if (typeof value === "string") {
      const normalizedValue = value.trim().toLowerCase();
      return ["true", "yes", "sim", "1"].includes(normalizedValue);
    }

    if (typeof value === "number") return value === 1;

    return false;
  });
}

function getMetadataNumber(
  metadata: Record<string, unknown>,
  keys: string[],
): number | null {
  for (const key of keys) {
    const value = metadata[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsedValue = Number(value);
      if (Number.isFinite(parsedValue)) return parsedValue;
    }
  }

  return null;
}

function notificationHasText(
  notification: UserNotification,
  values: string[],
): boolean {
  const text = `${notification.title || ""} ${notification.message || ""}`.toLowerCase();

  return values.some((value) => text.includes(value));
}

function metadataHasIntent(
  metadata: Record<string, unknown>,
  intents: string[],
): boolean {
  const possibleValues = [
    metadata.action,
    metadata.target,
    metadata.destination,
    metadata.kind,
    metadata.entity,
    metadata.source,
  ];

  return possibleValues.some((value) => {
    if (typeof value !== "string") return false;

    const normalizedValue = value.toLowerCase();

    return intents.some((intent) => normalizedValue.includes(intent));
  });
}

function isMissionNotification(notification: UserNotification) {
  const metadata = notification.metadata || {};

  return (
    notification.type === "mission_completed" ||
    Boolean(
      getMetadataString(metadata, [
        "mission_id",
        "missionId",
        "user_mission_id",
        "userMissionId",
      ]),
    ) ||
    metadataHasIntent(metadata, [
      "mission",
      "missions",
      "missao",
      "missão",
      "missoes",
      "missões",
    ]) ||
    notificationHasText(notification, [
      "missão",
      "missao",
      "missões",
      "missoes",
    ])
  );
}

function isXpOnlyNotification(notification: UserNotification) {
  const metadata = notification.metadata || {};

  if (notification.type === "card_collected" || notification.type === "card_won") {
    return false;
  }

  if (notification.type === "mission_completed") {
    return false;
  }

  if (notification.type === "xp_gained" || notification.type === "xp_reward") {
    return true;
  }

  if (
    getMetadataBoolean(metadata, [
      "converted_to_xp",
      "convertedToXp",
      "duplicate_to_xp",
      "duplicateToXp",
      "xp_only",
      "xpOnly",
    ])
  ) {
    return true;
  }

  if (
    getMetadataNumber(metadata, [
      "xp",
      "xp_amount",
      "xpAmount",
      "xp_reward",
      "xpReward",
      "reward_xp",
      "rewardXp",
    ]) !== null &&
    !isMissionNotification(notification)
  ) {
    return true;
  }

  if (
    metadataHasIntent(metadata, [
      "xp",
      "experience",
      "experiencia",
      "experiência",
      "duplicate",
      "duplicada",
      "duplicado",
    ])
  ) {
    return true;
  }

  return notificationHasText(notification, [
    " xp",
    "+xp",
    "experiência",
    "experiencia",
    "convertida em xp",
    "convertido em xp",
    "virou xp",
    "ganhou xp",
  ]);
}

function isPackNotification(notification: UserNotification) {
  const metadata = notification.metadata || {};

  return (
    notification.type === "pack_received" ||
    notification.type === "pack_opened" ||
    notification.type === "package_received" ||
    notification.type === "package_opened" ||
    Boolean(
      getMetadataString(metadata, [
        "pack_id",
        "user_pack_id",
        "pack_type",
        "pack_rarity",
      ]),
    ) ||
    metadataHasIntent(metadata, ["pack", "pacote", "packs"])
  );
}

function isCardNotification(notification: UserNotification) {
  const metadata = notification.metadata || {};

  return (
    notification.type === "card_collected" ||
    notification.type === "card_won" ||
    Boolean(
      getMetadataString(metadata, [
        "card_id",
        "user_card_id",
        "collection_card_id",
        "creator_id",
        "creator_username",
      ]),
    ) ||
    metadataHasIntent(metadata, [
      "card",
      "carta",
      "collection",
      "colecao",
      "coleção",
    ])
  );
}

export function SiteHeader({ search, onSearchChange }: SiteHeaderProps = {}) {
  const [internalSearch, setInternalSearch] = useState("");
  const effectiveSearch = search ?? internalSearch;

  function handleSearchChange(value: string) {
    if (onSearchChange) {
      onSearchChange(value);
      return;
    }

    setInternalSearch(value);

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("cardpoc:creator-search", {
          detail: { value },
        })
      );
    }
  }

  const [loginOpen, setLoginOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [packsOpen, setPacksOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [notificationToast, setNotificationToast] =
    useState<UserNotification | null>(null);
  const [notificationBellPulse, setNotificationBellPulse] = useState(false);
  const [collectionInitialCardId, setCollectionInitialCardId] = useState<
    string | null
  >(null);
  const [collectionInitialCreatorId, setCollectionInitialCreatorId] = useState<
    string | null
  >(null);
  const [languageOpen, setLanguageOpen] = useState(false);
  const notificationBoxRef = useRef<HTMLDivElement | null>(null);
  const notificationMobileBoxRef = useRef<HTMLDivElement | null>(null);
  const languageBoxRef = useRef<HTMLDivElement | null>(null);
  const openCollectionCardTimeoutRef = useRef<number | null>(null);
  const clearCollectionInitialStateTimeoutRef = useRef<number | null>(null);
  const notificationActionUnlockTimeoutRef = useRef<number | null>(null);
  const activeNotificationActionRef = useRef<string | null>(null);
  const notificationToastTimeoutRef = useRef<number | null>(null);
  const notificationBellPulseTimeoutRef = useRef<number | null>(null);

  const { language, setLanguage, t } = useLanguage();

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read_at).length,
    [notifications],
  );

  function pushNotificationFeedback(notification: UserNotification) {
    setNotificationToast(notification);
    setNotificationBellPulse(true);

    if (notificationToastTimeoutRef.current) {
      window.clearTimeout(notificationToastTimeoutRef.current);
    }

    if (notificationBellPulseTimeoutRef.current) {
      window.clearTimeout(notificationBellPulseTimeoutRef.current);
    }

    notificationToastTimeoutRef.current = window.setTimeout(() => {
      setNotificationToast(null);
      notificationToastTimeoutRef.current = null;
    }, 5600);

    notificationBellPulseTimeoutRef.current = window.setTimeout(() => {
      setNotificationBellPulse(false);
      notificationBellPulseTimeoutRef.current = null;
    }, 2800);
  }

  function addNotificationToState(
    notification: UserNotification,
    options: { showFeedback?: boolean } = {},
  ) {
    setNotifications((current) => {
      const alreadyExists = current.some((item) => item.id === notification.id);

      if (alreadyExists) {
        return current.map((item) =>
          item.id === notification.id ? { ...item, ...notification } : item,
        );
      }

      return [notification, ...current].slice(0, 12);
    });

    if (options.showFeedback) {
      pushNotificationFeedback(notification);
    }
  }

  async function refreshProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Erro ao carregar profile:", error);
      return;
    }

    setProfile(data);
  }

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

      await refreshProfile(user.id);
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
        (payload) => {
          if (payload.eventType === "INSERT" && payload.new) {
            const notification = payload.new as UserNotification;

            if (notification.user_id === user.id) {
              addNotificationToState(notification, { showFeedback: true });
              return;
            }
          }

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
    }, 30000);

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

      addNotificationToState(notification, { showFeedback: true });
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
    if (!user?.id) return;

    const userId = user.id;

    function handleProfileUpdated() {
      refreshProfile(userId);
    }

    window.addEventListener("cardpoc-profile-updated", handleProfileUpdated);

    window.addEventListener(
      "creator-nexus:profile-updated",
      handleProfileUpdated,
    );

    return () => {
      window.removeEventListener(
        "cardpoc-profile-updated",
        handleProfileUpdated,
      );

      window.removeEventListener(
        "creator-nexus:profile-updated",
        handleProfileUpdated,
      );
    };
  }, [user?.id]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const clickedInsideDesktopNotifications =
        notificationBoxRef.current?.contains(target) ?? false;
      const clickedInsideMobileNotifications =
        notificationMobileBoxRef.current?.contains(target) ?? false;

      if (
        !clickedInsideDesktopNotifications &&
        !clickedInsideMobileNotifications
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

      if (clearCollectionInitialStateTimeoutRef.current) {
        window.clearTimeout(clearCollectionInitialStateTimeoutRef.current);
      }

      if (notificationActionUnlockTimeoutRef.current) {
        window.clearTimeout(notificationActionUnlockTimeoutRef.current);
      }

      if (notificationToastTimeoutRef.current) {
        window.clearTimeout(notificationToastTimeoutRef.current);
      }

      if (notificationBellPulseTimeoutRef.current) {
        window.clearTimeout(notificationBellPulseTimeoutRef.current);
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

  function clearCollectionInitialState() {
    setCollectionInitialCardId(null);
    setCollectionInitialCreatorId(null);

    if (clearCollectionInitialStateTimeoutRef.current) {
      window.clearTimeout(clearCollectionInitialStateTimeoutRef.current);
      clearCollectionInitialStateTimeoutRef.current = null;
    }
  }

  function unlockNotificationAction(notificationId: string) {
    if (notificationActionUnlockTimeoutRef.current) {
      window.clearTimeout(notificationActionUnlockTimeoutRef.current);
    }

    notificationActionUnlockTimeoutRef.current = window.setTimeout(() => {
      if (activeNotificationActionRef.current === notificationId) {
        activeNotificationActionRef.current = null;
      }

      notificationActionUnlockTimeoutRef.current = null;
    }, 1400);
  }

  function openCollectionFromNotification(notification: UserNotification) {
    const metadata = notification.metadata || {};
    const cardId = getMetadataString(metadata, [
      "card_id",
      "user_card_id",
      "collection_card_id",
    ]);
    const creatorId = getMetadataString(metadata, [
      "creator_id",
      "creatorId",
      "creator_username",
      "username",
    ]);

    setAccountOpen(false);
    setPacksOpen(false);
    setCollectionInitialCardId(cardId);
    setCollectionInitialCreatorId(creatorId);
    setCollectionOpen(true);

    if (openCollectionCardTimeoutRef.current) {
      window.clearTimeout(openCollectionCardTimeoutRef.current);
      openCollectionCardTimeoutRef.current = null;
    }

    if (clearCollectionInitialStateTimeoutRef.current) {
      window.clearTimeout(clearCollectionInitialStateTimeoutRef.current);
      clearCollectionInitialStateTimeoutRef.current = null;
    }

    /*
      A notificação deve abrir a coleção/carta apenas uma vez.
      O CollectionModal já recebe initialCardId/initialCreatorId por props e
      consome esse valor internamente. Não disparamos mais eventos globais aqui,
      porque isso criava um segundo gatilho capaz de reabrir a coleção depois
      que o usuário tentava fechar o modal.
    */
    clearCollectionInitialStateTimeoutRef.current = window.setTimeout(() => {
      clearCollectionInitialState();
    }, 1600);
  }

  function openPacksFromNotification() {
    setAccountOpen(false);
    setCollectionOpen(false);
    clearCollectionInitialState();
    setPacksOpen(true);

    /*
      O PacksModal já é controlado pelo estado packsOpen.
      Evitamos eventos globais para não manter um gatilho externo vivo que
      possa reabrir o modal após o fechamento.
    */
  }

  function openMissionsFromNotification(notification: UserNotification) {
  setCollectionOpen(false);
  setPacksOpen(false);
  setAccountOpen(false);
  clearCollectionInitialState();

  window.setTimeout(() => {
    window.dispatchEvent(
      new CustomEvent("creator-nexus:open-missions", {
        detail: {
          notificationId: notification.id,
          missionId: getMetadataString(notification.metadata || {}, [
            "mission_id",
            "missionId",
            "user_mission_id",
            "userMissionId",
          ]),
        },
      }),
    );
  }, 0);
}

  function handleNotificationClick(notification: UserNotification) {
    if (activeNotificationActionRef.current === notification.id) {
      return;
    }

    activeNotificationActionRef.current = notification.id;
    unlockNotificationAction(notification.id);

    setNotificationToast(null);
    markNotificationAsRead(notification.id);
    setNotificationsOpen(false);

    if (isMissionNotification(notification)) {
      openMissionsFromNotification(notification);
      return;
    }

    if (isPackNotification(notification)) {
      openPacksFromNotification();
      return;
    }

    if (isXpOnlyNotification(notification)) {
      clearCollectionInitialState();
      setCollectionOpen(false);
      setPacksOpen(false);
      setAccountOpen(true);
      return;
    }

    if (isCardNotification(notification)) {
      openCollectionFromNotification(notification);
      return;
    }

    const metadata = notification.metadata || {};

    if (notification.type === "level_up") {
      setCollectionOpen(false);
      setPacksOpen(false);
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
    setNotificationToast(null);
    setNotificationBellPulse(false);
    setNotificationsOpen(false);
    setAccountOpen(false);
    setCollectionOpen(false);
    setPacksOpen(false);
    setLogoutConfirmOpen(false);
    clearCollectionInitialState();
    activeNotificationActionRef.current = null;
  }

  function requestLogout() {
    setLogoutConfirmOpen(true);
  }

  const displayName = profile?.display_name || user?.name || "Creator";
  const avatarUrl = profile?.avatar_url || null;
  const userLevel = Number(profile?.level ?? 0);
  const accountMeta =
    userLevel > 0
      ? `LVL ${userLevel} • ${translate(t, "collectorRole", "Colecionador")}`
      : translate(t, "collectorRole", "Colecionador");

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
                <div ref={notificationMobileBoxRef} className="relative">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setNotificationsOpen((current) => !current);
                    }}
                    className={`relative flex h-10 w-10 items-center justify-center rounded-full border text-white transition hover:border-cyan-300/30 hover:bg-cyan-300/10 ${
                      notificationBellPulse
                        ? "animate-pulse border-cyan-200/60 bg-cyan-300/15 shadow-[0_0_30px_rgba(34,211,238,0.45)]"
                        : "border-white/10 bg-white/[0.03]"
                    }`}
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
                  className="group flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-cyan-300/20 bg-cyan-300/10 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.12)] transition hover:bg-cyan-300/20"
                  aria-label={translate(t, "account", "Conta")}
                  title={displayName}
                >
                  <UserAvatar
                    avatarUrl={avatarUrl}
                    displayName={displayName}
                    size="mobile"
                  />
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

          <Link
            href="/rankings"
            className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full border border-yellow-300/20 bg-yellow-300/[0.06] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-yellow-100 shadow-[0_0_26px_rgba(250,204,21,0.08)] transition hover:-translate-y-0.5 hover:border-yellow-200/45 hover:bg-yellow-300/[0.10] hover:shadow-[0_0_34px_rgba(250,204,21,0.16)] md:w-auto md:shrink-0"
            aria-label={translate(t, "openRankings", "Abrir rankings")}
            title={translate(t, "openRankings", "Abrir rankings")}
          >
            <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(250,204,21,0.20),transparent_34%),radial-gradient(circle_at_80%_80%,rgba(34,211,238,0.10),transparent_40%)] opacity-70 transition group-hover:opacity-100" />
            <Trophy
              size={17}
              className="relative drop-shadow-[0_0_12px_rgba(250,204,21,0.65)]"
            />
            <span className="relative">
              {translate(t, "rankings", "Rankings")}
            </span>
          </Link>

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
                  className={`relative flex h-11 w-11 items-center justify-center rounded-full border text-white transition hover:border-cyan-300/30 hover:bg-cyan-300/10 ${
                    notificationBellPulse
                      ? "animate-pulse border-cyan-200/60 bg-cyan-300/15 shadow-[0_0_30px_rgba(34,211,238,0.45)]"
                      : "border-white/10 bg-white/[0.03]"
                  }`}
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
                className="group inline-flex max-w-[190px] items-center gap-3 rounded-2xl border border-white/0 px-2.5 py-2 text-left transition hover:border-cyan-300/15 hover:bg-white/[0.04]"
                title={translate(t, "openPanel", "Abrir painel")}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-cyan-300/20 bg-cyan-300/10 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.12)] transition group-hover:border-cyan-200/45 group-hover:bg-cyan-300/15">
                  <UserAvatar
                    avatarUrl={avatarUrl}
                    displayName={displayName}
                    size="desktop"
                  />
                </span>

                <span className="min-w-0 leading-none">
                  <span className="block truncate text-sm font-black text-white transition group-hover:text-cyan-100">
                    {displayName}
                  </span>

                  <span className="mt-1 block truncate text-[11px] font-bold uppercase tracking-[0.12em] text-cyan-100/55 transition group-hover:text-cyan-100">
                    {accountMeta}
                  </span>
                </span>
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

      <NotificationToast
        notification={notificationToast}
        onClose={() => setNotificationToast(null)}
        onOpen={(notification) => {
          setNotificationToast(null);
          handleNotificationClick(notification);
        }}
      />

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

      <PacksModal
        open={packsOpen}
        onClose={() => {
          setPacksOpen(false);
          activeNotificationActionRef.current = null;
        }}
      />

      <CollectionModal
        open={collectionOpen}
        initialCardId={collectionInitialCardId}
        initialCreatorId={collectionInitialCreatorId}
        onInitialCardOpened={() => {
          clearCollectionInitialState();
        }}
        onClose={() => {
          setCollectionOpen(false);
          clearCollectionInitialState();
          activeNotificationActionRef.current = null;

          if (openCollectionCardTimeoutRef.current) {
            window.clearTimeout(openCollectionCardTimeoutRef.current);
            openCollectionCardTimeoutRef.current = null;
          }
        }}
      />
    </>
  );
}

function UserAvatar({
  avatarUrl,
  displayName,
  size,
}: {
  avatarUrl: string | null;
  displayName: string;
  size: "mobile" | "desktop";
}) {
  const fallbackSize = size === "desktop" ? 16 : 15;

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={displayName}
        className="h-full w-full object-cover"
        referrerPolicy="no-referrer"
      />
    );
  }

  return <User size={fallbackSize} />;
}

function NotificationToast({
  notification,
  onClose,
  onOpen,
}: {
  notification: UserNotification | null;
  onClose: () => void;
  onOpen: (notification: UserNotification) => void;
}) {
  const { t } = useLanguage();

  if (!notification) return null;

  return (
    <div className="fixed right-4 top-24 z-[90] w-[min(360px,calc(100vw-32px))] md:right-6">
      <div className="relative overflow-hidden rounded-3xl border border-cyan-300/20 bg-zinc-950/95 p-4 text-white shadow-[0_24px_80px_rgba(0,0,0,0.85),0_0_42px_rgba(34,211,238,0.16)] backdrop-blur-2xl animate-in slide-in-from-right-6 fade-in duration-300">
        <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-cyan-400/20 blur-[54px]" />
        <div className="pointer-events-none absolute -bottom-14 -left-14 h-32 w-32 rounded-full bg-fuchsia-500/15 blur-[58px]" />

        <div className="relative z-10 flex items-start gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${getNotificationTone(
              notification.type,
            )}`}
          >
            {getNotificationIcon(notification.type)}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-100/70">
              {getNotificationToastTitle(notification.type, t)}
            </p>

            <p className="mt-1 line-clamp-1 text-sm font-black text-white">
              {notification.title}
            </p>

            {notification.message && (
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/50">
                {notification.message}
              </p>
            )}

            <button
              type="button"
              onClick={() => onOpen(notification)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-bold text-cyan-100 transition hover:bg-cyan-300/20"
            >
              {getNotificationActionLabel(notification.type, t)}
              <ChevronRight size={13} />
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] p-1.5 text-white/45 transition hover:bg-white/10 hover:text-white"
            aria-label={translate(t, "closeNotification", "Fechar notificação")}
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
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

          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onClearAll();
            }}
            disabled={notifications.length === 0}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
              notifications.length > 0
                ? "border-red-300/20 bg-red-300/10 text-red-100 hover:bg-red-300/20"
                : "cursor-default border-emerald-300/20 bg-emerald-300/10 text-emerald-100/80"
            }`}
          >
            <Trash2 size={12} />
            {notifications.length > 0
              ? translate(t, "clearNotifications", "Limpar")
              : translate(t, "notificationsCleared", "Limpo")}
          </button>

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

      <div className="relative z-10 max-h-[min(420px,calc(100dvh-120px))] overflow-y-auto p-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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

                <div className="mt-2 flex items-center gap-2">
                  <p className="text-[11px] text-white/30">
                    {formatNotificationDate(notification.created_at, language)}
                  </p>

                  <span className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-2 py-0.5 text-[10px] font-bold text-cyan-100/80 opacity-0 transition group-hover:opacity-100">
                    {getNotificationActionLabel(notification.type, t)}
                  </span>
                </div>
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
