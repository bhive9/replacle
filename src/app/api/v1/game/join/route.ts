import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { dbStore } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { roomId, playerName } = await req.json();
    if (!roomId) {
      return NextResponse.json({ error: "roomId required" }, { status: 400 });
    }

    const room = dbStore.getRoom(roomId);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Player 1 already has a token - this is Player 2 joining
    if (room.player2Token === null) {
      const player2Token = crypto.randomBytes(16).toString("hex");
      room.player2Token = player2Token;
      room.lastUpdated = Date.now();
      dbStore.saveRoom(room);
      return NextResponse.json({ playerNumber: 2, playerToken: player2Token, gameState: room });
    }

    // Room already full
    return NextResponse.json({ error: "Room is full" }, { status: 403 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to join room" }, { status: 500 });
  }
}