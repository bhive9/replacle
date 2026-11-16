import { NextRequest, NextResponse } from "next/server";
import { setReady } from "@/lib/remote-db";
import { startingWords } from "@/lib/remote-words";

export async function POST(req: NextRequest, { params }: { params: Promise<{ gameId: string }> }) {
  try {
    const { gameId } = await params;
    const { player } = await req.json();
    if (player !== 1 && player !== 2) return NextResponse.json({ error: "player must be 1 or 2" }, { status: 400 });
    const game = await setReady(gameId, player, startingWords);
    if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });
    return NextResponse.json({ game });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to set ready" }, { status: 400 });
  }
}
