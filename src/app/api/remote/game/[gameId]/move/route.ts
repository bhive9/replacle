import { NextRequest, NextResponse } from "next/server";
import { submitMove } from "@/lib/remote-db";
import { dictionary } from "@/lib/remote-words";

export async function POST(req: NextRequest, { params }: { params: Promise<{ gameId: string }> }) {
  try {
    const { gameId } = await params;
    const { player, word } = await req.json();
    if ((player !== 1 && player !== 2) || typeof word !== "string") {
      return NextResponse.json({ error: "A player and word are required" }, { status: 400 });
    }
    const game = await submitMove(gameId, player, word, dictionary);
    if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });
    return NextResponse.json({ game });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to submit move" }, { status: 400 });
  }
}
