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
import { GameState, isOneLetterDifferent, checkGameOver } from "@/lib/game-logic";

interface MultiplayerGameState {
  roomId: string;
  history: string[];
  currentPlayer: 1 | 2;
  status: "setup" | "playing" | "game_over";
  winner: 1 | 2 | null;
  player1Token: string;
  player2Token: string | null;
  error?: string;
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
      // In a real app, we'd handle tokens/auth here
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

  if (!gameState || gameState.status === "setup") {
    return (
      <Container maxWidth="sm" sx={{ py: 10, textAlign: "center" }}>
        <Typography variant="h3" color="secondary" gutterBottom>
          Waiting for Opponent...
        </Typography>
        <Typography variant="body1" sx={{ mb: 4 }}>
          Room ID: {roomId}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Game will start automatically when the second player joins.
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4, height: "100vh", display: "flex", flexDirection: "column" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h3" color="secondary">Replacle</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>Room: {gameState.roomId}</Typography>
      </Box>

      {/* Game UI matches original logic... */}
      {gameState.status === "playing" && (
        <Paper sx={{ p: 2, mb: 3, textAlign: "center", bgcolor: gameState.currentPlayer === playerNumber ? "primary.main" : "secondary.main", color: "white" }}>
          <Typography variant="h5">
            {gameState.currentPlayer === playerNumber ? "Your Turn!" : `Player ${gameState.currentPlayer}'s Turn`}
          </Typography>
        </Paper>
      )}

      {gameState.history.length > 0 && (
        <Box sx={{ flexGrow: 1, overflowY: "auto", mb: 2 }}>
          {gameState.history.map((word, i) => (
            <Chip key={i} label={word.toUpperCase()} sx={{ m: 0.5 }} />
          ))}
        </Box>
      )}

      {gameState.status === "playing" && gameState.currentPlayer === playerNumber && (
        <Box sx={{ display: "flex", gap: 1 }}>
          <OutlinedInput fullWidth value={input} onChange={(e) => setInput(e.target.value.toUpperCase().slice(0, 4))} />
          <Button variant="contained" color="secondary" onClick={makeMove}>
            <ArrowUpwardIcon />
          </Button>
        </Box>
      )}
    </Container>
  );
}