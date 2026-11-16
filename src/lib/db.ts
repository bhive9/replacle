import { Redis } from "@upstash/redis";
import { generateGameId } from "@/lib/utils";

export interface LocalGameState {
  id: string;
  player1Name: string;
  player2Name: string;
  history: string[];
  currentPlayer: 1 | 2;
  status: "setup" | "playing" | "game_over";
  winner: 1 | 2 | null;
  error: string | null;
  turnStartTime: number | null;
  timeRemaining: number;
  createdAt: number;
  updatedAt: number;
}

const GAME_KEY = (id: string) => `game:local:${id}`;

// In-memory fallback for local development when Redis env vars are not configured.
const memoryStore = new Map<string, string>();

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

const useRedis = !!(
  process.env.KV_REST_API_URL ||
  process.env.UPSTASH_REDIS_REST_URL ||
  process.env.KV_REST_API_TOKEN ||
  process.env.UPSTASH_REDIS_REST_TOKEN
);

async function readRaw(id: string): Promise<string | null> {
  if (useRedis) return (await redis.get<string>(GAME_KEY(id))) ?? null;
  return memoryStore.get(GAME_KEY(id)) ?? null;
}

async function writeRaw(id: string, value: string): Promise<void> {
  if (useRedis) {
    await redis.set(GAME_KEY(id), value);
    return;
  }
  memoryStore.set(GAME_KEY(id), value);
}

async function deleteRaw(id: string): Promise<void> {
  if (useRedis) {
    await redis.del(GAME_KEY(id));
    return;
  }
  memoryStore.delete(GAME_KEY(id));
}

export async function createLocalGame(
  player1Name: string,
  player2Name: string
): Promise<LocalGameState> {
  const id = generateGameId();
  const now = Date.now();
  const state: LocalGameState = {
    id,
    player1Name,
    player2Name,
    history: [],
    currentPlayer: 1,
    status: "setup",
    winner: null,
    error: null,
    turnStartTime: null,
    timeRemaining: 30,
    createdAt: now,
    updatedAt: now,
  };
  await writeRaw(id, JSON.stringify(state));
  return state;
}

export async function getLocalGame(id: string): Promise<LocalGameState | null> {
  const raw = await readRaw(id);
  return raw ? (JSON.parse(raw) as LocalGameState) : null;
}

export async function saveLocalGame(state: LocalGameState): Promise<void> {
  state.updatedAt = Date.now();
  await writeRaw(state.id, JSON.stringify(state));
}

export async function deleteLocalGame(id: string): Promise<void> {
  await deleteRaw(id);
}