"use client";

import { Box, Paper, Typography } from "@mui/material";

export default function WordDisplay({ word }: { word: string }) {
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
              width: 60, height: 70, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "2.5rem", fontWeight: "bold", bgcolor: "white", borderRadius: 2,
            }}
          >
            {char.toUpperCase()}
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
