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

    if (room.player1Token === playerToken) {
      return NextResponse.json({ playerNumber: 1, gameState: room });
    } else if (!room.player2Token) {
      room.player2Token = playerToken;
      room.lastUpdated = Date.now();
      dbStore.saveRoom(room);
      return NextResponse.json({ playerNumber: 2, gameState: room });
    } else {
      return NextResponse.json({ error: "Room is full" }, { status: 403 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to join room" }, { status: 500 });
  }
}