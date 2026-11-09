import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Simple in-memory room store (in production this would be Redis/DB)
// Each room holds game state for 2 players coordinating over HTTP
interface Room {
  roomId: string;
  history: string[];
  currentPlayer: 1 | 2;
  status: "setup" | "playing" | "game_over";
  winner: 1 | 2 | null;
  players: {
    player1Id: string;
    player2Id: string | null;
  };
  lastUpdated: number;
}

// Global store attached to globalThis to survive hot reloads in dev
const globalStore = globalThis as unknown as { _rooms?: Map<string, Room> };
if (!globalStore._rooms) {
  globalStore._rooms = new Map<string, Room>();
}
const rooms = globalStore._rooms;

function getDictionaryAndStarters() {
  try {
    const dictPath = path.join(process.cwd(), "public", "data", "dictionary.txt");
    const startPath = path.join(process.cwd(), "public", "data", "starting_words.txt");
    const dictText = fs.readFileSync(dictPath, "utf8");
    const startText = fs.readFileSync(startPath, "utf8");
    const dictionary = new Set(dictText.split("\n").map(w => w.trim().toLowerCase()));
    const startingWords = startText.split("\n").map(w => w.trim().toLowerCase()).filter(w => w.length === 4);
    return { dictionary, startingWords };
  } catch {
    return { dictionary: new Set<string>(), startingWords: [] };
  }
}

export function isOneLetterDifferent(word1: string, word2: string): boolean {
  if (word1.length !== word2.length) return false;
  let differences = 0;
  for (let i = 0; i < word1.length; i++) {
    if (word1[i] !== word2[i]) differences++;
  }
  return differences === 1;
}

export function checkGameOver(currentWord: string, dictionary: Set<string>, history: string[]): boolean {
  for (const word of dictionary) {
    if (word.length === 4 && !history.includes(word) && isOneLetterDifferent(currentWord, word)) {
      return false; // Found a valid move
    }
  }
  return true; // No moves left
}
