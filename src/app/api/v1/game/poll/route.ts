import { NextRequest, NextResponse } from "next/server";
import { dbStore } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { roomId, playerToken } = await req.json();
    if (!roomId || !playerToken) {
      return NextResponse.json({ error: "roomId and playerToken required" }, { status: 400 });
    }

    const room = dbStore.getRoom(roomId);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (room.player1Token !== playerToken && room.player2Token !== playerToken) {
      return NextResponse.json({ error: "Invalid player token" }, { status: 403 });
    }

    // Decrement timer every second
    if (room.timer !== null && room.timer > 0) {
      room.timer -= 1;
      dbStore.saveRoom(room);
    }

    // Check for timeout
    if (room.timer === 0) {
      room.status = "game_over";
      room.winner = room.currentPlayer === 1 ? 2 : 1;
      room.timer = null;
      dbStore.saveRoom(room);
    }

    return NextResponse.json({ gameState: room });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to get game state" }, { status: 500 });
  }
}