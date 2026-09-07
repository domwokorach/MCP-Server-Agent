"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ConnectionState = "connected" | "reconnecting" | "offline";

const RETRY_DELAYS_MS = [1_000, 2_000, 4_000, 8_000, 15_000];
const STALE_AFTER_MS = 45_000;

export function DashboardRealtimeProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<ConnectionState>("reconnecting");
  const retryRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const sourceRef = useRef<EventSource | undefined>(undefined);
  const eventIdsRef = useRef(new Set<string>());
  const lastEventAtRef = useRef(0);
  const readyRef = useRef(false);

  const refreshAuthoritativeState = useCallback(async () => {
    const response = await fetch("/api/realtime/state", { cache: "no-store" });
    if (!response.ok) throw new Error("Could not recover current dashboard state.");
    await response.json();
    router.refresh();
  }, [router]);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) return;
    refreshTimerRef.current = setTimeout(() => {
      refreshTimerRef.current = undefined;
      void refreshAuthoritativeState().catch(() => setState("offline"));
    }, 250);
  }, [refreshAuthoritativeState]);

  useEffect(() => {
    let disposed = false;
    const disconnect = () => {
      sourceRef.current?.close();
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      setState("offline");
    };
    const connect = () => {
      if (disposed) return;
      readyRef.current = false;
      lastEventAtRef.current = Date.now();
      setState("reconnecting");
      const source = new EventSource("/api/events");
      sourceRef.current = source;

      source.onopen = () => {
        retryRef.current = 0;
        lastEventAtRef.current = Date.now();
        setState("connected");
        void refreshAuthoritativeState().then(() => {
          readyRef.current = true;
        }).catch(() => setState("offline"));
      };
      source.onmessage = (message) => {
        lastEventAtRef.current = Date.now();
        if (!readyRef.current) return;
        if (message.lastEventId && eventIdsRef.current.has(message.lastEventId)) return;
        if (message.lastEventId) {
          eventIdsRef.current.add(message.lastEventId);
          if (eventIdsRef.current.size > 500) {
            const oldestEventId = eventIdsRef.current.values().next().value;
            if (oldestEventId) eventIdsRef.current.delete(oldestEventId);
          }
        }
        scheduleRefresh();
      };
      source.onerror = () => {
        source.close();
        if (disposed) return;
        setState("reconnecting");
        const delay = RETRY_DELAYS_MS[Math.min(retryRef.current++, RETRY_DELAYS_MS.length - 1)];
        reconnectTimerRef.current = setTimeout(() => {
          reconnectTimerRef.current = undefined;
          connect();
          window.addEventListener("auth:logout", disconnect);
        }, delay);
      };
    };

    connect();
    const staleCheck = setInterval(() => {
      if (Date.now() - lastEventAtRef.current > STALE_AFTER_MS) {
        sourceRef.current?.close();
        setState("reconnecting");
        if (!reconnectTimerRef.current) {
          reconnectTimerRef.current = setTimeout(() => {
            reconnectTimerRef.current = undefined;
            connect();
          }, RETRY_DELAYS_MS[0]);
        }
      }
    }, 10_000);

    return () => {
      disposed = true;
      sourceRef.current?.close();
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      clearInterval(staleCheck);
      window.removeEventListener("auth:logout", disconnect);
    };
  }, [refreshAuthoritativeState, scheduleRefresh]);

  const label = state === "connected" ? "Connected" : state === "reconnecting" ? "Reconnecting…" : "Offline";
  const color = state === "connected" ? "text-success border-success/30 bg-success/10" : state === "reconnecting" ? "text-warning border-warning/30 bg-warning/10" : "text-destructive border-destructive/30 bg-destructive/10";

  return (
    <>
      {children}
      <Badge className={cn("fixed right-4 bottom-4 z-40 h-7 gap-1.5 px-2.5 shadow-lg", color)} aria-live="polite">
        {state === "connected" ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5" />}
        {label}
      </Badge>
    </>
  );
}
