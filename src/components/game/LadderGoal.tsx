"use client";

import { Box, Chip, Paper, Typography } from "@mui/material";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";

interface LadderGoalProps {
  start: string;
  target: string;
  par: number;
}

function TileRow({ word, goal = false }: { word: string; goal?: boolean }) {
  return (
    <Box sx={{ display: "flex", gap: 0.5 }}>
      {word.split("").map((char, i) => (
        <Paper
          key={i}
          elevation={2}
          sx={{
            width: 34, height: 42,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.35rem", fontWeight: 700, borderRadius: 1.5,
            bgcolor: goal ? "primary.main" : "white",
            color: goal ? "white" : "text.primary",
            border: goal ? "none" : "1px solid", borderColor: "divider",
          }}
        >
          {char.toUpperCase()}
        </Paper>
      ))}
    </Box>
  );
}

/**
 * The solo puzzle goal: start tiles → connector with par → target tiles.
 * Target tiles are filled so the destination reads at a glance.
 */
export default function LadderGoal({ start, target, par }: LadderGoalProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2, mb: 3, borderRadius: 4, flexShrink: 0,
        border: 1, borderColor: "divider",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 2,
      }}
    >
      <Box sx={{ textAlign: "center" }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
          Start
        </Typography>
        <TileRow word={start} />
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", px: 0.5 }}>
        <ArrowRightIcon color="primary" sx={{ fontSize: 32 }} />
        <Chip label={`Par ${par}`} size="small" variant="outlined" color="secondary" />
      </Box>

      <Box sx={{ textAlign: "center" }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
          Target
        </Typography>
        <TileRow word={target} goal />
      </Box>
    </Paper>
  );
}
