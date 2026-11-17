"use client";

import { Button, Container, Typography } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";

interface SoloWinScreenProps {
  /** Ladder steps the player actually used (excluding the start word). */
  moves: number;
  /** Shortest possible ladder for this puzzle. */
  par: number;
  target: string;
  onPlayAgain: () => void;
}

export default function SoloWinScreen({ moves, par, target, onPlayAgain }: SoloWinScreenProps) {
  return (
    <Container maxWidth="sm" sx={{ py: 10, textAlign: "center" }}>
      <Typography variant="h1" gutterBottom color="secondary">
        Replacle
      </Typography>
      <Typography variant="h2" gutterBottom color="success.main" sx={{ mt: 2 }}>
        🎉 You made it to {target.toUpperCase()}!
      </Typography>
      <Typography variant="body1" sx={{ mb: 1, color: "text.secondary" }}>
        Solved in {moves} {moves === 1 ? "move" : "moves"} — par was {par}
      </Typography>
      {moves === par && (
        <Typography variant="body1" sx={{ mb: 2, color: "success.main", fontWeight: 700 }}>
          Perfect ladder!
        </Typography>
      )}
      <Typography variant="body2" sx={{ mb: 4, color: "text.secondary" }}>
        {moves <= par
          ? "You matched or beat the shortest possible ladder."
          : `A shorter ladder exists — ${par} moves.`}
      </Typography>
      <Button
        variant="outlined"
        size="large"
        onClick={onPlayAgain}
        startIcon={<RefreshIcon />}
        color="secondary"
      >
        New Puzzle
      </Button>
    </Container>
  );
}
