import { NextRequest, NextResponse } from "next/server";
import { createLocalGame } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { player1Name, player2Name } = await req.json();

    if (!player1Name || !player2Name) {
      return NextResponse.json({ error: "player1Name and player2Name required" }, { status: 400 });
    }

    const game = createLocalGame(player1Name, player2Name);

    return NextResponse.json({ gameId: game.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to start game" }, { status: 500 });
  }
}