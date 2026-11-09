"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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
import SendIcon from "@mui/icons-material/Send";
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
  const [gameState, setGameState] = useState<MultiplayerGameState | null>(null);
  const [input, setInput] = useState("");
  const [dictionary, setDictionary] = useState<Set<string>>(new Set());
  const [startingWords, setStartingWords] = useState<string[]>([]);
  const [playerNumber, setPlayerNumber] = useState<1 | 2 | null>(null);
  const [playerToken, setPlayerToken] = useState<string | null>(null);
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load dictionary
  useEffect(() => {
    async function loadData() {
      try {
        const [dictRes, startRes] = await Promise.all([
          fetch("/data/dictionary.txt"),
          fetch("/data/starting_words.txt"),
        ]);
        const dictText = await dictRes.text();
        const startText = await startRes.text();
        
        setDictionary(new Set(dictText.split("\n").map(w => w.trim().toLowerCase())));
        setStartingWords(startText.split("\n").map(w => w.trim().toLowerCase()).filter(w => w.length === 4));
      } catch (err) {
        console.error("Failed to load game data", err);
      }
    }
    loadData();
  }, []);

  const createRoom = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/game", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setGameState(data);
        setPlayerNumber(1);
        setPlayerToken(data.playerToken);
        setRoomUrl(`${window.location.origin}/game/${data.roomId}`);
        // Auto-join as player 1
        await joinRoom(data.roomId, data.playerToken);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.error("Failed to create room", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const joinRoom = useCallback(async (roomId: string, token: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/game/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, playerToken: token }),
      });
      const data = await res.json();
      if (res.ok) {
        setGameState(data.gameState);
        setPlayerNumber(data.playerNumber);
        setPlayerToken(token);
        setRoomUrl(`${window.location.origin}/game/${roomId}`);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.error("Failed to join room", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const makeMove = useCallback(async () => {
    if (!gameState || !playerToken || !input.trim()) return;
    
    const word = input.trim().toLowerCase();
    const lastWord = gameState.history[gameState.history.length - 1];

    // Validation
    if (word.length !== 4) {
      setGameState(s => s ? { ...s, error: "Word must be 4 letters long!" } : null);
      return;
    }
    if (gameState.history.includes(word)) {
      setGameState(s => s ? { ...s, error: "Word already used!" } : null);
      return;
    }
    if (!dictionary.has(word)) {
      setGameState(s => s ? { ...s, error: "Not a valid word in TWL06!" } : null);
      return;
    }
    if (!isOneLetterDifferent(lastWord, word)) {
      setGameState(s => s ? { ...s, error: "Must change exactly one letter!" } : null);
      return;
    }

    // API call
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

  const pollGameState = useCallback(async () => {
    if (!gameState || !playerToken) return;
    
    try {
      const res = await fetch("/api/v1/game/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: gameState.roomId, playerToken }),
      });
      const data = await res.json();
      if (res.ok && data.gameState && JSON.stringify(data.gameState) !== JSON.stringify(gameState)) {
        setGameState(data.gameState);
      }
    } catch (err) {
      console.error("Poll failed", err);
    }
  }, [gameState, playerToken]);

  // Auto-poll for updates
  useEffect(() => {
    if (!gameState || !playerToken) return;
    const interval = setInterval(pollGameState, 1000);
    return () => clearInterval(interval);
  }, [gameState, playerToken, pollGameState]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [gameState?.history]);

  if (!gameState) {
    return (
      <Container maxWidth="sm" sx={{ py: 10, textAlign: "center" }}>
        <Typography variant="h1" gutterBottom color="secondary">
          Replacle Multiplayer
        </Typography>
        <Typography variant="body1" sx={{ mb: 4, color: "text.secondary" }}>
          Create a room and share the link with a friend to play remotely!
        </Typography>
        <Button 
          variant="contained" 
          size="large" 
          onClick={createRoom}
          disabled={isLoading}
          startIcon={isLoading ? <RefreshIcon /> : <RefreshIcon />}
        >
          {isLoading ? "Creating..." : "Create Room"}
        </Button>
      </Container>
    );
  }

  const currentWord = gameState.history[gameState.history.length - 1];

  return (
    <Container maxWidth="sm" sx={{ py: 4, height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h3" color="secondary" sx={{ m: 0 }}>Replacle</Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Room: {gameState.roomId}
          </Typography>
          <IconButton onClick={() => window.location.reload()} title="New Game">
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Room Info */}
      {roomUrl && (
        <Paper sx={{ p: 2, mb: 3, borderRadius: 3, bgcolor: "info.main", color: "white" }}>
          <Typography variant="body2" sx={{ mb: 1 }}>Share this link:</Typography>
          <Typography variant="caption" sx={{ fontFamily: "monospace", wordBreak: "break-all" }}>
            {roomUrl}
          </Typography>
        </Paper>
      )}

      {/* Player Turn Indicator */}
      {gameState.status === "playing" && (
        <Paper 
          elevation={0} 
          sx={{ 
            p: 2, mb: 3, textAlign: "center", borderRadius: 4,
            bgcolor: gameState.currentPlayer === playerNumber ? "primary.main" : "secondary.main",
            color: "white",
            transition: "all 0.3s ease"
          }}
        >
          <Typography variant="h3" sx={{ m: 0 }}>
            {gameState.currentPlayer === playerNumber ? "Your Turn!" : `Player ${gameState.currentPlayer}'s Turn`}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            You are Player {playerNumber}
          </Typography>
        </Paper>
      )}

      {/* Current Word Display */}
      {gameState.status === "playing" && (
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
      )}

      {/* Game Over */}
      {gameState.status === "game_over" && (
        <Paper sx={{ p: 4, mb: 4, textAlign: "center", borderRadius: 4, bgcolor: "success.light" }}>
          <Typography variant="h2" gutterBottom color="success.main">
            🎉 Player {gameState.winner} Wins!
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary" }}>
            {gameState.winner === playerNumber ? "You won!" : "You lost!"}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
            Total words played: {gameState.history.length}
          </Typography>
        </Paper>
      )}

      {/* History */}
      {gameState.status === "playing" && (
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
      )}

      {/* Input */}
      {gameState.status === "playing" && gameState.currentPlayer === playerNumber && (
        <Box sx={{ pb: 2 }}>
          {gameState.error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }} onClose={() => setGameState(s => s ? { ...s, error: undefined } : null)}>
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
                if (gameState?.error) setGameState(s => s ? { ...s, error: undefined } : null);
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

      {/* Waiting for opponent */}
      {gameState.status === "playing" && gameState.currentPlayer !== playerNumber && (
        <Box sx={{ pb: 2, textAlign: "center" }}>
          <Typography variant="body1" color="text.secondary">
            Waiting for Player {gameState.currentPlayer} to make a move...
          </Typography>
        </Box>
      )}
    </Container>
  );
}