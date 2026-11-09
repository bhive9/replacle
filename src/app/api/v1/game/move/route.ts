import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { dbStore } from "@/lib/db";

function getDictionary() {
  try {
    const dictPath = path.join(process.cwd(), "public", "data", "dictionary.txt");
    const dictText = fs.readFileSync(dictPath, "utf8");
    return new Set(dictText.split("\n").map(w => w.trim().toLowerCase()));
  } catch {
    return new Set<string>();
  }
}

function checkGameOver(currentWord: string, dictionary: Set<string>, history: string[]): boolean {
  for (const word of dictionary) {
    if (word.length === 4 && !history.includes(word)) {
      if (word.split("").filter((c: string, i: number) => c !== currentWord[i]).length === 1) {
        return false;
      }
    }
  }
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const { roomId, playerToken, word } = await req.json();
    if (!roomId || !playerToken || !word) {
      return NextResponse.json({ error: "roomId, playerToken, and word required" }, { status: 400 });
    }

    const room = dbStore.getRoom(roomId);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const isPlayer1 = room.player1Token === playerToken;
    const isPlayer2 = room.player2Token === playerToken;
    if (!isPlayer1 && !isPlayer2) {
      return NextResponse.json({ error: "Invalid player token" }, { status: 403 });
    }
    if ((room.currentPlayer === 1 && !isPlayer1) || (room.currentPlayer === 2 && !isPlayer2)) {
      return NextResponse.json({ error: "Not your turn" }, { status: 403 });
    }

    const lastWord = room.history[room.history.length - 1];
    const dictionary = getDictionary();

    if (word.length !== 4) {
      return NextResponse.json({ error: "Word must be 4 letters long" }, { status: 400 });
    }
    if (room.history.includes(word)) {
      return NextResponse.json({ error: "Word already used" }, { status: 400 });
    }
    if (!dictionary.has(word)) {
      return NextResponse.json({ error: "That's not in my dictionary" }, { status: 400 });
    }
    if (word.split("").filter((c: string, i: number) => c !== lastWord[i]).length !== 1) {
      return NextResponse.json({ error: "Must change exactly one letter" }, { status: 400 });
    }

    const newHistory = [...room.history, word];
    const isOver = checkGameOver(word, dictionary, newHistory);

    room.history = newHistory;
    room.currentPlayer = room.currentPlayer === 1 ? 2 : 1;
    if (isOver) {
      room.status = "game_over";
      room.winner = room.currentPlayer === 1 ? 2 : 1; // Last player who moved wins
    }
    room.lastUpdated = Date.now();

    dbStore.saveRoom(room);

    return NextResponse.json({ success: true, gameState: room });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to make move" }, { status: 500 });
  }
}
