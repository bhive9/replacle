"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { isOneLetterDifferent, checkGameOver, TURN_TIME_LIMIT } from "@/lib/game-logic";

interface LocalGameState {
  id: string;
  player1Name: string;
  player2Name: string;
  history: string[];
  currentPlayer: 1 | 2;
  status: "setup" | "playing" | "game_over";
  winner: 1 | 2 | null;
  error: string | null;
  turnStartTime: number | null;
  timeRemaining: number;
}

function LocalGameInner() {
  const { gameId } = useParams();
  const router = useRouter();
  
  const [gameState, setGameState] = useState<LocalGameState | null>(null);
  const [input, setInput] = useState("");
  const [dictionary, setDictionary] = useState<Set<string>>(new Set());
  const [startingWords, setStartingWords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const turnStartRef = useRef<number | null>(null);
  const startedRef = useRef(false);

  // Load dictionary and starting words
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

  // Load game state
  useEffect(() => {
    async function loadGame() {
      if (!gameId) return;
      try {
        const res = await fetch(`/api/local/game/${gameId}`);
        if (res.ok) {
          const data = await res.json();
          setGameState(data.game);
        } else if (res.status === 404) {
          router.push("/");
        }
      } catch (err) {
        console.error("Failed to load game", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadGame();
  }, [gameId, router]);

  // Auto-start the game once state is loaded as setup and words are ready
  useEffect(() => {
    if (startedRef.current) return;
    if (!gameState || gameState.status !== "setup") return;
    if (startingWords.length === 0) return;

    startedRef.current = true;
    startNewGame();
  }, [gameState?.status, startingWords.length]);

  // Timer countdown effect
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (!gameState || gameState.status !== "playing" || !gameState.turnStartTime) {
      return;
    }

    turnStartRef.current = gameState.turnStartTime;

    const updateTimer = () => {
      if (!turnStartRef.current) return;
      
      const elapsed = Math.floor((Date.now() - turnStartRef.current) / 1000);
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

  // Save game state to API
  const saveGameState = useCallback(async (newState: LocalGameState) => {
    if (!gameId) return;
    try {
      await fetch(`/api/local/game/${gameId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newState),
      });
    } catch (err) {
      console.error("Failed to save game", err);
    }
  }, [gameId]);

  const startNewGame = useCallback(() => {
    if (!gameState || startingWords.length === 0) return;
    
    const randomWord = startingWords[Math.floor(Math.random() * startingWords.length)];
    const now = Date.now();
    
    const newState: LocalGameState = {
      ...gameState,
      history: [randomWord],
      currentPlayer: 1,
      status: "playing",
      winner: null,
      error: null,
      turnStartTime: now,
      timeRemaining: TURN_TIME_LIMIT,
    };
    
    setGameState(newState);
    setInput("");
    turnStartRef.current = now;
    saveGameState(newState);
  }, [gameState, startingWords, saveGameState]);

  const handleMove = useCallback(() => {
    if (!gameState || !input.trim()) return;

    const word = input.trim().toLowerCase();
    const lastWord = gameState.history[gameState.history.length - 1];

    if (word.length !== 4) {
      setGameState(s => s ? { ...s, error: "Word must be 4 letters long!" } : null);
      return;
    }
    if (gameState.history.includes(word)) {
      setGameState(s => s ? { ...s, error: "Word already used!" } : null);
      return;
    }
    if (!dictionary.has(word)) {
      setGameState(s => s ? { ...s, error: "That's not in my dictionary!" } : null);
      return;
    }
    if (!isOneLetterDifferent(lastWord, word)) {
      setGameState(s => s ? { ...s, error: "Must change exactly one letter!" } : null);
      return;
    }

    const newHistory = [...gameState.history, word];
    const gameOver = checkGameOver(word, dictionary, newHistory);
    const now = Date.now();

    const newState: LocalGameState = {
      ...gameState,
      history: newHistory,
      currentPlayer: gameState.currentPlayer === 1 ? 2 : 1,
      status: gameOver ? "game_over" : "playing",
      winner: gameOver ? gameState.currentPlayer : null,
      error: null,
      turnStartTime: gameOver ? null : now,
      timeRemaining: gameOver ? 0 : TURN_TIME_LIMIT,
    };

    setGameState(newState);
    setInput("");
    saveGameState(newState);
    if (!gameOver) {
      turnStartRef.current = now;
    }
  }, [gameState, input, dictionary, saveGameState]);

  // Auto-scroll history
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [gameState?.history]);

  if (isLoading) {
    return (
      <Container maxWidth="sm" sx={{ py: 10, textAlign: "center" }}>
        <Typography variant="h3" color="secondary">Loading...</Typography>
      </Container>
    );
  }

  if (!gameState) {
    return (
      <Container maxWidth="sm" sx={{ py: 10, textAlign: "center" }}>
        <Typography variant="h3" color="secondary">Game not found</Typography>
      </Container>
    );
  }

  if (gameState.status === "game_over") {
    const isTimeout = gameState.timeRemaining === 0;
    const winnerName = gameState.winner === 1 ? gameState.player1Name : gameState.player2Name;
    const loserName = gameState.winner === 1 ? gameState.player2Name : gameState.player1Name;
    
    return (
      <Container maxWidth="sm" sx={{ py: 10, textAlign: "center" }}>
        <Typography variant="h1" gutterBottom color="secondary">
          Replacle
        </Typography>
        <Typography variant="h2" gutterBottom color="success.main" sx={{ mt: 2 }}>
          🎉 {winnerName} Wins!
        </Typography>
        <Typography variant="body1" sx={{ mb: 2, color: "text.secondary" }}>
          {isTimeout
            ? `${loserName} ran out of time!`
            : `No valid moves left for ${loserName}.`}
        </Typography>
        <Typography variant="body2" sx={{ mb: 4, color: "text.secondary" }}>
          Total words played: {gameState.history.length}
        </Typography>
        <Button
          variant="outlined"
          size="large"
          onClick={startNewGame}
          startIcon={<RefreshIcon />}
          color="secondary"
        >
          Play Again
        </Button>
      </Container>
    );
  }

  if (gameState.status === "setup" || !gameState.history?.length) {
    return (
      <Container maxWidth="sm" sx={{ py: 10, textAlign: "center" }}>
        <Typography variant="h3" color="secondary">Starting Game...</Typography>
      </Container>
    );
  }

  const currentWord = gameState.history[gameState.history.length - 1] ?? "";
  const currentPlayerName = gameState.currentPlayer === 1 ? gameState.player1Name : gameState.player2Name;

  return (
    <Container maxWidth="sm" sx={{ py: 4, height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h3" color="secondary" sx={{ m: 0 }}>Replacle</Typography>
        <IconButton onClick={startNewGame} title="New Game">
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Player Turn Indicator + Timer */}
      <Paper
        elevation={0}
        sx={{
          p: 2, mb: 3, borderRadius: 4,
          bgcolor: gameState.currentPlayer === 1 ? "primary.main" : "secondary.main",
          color: "white",
          transition: "all 0.3s ease",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 3,
        }}
      >
        <Typography variant="h3" sx={{ m: 0, color: "inherit" }}>
          {currentPlayerName}'s Turn
        </Typography>
        <Typography variant="h3" sx={{ m: 0, color: "inherit", fontWeight: 700 }}>
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

      {/* Input */}
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
            onKeyDown={(e) => e.key === "Enter" && handleMove()}
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
            onClick={handleMove}
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
    </Container>
  );
}

export default function LocalGame() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LocalGameInner />
    </Suspense>
  );
}