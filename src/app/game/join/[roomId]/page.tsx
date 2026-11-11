"use client";

import React, { useState, useCallback, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Container,
  Typography,
  Button,
  Box,
  TextField,
  Paper,
  IconButton,
  Tooltip,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

export default function JoinRoomPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <JoinRoomContent />
    </Suspense>
  );
}

function JoinRoomContent() {
  const { roomId } = useParams();
  const router = useRouter();
  const [playerName, setPlayerName] = useState("Player1");

  const copyRoomId = useCallback(() => {
    if (typeof roomId === 'string') {
      navigator.clipboard.writeText(roomId);
    }
  }, [roomId]);

  const handleJoin = useCallback(() => {
    router.push(`/game/${roomId}?name=${encodeURIComponent(playerName)}`);
  }, [roomId, playerName, router]);

  return (
    <Container maxWidth="sm" sx={{ py: 10, textAlign: "center" }}>
      <Paper sx={{ p: 4, borderRadius: 4 }}>
        <Typography variant="h3" color="secondary" gutterBottom>
          Join Room
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Room ID:
          </Typography>
          <Box
            sx={{
              fontFamily: "monospace",
              fontSize: "1rem",
              bgcolor: "white",
              borderRadius: 2,
              p: 2,
              border: "2px dashed",
              borderColor: "secondary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="body1" sx={{ fontFamily: "monospace", fontWeight: 600 }}>
              {roomId}
            </Typography>
            <Tooltip title="Copy Room ID">
              <IconButton onClick={copyRoomId} size="small">
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <TextField
          fullWidth
          label="Your Name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          margin="normal"
          sx={{ mb: 3 }}
          color="secondary"
        />

        <Button 
          variant="contained" 
          size="large" 
          color="secondary"
          onClick={handleJoin}
          fullWidth
        >
          Join Room
        </Button>
      </Paper>
    </Container>
  );
}