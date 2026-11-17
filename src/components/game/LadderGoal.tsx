"use client";

import { Box, Paper, Typography } from "@mui/material";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";

interface LadderGoalProps {
  start: string;
  target: string;
  par: number;
}

function TileRow({ word, goal = false }: { word: string; goal?: boolean }) {
  return (
    <Box sx={{ display: "flex", gap: 0.25 }}>
      {word.split("").map((char, i) => (
        <Paper
          key={i}
          elevation={2}
          sx={{
            width: { xs: "1.5rem", sm: "2.125rem" }, height: { xs: "1.875rem", sm: "2.625rem" },
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: { xs: "1.05rem", sm: "1.35rem" }, fontWeight: 700, borderRadius: 1,
            bgcolor: goal ? "primary.main" : "white",
            color: goal ? "white" : "text.primary",
            border: goal ? "none" : "1px solid", borderColor: "divider",
            flexShrink: 0,
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
    <Box
      sx={{
        px: 0.5, mb: 3, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 1,
        maxWidth: "100%",
      }}
    >
      <Box sx={{ textAlign: "center" }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
          Start
        </Typography>
        <TileRow word={start} />
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", px: 0.5 }}>
        <ArrowRightIcon color="primary" sx={{ fontSize: { xs: "1.375rem", sm: "2rem" } }} />
        <Typography variant="caption" sx={{ fontWeight: 700, fontSize: { xs: "0.7rem", sm: "0.75rem" } }}>
          Par {par}
        </Typography>
      </Box>

      <Box sx={{ textAlign: "center" }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
          Target
        </Typography>
        <TileRow word={target} goal />
      </Box>
    </Box>
  );
}
