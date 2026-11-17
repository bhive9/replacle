"use client";

import React, { Suspense, useEffect, useState } from "react";
import { Box, Chip, Paper, Typography } from "@mui/material";
import GamePageContainer from "@/components/game/GamePageContainer";
import GameHeader from "@/components/game/GameHeader";
import WordDisplay from "@/components/game/WordDisplay";
import HistoryList from "@/components/game/HistoryList";
import WordInput from "@/components/game/WordInput";
import SoloWinScreen from "@/components/game/SoloWinScreen";
import { useSoloGame } from "@/hooks/useSoloGame";

function SoloGameInner() {
  const [dictionary, setDictionary] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [input, setInput] = useState("");

  // Same static, immutable-cached word list the other modes use.
  useEffect(() => {
    fetch("/data/dictionary-4.txt")
      .then((res) => res.text())
      .then((text) => {
        setDictionary(new Set(text.split("\n").filter(Boolean)));
      })
      .catch((err) => console.error("Failed to load dictionary", err))
      .finally(() => setIsLoading(false));
  }, []);

  const { status, puzzle, history, error, play, newGame, clearError } = useSoloGame(
    !isLoading && dictionary.size > 0,
    dictionary
  );

  const submit = () => {
    play(input);
    setInput("");
  };

  if (status === "won" && puzzle) {
    return (
      <SoloWinScreen
        moves={history.length - 1}
        par={puzzle.par}
        target={puzzle.target}
        onPlayAgain={newGame}
      />
    );
  }

  if (isLoading || !puzzle) {
    return (
      <GamePageContainer>
        <Typography variant="h3" color="secondary" sx={{ textAlign: "center", pt: 10 }}>
          Shuffling a puzzle...
        </Typography>
      </GamePageContainer>
    );
  }

  const currentWord = history[history.length - 1];
  const moves = history.length - 1;

  return (
    <GamePageContainer>
      <GameHeader onNewGame={newGame} />

      {/* Puzzle: start → target */}
      <Paper
        elevation={0}
        sx={{
          p: 2, mb: 3, borderRadius: 4, flexShrink: 0,
          border: 1, borderColor: "divider",
          display: "flex", justifyContent: "space-between", alignItems: "center", px: 3,
        }}
      >
        <Box sx={{ textAlign: "left" }}>
          <Typography variant="caption" color="text.secondary">Start</Typography>
          <Typography variant="h3" sx={{ fontWeight: 700 }}>{puzzle.start.toUpperCase()}</Typography>
        </Box>
        <Typography variant="h3" color="primary.main">→</Typography>
        <Box sx={{ textAlign: "right" }}>
          <Typography variant="caption" color="text.secondary">Target</Typography>
          <Typography variant="h3" sx={{ fontWeight: 700 }}>{puzzle.target.toUpperCase()}</Typography>
        </Box>
      </Paper>

      {/* Progress */}
      <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 2, flexShrink: 0 }}>
        <Chip label={`Moves: ${moves}`} variant="outlined" color="primary" />
        <Chip label={`Par: ${puzzle.par}`} variant="outlined" color="secondary" />
      </Box>

      <WordDisplay word={currentWord} />

      <HistoryList history={history} />

      <WordInput
        value={input}
        onChange={setInput}
        onSubmit={submit}
        error={error}
        onClearError={clearError}
      />
    </GamePageContainer>
  );
}

export default function SoloGame() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SoloGameInner />
    </Suspense>
  );
}
