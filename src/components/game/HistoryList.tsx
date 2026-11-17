"use client";

import { useEffect, useRef } from "react";
import { Box, Chip, Typography, Fade } from "@mui/material";
import HistoryIcon from "@mui/icons-material/History";

/**
 * The played-words feed. role="log" announces moves streamed in from the
 * opponent; tabIndex lets keyboard users scroll a long game.
 */
export default function HistoryList({ history }: { history: string[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  return (
    <Box sx={{ flexGrow: 1, overflow: "hidden", display: "flex", flexDirection: "column", mb: 3, minHeight: 0 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, flexShrink: 0 }}>
        <HistoryIcon fontSize="small" color="disabled" />
        <Typography variant="body2" color="text.secondary">Game History</Typography>
      </Box>
      <Box
        ref={scrollRef}
        role="log"
        aria-label="Move history"
        tabIndex={0}
        sx={{
          flexGrow: 1, overflowY: "auto", pr: 1,
          display: "flex", flexDirection: "column", gap: 1,
          minHeight: 0,
        }}
      >
        {history.map((word, i) => (
          <Fade in key={i}>
            <Box sx={{ display: "flex", justifyContent: i % 2 === 0 ? "flex-start" : "flex-end" }}>
              <Chip
                label={word.toUpperCase()}
                variant={i === history.length - 1 ? "filled" : "outlined"}
                color={i % 2 === 0 ? "primary" : "secondary"}
                sx={{ fontSize: "1.1rem", height: 36, fontWeight: 600 }}
              />
            </Box>
          </Fade>
        ))}
      </Box>
    </Box>
  );
}
