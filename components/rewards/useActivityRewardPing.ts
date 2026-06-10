"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";

type ActivityPingResponse = {
  ok?: boolean;
  xpGranted?: number;
  minutesActive?: number;
  rewardCycles?: number;
  dailyXpGranted?: number;
  nextRewardInMinutes?: number;
};

const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"] as const;
const PING_INTERVAL_MS = 60 * 1000;
const ACTIVE_GRACE_MS = 2 * 60 * 1000;

export function useActivityRewardPing({
  enabled,
  onReward,
}: {
  enabled: boolean;
  onReward?: (result: ActivityPingResponse) => void;
}) {
  const lastActivityAtRef = useRef<number>(Date.now());
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;

    function markActive() {
      lastActivityAtRef.current = Date.now();
    }

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, markActive, { passive: true });
    });

    return () => {
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, markActive);
      });
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;

    async function sendPing() {
      if (inFlightRef.current) return;
      if (document.visibilityState !== "visible") return;

      const inactiveForMs = Date.now() - lastActivityAtRef.current;

      if (inactiveForMs > ACTIVE_GRACE_MS) return;

      inFlightRef.current = true;

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) return;

        const response = await fetch("/api/rewards/activity-ping", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ active: true }),
        });

        if (!response.ok) return;

        const result = (await response.json()) as ActivityPingResponse;

        if (result.xpGranted && result.xpGranted > 0) {
          window.dispatchEvent(new Event("cardpoc-profile-updated"));
          window.dispatchEvent(new Event("creator-nexus:profile-updated"));
          window.dispatchEvent(new Event("creator-nexus:notifications-updated"));
          onReward?.(result);
        }
      } catch (error) {
        console.error("Erro ao registrar recompensa de atividade:", error);
      } finally {
        inFlightRef.current = false;
      }
    }

    sendPing();

    const interval = window.setInterval(sendPing, PING_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [enabled, onReward]);
}
