"use client";

import { ThemeProvider, CssBaseline } from "@mui/material";
import { doodleTheme } from "@/theme";

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={doodleTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}