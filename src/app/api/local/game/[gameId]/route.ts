import { NextRequest, NextResponse } from "next/server";
import { getLocalGame, saveLocalGame } from "@/lib/db";
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const game = await getLocalGame(gameId);

    if (!game) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ game });
  } catch (err: unknown) {
    console.error("getLocalGame error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load game" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    await params;
    const gameState = await req.json();

    if (typeof gameState?.id !== "string" || !gameState.id) {
      return NextResponse.json(
        { error: "Game state must include an id" },
        { status: 400 }
      );
    }

    await saveLocalGame(gameState);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save game" },
      { status: 500 }
    );
  }
}