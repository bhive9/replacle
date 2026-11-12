import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import { submitMove } from "@/lib/remote-db";

const cwd = process.cwd();

const dictText = readFileSync(join(cwd, "public/data/dictionary.txt"), "utf-8");
const dictionary = new Set(dictText.split("\n").map((w) => w.trim().toLowerCase()));
const startText = readFileSync(join(cwd, "public/data/starting_words.txt"), "utf-8");
const startingWords = startText.split("\n").map((w) => w.trim().toLowerCase()).filter((w) => w.length === 4);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const { player, word } = await req.json();

    if (player !== 1 && player !== 2) {
      return NextResponse.json({ error: "player must be 1 or 2" }, { status: 400 });
    }
    if (!word) {
      return NextResponse.json({ error: "word required" }, { status: 400 });
    }

    const game = await submitMove(gameId, player, word, dictionary, startingWords);
    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    return NextResponse.json({ game });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to submit move" }, { status: 500 });
  }
}