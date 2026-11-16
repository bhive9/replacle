import { NextResponse } from "next/server";
import { restartGame } from "@/lib/remote-db";
import { startingWords } from "@/lib/remote-words";

export async function POST(_req: Request, { params }: { params: Promise<{ gameId: string }> }) {
  try {
    const { gameId } = await params;
    const game = await restartGame(gameId, startingWords);
    if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });
    return NextResponse.json({ game });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to restart game" }, { status: 400 });
  }
}
