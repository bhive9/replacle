import { NextRequest, NextResponse } from "next/server";
import { setPlayerName } from "@/lib/remote-db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ gameId: string }> }) {
  try {
    const { gameId } = await params;
    const { player, name } = await req.json();
    if ((player !== 1 && player !== 2) || typeof name !== "string" || !name.trim() || name.trim().length > 40) {
      return NextResponse.json({ error: "A player and name (up to 40 characters) are required" }, { status: 400 });
    }
    const game = await setPlayerName(gameId, player, name.trim());
    if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });
    return NextResponse.json({ game });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to set name" }, { status: 400 });
  }
}
