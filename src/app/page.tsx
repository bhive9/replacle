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
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import RefreshIcon from "@mui/icons-material/Refresh";
import { GameState, INITIAL_STATE, isOneLetterDifferent, checkGameOver, TURN_TIME_LIMIT } from "@/lib/game-logic";

export default function ReplacleGame() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [input, setInput] = useState("");
  const [dictionary, setDictionary] = useState<Set<string>>(new Set());
  const [startingWords, setStartingWords] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const turnStartRef = useRef<number | null>(null);

  // Timer countdown effect
  useEffect(() => {
    if (gameState.status !== "playing" || gameState.turnStartTime === null) {
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
        if (s.status !== "playing") return s;
        if (remaining <= 0) {
          // Time's up - current player loses
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
  }, [gameState.status, gameState.turnStartTime]);

  // Load word lists
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

  const startGame = useCallback(() => {
    if (startingWords.length === 0) return;
    const randomWord = startingWords[Math.floor(Math.random() * startingWords.length)];
    const now = Date.now();
    setGameState({
      history: [randomWord],
      currentPlayer: 1,
      status: "playing",
      winner: null,
      error: null,
      turnStartTime: now,
      timeRemaining: TURN_TIME_LIMIT,
    });
    setInput("");
    turnStartRef.current = now;
  }, [startingWords]);

  const handleMove = () => {
    const word = input.trim().toLowerCase();
    const lastWord = gameState.history[gameState.history.length - 1];

    // Validation
    if (word.length !== 4) {
      setGameState(s => ({ ...s, error: "Word must be 4 letters long!" }));
      return;
    }
    if (gameState.history.includes(word)) {
      setGameState(s => ({ ...s, error: "Word already used!" }));
      return;
    }
    if (!dictionary.has(word)) {
      setGameState(s => ({ ...s, error: "That's not in my dictionary!" }));
      return;
    }
    if (!isOneLetterDifferent(lastWord, word)) {
      setGameState(s => ({ ...s, error: "Must change exactly one letter!" }));
      return;
    }

    // Valid move - check if game is over (next player has no moves)
    const newHistory = [...gameState.history, word];
    const gameOver = checkGameOver(word, dictionary, newHistory);
    
    setGameState(s => ({
      ...s,
      history: newHistory,
      currentPlayer: s.currentPlayer === 1 ? 2 : 1,
      status: gameOver ? "game_over" : "playing",
      winner: gameOver ? s.currentPlayer : null,
      error: null,
      turnStartTime: gameOver ? null : Date.now(),
      timeRemaining: gameOver ? 0 : TURN_TIME_LIMIT,
    }));
    setInput("");
    if (!gameOver) {
      turnStartRef.current = Date.now();
    }
  };

  // Auto-scroll history
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [gameState.history]);

  if (gameState.status === "game_over") {
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
          onClick={startGame}
          startIcon={<RefreshIcon />}
          color="secondary"
        >
          Play Again
        </Button>
      </Container>
    );
  }

  if (gameState.status === "setup") {
    return (
      <Container maxWidth="sm" sx={{ py: 10, textAlign: "center" }}>
        <Typography variant="h1" gutterBottom color="secondary">
          Replacle
        </Typography>
        <Typography variant="body1" sx={{ mb: 4, color: "text.secondary" }}>
          The 2-player word replacement game. Change one letter, make a word, don't repeat.
        </Typography>
        <Button 
          variant="contained"
          size="large" 
          onClick={startGame}
          disabled={startingWords.length === 0}
          color="secondary"
        >
          {startingWords.length === 0 ? "Loading Dictionary..." : "Start Game"}
        </Button>
        <Box sx={{ mt: 2 }}>
          <Button 
            variant="outlined"
            size="large"
            href="/game/create"
            color="secondary"
          >
            Create Multiplayer Room
          </Button>
        </Box>
      </Container>
    );
  }

  const currentWord = gameState.history[gameState.history.length - 1];

  return (
    <Container maxWidth="sm" sx={{ py: 4, height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h3" color="secondary" sx={{ m: 0 }}>Replacle</Typography>
        <IconButton onClick={startGame} title="Reset Game">
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
          Player {gameState.currentPlayer}'s Turn
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
          <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }} onClose={() => setGameState(s => ({ ...s, error: null }))}>
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
              if (gameState.error) setGameState(s => ({ ...s, error: null }));
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
