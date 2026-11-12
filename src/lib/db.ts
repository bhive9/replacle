import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { generateGameId } from "@/lib/utils";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface LocalGameState {
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

const DB_PATH = path.join(__dirname, "../../game.db");
const db = new Database(DB_PATH);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS local_games (
    id TEXT PRIMARY KEY,
    player1_name TEXT NOT NULL,
    player2_name TEXT NOT NULL,
    history TEXT NOT NULL DEFAULT '[]',
    current_player INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'setup',
    winner INTEGER,
    error TEXT,
    turn_start_time INTEGER,
    time_remaining INTEGER NOT NULL DEFAULT 30,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )
`);

export function createLocalGame(player1Name: string, player2Name: string): LocalGameState {
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
  
  db.prepare(`
    INSERT INTO local_games (id, player1_name, player2_name, history, current_player, status, winner, error, turn_start_time, time_remaining, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    state.id,
    state.player1Name,
    state.player2Name,
    JSON.stringify(state.history),
    state.currentPlayer,
    state.status,
    state.winner,
    state.error,
    state.turnStartTime,
    state.timeRemaining,
    state.createdAt,
    state.updatedAt
  );
  
  return state;
}

export function getLocalGame(id: string): LocalGameState | null {
  const row = db.prepare("SELECT * FROM local_games WHERE id = ?").get(id) as any;
  if (!row) return null;
  
  return {
    id: row.id,
    player1Name: row.player1_name,
    player2Name: row.player2_name,
    history: JSON.parse(row.history),
    currentPlayer: row.current_player,
    status: row.status,
    winner: row.winner,
    error: row.error,
    turnStartTime: row.turn_start_time,
    timeRemaining: row.time_remaining,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function saveLocalGame(state: LocalGameState): void {
  state.updatedAt = Date.now();
  db.prepare(`
    UPDATE local_games
    SET history = ?, current_player = ?, status = ?, winner = ?, error = ?, turn_start_time = ?, time_remaining = ?, updated_at = ?
    WHERE id = ?
  `).run(
    JSON.stringify(state.history),
    state.currentPlayer,
    state.status,
    state.winner,
    state.error,
    state.turnStartTime,
    state.timeRemaining,
    state.updatedAt,
    state.id
  );
}

export function deleteLocalGame(id: string): void {
  db.prepare("DELETE FROM local_games WHERE id = ?").run(id);
}