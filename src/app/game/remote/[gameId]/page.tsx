"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Container,
  Typography,
  Button,
  Box,
  Paper,
  Chip,
  Alert,
  Fade,
  IconButton,
  OutlinedInput,
} from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import HistoryIcon from "@mui/icons-material/History";
import RefreshIcon from "@mui/icons-material/Refresh";
import TurnCountdown from "@/components/TurnCountdown";
import type { RemoteGame } from "@/lib/remote-db";

function RemoteGameInner() {
  const { gameId } = useParams<{ gameId: string }>();
  const router = useRouter();
  const search = useSearchParams();
  const player = search.get("player") === "2" ? 2 : 1;
  const [game, setGame] = useState<RemoteGame | null>(null);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  // Tracks which turn the local timeout edge fired for; a new turnStartTime
  // automatically re-enables input without a reset effect.
  const [timedOutForTurn, setTimedOutForTurn] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Poll game state; timeouts are decided server-side.
  useEffect(() => {
    let stopped = false;
    async function refresh() {
      try {
        const response = await fetch(`/api/remote/game/${gameId}`, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to load game");
        if (stopped) return;
        setGame(data.game);
        if (data.game.status === "waiting") router.replace(`/game/remote/join/${gameId}?player=${player}`);
      } catch (err) {
        if (!stopped) setError(err instanceof Error ? err.message : "Failed to load game");
      }
    }
    void refresh();
    const interval = setInterval(refresh, 1500);
    return () => { stopped = true; clearInterval(interval); };
  }, [gameId, player, router]);

  // Auto-scroll history
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [game?.history]);

  async function action(endpoint: "move" | "restart", body: object = {}) {
    setBusy(true);
    setError("");
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
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  if (!game) {
    return (
      <Container maxWidth="sm" sx={{ py: 10, textAlign: "center" }}>
        {error ? <Alert severity="error">{error}</Alert> : <Typography variant="h3" color="secondary">Loading...</Typography>}
      </Container>
    );
  }

  if (game.status === "waiting" || !game.history.length) {
    return (
      <Container maxWidth="sm" sx={{ py: 10, textAlign: "center" }}>
        <Typography variant="h3" color="secondary">Starting Game...</Typography>
      </Container>
    );
  }

  if (game.status === "game_over") {
    const winnerName = game.winner === 1 ? game.player1Name : game.player2Name;
    const loserName = game.winner === 1 ? game.player2Name : game.player1Name;

    return (
      <Container maxWidth="sm" sx={{ py: 10, textAlign: "center" }}>
        <Typography variant="h1" gutterBottom color="secondary">Replacle</Typography>
        <Typography variant="h2" gutterBottom color="success.main" sx={{ mt: 2 }}>
          🎉 {winnerName} Wins!
        </Typography>
        <Typography variant="body1" sx={{ mb: 2, color: "text.secondary" }}>
          {game.endReason === "timeout"
            ? `${loserName} ran out of time!`
            : `No valid moves left for ${loserName}.`}
        </Typography>
        <Typography variant="body2" sx={{ mb: 4, color: "text.secondary" }}>
          Total words played: {game.history.length}
        </Typography>
        <Button
          variant="outlined"
          size="large"
          onClick={() => action("restart")}
          startIcon={<RefreshIcon />}
          color="secondary"
          disabled={busy}
        >
          Play Again
        </Button>
      </Container>
    );
  }

  const currentWord = game.history[game.history.length - 1] ?? "";
  const currentPlayerName = game.currentPlayer === 1 ? game.player1Name : game.player2Name;
  const timedOut = timedOutForTurn !== null && timedOutForTurn === game.turnStartTime;
  const isMyTurn = game.currentPlayer === player && !timedOut;

  return (
    <Container maxWidth="sm" sx={{ py: 4, height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h3" color="secondary" sx={{ m: 0 }}>Replacle</Typography>
        <IconButton onClick={() => action("restart")} title="New Game" disabled={busy}>
          <RefreshIcon />
        </IconButton>
      </Box>

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
        }}
      >
        <Typography variant="h3" sx={{ m: 0, color: "inherit" }}>
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

      {/* Current Word Display */}
      <Box sx={{ textAlign: "center", mb: 4, py: 4, border: "2px dashed", borderColor: "primary.main", borderRadius: 4 }}>
        <Typography variant="caption" sx={{ textTransform: "uppercase", letterSpacing: 2 }}>Current Word</Typography>
        <Box sx={{ display: "flex", justifyContent: "center", gap: 1, mt: 1 }}>
          {currentWord.split("").map((char, i) => (
            <Paper
              key={i}
              elevation={2}
              sx={{
                width: 60, height: 70, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "2.5rem", fontWeight: "bold", bgcolor: "white", borderRadius: 2
              }}
            >
              {char.toUpperCase()}
            </Paper>
          ))}
        </Box>
      </Box>

      {/* History */}
      <Box sx={{ flexGrow: 1, overflow: "hidden", display: "flex", flexDirection: "column", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <HistoryIcon fontSize="small" color="disabled" />
          <Typography variant="body2" color="text.secondary">Game History</Typography>
        </Box>
        <Box
          ref={scrollRef}
          sx={{
            flexGrow: 1, overflowY: "auto", pr: 1,
            display: "flex", flexDirection: "column", gap: 1
          }}
        >
          {game.history.map((word, i) => (
            <Fade in key={i}>
              <Box sx={{ display: "flex", justifyContent: i % 2 === 0 ? "flex-start" : "flex-end" }}>
                <Chip
                  label={word.toUpperCase()}
                  variant={i === game.history.length - 1 ? "filled" : "outlined"}
                  color={i % 2 === 0 ? "primary" : "secondary"}
                  sx={{ fontSize: "1.1rem", height: 36, fontWeight: 600 }}
                />
              </Box>
            </Fade>
          ))}
        </Box>
      </Box>

      {/* Input */}
      <Box sx={{ pb: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}
        <Box sx={{ display: "flex", gap: 2 }}>
          <OutlinedInput
            fullWidth
            placeholder="Type next word..."
            value={input}
            onChange={(e) => {
              setInput(e.target.value.slice(0, 4).toUpperCase());
              if (error) setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && isMyTurn && !busy && void action("move", { player, word: input })}
            autoFocus
            disabled={!isMyTurn || busy}
            sx={{
              borderRadius: 3,
              bgcolor: isMyTurn ? "white" : "grey.100",
              height: 52,
              fontSize: "1.25rem",
              letterSpacing: 2,
              textTransform: "uppercase",
              "& .MuiOutlinedInput-notchedOutline": {
                borderWidth: 2,
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderWidth: 2,
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderWidth: 3,
              },
            }}
            inputProps={{ maxLength: 4, style: { textAlign: "center" } }}
          />
          <Button
            variant="contained"
            onClick={() => action("move", { player, word: input })}
            disabled={!isMyTurn || !input.trim() || busy}
            sx={{
              height: 52,
              minWidth: 52,
              borderRadius: 3,
              padding: 0,
              boxShadow: 3,
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              "&:hover:not(:disabled)": {
                transform: "scale(1.05)",
                boxShadow: 4,
              },
              "&:active:not(:disabled)": {
                transform: "scale(0.98)",
              },
              "&:disabled": {
                opacity: 0.4,
              },
            }}
            aria-label="Submit word"
          >
            <ArrowUpwardIcon fontSize="large" />
          </Button>
        </Box>
        {!isMyTurn && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: "center" }}>
            Waiting for {currentPlayerName}...
          </Typography>
        )}
      </Box>
    </Container>
  );
}

export default function RemoteGamePage() {
  return (
    <Suspense fallback={<div>Loading game...</div>}>
      <RemoteGameInner />
    </Suspense>
  );
}
