"use client";

import { Container } from "@mui/material";
import type { ReactNode } from "react";

/**
 * Fixed-viewport flex column shared by both game pages: the page itself never
 * scrolls, the history area scrolls internally, and the input stays on screen.
 */
export default function GamePageContainer({ children }: { children: ReactNode }) {
  return (
    <Container
      maxWidth="sm"
      sx={{ py: 4, height: "100dvh", overflow: "hidden", display: "flex", flexDirection: "column" }}
    >
      {children}
    </Container>
  );
}
