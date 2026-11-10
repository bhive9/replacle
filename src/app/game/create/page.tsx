"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateRoomContent />
    </Suspense>
  );
}

function CreateRoomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [playerName, setPlayerName] = useState("Player1");
  const [roomId, setRoomId] = useState("");
  const [roomUrl, setRoomUrl] = useState("");

  // Create room immediately on load
  useEffect(() => {
    async function initRoom() {
      try {
        const res = await fetch("/api/v1/game", { method: "POST" });
        const data = await res.json();
        if (res.ok && data.roomId) {
          setRoomId(data.roomId);
          const fullUrl = `${window.location.origin}/game/join/${data.roomId}`;
          setRoomUrl(fullUrl);
        }
      } catch (err) {
        console.error("Failed to create room", err);
      }
    }
    initRoom();
  }, []);

  const copyRoomUrl = useCallback(() => {
    if (roomUrl) {
      navigator.clipboard.writeText(roomUrl);
    }
  }, [roomUrl]);

  const handleJoin = useCallback(() => {
    if (!roomId) return;
    router.push(`/game/${roomId}?name=${encodeURIComponent(playerName)}`);
  }, [roomId, playerName, router]);

  return (
    <Container maxWidth="sm" sx={{ py: 10, textAlign: "center" }}>
      <Paper sx={{ p: 4, borderRadius: 4 }}>
        <Typography variant="h3" color="secondary" gutterBottom>
          Create Room
        </Typography>

        {roomId && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Shareable Join URL:
            </Typography>
            <Input
              value={roomUrl}
              readOnly
              fullWidth
              sx={{
                fontFamily: "monospace",
                fontSize: "0.9rem",
                bgcolor: "white",
                borderRadius: 2,
                p: 1,
                border: "2px dotted",
                borderColor: "primary.main",
              }}
              endAdornment={
                <Tooltip title="Copy full URL">
                  <IconButton onClick={copyRoomUrl} size="small" sx={{ ml: 1 }}>
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
          onClick={handleJoin}
          disabled={!roomId}
          fullWidth
        >
          Join Room
        </Button>
      </Paper>
    </Container>
  );
}