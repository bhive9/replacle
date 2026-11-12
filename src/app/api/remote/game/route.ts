import { NextRequest, NextResponse } from "next/server";
import { createRemoteGame } from "@/lib/remote-db";

export async function POST(req: NextRequest) {
  try {
    const game = await createRemoteGame()
    return NextResponse.json({ gameId: game.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create game" }, { status: 500 })
  }
}