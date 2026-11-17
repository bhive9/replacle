"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Alert, Box, Paper, Typography } from "@mui/material";
import TurnCountdown from "@/components/TurnCountdown";
import { useRemoteGameStream } from "@/hooks/useRemoteGameStream";
import GamePageContainer from "@/components/game/GamePageContainer";
import GameHeader from "@/components/game/GameHeader";
import WordDisplay from "@/components/game/WordDisplay";
import HistoryList from "@/components/game/HistoryList";
import WordInput from "@/components/game/WordInput";
import GameOverScreen from "@/components/game/GameOverScreen";

function RemoteGameInner() {
  const { gameId } = useParams<{ gameId: string }>();
  const search = useSearchParams();
  const player = search.get("player") === "2" ? 2 : 1;
  const { game, setGame, error: streamError } = useRemoteGameStream(gameId);
  const router = useRouter();
  const [input, setInput] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);
  const error = actionError || streamError;
  // Tracks which turn the local timeout edge fired for; a new turnStartTime
  // automatically re-enables input without a reset effect.
  const [timedOutForTurn, setTimedOutForTurn] = useState<number | null>(null);

  // Back in the lobby if the server says the game is waiting (e.g. rematch reset).
  useEffect(() => {
    if (game?.status === "waiting") router.replace(`/game/remote/join/${gameId}?player=${player}`);
  }, [game?.status, gameId, player, router]);

  async function action(endpoint: "move" | "restart", body: object = {}) {
    setBusy(true);
    setActionError("");
    try {
      const response = await fetch(`/api/remote/game/${gameId}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Request failed");
      setGame(data.game);
      if (endpoint === "move") setInput("");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  if (!game) {
    return (
      <GamePageContainer>
        {error ? <Alert severity="error">{error}</Alert> : <Typography variant="h3" color="secondary">Loading...</Typography>}
      </GamePageContainer>
    );
  }

  if (game.status === "waiting" || !game.history.length) {
    return (
      <GamePageContainer>
        <Typography variant="h3" color="secondary">Starting Game...</Typography>
      </GamePageContainer>
    );
  }

  if (game.status === "game_over") {
    const winnerName = game.winner === 1 ? game.player1Name : game.player2Name;
    const loserName = game.winner === 1 ? game.player2Name : game.player1Name;
    if (!winnerName || !loserName) return null;

    return (
      <GameOverScreen
        winnerName={winnerName}
        loserName={loserName}
        reason={game.endReason ?? null}
        totalWords={game.history.length}
        onPlayAgain={() => action("restart")}
        playAgainDisabled={busy}
      />
    );
  }

  const currentWord = game.history[game.history.length - 1] ?? "";
  const currentPlayerName = game.currentPlayer === 1 ? game.player1Name : game.player2Name;
  const timedOut = timedOutForTurn !== null && timedOutForTurn === game.turnStartTime;
  const isMyTurn = game.currentPlayer === player && !timedOut;

  return (
    <GamePageContainer>
      <GameHeader onNewGame={() => action("restart")} newGameDisabled={busy} />

      {/* Player Turn Indicator + Timer */}
      <Paper
        elevation={0}
        sx={{
          p: 2, mb: 3, borderRadius: 4,
          bgcolor: game.currentPlayer === 1 ? "primary.main" : "secondary.main",
          color: "white",
          transition: "all 0.3s ease",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 3,
          flexShrink: 0,
        }}
      >
        <Typography variant="h2" sx={{ m: 0, color: "inherit" }}>
          {currentPlayerName}&apos;s Turn
        </Typography>
        <Typography variant="h3" sx={{ m: 0, color: "inherit", fontWeight: 700 }}>
          <TurnCountdown
            key={game.turnStartTime ?? "no-turn"}
            turnStartTime={game.turnStartTime}
            tickMs={250}
            rounding="ceil"
            onTimeout={() => setTimedOutForTurn(game.turnStartTime)}
          />
        </Typography>
      </Paper>

      <WordDisplay word={currentWord} />

      <HistoryList history={game.history} />

      <WordInput
        value={input}
        onChange={setInput}
        onSubmit={() => void action("move", { player, word: input })}
        disabled={!isMyTurn || busy}
        error={error}
        onClearError={() => {
          setActionError("");
        }}
      />
      {!isMyTurn && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: "center" }}>
          Waiting for {currentPlayerName}...
        </Typography>
      )}
    </GamePageContainer>
  );
}

export default function RemoteGamePage() {
  return (
    <Suspense fallback={<div>Loading game...</div>}>
      <RemoteGameInner />
    </Suspense>
  );
}
