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
  Input,
  IconButton,
  Tooltip,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

export default function CreateRoomPage() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState("Player1");
  const [roomId, setRoomId] = useState<string | null>(null);

  const handleCreate = useCallback(async () => {
    // Generate a room ID and set it
    const newRoomId = Math.random().toString(36).substring(7);
    setRoomId(newRoomId);
    // Navigate to the game room with the name as a query parameter
    router.push(`/game/${newRoomId}?name=${encodeURIComponent(playerName)}`);
  }, [playerName, router]);

  const copyRoomId = useCallback(() => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
    }
  }, [roomId]);

  return (
    <Container maxWidth="sm" sx={{ py: 10, textAlign: "center" }}>
      <Paper sx={{ p: 4, borderRadius: 4 }}>
        <Typography variant="h3" color="secondary" gutterBottom>
          Create Room
        </Typography>
        
        {roomId && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              Room ID:
            </Typography>
            <Input
              value={roomId}
              readOnly
              sx={{
                fontFamily: "monospace",
                fontSize: "1rem",
                bgcolor: "white",
                borderRadius: 2,
                "&:hover": {
                  bgcolor: "grey.50",
                },
              }}
              endAdornment={
                <Tooltip title="Copy room ID">
                  <IconButton
                    onClick={copyRoomId}
                    size="small"
                    sx={{ ml: 1 }}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              }
            />
          </Box>
        )}
        
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