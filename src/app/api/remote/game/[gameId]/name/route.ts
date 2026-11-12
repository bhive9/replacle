import { NextRequest, NextResponse } from "next/server";
import { getRemoteGame, saveRemoteGame } from "@/lib/remote-db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const { player, name } = await req.json();

    if (player !== 1 && player !== 2) {
      return NextResponse.json({ error: "player must be 1 or 2" }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ error: "name required" }, { status: 400 });
    }

    const game = await getRemoteGame(gameId);
    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    if (player === 1) game.player1Name = name;
    else game.player2Name = name;

    await saveRemoteGame(game);
    return NextResponse.json({ game });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to set name" }, { status: 500 });
  }
}