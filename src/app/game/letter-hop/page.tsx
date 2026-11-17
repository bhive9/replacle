"use client";

import React, { Suspense, useEffect, useState } from "react";
import { Box, Chip, IconButton, Typography } from "@mui/material";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import GamePageContainer from "@/components/game/GamePageContainer";
import GameHeader from "@/components/game/GameHeader";
import HistoryList from "@/components/game/HistoryList";
import WordInput from "@/components/game/WordInput";
import SoloWinScreen from "@/components/game/SoloWinScreen";
import LadderGoal from "@/components/game/LadderGoal";
import { useSoloGame } from "@/hooks/useSoloGame";
import { SoloDifficulty } from "@/lib/solo-game";

const DIFFICULTIES: SoloDifficulty[] = ["easy", "medium", "hard"];

function SoloGameInner() {
  const [dictionary, setDictionary] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [input, setInput] = useState("");
  const [difficulty, setDifficulty] = useState<SoloDifficulty>("medium");

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

  const { status, puzzle, history, error, hintsUsed, play, newGame, hint, reset, clearError } =
    useSoloGame(!isLoading && dictionary.size > 0, dictionary);

  const submit = () => {
    play(input);
    setInput("");
  };

  const pickDifficulty = (d: SoloDifficulty) => {
    setDifficulty(d);
    newGame(d);
  };

  if (status === "won" && puzzle) {
    return (
      <SoloWinScreen
        moves={history.length - 1}
        par={puzzle.par}
        target={puzzle.target}
        hintsUsed={hintsUsed}
        onPlayAgain={() => newGame(difficulty)}
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

  const moves = history.length - 1;

  return (
    <GamePageContainer>
      <GameHeader onNewGame={() => newGame(difficulty)} />

      <Box sx={{ display: "flex", justifyContent: "center", gap: 1, mb: 3, flexShrink: 0 }}>
        {DIFFICULTIES.map((d) => (
          <Chip
            key={d}
            label={d.charAt(0).toUpperCase() + d.slice(1)}
            onClick={() => pickDifficulty(d)}
            variant={difficulty === d ? "filled" : "outlined"}
            color={difficulty === d ? "primary" : "default"}
            aria-pressed={difficulty === d}
          />
        ))}
      </Box>

      <LadderGoal start={puzzle.start} target={puzzle.target} par={puzzle.par} />

      <HistoryList
        history={history}
        layout="linear"
        headerAction={
          <>
            <Chip label={`Moves: ${moves}`} size="small" variant="outlined" color="primary" />
            <IconButton
              onClick={hint}
              title="Hint: reveal the next word"
              aria-label="Hint: reveal the next word"
              size="small"
            >
              <LightbulbIcon />
            </IconButton>
            <IconButton
              onClick={reset}
              title="Reset puzzle"
              aria-label="Reset puzzle"
              disabled={moves === 0}
              size="small"
            >
              <RestartAltIcon />
            </IconButton>
          </>
        }
      />

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
