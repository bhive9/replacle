import { Redis } from "@upstash/redis";
import { isOneLetterDifferent, checkGameOver } from "@/lib/game-logic";

// Create Redis client only if env vars are set
let redis: Redis | null = null;
if (process.env.KV_URL && process.env.KV_TOKEN) {
  redis = new Redis({
    url: process.env.KV_URL,
    token: process.env.KV_TOKEN,
  });
}

// In-memory fallback for development
const memoryStore = new Map<string, string>();

async function kvGet(key: string): Promise<string | null> {
  if (redis) return redis.get(key);
  return memoryStore.get(key) ?? null;
}

async function kvSet(key: string, value: string): Promise<void> {
  if (redis) await redis.set(key, value);
  else memoryStore.set(key, value);
}

export interface RemoteGame {
  id: string;
  player1Name: string;
  player2Name: string | null;
  player1Ready: boolean;
  player2Ready: boolean;
  history: string[];
  currentPlayer: 1 | 2;
  status: "waiting" | "playing" | "game_over";
  winner: 1 | 2 | null;
  error: string | null;
  turnStartTime: number | null;
  timeRemaining: number;
  createdAt: number;
}

export async function createRemoteGame(player1Name: string): Promise<RemoteGame> {
  const id = Math.random().toString(36).substring(2, 8);
  const now = Date.now();
  const game: RemoteGame = {
    id,
    player1Name,
    player2Name: null,
    player1Ready: false,
    player2Ready: false,
    history: [],
    currentPlayer: 1,
    status: "waiting",
    winner: null,
    error: null,
    turnStartTime: null,
    timeRemaining: 30,
    createdAt: now,
  };
  await kvSet(`game:${id}`, JSON.stringify(game));
  return game;
}

export async function getRemoteGame(id: string): Promise<RemoteGame | null> {
  const raw = await kvGet(`game:${id}`);
  if (!raw) return null;
  return JSON.parse(raw as string);
}

export async function saveRemoteGame(game: RemoteGame): Promise<void> {
  await kvSet(`game:${game.id}`, JSON.stringify(game));
}

export async function setPlayerName(gameId: string, player: 1 | 2, name: string): Promise<RemoteGame | null> {
  const game = await getRemoteGame(gameId);
  if (!game) return null;
  if (player === 1) game.player1Name = name;
  else game.player2Name = name;
  await saveRemoteGame(game);
  return game;
}

export async function setReady(gameId: string, player: 1 | 2): Promise<RemoteGame | null> {
  const game = await getRemoteGame(gameId);
  if (!game) return null;
  if (player === 1) game.player1Ready = true;
  else game.player2Ready = true;
  if (game.player1Ready && game.player2Ready) {
    game.status = "playing";
  }
  await saveRemoteGame(game);
  return game;
}

export async function submitMove(
  gameId: string,
  player: 1 | 2,
  word: string,
  dictionary: Set<string>,
  startingWords: string[]
): Promise<RemoteGame | null> {
  const game = await getRemoteGame(gameId);
  if (!game) return null;
  if (game.status !== "playing") return game;
  if (game.currentPlayer !== player) return game;

  const w = word.trim().toLowerCase();
  const lastWord = game.history[game.history.length - 1];

  if (w.length !== 4) {
    game.error = "Word must be 4 letters long!";
    await saveRemoteGame(game);
    return game;
  }
  if (game.history.includes(w)) {
    game.error = "Word already used!";
    await saveRemoteGame(game);
    return game;
  }
  if (!dictionary.has(w)) {
    game.error = "That's not in my dictionary!";
    await saveRemoteGame(game);
    return game;
  }

  // First move: any valid starting word (no previous word to compare)
  if (game.history.length === 0) {
    if (!startingWords.includes(w)) {
      game.error = "Must be a valid starting word!";
      await saveRemoteGame(game);
      return game;
    }
  } else {
    const lastWord = game.history[game.history.length - 1];
    if (!isOneLetterDifferent(lastWord, w)) {
      game.error = "Must change exactly one letter!";
      await saveRemoteGame(game);
      return game;
    }
  }

  const newHistory = [...game.history, w];
  const gameOver = checkGameOver(w, dictionary, newHistory);
  const now = Date.now();

  game.history = newHistory;
  game.currentPlayer = game.currentPlayer === 1 ? 2 : 1;
  game.status = gameOver ? "game_over" : "playing";
  game.winner = gameOver ? player : null;
  game.error = null;
  game.turnStartTime = gameOver ? null : now;
  game.timeRemaining = gameOver ? 0 : 30;

  await saveRemoteGame(game);
  return game;
}