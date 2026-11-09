import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "game.db");
const db = new Database(dbPath);

// Initialize table
db.exec(`
  CREATE TABLE IF NOT EXISTS rooms (
    roomId TEXT PRIMARY KEY,
    history TEXT NOT NULL,
    currentPlayer INTEGER NOT NULL,
    status TEXT NOT NULL,
    winner INTEGER,
    player1Token TEXT NOT NULL,
    player2Token TEXT,
    lastUpdated INTEGER NOT NULL
  )
`);

export interface RoomRecord {
  roomId: string;
  history: string[];
  currentPlayer: 1 | 2;
  status: "setup" | "playing" | "game_over";
  winner: 1 | 2 | null;
  player1Token: string;
  player2Token: string | null;
  lastUpdated: number;
}

export const dbStore = {
  getRoom(roomId: string): RoomRecord | null {
    const stmt = db.prepare("SELECT * FROM rooms WHERE roomId = ?");
    const row = stmt.get(roomId) as any;
    if (!row) return null;
    return {
      roomId: row.roomId,
      history: JSON.parse(row.history),
      currentPlayer: row.currentPlayer as (1 | 2),
      status: row.status as any,
      winner: row.winner as any,
      player1Token: row.player1Token,
      player2Token: row.player2Token,
      lastUpdated: row.lastUpdated,
    };
  },

  saveRoom(room: RoomRecord) {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO rooms (roomId, history, currentPlayer, status, winner, player1Token, player2Token, lastUpdated)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      room.roomId,
      JSON.stringify(room.history),
      room.currentPlayer,
      room.status,
      room.winner ?? null,
      room.player1Token,
      room.player2Token ?? null,
      room.lastUpdated
    );
  }
};
