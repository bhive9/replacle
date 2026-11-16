import { Redis } from "@upstash/redis";
import { isOneLetterDifferent, checkGameOver, TURN_TIME_LIMIT } from "@/lib/game-logic";
import { generateGameId } from "@/lib/game-state";

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
  automaticDeserialization: false,
});
const gameKey = (id: string) => `game:remote:${id}`;

export interface RemoteGame {
  id: string;
  player1Name: string | null;
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
  endReason?: "timeout" | "no_moves" | null;
}

// Compare-and-set prevents simultaneous ready/move requests from overwriting each other.
const CAS = `if redis.call('GET', KEYS[1]) == ARGV[1] then
  redis.call('SET', KEYS[1], ARGV[2]); return 1
end
return 0`;

async function updateGame(id: string, update: (game: RemoteGame) => void): Promise<RemoteGame | null> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const raw = await redis.get<string>(gameKey(id));
    if (raw === null) return null;
    const game = JSON.parse(raw) as RemoteGame;
    if (game.status === "playing" && game.turnStartTime !== null &&
        Date.now() - game.turnStartTime >= TURN_TIME_LIMIT * 1000) {
      game.status = "game_over";
      game.winner = game.currentPlayer === 1 ? 2 : 1;
      game.timeRemaining = 0;
      game.turnStartTime = null;
      game.endReason = "timeout";
    }
    update(game);
    const next = JSON.stringify(game);
    if (next === raw || await redis.eval<string[], number>(CAS, [gameKey(id)], [raw, next]) === 1) return game;
  }
  throw new Error("Game is busy; please try again");
}

export async function createRemoteGame(): Promise<RemoteGame> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const id = generateGameId();
    const game: RemoteGame = {
      id, player1Name: null, player2Name: null, player1Ready: false, player2Ready: false,
      history: [], currentPlayer: 1, status: "waiting", winner: null, error: null,
      turnStartTime: null, timeRemaining: TURN_TIME_LIMIT, createdAt: Date.now(), endReason: null,
    };
    if (await redis.set(gameKey(id), JSON.stringify(game), { nx: true })) return game;
  }
  throw new Error("Unable to create a room; please try again");
}

export async function getRemoteGame(id: string): Promise<RemoteGame | null> {
  return updateGame(id, () => {});
}

export async function setPlayerName(id: string, player: 1 | 2, name: string): Promise<RemoteGame | null> {
  return updateGame(id, (game) => {
    if (game.status !== "waiting") throw new Error("Game has already started");
    const key = player === 1 ? "player1Name" : "player2Name";
    if (game[key] && game[key] !== name) throw new Error("This player slot is already taken");
    game[key] = name;
  });
}

function startGame(game: RemoteGame, startingWords: string[]) {
  if (!startingWords.length) throw new Error("No starting words available");
  game.history = [startingWords[Math.floor(Math.random() * startingWords.length)]];
  game.currentPlayer = 1;
  game.status = "playing";
  game.winner = null;
  game.error = null;
  game.turnStartTime = Date.now();
  game.timeRemaining = TURN_TIME_LIMIT;
  game.endReason = null;
}

export async function setReady(id: string, player: 1 | 2, startingWords: string[]): Promise<RemoteGame | null> {
  return updateGame(id, (game) => {
    if (game.status !== "waiting") return;
    if (!(player === 1 ? game.player1Name : game.player2Name)) throw new Error("Enter your name first");
    if (player === 1) game.player1Ready = true;
    else game.player2Ready = true;
    if (game.player1Ready && game.player2Ready) startGame(game, startingWords);
  });
}

export async function restartGame(id: string, startingWords: string[]): Promise<RemoteGame | null> {
  return updateGame(id, (game) => {
    if (game.status !== "game_over") throw new Error("The game is still in progress");
    startGame(game, startingWords);
  });
}

export async function submitMove(id: string, player: 1 | 2, word: string, dictionary: Set<string>): Promise<RemoteGame | null> {
  return updateGame(id, (game) => {
    if (game.status !== "playing") return;
    if (game.currentPlayer !== player) throw new Error("It is not your turn");
    const w = word.trim().toLowerCase();
    if (w.length !== 4) throw new Error("Word must be 4 letters long!");
    if (game.history.includes(w)) throw new Error("Word already used!");
    if (!dictionary.has(w)) throw new Error("That's not in my dictionary!");
    if (!isOneLetterDifferent(game.history[game.history.length - 1], w)) throw new Error("Must change exactly one letter!");
    game.history.push(w);
    const gameOver = checkGameOver(w, dictionary, game.history);
    game.currentPlayer = player === 1 ? 2 : 1;
    game.status = gameOver ? "game_over" : "playing";
    game.winner = gameOver ? player : null;
    game.error = null;
    game.turnStartTime = gameOver ? null : Date.now();
    game.timeRemaining = gameOver ? 0 : TURN_TIME_LIMIT;
    game.endReason = gameOver ? "no_moves" : null;
  });
}
