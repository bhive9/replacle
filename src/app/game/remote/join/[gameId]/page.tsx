"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  Container,
  Typography,
  Button,
  Box,
  Paper,
  TextField,
  Alert,
  Chip,
  CircularProgress,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { getRemoteGame, setPlayerName, setReady, RemoteGame } from "@/lib/remote-db";

function RemoteJoinPageInner() {
  const { gameId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isPlayer1 = searchParams.get("player") === "1";

  const [game, setGame] = useState<RemoteGame | null>(null);
  const [playerName, setPlayerNameState] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadGame() {
      if (!gameId) return;
      try {
        const res = await fetch(`/api/remote/game/${gameId}`);
        if (res.ok) {
          const data = await res.json();
          setGame(data.game);
        } else if (res.status === 404) {
          router.push("/game/remote");
        }
      } catch (err) {
        console.error("Failed to load game", err);
        setError("Failed to load game");
      } finally {
        setIsLoading(false);
      }
    }
    loadGame();
  }, [gameId, router]);

  // Poll for game state changes (waiting room doesn't use SSE)
  useEffect(() => {
    if (!gameId || game?.status === "playing") return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/remote/game/${gameId}`);
        if (res.ok) {
          const data = await res.json();
          setGame(data.game);
          if (data.game.status === "playing") {
            router.push(`/game/remote/${gameId}`);
          }
        }
      } catch (err) {
        console.error("Poll failed", err);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [gameId, game?.status, router]);

  const handleSetName = async () => {
    if (!playerName.trim() || !gameId) return;
    try {
      const res = await fetch(`/api/remote/game/${gameId}/name`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player: isPlayer1 ? 1 : 2, name: playerName.trim() }),
      });
      if (res.ok) {
        const { game: updated } = await res.json();
        setGame(updated);
        setPlayerNameState("");
      }
    } catch (err) {
      setError("Failed to set name");
    }
  };

  const handleReady = async () => {
    if (!gameId) return;
    try {
      const res = await fetch(`/api/remote/game/${gameId}/ready`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player: isPlayer1 ? 1 : 2 }),
      });
      if (res.ok) {
        const { game: updated } = await res.json();
        setGame(updated);
      }
    } catch (err) {
      setError("Failed to set ready");
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="sm" sx={{ py: 10, textAlign: "center" }}>
        <Typography variant="h3" color="secondary">
          Loading...
        </Typography>
        <CircularProgress sx={{ mt: 3 }} />
      </Container>
    );
  }

  if (!game) {
    return (
      <Container maxWidth="sm" sx={{ py: 10, textAlign: "center" }}>
        <Typography variant="h3" color="secondary">Game not found</Typography>
      </Container>
    );
  }

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/game/remote/join/${gameId}` : "";

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h1" gutterBottom color="secondary" align="center">
        Replacle
      </Typography>
      <Typography variant="h3" gutterBottom align="center" sx={{ mb: 3 }}>
        Waiting Room
      </Typography>

      <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: "divider", mb: 3 }}>
        <TextField
          label="Your Name"
          value={playerName}
          onChange={(e) => setPlayerNameState(e.target.value)}
          placeholder="Enter your name"
          fullWidth
          sx={{ mb: 3 }}
          disabled={!!(game.player1Name && game.player2Name)}
        />
        <Button
          variant="contained"
          size="large"
          color="secondary"
          onClick={handleSetName}
          disabled={!playerName.trim() || !!(game.player1Name && game.player2Name)}
          sx={{ py: 1.5, height: "auto", width: "100%" }}
        >
          Set Name
        </Button>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Box component="input" type="text" readOnly value={shareUrl} sx={{ flex: 1, p: 1.5, textAlign: "center", border: 1, borderColor: "divider", borderRadius: 1, fontFamily: "monospace" }} />
          <Button
            variant="outlined"
            size="small"
            startIcon={<ContentCopyIcon />}
            onClick={() => navigator.clipboard.writeText(shareUrl)}
          >
            Copy
          </Button>
        </Box>
      </Paper>

      <Paper elevation={0} sx={{ p: 4, border: 1, borderColor: "divider" }}>
        <Typography variant="h3" gutterBottom align="center" sx={{ mb: 3 }}>
          Players
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Player 1 */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <Chip
              label="Player 1"
              color="primary"
              variant="outlined"
              size="small"
            />
            <Typography variant="body1" sx={{ flex: 1 }}>
              {game.player1Name || "Waiting..."}
            </Typography>
            {game.player1Ready ? (
              <Chip label="Ready" color="success" size="small" icon={<Typography variant="body2">✓</Typography>} />
            ) : isPlayer1 && !game.player1Name && !game.player2Name && (
              <Button
                variant="contained"
                size="small"
                color="secondary"
                onClick={handleReady}
                disabled={!game.player1Name}
              >
                Ready
              </Button>
            )}
          </Box>

          {/* Player 2 */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <Chip
              label="Player 2"
              color="secondary"
              variant="outlined"
              size="small"
            />
            {game.player2Name ? (
              <>
                <Typography variant="body1" sx={{ flex: 1 }}>
                  {game.player2Name}
                </Typography>
                {game.player2Ready ? (
                  <Chip label="Ready" color="success" size="small" icon={<Typography variant="body2">✓</Typography>} />
                ) : !isPlayer1 && (
                  <Button
                    variant="contained"
                    size="small"
                    color="secondary"
                    onClick={handleReady}
                  >
                    Ready
                  </Button>
                )}
              </>
            ) : (
              <>
                <TextField
                  size="small"
                  placeholder="Enter your name"
                  value={playerName}
                  onChange={(e) => setPlayerNameState(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSetName()}
                  sx={{ flex: 1, py: 0.5 }}
                />
                <Button
                  variant="contained"
                  size="small"
                  color="secondary"
                  onClick={handleSetName}
                  disabled={!playerName.trim()}
                  sx={{ py: 0.5, height: "auto" }}
                >
                  Join
                </Button>
              </>
            )}
          </Box>
        </Box>

        {game.player1Name && game.player2Name && !game.player1Ready && !game.player2Ready && (
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
            Both players joined. Click Ready when you're ready to start.
          </Typography>
        )}

        {game.player1Ready && !game.player2Ready && !isPlayer1 && (
          <Typography variant="body2" color="primary" align="center" sx={{ mt: 2 }}>
            Player 1 is ready. Click Ready to start!
          </Typography>
        )}

        {game.player2Ready && !game.player1Ready && isPlayer1 && (
          <Typography variant="body2" color="primary" align="center" sx={{ mt: 2 }}>
            Player 2 is ready. Click Ready to start!
          </Typography>
        )}

        {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}
      </Paper>
    </Container>
  );
}

export default function RemoteJoinPage() {
  return (
    <Suspense fallback={<div>Loading game...</div>}>
      <RemoteJoinPageInner />
    </Suspense>
  );
}