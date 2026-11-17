"use client";

import { Alert, Box, Button, OutlinedInput } from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";

interface WordInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  /** True while the player cannot act (not their turn, busy, etc.). */
  disabled?: boolean;
  error?: string | null;
  onClearError?: () => void;
}

export default function WordInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  error,
  onClearError,
}: WordInputProps) {
  return (
    <Box sx={{ pb: 2, flexShrink: 0 }}>
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: 3 }}
          onClose={onClearError}
        >
          {error}
        </Alert>
      )}
      <Box sx={{ display: "flex", gap: 2 }}>
        <OutlinedInput
          fullWidth
          placeholder="Type next word..."
          aria-label="Your word"
          value={value}
          onChange={(e) => {
            onChange(e.target.value.slice(0, 4).toUpperCase());
            if (error) onClearError?.();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !disabled && value.trim()) onSubmit();
          }}
          autoFocus
          disabled={disabled}
          sx={{
            borderRadius: 3,
            bgcolor: disabled ? "grey.100" : "white",
            height: 52,
            fontSize: "1.25rem",
            letterSpacing: 2,
            textTransform: "uppercase",
            "& .MuiOutlinedInput-notchedOutline": {
              borderWidth: 2,
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderWidth: 2,
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderWidth: 3,
            },
          }}
          inputProps={{ maxLength: 4, style: { textAlign: "center" } }}
        />
        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={disabled || !value.trim()}
          sx={{
            height: 52,
            minWidth: 52,
            borderRadius: 3,
            padding: 0,
            boxShadow: 3,
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            "&:hover:not(:disabled)": {
              transform: "scale(1.05)",
              boxShadow: 4,
            },
            "&:active:not(:disabled)": {
              transform: "scale(0.98)",
            },
            "&:disabled": {
              opacity: 0.4,
            },
          }}
          aria-label="Submit word"
        >
          <ArrowUpwardIcon fontSize="large" />
        </Button>
      </Box>
    </Box>
  );
}
