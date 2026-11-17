"use client";

import { useEffect, useRef, useState } from "react";
import { TURN_TIME_LIMIT } from "@/lib/game-logic";

interface TurnCountdownProps {
  /** Epoch ms the current turn started, or null when no turn is active. */
  turnStartTime: number | null;
  /** Milliseconds between ticks. Local games tick per second; remote every 250ms. */
  tickMs?: number;
  /** Remote shows ceil(remaining) (a "30s" until the first tick), local floor. */
  rounding?: "floor" | "ceil";
  onTimeout?: () => void;
  suffix?: string;
}

function remainingFor(turnStartTime: number, rounding: "floor" | "ceil"): number {
  const elapsedSeconds = (Date.now() - turnStartTime) / 1000;
  const remaining = TURN_TIME_LIMIT - elapsedSeconds;
  return Math.max(0, rounding === "ceil" ? Math.ceil(remaining) : Math.floor(remaining));
}

/**
 * Self-contained countdown display. Owning the ticking state locally keeps the
 * per-second (or 250ms) re-render scoped to this component instead of the whole
 * game page.
 */
export default function TurnCountdown({
  turnStartTime,
  tickMs = 1000,
  rounding = "floor",
  onTimeout,
  suffix = "s",
}: TurnCountdownProps) {
  const [remaining, setRemaining] = useState(() =>
    turnStartTime === null ? TURN_TIME_LIMIT : remainingFor(turnStartTime, rounding)
  );

  // onTimeout is kept in a ref so a new callback identity does not restart the interval.
  const onTimeoutRef = useRef(onTimeout);
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  });

  useEffect(() => {
    if (turnStartTime === null) return;
    const interval = setInterval(() => {
      const next = remainingFor(turnStartTime, rounding);
      setRemaining(next);
      if (next <= 0) {
        clearInterval(interval);
        onTimeoutRef.current?.();
      }
    }, tickMs);
    return () => clearInterval(interval);
  }, [turnStartTime, tickMs, rounding]);

  return (
    <>
      {remaining}
      {suffix}
    </>
  );
}
