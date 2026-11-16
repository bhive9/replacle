import { NextResponse } from "next/server";
import { getRemoteGame } from "@/lib/remote-db";

export async function GET(_req: Request, { params }: { params: Promise<{ gameId: string }> }) {
  try {
    const { gameId } = await params;
    const game = await getRemoteGame(gameId);
    if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });
    return NextResponse.json({ game }, { headers: { "Cache-Control": "no-store" } });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to load game" }, { status: 500 });
  }
}
