"use client";

import { useCallback, useState } from "react";
import {
  PAR_BANDS,
  SoloDifficulty,
  SoloPuzzle,
  generateSoloPuzzle,
  shortestPath,
  validateSoloMove,
} from "@/lib/solo-game";

export type SoloStatus = "loading" | "playing" | "won";

interface SavedSoloGame {
  puzzle: SoloPuzzle;
  history: string[];
  /** How many hints were spent on this run (absent in older saves). */
  hintsUsed?: number;
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
  const [hintsUsed, setHintsUsed] = useState(0);

  const beginGame = useCallback(
    (saved: SavedSoloGame | null, band?: readonly [number, number]) => {
      const game = saved ?? {
        puzzle: generateSoloPuzzle(dictionary, Math.random, band?.[0], band?.[1]),
        history: [],
        hintsUsed: 0,
      } satisfies SavedSoloGame;
      if (!saved) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
      }
      setPuzzle(game.puzzle);
      setHistory(game.history.length > 0 ? game.history : [game.puzzle.start]);
      setHintsUsed(game.hintsUsed ?? 0);
      setStatus("playing");
    },
    [dictionary]
  );

  // Derive the game during render when the dictionary first becomes available
  // (React's "adjust state when a prop changes" pattern — no init effect).
  const [initializedFor, setInitializedFor] = useState<Set<string> | null>(null);
  if (ready && dictionary.size > 0 && initializedFor !== dictionary) {
    setInitializedFor(dictionary);
    beginGame(loadSaved(dictionary));
  }

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
          JSON.stringify({ puzzle, history: nextHistory, hintsUsed } satisfies SavedSoloGame)
        );
      }
    },
    [status, puzzle, history, hintsUsed, dictionary]
  );

  const newGame = useCallback(
    (difficulty: SoloDifficulty = "medium") => {
      beginGame(null, PAR_BANDS[difficulty]);
    },
    [beginGame]
  );

  /** Restarts the same puzzle from its start word. */
  const reset = useCallback(() => {
    if (!puzzle) return;
    const fresh = { puzzle, history: [puzzle.start], hintsUsed: 0 } satisfies SavedSoloGame;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    setHistory([puzzle.start]);
    setHintsUsed(0);
    setStatus("playing");
    setError(null);
  }, [puzzle]);

  /** Plays the optimal next word for the player and counts the hint. */
  const hint = useCallback(() => {
    if (status !== "playing" || !puzzle || history.length === 0) return;
    const path = shortestPath(history[history.length - 1], puzzle.target, dictionary);
    if (!path || path.length < 2) return;
    play(path[1]);
    setHintsUsed((used) => used + 1);
    // play() persisted the move with the old count; refresh the saved hint count.
    // (If the hint won the game the save was removed — nothing to update.)
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as SavedSoloGame;
      saved.hintsUsed = hintsUsed + 1;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    }
  }, [status, puzzle, history, dictionary, play, hintsUsed]);

  return {
    status,
    puzzle,
    history,
    error,
    hintsUsed,
    play,
    newGame,
    hint,
    reset,
    clearError: () => setError(null),
  };
}
