import { NextRequest, NextResponse } from "next/server";
import { getRemoteGame } from "@/lib/remote-db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;

  const game = await getRemoteGame(gameId);
  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      let lastState = JSON.stringify(game);

      // Send initial state
      controller.enqueue(encoder.encode(`data: ${lastState}\n\n`));

      const send = async () => {
        const current = await getRemoteGame(gameId);
        if (!current) return;
        const state = JSON.stringify(current);
        if (state !== lastState) {
          lastState = state;
          controller.enqueue(encoder.encode(`data: ${state}\n\n`));
        }
      };

      // Poll KV every 1s and push changes
      const interval = setInterval(send, 1000);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}