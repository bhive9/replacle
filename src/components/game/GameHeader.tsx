"use client";

import { Box, IconButton, Typography } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";

interface GameHeaderProps {
  onNewGame: () => void;
  newGameDisabled?: boolean;
}

export default function GameHeader({ onNewGame, newGameDisabled }: GameHeaderProps) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexShrink: 0 }}>
      {/* h3 sizing keeps the compact game header; h1 keeps the page outline sane. */}
      <Typography variant="h3" component="h1" color="secondary" sx={{ m: 0 }}>
        Replacle
      </Typography>
      <IconButton
        onClick={onNewGame}
        title="New Game"
        aria-label="New game"
        disabled={newGameDisabled}
        sx={{ width: "2.75rem", height: "2.75rem" }}
      >
        <RefreshIcon />
      </IconButton>
    </Box>
  );
}
