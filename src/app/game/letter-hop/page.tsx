"use client";

import React, { Suspense, useEffect, useState } from "react";
import { Badge, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Skeleton, Typography } from "@mui/material";
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
const DIFFICULTY_KEY = "replacle:solo-difficulty";

/** Standard visually-hidden style (rem-based, no raw pixels). */
const visuallyHidden = {
  position: "absolute",
  width: "0.0625rem",
  height: "0.0625rem",
  margin: "-0.0625rem",
  padding: 0,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
} as const;

/** Loading placeholder shaped like the ladder goal tiles. */
function PuzzleSkeleton() {
  return (
    <Box role="status" sx={{ px: 0.5, mb: 3, flexShrink: 0, display: "flex", flexDirection: "column", gap: 1, alignItems: "center" }}>
      <Box sx={{ display: "flex", gap: 0.25 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} data-testid="skeleton-tile" variant="rectangular" sx={{ width: "1.5rem", height: "1.875rem", borderRadius: 1 }} />
        ))}
      </Box>
      <Box sx={{ display: "flex", gap: 0.25 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} data-testid="skeleton-tile" variant="rectangular" sx={{ width: "1.5rem", height: "1.875rem", borderRadius: 1 }} />
        ))}
      </Box>
      <Typography variant="caption" color="text.secondary" sx={visuallyHidden}>
        Shuffling a puzzle...
      </Typography>
    </Box>
  );
}

function SoloGameInner() {
  const [dictionary, setDictionary] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [input, setInput] = useState("");
  const [difficulty, setDifficulty] = useState<SoloDifficulty>("medium");
  const [difficultySynced, setDifficultySynced] = useState(false);
  const [pendingDifficulty, setPendingDifficulty] = useState<SoloDifficulty | null>(null);

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

  // Pick up the saved difficulty preference during the first client render
  // (React's "adjust state when props change" pattern — no effect, and the
  // server render stays on "medium" so hydration matches).
  if (!difficultySynced && typeof window !== "undefined") {
    setDifficultySynced(true);
    const saved = localStorage.getItem(DIFFICULTY_KEY);
    if (saved === "easy" || saved === "medium" || saved === "hard") setDifficulty(saved);
  }

  const { status, puzzle, history, error, hintsUsed, lastRewind, play, newGame, hint, reset, clearError } =
    useSoloGame(!isLoading && dictionary.size > 0, dictionary, difficulty);

  const submit = () => {
    play(input);
    setInput("");
  };

  const moves = history.length - 1;

  const applyDifficulty = (d: SoloDifficulty) => {
    setDifficulty(d);
    localStorage.setItem(DIFFICULTY_KEY, d);
    newGame(d);
    setPendingDifficulty(null);
  };

  const pickDifficulty = (d: SoloDifficulty) => {
    if (moves === 0) applyDifficulty(d);
    else setPendingDifficulty(d);
  };

  if (status === "won" && puzzle) {
    return (
      <SoloWinScreen
        moves={moves}
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
        <GameHeader onNewGame={() => newGame(difficulty)} />
        <PuzzleSkeleton />
      </GamePageContainer>
    );
  }

  return (
    <GamePageContainer>
      <GameHeader onNewGame={() => newGame(difficulty)} />

      <Box
        role="group"
        aria-label="Difficulty"
        sx={{ display: "flex", justifyContent: "center", gap: 1, mb: 3, flexShrink: 0 }}
      >
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
              sx={{ width: "2.75rem", height: "2.75rem" }}
            >
              {hintsUsed > 0 ? (
                <Badge badgeContent={hintsUsed} color="primary">
                  <LightbulbIcon />
                </Badge>
              ) : (
                <LightbulbIcon />
              )}
            </IconButton>
            <IconButton
              onClick={reset}
              title="Reset puzzle"
              aria-label="Reset puzzle"
              disabled={moves === 0}
              sx={{ width: "2.75rem", height: "2.75rem" }}
            >
              <RestartAltIcon />
            </IconButton>
          </>
        }
      />

      {/* Announces rewinds to screen readers (role="log" only reports additions). */}
      <Box role="status" sx={visuallyHidden}>
        {lastRewind
          ? `Back to ${lastRewind.word.toUpperCase()}. ${lastRewind.discarded} ${lastRewind.discarded === 1 ? "move" : "moves"} discarded.`
          : ""}
      </Box>

      <WordInput
        value={input}
        onChange={setInput}
        onSubmit={submit}
        error={error}
        onClearError={clearError}
      />

      <Dialog
        open={pendingDifficulty !== null}
        onClose={() => setPendingDifficulty(null)}
        aria-labelledby="difficulty-dialog-title"
      >
        <DialogTitle id="difficulty-dialog-title">Start over?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Switching to{" "}
            {pendingDifficulty ? pendingDifficulty.charAt(0).toUpperCase() + pendingDifficulty.slice(1) : ""}{" "}
            starts a fresh puzzle — your current ladder will be discarded.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingDifficulty(null)}>Cancel</Button>
          <Button onClick={() => pendingDifficulty && applyDifficulty(pendingDifficulty)} autoFocus>
            Start over
          </Button>
        </DialogActions>
      </Dialog>
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
