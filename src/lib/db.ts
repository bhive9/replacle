import { Redis } from "@upstash/redis";
import { GameState, generateGameId } from "@/lib/game-state";
import { TURN_TIME_LIMIT } from "@/lib/game-logic";

const GAME_KEY = (id: string) => `game:local:${id}`;

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
  // Game states are serialized explicitly below; keep Redis responses as strings.
  automaticDeserialization: false,
});

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
    timeRemaining: TURN_TIME_LIMIT,
    createdAt: now,
    updatedAt: now,
  };
  await redis.set(GAME_KEY(id), JSON.stringify(state));
  return state;
}

export async function getLocalGame(id: string): Promise<GameState | null> {
  const raw = (await redis.get<string>(GAME_KEY(id))) ?? null;
  return raw ? (JSON.parse(raw) as GameState) : null;
}

export async function saveLocalGame(state: GameState): Promise<void> {
  // Write a copy so the caller's object is not mutated as a side effect.
  await redis.set(GAME_KEY(state.id), JSON.stringify({ ...state, updatedAt: Date.now() }));
}
