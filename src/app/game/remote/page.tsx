"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Typography,
  Button,
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Paper,
  OutlinedInput,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

export default function RemoteHub() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");

  const handleCreate = () => {
    if (!name.trim()) return;
    router.push(`/game/remote/create?name=${encodeURIComponent(name.trim())}`);
  };

  const handleJoin = () => {
    if (!roomId.trim()) return;
    const path = name.trim()
      ? `/game/remote/join/${roomId.trim().toLowerCase()}?name=${encodeURIComponent(name.trim())}`
      : `/game/remote/join/${roomId.trim().toLowerCase()}`;
    router.push(path);
  };

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Typography variant="h1" gutterBottom color="secondary" align="center">
        Replacle
      </Typography>
      <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
        Play remotely with a friend
      </Typography>

      <Paper elevation={0} sx={{ p: 4, border: 1, borderColor: "divider" }}>
        <TextField
          label="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          fullWidth
          sx={{ mb: 4 }}
        />

        <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
          <Button
            variant="contained"
            size="large"
            color="secondary"
            onClick={handleCreate}
            disabled={!name.trim()}
            fullWidth
            sx={{ py: 1.5, height: "auto" }}
          >
            Create Room
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" align="center" sx={{ my: 3 }}>
          OR JOIN AN EXISTING ROOM
        </Typography>

        <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
          <TextField
            label="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value.toLowerCase())}
            placeholder="Enter Room ID"
            fullWidth
            sx={{ mb: 2, textAlign: "center", py: 1.5 }}
            inputProps={{ maxLength: 8 }}
          />
          <Button
            variant="outlined"
            size="large"
            onClick={handleJoin}
            disabled={!roomId.trim()}
            sx={{ py: 1.5, height: "auto" }}
          >
            Join
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}