"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Alert, Container, Typography, Button, Paper, TextField, Box } from "@mui/material";
import type { RemoteGame } from "@/lib/remote-db";

export default function RemoteJoinPage() {
  return <Suspense fallback={<div>Loading...</div>}><WaitingRoom /></Suspense>;
}

function WaitingRoom() {
  const { gameId } = useParams<{ gameId: string }>();
  const router = useRouter();
  const search = useSearchParams();
  const player = search.get("player") === "1" ? 1 : 2;
  const [name, setName] = useState("");
  const [game, setGame] = useState<RemoteGame | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      try {
        const response = await fetch(`/api/remote/game/${gameId}`, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to load room");
        if (cancelled) return;
        setGame(data.game);
        if (data.game.status !== "waiting") router.replace(`/game/remote/${gameId}?player=${player}`);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load room");
      }
    }
    void refresh();
    const interval = setInterval(refresh, 1500);
    return () => { cancelled = true; clearInterval(interval); };
  }, [gameId, player, router]);

  async function ready() {
    setBusy(true);
    setError("");
    try {
      for (const [endpoint, body] of [["name", { player, name }], ["ready", { player }]] as const) {
        const response = await fetch(`/api/remote/game/${gameId}/${endpoint}`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not join room");
        setGame(data.game);
        if (data.game.status !== "waiting") router.replace(`/game/remote/${gameId}?player=${player}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join room");
    } finally { setBusy(false); }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/game/remote/join/${gameId}?player=2`);
    } catch { setError("Could not copy link. Share the room ID instead."); }
  }

  const myReady = player === 1 ? game?.player1Ready : game?.player2Ready;
  const opponentName = player === 1 ? game?.player2Name : game?.player1Name;
  const opponentReady = player === 1 ? game?.player2Ready : game?.player1Ready;
  return (
    <Container maxWidth="sm" sx={{ py: 4, textAlign: "center" }}>
      <Typography variant="h1" gutterBottom color="secondary">Replacle</Typography>
      <Typography variant="h3" gutterBottom sx={{ mb: 4 }}>Waiting Room</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: 1, borderColor: "divider" }}>
        <Typography sx={{ mb: 2 }}>Room ID: {gameId}</Typography>
        <Button variant="outlined" fullWidth onClick={copyLink} color="secondary">Copy Room Link</Button>
      </Paper>
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: 1, borderColor: "divider" }}>
        <TextField label="Your Name" value={name} onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && name.trim() && !myReady && !busy) void ready(); }}
          autoFocus fullWidth disabled={Boolean(myReady)} slotProps={{ htmlInput: { maxLength: 40 } }} />
      </Paper>
      <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: "divider" }}>
        <Box sx={{ mb: 2 }}>{opponentName ? <Typography>Opponent: {opponentName}{opponentReady ? " (Ready)" : ""}</Typography> : <Typography>Waiting for opponent to join...</Typography>}</Box>
        {myReady ? <Typography color="success.main">Ready. Waiting for opponent...</Typography> :
          <Button variant="contained" color="secondary" fullWidth size="large" disabled={!name.trim() || busy || !game} onClick={ready}>Ready</Button>}
      </Paper>
    </Container>
  );
}
