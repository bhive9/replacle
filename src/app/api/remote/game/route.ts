import { NextResponse } from "next/server";
import { createRemoteGame } from "@/lib/remote-db";

export async function POST() {
  try {
    const game = await createRemoteGame();
    return NextResponse.json({ gameId: game.id });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to create game" }, { status: 500 });
  }
}
