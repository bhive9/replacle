"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Alert,
  Container,
  Typography,
  Button,
  Box,
  TextField,
  Paper,
} from "@mui/material"

export default function RemoteHub() {
  const router = useRouter()
  const [roomId, setRoomId] = useState("")
  const [error, setError] = useState("")
  const [creating, setCreating] = useState(false)

  const handleCreate = () => {
    setCreating(true)
    setError("")
    fetch("/api/remote/game", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to create game")
        return res.json()
      })
      .then(({ gameId }) => {
        router.push(`/game/remote/join/${gameId}?player=1`)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to create game")
      })
      .finally(() => setCreating(false))
  }

  const handleJoin = () => {
    const id = roomId.trim().toLowerCase();
    if (!/^[a-z0-9]{4,8}$/.test(id)) {
      setError("Room IDs are 4-8 letters and digits.");
      return;
    }
    setError("");
    router.push(`/game/remote/join/${id}?player=2`);
  }

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Typography variant="h1" gutterBottom color="secondary" align="center">
        Replacle
      </Typography>
      <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
        Play remotely with a friend
      </Typography>

      <Paper elevation={0} sx={{ p: 4, border: 1, borderColor: "divider" }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Button
          variant="contained"
          size="large"
          color="secondary"
          onClick={handleCreate}
          disabled={creating}
          fullWidth
          sx={{ py: 1.5, height: "auto", mb: 3 }}
        >
          Create Room
        </Button>

        <Typography variant="body2" color="text.secondary" align="center" sx={{ my: 3 }}>
          Or join an existing room
        </Typography>

        <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
          <TextField
            label="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value.toLowerCase())}
            placeholder="Enter Room ID"
            fullWidth
          />
          <Button
            variant="contained"
            size="large"
            onClick={handleJoin}
            disabled={!roomId.trim()}
          >
            Join
          </Button>
        </Box>
      </Paper>
    </Container>
  )
}