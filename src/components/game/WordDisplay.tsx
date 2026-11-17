"use client";

import { Box, Paper, Typography } from "@mui/material";

export default function WordDisplay({ word, compact = false }: { word: string; compact?: boolean }) {
  const tile = compact
    ? { width: "2.75rem", height: "3.375rem", fontSize: "2rem" }
    : { width: "3.75rem", height: "4.375rem", fontSize: "2.5rem" };
  return (
    <Box
      sx={{
        textAlign: "center", mb: 4, py: 4,
        border: "2px dashed", borderColor: "primary.main", borderRadius: 4, flexShrink: 0,
      }}
    >
      <Typography variant="caption" sx={{ letterSpacing: 2 }}>Current word</Typography>
      <Box sx={{ display: "flex", justifyContent: "center", gap: 1, mt: 1 }}>
        {word.split("").map((char, i) => (
          <Paper
            key={i}
            elevation={2}
            sx={{
              width: tile.width, height: tile.height, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: tile.fontSize, fontWeight: "bold", bgcolor: "white", borderRadius: 2,
            }}
          >
            {char.toUpperCase()}
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
