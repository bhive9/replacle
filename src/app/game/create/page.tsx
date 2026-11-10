"use client";

import React, { useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Typography,
  Button,
  Paper,
} from "@mui/material";

export default function CreateRoomPage() {
  const router = useRouter();

  const handleCreate = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/game", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.roomId) {
        router.push(`/game/join/${data.roomId}`);
      }
    } catch (err) {
      console.error("Failed to create room", err);
    }
  }, [router]);

  return (
    <Container maxWidth="sm" sx={{ py: 10, textAlign: "center" }}>
      <Paper sx={{ p: 4, borderRadius: 4 }}>
        <Typography variant="h3" color="secondary" gutterBottom>
          Create Room
        </Typography>
        <Button 
          variant="contained" 
          size="large" 
          color="secondary"
          onClick={handleCreate}
          fullWidth
        >
          Create New Room
        </Button>
      </Paper>
    </Container>
  );
}