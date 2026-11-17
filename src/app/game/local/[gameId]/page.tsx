"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, Paper, Typography } from "@mui/material";
import { isOneLetterDifferent, checkGameOver, TURN_TIME_LIMIT } from "@/lib/game-logic";
import TurnCountdown from "@/components/TurnCountdown";
import GamePageContainer from "@/components/game/GamePageContainer";
import GameHeader from "@/components/game/GameHeader";
import WordDisplay from "@/components/game/WordDisplay";
import HistoryList from "@/components/game/HistoryList";
import WordInput from "@/components/game/WordInput";
import GameOverScreen from "@/components/game/GameOverScreen";

import { GameState } from "@/lib/game-state";


function LocalGameInner() {
  const { gameId } = useParams();
  const router = useRouter();
  
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [input, setInput] = useState("");
  const [dictionary, setDictionary] = useState<Set<string>>(new Set());
  const [startingWords, setStartingWords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const startedRef = useRef(false);

  // Load dictionary and starting words
  useEffect(() => {
    async function loadData() {
      try {
        const [dictRes, startRes] = await Promise.all([
          fetch("/data/dictionary-4.txt"),
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

  // Save game state to API
  const saveGameState = useCallback(async (newState: GameState) => {
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
    
    const newState: GameState = {
      ...gameState,
      history: [randomWord],
      currentPlayer: 1,
      status: "playing",
      winner: null,
      error: null,
      turnStartTime: now,
      timeRemaining: TURN_TIME_LIMIT,
      endReason: null,
    };
    
    setGameState(newState);
    setInput("");
    saveGameState(newState);
  }, [gameState, startingWords, saveGameState]);

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
        } else {
          const text = await res.text();
          console.error("Failed to load game:", res.status, text);
          throw new Error(`Failed to load game: ${res.status} ${text}`);
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
    // eslint-disable-next-line
    startNewGame();
  }, [gameState?.status, startingWords.length, gameState, startNewGame]);

  const turnStartTime = gameState?.turnStartTime ?? null;

  // Serverless-free timeout: the countdown component calls back once at zero.
  const handleTimeout = useCallback(() => {
    setGameState(s => {
      if (!s || s.status !== "playing") return s;
      return {
        ...s,
        status: "game_over",
        winner: s.currentPlayer === 1 ? 2 : 1,
        timeRemaining: 0,
        endReason: "timeout",
      };
    });
  }, []);

  const handleMove = useCallback(() => {
    if (!gameState || !input.trim()) return;

    const word = input.trim().toLowerCase();
    const lastWord = gameState.history[gameState.history.length - 1];
    const fail = (message: string) => {
      setGameState(s => (s ? { ...s, error: message } : s));
    };

    if (word.length !== 4) {
      fail("Word must be 4 letters long!");
      return;
    }
    if (gameState.history.includes(word)) {
      fail("Word already used!");
      return;
    }
    if (!dictionary.has(word)) {
      fail("That's not in my dictionary!");
      return;
    }
    if (!isOneLetterDifferent(lastWord, word)) {
      fail("Must change exactly one letter!");
      return;
    }

    const newHistory = [...gameState.history, word];
    const gameOver = checkGameOver(word, dictionary, newHistory);
    const now = Date.now();

    const newState: GameState = {
      ...gameState,
      history: newHistory,
      currentPlayer: gameState.currentPlayer === 1 ? 2 : 1,
      status: gameOver ? "game_over" : "playing",
      winner: gameOver ? gameState.currentPlayer : null,
      error: null,
      turnStartTime: gameOver ? null : now,
      timeRemaining: gameOver ? 0 : TURN_TIME_LIMIT,
      endReason: gameOver ? "no_moves" : null,
    };

    setGameState(newState);
    setInput("");
    saveGameState(newState);
  }, [gameState, input, dictionary, saveGameState]);

  if (isLoading) {
    return (
      <GamePageContainer>
        <Typography variant="h3" color="secondary">Loading...</Typography>
      </GamePageContainer>
    );
  }

  if (!gameState) {
    return (
      <GamePageContainer>
        <Typography variant="h3" color="secondary">Game not found</Typography>
      </GamePageContainer>
    );
  }

  if (gameState.status === "game_over") {
    const winnerName = gameState.winner === 1 ? gameState.player1Name : gameState.player2Name;
    const loserName = gameState.winner === 1 ? gameState.player2Name : gameState.player1Name;

    return (
      <GameOverScreen
        winnerName={winnerName}
        loserName={loserName}
        reason={gameState.endReason ?? null}
        totalWords={gameState.history.length}
        onPlayAgain={startNewGame}
      />
    );
  }

  if (gameState.status === "setup" || !gameState.history?.length) {
    return (
      <GamePageContainer>
        <Typography variant="h3" color="secondary">Starting Game...</Typography>
      </GamePageContainer>
    );
  }

  const currentWord = gameState.history[gameState.history.length - 1] ?? "";
  const currentPlayerName = gameState.currentPlayer === 1 ? gameState.player1Name : gameState.player2Name;

  return (
    <GamePageContainer>
      <GameHeader onNewGame={startNewGame} />

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
          flexShrink: 0,
        }}
      >
        <Typography variant="h2" sx={{ m: 0, color: "inherit" }}>
          {currentPlayerName}&apos;s Turn
        </Typography>
        <Typography variant="h3" sx={{ m: 0, color: "inherit", fontWeight: 700 }}>
          <TurnCountdown
            key={turnStartTime ?? "no-turn"}
            turnStartTime={turnStartTime}
            onTimeout={handleTimeout}
          />
        </Typography>
      </Paper>

      <WordDisplay word={currentWord} />

      <HistoryList history={gameState.history} />

      <WordInput
        value={input}
        onChange={setInput}
        onSubmit={handleMove}
        error={gameState.error}
        onClearError={() => setGameState(s => (s ? { ...s, error: null } : s))}
      />
    </GamePageContainer>
  );
}

export default function LocalGame() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LocalGameInner />
    </Suspense>
  );
}
