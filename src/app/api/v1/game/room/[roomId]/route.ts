import { NextRequest, NextResponse } from "next/server";

// Global in-memory rooms map
const globalStore = globalThis as unknown as {
  _rooms?: Map<string, {
    roomId: string;
    history: string[];
    currentPlayer: 1 | 2;
    status: "setup" | "playing" | "game_over";
    winner: 1 | 2 | null;
    player1Token: string;
    player2Token: string | null;
    lastUpdated: number;
  }>;
};

if (!globalStore._rooms) {
  globalStore._rooms = new Map();
}
const rooms = globalStore._rooms;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const room = rooms.get(roomId);
    
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      roomId: room.roomId,
      status: room.status,
      playerCount: room.player2Token ? 2 : 1,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to check room" }, { status: 500 });
  }
}