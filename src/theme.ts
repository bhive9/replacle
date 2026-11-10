import { createTheme, Shadows } from "@mui/material/styles";

const tokens = {
  primary: "#49B6E5",
  secondary: "#263D5B",
  success: "#16A34A",
  warning: "#D97706",
  danger: "#DC2626",
  surface: "#FFFFFF",
  text: "#111827",
  shadow: "0 4px 14px rgba(38, 61, 91, 0.18)",
  shadowHover: "0 8px 22px rgba(38, 61, 91, 0.28)",
};

const customShadows = Array(25).fill(tokens.shadow) as Shadows;
customShadows[0] = "none";
customShadows[1] = tokens.shadow;
customShadows[2] = tokens.shadowHover;

export const doodleTheme = createTheme({
  palette: {
    primary: { main: tokens.primary, contrastText: "#FFFFFF" },
    secondary: { main: tokens.secondary, contrastText: "#FFFFFF" },
    success: { main: tokens.success },
    warning: { main: tokens.warning },
    error: { main: tokens.danger },
    background: { default: "#F4F6FA", paper: tokens.surface },
    text: { primary: tokens.text, secondary: "#5A6478" },
  },
  typography: {
    fontFamily: [
      'Montserrat',
      'system-ui',
      'sans-serif',
    ].join(','),
    h1: { fontWeight: 700, fontSize: "2.5rem", lineHeight: 1.15 },
    h2: { fontWeight: 700, fontSize: "2rem", lineHeight: 1.2 },
    h3: { fontWeight: 600, fontSize: "1.5rem", lineHeight: 1.25 },
    body1: { fontSize: "1rem", lineHeight: 1.6 },
    body2: { fontSize: "0.875rem", lineHeight: 1.55 },
    button: { fontWeight: 700, textTransform: "none" },
  },
  shape: { borderRadius: 14 },
  shadows: customShadows,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          paddingInline: "1.25rem",
          minHeight: 44,
          boxShadow: tokens.shadow,
          "&:hover": { boxShadow: tokens.shadowHover },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: tokens.shadow,
          border: "1px solid rgba(73, 182, 229, 0.18)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 600,
        },
      },
    },
  },
});