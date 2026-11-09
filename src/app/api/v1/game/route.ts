import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { dbStore } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const startPath = path.join(process.cwd(), "public", "data", "starting_words.txt");
    const startText = fs.readFileSync(startPath, "utf8");
    const startingWords = startText.split("\n").map(w => w.trim().toLowerCase()).filter(w => w.length === 4);
    const initialWord = startingWords[Math.floor(Math.random() * startingWords.length)] || "test";

    const roomId = crypto.randomBytes(3).toString("hex");
    const player1Token = crypto.randomBytes(16).toString("hex");

    const room = {
      roomId,
      history: [initialWord],
      currentPlayer: 1 as const,
      status: "playing" as const,
      winner: null,
      player1Token,
      player2Token: null,
      lastUpdated: Date.now(),
    };

    dbStore.saveRoom(room);

    return NextResponse.json({ roomId, playerToken: player1Token, playerNumber: 1 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create room" }, { status: 500 });
  }
}
