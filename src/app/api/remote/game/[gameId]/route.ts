import { NextRequest, NextResponse } from "next/server";
import { createRemoteGame, getRemoteGame } from "@/lib/remote-db";

export async function POST(req: NextRequest) {
  try {
    const { player1Name } = await req.json();

    if (!player1Name) {
      return NextResponse.json({ error: "player1Name required" }, { status: 400 });
    }

    const game = await createRemoteGame(player1Name.trim());
    return NextResponse.json({ gameId: game.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create game" }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const game = await getRemoteGame(gameId);

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    return NextResponse.json({ game });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load game" }, { status: 500 });
  }
}