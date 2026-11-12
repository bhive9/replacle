import { NextRequest, NextResponse } from "next/server";
import { getLocalGame, saveLocalGame } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const game = getLocalGame(gameId);
    
    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }
    
    return NextResponse.json({ game });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load game" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const gameState = await req.json();
    
    saveLocalGame(gameState);
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to save game" }, { status: 500 });
  }
}