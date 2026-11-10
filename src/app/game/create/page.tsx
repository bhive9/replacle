"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Typography,
  Button,
  Box,
  TextField,
  Paper,
} from "@mui/material";

export default function CreateRoomPage() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState("Player1");

  const handleCreate = useCallback(async () => {
    // Navigate to a new room ID. In a real app, this would hit the API 
    // to create the room and return an ID. For now, simulate.
    const roomId = Math.random().toString(36).substring(7);
    router.push(`/game/${roomId}?name=${encodeURIComponent(playerName)}`);
  }, [playerName, router]);

  return (
    <Container maxWidth="sm" sx={{ py: 10, textAlign: "center" }}>
      <Paper sx={{ p: 4, borderRadius: 4 }}>
        <Typography variant="h3" color="secondary" gutterBottom>
          Create Room
        </Typography>
        <TextField
          fullWidth
          label="Your Name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          margin="normal"
          sx={{ mb: 3 }}
        />
        <Button 
          variant="contained" 
          size="large" 
          color="secondary"
          onClick={handleCreate}
          fullWidth
        >
          Join Room
        </Button>
      </Paper>
    </Container>
  );
}