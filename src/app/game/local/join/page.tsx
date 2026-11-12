"use client";

import React, { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Typography,
  Button,
  Box,
  Paper,
  OutlinedInput,
  InputLabel,
  FormControl,
} from "@mui/material";

function NameInput({
  label,
  value,
  onChange,
  color,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  color: "primary" | "secondary";
}) {
  return (
    <FormControl
      fullWidth
      variant="outlined"
      sx={{
        "& .MuiOutlinedInput-root": {
          "&.Mui-focused fieldset": {
            borderColor: `${color}.main`,
          },
        },
      }}
    >
      <InputLabel
        sx={{
          "&.Mui-focused": {
            color: `${color}.main`,
          },
        }}
      >
        {label}
      </InputLabel>
      <OutlinedInput
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputProps={{ maxLength: 20, style: { textAlign: "center" } }}
      />
    </FormControl>
  );
}

export default function LocalGameJoin() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LocalGameJoinInner />
    </Suspense>
  );
}

function LocalGameJoinInner() {
  const router = useRouter();
  const [player1Name, setPlayer1Name] = useState("");
  const [player2Name, setPlayer2Name] = useState("");
  const [isStarting, setIsStarting] = useState(false);

  const handleStart = async () => {
    if (!player1Name.trim() || !player2Name.trim()) return;
    setIsStarting(true);

    try {
      const res = await fetch("/api/local/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player1Name: player1Name.trim(),
          player2Name: player2Name.trim(),
        }),
      });

      if (res.ok) {
        const { gameId } = await res.json();
        router.push(`/game/local/${gameId}`);
      } else {
        console.error("Failed to start game");
      }
    } catch (err) {
      console.error("Error starting game", err);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4, textAlign: "center" }}>
      <Typography variant="h1" gutterBottom color="secondary">
        Replacle
      </Typography>
      <Typography variant="h2" gutterBottom sx={{ mb: 3 }}>
        Local Game
      </Typography>

      <Paper elevation={0} sx={{ p: 4, textAlign: "left", mb: 3, border: 1, borderColor: "divider" }}>
        <Typography variant="h3" gutterBottom sx={{ textAlign: "center", mb: 3 }}>
          Enter Player Names
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <NameInput
            label="Player 1 Name"
            value={player1Name}
            onChange={setPlayer1Name}
            color="primary"
          />
          <NameInput
            label="Player 2 Name"
            value={player2Name}
            onChange={setPlayer2Name}
            color="secondary"
          />
        </Box>

        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Button
            variant="contained"
            size="large"
            color="secondary"
            fullWidth
            onClick={handleStart}
            disabled={isStarting || !player1Name.trim() || !player2Name.trim()}
          >
            {isStarting ? "Starting..." : "Start Game"}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}