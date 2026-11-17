"use client";

import React, { Suspense, useEffect, useState } from "react";
import { Chip, IconButton, Typography } from "@mui/material";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import GamePageContainer from "@/components/game/GamePageContainer";
import GameHeader from "@/components/game/GameHeader";
import HistoryList from "@/components/game/HistoryList";
import WordInput from "@/components/game/WordInput";
import SoloWinScreen from "@/components/game/SoloWinScreen";
import LadderGoal from "@/components/game/LadderGoal";
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

  const { status, puzzle, history, error, play, newGame, reset, clearError } = useSoloGame(
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

  const moves = history.length - 1;

  return (
    <GamePageContainer>
      <GameHeader onNewGame={newGame} />

      <LadderGoal start={puzzle.start} target={puzzle.target} par={puzzle.par} />

      <HistoryList
        history={history}
        layout="linear"
        headerAction={
          <>
            <Chip label={`Moves: ${moves}`} size="small" variant="outlined" color="primary" />
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
