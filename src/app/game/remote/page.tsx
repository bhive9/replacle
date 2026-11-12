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
    router.push(`/game/remote/join/${roomId.trim().toLowerCase()}`);
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
        <Typography variant="h3" gutterBottom align="center" sx={{ mb: 3 }}>
          Create Room
        </Typography>
        <Box sx={{ display: "flex", gap: 2, mb: 4 }}>
          <TextField
            label="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            sx={{ flex: 1 }}
          />
          <Button
            variant="contained"
            size="large"
            color="secondary"
            onClick={handleCreate}
            disabled={!name.trim()}
            sx={{ minWidth: 160, height: 56 }}
          >
            Create Room
          </Button>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2, my: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
            or
          </Typography>
        </Box>

        <Typography variant="h3" gutterBottom align="center" sx={{ mb: 3 }}>
          Join Room
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <OutlinedInput
            label="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value.toLowerCase())}
            placeholder="e.g. abc123"
            sx={{ flex: 1 }}
            inputProps={{ maxLength: 8, style: { textAlign: "center" } }}
          />
          <Button
            variant="outlined"
            size="large"
            onClick={handleJoin}
            disabled={!roomId.trim()}
            sx={{ minWidth: 160, height: 56 }}
          >
            Join Room
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}