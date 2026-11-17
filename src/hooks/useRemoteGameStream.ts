"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { RemoteGame } from "@/lib/remote-db";

/**
 * Subscribes to the server-sent game event stream and keeps the latest state
 * in local React state. Replaces per-client polling: the server polls KV once
 * per stream and pushes only changed states.
 */
export function useRemoteGameStream(gameId: string, player: 1 | 2) {
  const router = useRouter();
  const [game, setGame] = useState<RemoteGame | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let stopped = false;
    const source = new EventSource(`/api/remote/game/${gameId}/stream`);

    source.onmessage = (event) => {
      if (stopped) return;
      try {
        const data = JSON.parse(event.data) as RemoteGame;
        setGame(data);
        if (data.status === "waiting") {
          router.replace(`/game/remote/join/${gameId}?player=${player}`);
        }
      } catch {
        setError("Received invalid game data");
      }
    };

    // EventSource reconnects on transient failures by itself; only a closed
    // stream (server gave up, e.g. game not found) surfaces to the user.
    source.onerror = () => {
      if (stopped) return;
      if (source.readyState === EventSource.CLOSED) {
        setError("Lost connection to the game");
      }
    };

    return () => {
      stopped = true;
      source.close();
    };
  }, [gameId, player, router]);

  return { game, setGame, error };
}
