"use client";

import { Button, Container, Typography } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";

interface GameOverScreenProps {
  winnerName: string;
  loserName: string;
  /** How the game ended; falls back to the no-moves copy when unknown. */
  reason: "timeout" | "no_moves" | null;
  totalWords: number;
  onPlayAgain: () => void;
  playAgainDisabled?: boolean;
}

export default function GameOverScreen({
  winnerName,
  loserName,
  reason,
  totalWords,
  onPlayAgain,
  playAgainDisabled,
}: GameOverScreenProps) {
  return (
    <Container maxWidth="sm" sx={{ py: 10, textAlign: "center" }}>
      <Typography variant="h1" gutterBottom color="secondary">
        Replacle
      </Typography>
      <Typography variant="h2" gutterBottom color="success.main" sx={{ mt: 2 }}>
        🎉 {winnerName} Wins!
      </Typography>
      <Typography variant="body1" sx={{ mb: 2, color: "text.secondary" }}>
        {reason === "timeout"
          ? `${loserName} ran out of time!`
          : `No valid moves left for ${loserName}.`}
      </Typography>
      <Typography variant="body2" sx={{ mb: 4, color: "text.secondary" }}>
        Total words played: {totalWords}
      </Typography>
      <Button
        variant="outlined"
        size="large"
        onClick={onPlayAgain}
        startIcon={<RefreshIcon />}
        color="secondary"
        disabled={playAgainDisabled}
      >
        Play Again
      </Button>
    </Container>
  );
}
