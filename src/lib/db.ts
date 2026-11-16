import { Redis } from "@upstash/redis";
import { GameState, generateGameId } from "@/lib/game-state";

const GAME_KEY = (id: string) => `game:local:${id}`;

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
  // Game states are serialized explicitly below; keep Redis responses as strings.
  automaticDeserialization: false,
});

async function readRaw(id: string): Promise<string | null> {
  return (await redis.get<string>(GAME_KEY(id))) ?? null;
}

async function writeRaw(id: string, value: string): Promise<void> {
  await redis.set(GAME_KEY(id), value);
}

async function deleteRaw(id: string): Promise<void> {
  await redis.del(GAME_KEY(id));
}

export async function createLocalGame(
  player1Name: string,
  player2Name: string
): Promise<GameState> {
  const id = generateGameId();
  const now = Date.now();
  const state: GameState = {
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

export async function getLocalGame(id: string): Promise<GameState | null> {
  const raw = await readRaw(id);
  return raw ? (JSON.parse(raw) as GameState) : null;
}

export async function saveLocalGame(state: GameState): Promise<void> {
  state.updatedAt = Date.now();
  await writeRaw(state.id, JSON.stringify(state));
}

export async function deleteLocalGame(id: string): Promise<void> {
  await deleteRaw(id);
}