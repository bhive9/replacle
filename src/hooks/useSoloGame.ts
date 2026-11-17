"use client";

import { useCallback, useEffect, useState } from "react";
import {
  SoloPuzzle,
  generateSoloPuzzle,
  validateSoloMove,
} from "@/lib/solo-game";

export type SoloStatus = "loading" | "playing" | "won";

interface SavedSoloGame {
  puzzle: SoloPuzzle;
  history: string[];
}

const STORAGE_KEY = "replacle:solo";

function loadSaved(dictionary: Set<string>): SavedSoloGame | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as SavedSoloGame;
    if (
      !saved?.puzzle?.start ||
      !dictionary.has(saved.puzzle.start) ||
      !dictionary.has(saved.puzzle.target) ||
      !Array.isArray(saved.history) ||
      saved.history.length === 0 ||
      saved.history[0] !== saved.puzzle.start
    ) {
      return null;
    }
    // Each step must be a legal, non-repeating one-letter move.
    for (let i = 1; i < saved.history.length; i++) {
      const move = validateSoloMove(saved.history.slice(0, i), saved.puzzle.target, saved.history[i], dictionary);
      if (!move.accepted || move.won) return null;
    }
    return saved;
  } catch {
    return null;
  }
}

/**
 * Single-player word ladder, entirely on-device: the puzzle is generated in
 * the browser and the run survives reloads via localStorage.
 */
export function useSoloGame(ready: boolean, dictionary: Set<string>) {
  const [puzzle, setPuzzle] = useState<SoloPuzzle | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [status, setStatus] = useState<SoloStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  const beginGame = useCallback(
    (saved: SavedSoloGame | null) => {
      const game = saved ?? {
        puzzle: generateSoloPuzzle(dictionary),
        history: [],
      };
      if (!saved) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
      }
      setPuzzle(game.puzzle);
      setHistory(game.history.length > 0 ? game.history : [game.puzzle.start]);
      setStatus("playing");
    },
    [dictionary]
  );

  useEffect(() => {
    if (!ready || dictionary.size === 0) return;
    beginGame(loadSaved(dictionary));
    // Runs once per dictionary load; beginGame is stable for a given dictionary.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, dictionary]);

  const play = useCallback(
    (word: string) => {
      if (status !== "playing" || !puzzle) return;
      const result = validateSoloMove(history, puzzle.target, word, dictionary);
      if (!result.accepted) {
        setError(result.error);
        return;
      }
      const nextHistory = [...history, word.trim().toLowerCase()];
      setHistory(nextHistory);
      setError(null);
      if (result.won) {
        localStorage.removeItem(STORAGE_KEY);
        setStatus("won");
      } else {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ puzzle, history: nextHistory } satisfies SavedSoloGame)
        );
      }
    },
    [status, puzzle, history, dictionary]
  );

  const newGame = useCallback(() => {
    beginGame(null);
  }, [beginGame]);

  return {
    status,
    puzzle,
    history,
    error,
    play,
    newGame,
    clearError: () => setError(null),
  };
}
