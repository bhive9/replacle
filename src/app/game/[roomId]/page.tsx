"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
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
import { GameState, isOneLetterDifferent, checkGameOver, TURN_TIME_LIMIT } from "@/lib/game-logic";

interface MultiplayerGameState {
  roomId: string;
  history: string[];
  currentPlayer: 1 | 2;
  status: "setup" | "playing" | "game_over";
  winner: 1 | 2 | null;
  player1Token: string;
  player2Token: string | null;
  error: string | null;
  turnStartTime: number | null;
  timeRemaining: number;
}

export default function ReplacleMultiplayer() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReplacleMultiplayerInner />
    </Suspense>
  );
}

function ReplacleMultiplayerInner() {
  const { roomId } = useParams();
  const searchParams = useSearchParams();
  const playerName = searchParams.get("name") || "Player1";

  const [gameState, setGameState] = useState<MultiplayerGameState | null>(null);
  const [input, setInput] = useState("");
  const [dictionary, setDictionary] = useState<Set<string>>(new Set());
  const [playerNumber, setPlayerNumber] = useState<1 | 2 | null>(null);
  const [playerToken, setPlayerToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const turnStartRef = useRef<number | null>(null);

  // Timer countdown effect
  useEffect(() => {
    if (gameState?.status !== "playing" || gameState?.turnStartTime === null) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - (gameState.turnStartTime ?? Date.now())) / 1000);
      const remaining = Math.max(0, TURN_TIME_LIMIT - elapsed);

      setGameState(s => {
        if (!s || s.status !== "playing") return s;
        if (remaining <= 0) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return {
            ...s,
            status: "game_over",
            winner: s.currentPlayer === 1 ? 2 : 1,
            timeRemaining: 0,
          };
        }
        return { ...s, timeRemaining: remaining };
      });
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameState?.status, gameState?.turnStartTime]);

  // Load dictionary
  useEffect(() => {
    async function loadData() {
      try {
        const dictRes = await fetch("/data/dictionary.txt");
        const dictText = await dictRes.text();
        setDictionary(new Set(dictText.split("\n").map(w => w.trim().toLowerCase())));
      } catch (err) {
        console.error("Failed to load dictionary", err);
      }
    }
    loadData();
  }, []);

  const joinRoom = useCallback(async () => {
    if (!roomId) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/game/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, playerName }),
      });
      const data = await res.json();
      if (res.ok) {
        setGameState(data.gameState);
        setPlayerNumber(data.playerNumber);
        setPlayerToken(data.playerToken);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.error("Failed to join room", err);
    } finally {
      setIsLoading(false);
    }
  }, [roomId, playerName]);

  // Initial join
  useEffect(() => {
    joinRoom();
  }, [joinRoom]);

  const makeMove = useCallback(async () => {
    if (!gameState || !playerToken || !input.trim()) return;

    const word = input.trim().toLowerCase();
    const lastWord = gameState.history[gameState.history.length - 1];

    if (!dictionary.has(word)) {
      setGameState(s => s ? { ...s, error: "That's not in my dictionary!" } : null);
      return;
    }
    if (!isOneLetterDifferent(lastWord, word)) {
      setGameState(s => s ? { ...s, error: "Must change exactly one letter!" } : null);
      return;
    }

    try {
      const res = await fetch("/api/v1/game/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: gameState.roomId, playerToken, word }),
      });
      const data = await res.json();
      if (res.ok) {
        setGameState(data.gameState);
        setInput("");
      } else {
        setGameState(s => s ? { ...s, error: data.error } : null);
      }
    } catch (err: any) {
      setGameState(s => s ? { ...s, error: "Failed to submit move" } : null);
    }
  }, [gameState, playerToken, input, dictionary]);

  // Auto-poll
  useEffect(() => {
    if (!gameState || !playerToken) return;
    const interval = setInterval(async () => {
      const res = await fetch("/api/v1/game/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: gameState.roomId, playerToken }),
      });
      const data = await res.json();
      if (res.ok && data.gameState) {
        setGameState(data.gameState);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState, playerToken]);

  // Loading state
  if (isLoading) {
    return (
      <Container maxWidth="sm" sx={{ py: 10, textAlign: "center" }}>
        <Typography variant="h3" color="secondary">Loading...</Typography>
      </Container>
    );
  }

  // Game over state
  if (gameState?.status === "game_over") {
    const isTimeout = gameState.timeRemaining === 0;
    return (
      <Container maxWidth="sm" sx={{ py: 10, textAlign: "center" }}>
        <Typography variant="h1" gutterBottom color="secondary">
          Replacle
        </Typography>
        <Typography variant="h2" gutterBottom color="success.main" sx={{ mt: 2 }}>
          🎉 Player {gameState.winner} Wins!
        </Typography>
        <Typography variant="body1" sx={{ mb: 2, color: "text.secondary" }}>
          {isTimeout
            ? `Player ${gameState.winner === 1 ? 2 : 1} ran out of time!`
            : `No valid moves left for Player ${gameState.winner === 1 ? 2 : 1}.`}
        </Typography>
        <Typography variant="body2" sx={{ mb: 4, color: "text.secondary" }}>
          Total words played: {gameState.history.length}
        </Typography>
        <Button
          variant="outlined"
          size="large"
          onClick={() => window.location.reload()}
          startIcon={<RefreshIcon />}
          color="secondary"
        >
          Play Again
        </Button>
      </Container>
    );
  }

  // If game not loaded yet, show loading
  if (!gameState) {
    return (
      <Container maxWidth="sm" sx={{ py: 10, textAlign: "center" }}>
        <Typography variant="h3" color="secondary">Loading...</Typography>
      </Container>
    );
  }

  const currentWord = gameState.history[gameState.history.length - 1];
  const isMyTurn = gameState.currentPlayer === playerNumber;

  return (
    <Container maxWidth="sm" sx={{ py: 4, height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h3" color="secondary" sx={{ m: 0 }}>Replacle</Typography>
        <IconButton onClick={() => window.location.reload()} title="Reset Game">
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Player Turn Indicator + Timer - Timer invisible until game starts (status === "playing") */}
      <Paper
        elevation={0}
        sx={{
          p: 2, mb: 3, borderRadius: 4,
          bgcolor: isMyTurn ? "primary.main" : "secondary.main",
          color: "white",
          transition: "all 0.3s ease",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 3,
        }}
      >
        <Typography variant="h3" sx={{ m: 0, color: "inherit" }}>
          {isMyTurn ? "Your Turn" : `Player ${gameState.currentPlayer}'s Turn`}
        </Typography>
        {/* Timer only visible when game is playing (both players joined) */}
        <Typography variant="h3" sx={{ m: 0, color: "inherit", fontWeight: 700, visibility: gameState.status === "playing" ? "visible" : "hidden" }}>
          {gameState.timeRemaining}s
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
          {gameState.history.map((word, i) => (
            <Fade in key={i}>
              <Box sx={{ display: "flex", justifyContent: i % 2 === 0 ? "flex-start" : "flex-end" }}>
                <Chip
                  label={word.toUpperCase()}
                  variant={i === gameState.history.length - 1 ? "filled" : "outlined"}
                  color={i % 2 === 0 ? "primary" : "secondary"}
                  sx={{ fontSize: "1.1rem", height: 36, fontWeight: 600 }}
                />
              </Box>
            </Fade>
          ))}
        </Box>
      </Box>

      {/* Input - only show for current player's turn */}
      {isMyTurn && (
        <Box sx={{ pb: 2 }}>
          {gameState.error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }} onClose={() => setGameState(s => s ? { ...s, error: null } : null)}>
              {gameState.error}
            </Alert>
          )}
          <Box sx={{ display: "flex", gap: 2 }}>
            <OutlinedInput
              fullWidth
              placeholder="Type next word..."
              value={input}
              onChange={(e) => {
                setInput(e.target.value.slice(0, 4).toUpperCase());
                if (gameState.error) setGameState(s => s ? { ...s, error: null } : null);
              }}
              onKeyDown={(e) => e.key === "Enter" && makeMove()}
              autoFocus
              sx={{
                borderRadius: 3,
                bgcolor: "white",
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
              onClick={makeMove}
              disabled={!input.trim()}
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
        </Box>
      )}

      {!isMyTurn && (
        <Box sx={{ pb: 2, textAlign: "center" }}>
          <Typography variant="body1" color="text.secondary">
            Waiting for Player {gameState.currentPlayer}...
          </Typography>
        </Box>
      )}
    </Container>
  );
}