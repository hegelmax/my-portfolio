import React, { useEffect, useRef, useState } from "react";

type RefreshState = {
  currentKey: string;
  minTs: number;
  maxTs: number;
};

type DebugState = {
  lastStatus: string | null;
  lastReason: string | null;
  currentKey: string | null;
  windowMin: number | null;
  windowMax: number | null;
  serverNow: number | null;
};

/**
 * Daemon component:
 * - on mount calls init_refresh
 * - then sends pings at a random moment inside the allowed window
 * - logs everything to console and shows basic info on screen
 */
export const RefreshKeeper: React.FC = () => {
  const stateRef = useRef<RefreshState | null>(null);

  // Timer with safe type (works with DOM and Node typings)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [debug, setDebug] = useState<DebugState>({
    lastStatus: null,
    lastReason: null,
    currentKey: null,
    windowMin: null,
    windowMax: null,
    serverNow: null,
  });

  const logDebug = (partial: Partial<DebugState>) => {
    setDebug((prev) => {
      const next = { ...prev, ...partial };
      console.log("[RefreshKeeper]", next);
      return next;
    });
  };

  const scheduleNextPing = () => {
    const state = stateRef.current;
    if (!state) return;

    const now = Math.floor(Date.now() / 1000);
    let delaySec = state.minTs - now;
    let minDelaySec = state.minTs - now;
    let maxDelaySec = state.maxTs - now;

    // If something went wrong, do not allow negative values
    if (delaySec < 0) delaySec = 0;

    // Add 1 second to safely hit the window
    delaySec = delaySec + 1;

    console.log(`[RefreshKeeper] Ping in ${delaySec} sec`);

    timerRef.current = setTimeout(() => {
      void doPing();
    }, delaySec * 1000);

    /*

    // Just in case, avoid negative/zero
    if (minDelaySec < 1) minDelaySec = 1;
    if (maxDelaySec <= minDelaySec) maxDelaySec = minDelaySec + 1;

    const delaySec = randomInt(minDelaySec, maxDelaySec);*/
    const delayMs = delaySec * 1000;

    console.log(
      `[RefreshKeeper] Schedule ping in ${delaySec} sec (window: ${minDelaySec}-${maxDelaySec})`
    );

    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      void doPing();
    }, delayMs);
  };

  const doPing = async () => {
    const state = stateRef.current;
    if (!state) return;

    const clientTs = Math.floor(Date.now() / 1000);

    console.log(
      "[RefreshKeeper] Ping with key:",
      state.currentKey,
      "clientTs:",
      clientTs
    );

    try {
      const res = await fetch("/api/ping/refresh_ping", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          prev_key: state.currentKey,
          client_ts: String(clientTs),
        }).toString(),
      });

      const data = (await res.json()) as any;
      console.log("[RefreshKeeper] Ping response:", data);

      if (!res.ok || data.status !== "ok") {
        logDebug({
          lastStatus: data.status ?? "error",
          lastReason: data.reason ?? "unknown",
        });
        // For testing just log, no reload
        return;
      }

      stateRef.current = {
        currentKey: data.current_refresh_key as string,
        minTs: Number(data.next_refresh_min_datetime),
        maxTs: Number(data.next_refresh_max_datetime),
      };

      logDebug({
        lastStatus: "ok",
        lastReason: null,
        currentKey: stateRef.current.currentKey,
        windowMin: stateRef.current.minTs,
        windowMax: stateRef.current.maxTs,
        serverNow: Number(data.server_now),
      });

      scheduleNextPing();
    } catch (e) {
      console.error("[RefreshKeeper] Ping error:", e);
      logDebug({
        lastStatus: "error",
        lastReason: e instanceof Error ? e.message : String(e),
      });
    }
  };

  const init = async () => {
    try {
      const res = await fetch("/api/ping/init_refresh", {
        credentials: "include",
      });
      const data = (await res.json()) as any;
      console.log("[RefreshKeeper] init_refresh response:", data);

      if (!res.ok || data.status !== "ok") {
        logDebug({
          lastStatus: data.status ?? "error",
          lastReason: data.reason ?? "init_failed",
        });
        return;
      }

      stateRef.current = {
        currentKey: data.current_refresh_key as string,
        minTs: Number(data.next_refresh_min_datetime),
        maxTs: Number(data.next_refresh_max_datetime),
      };

      logDebug({
        lastStatus: "init_ok",
        lastReason: null,
        currentKey: stateRef.current.currentKey,
        windowMin: stateRef.current.minTs,
        windowMax: stateRef.current.maxTs,
      });

      scheduleNextPing();
    } catch (e) {
      console.error("[RefreshKeeper] Init error:", e);
      logDebug({
        lastStatus: "error",
        lastReason: e instanceof Error ? e.message : String(e),
      });
    }
  };

  useEffect(() => {
    void init();

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Small debug output at the bottom of the page
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        right: 0,
        fontSize: 10,
        background: "var(--color-backdrop-60)",
        color: "var(--color-text-contrast)",
        padding: "4px 8px",
        zIndex: 9999,
        maxWidth: 260,
      }}
    >
      <div>RefreshKeeper</div>
      <div>Status: {debug.lastStatus}</div>
      {debug.lastReason && <div>Reason: {debug.lastReason}</div>}
      {debug.currentKey && (
        <>
          <div style={{ wordBreak: "break-all" }}>Key: {debug.currentKey}</div>
          <div>Min: {debug.windowMin}</div>
          <div>Max: {debug.windowMax}</div>
          {debug.serverNow && <div>Server: {debug.serverNow}</div>}
        </>
      )}
    </div>
  );
};
