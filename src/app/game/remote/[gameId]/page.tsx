"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Alert, Box, Button, Chip, Container, OutlinedInput, Paper, Typography } from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import { TURN_TIME_LIMIT } from "@/lib/game-logic";
import type { RemoteGame } from "@/lib/remote-db";

export default function RemoteGamePage() {
  return <Suspense fallback={<div>Loading game...</div>}><Game /></Suspense>;
}

function Game() {
  const { gameId } = useParams<{ gameId: string }>();
  const router = useRouter();
  const search = useSearchParams();
  const player = search.get("player") === "2" ? 2 : 1;
  const [game, setGame] = useState<RemoteGame | null>(null);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let stopped = false;
    async function refresh() {
      try {
        const response = await fetch(`/api/remote/game/${gameId}`, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to load game");
        if (stopped) return;
        setGame(data.game);
        if (data.game.status === "waiting") router.replace(`/game/remote/join/${gameId}?player=${player}`);
      } catch (err) { if (!stopped) setError(err instanceof Error ? err.message : "Failed to load game"); }
    }
    void refresh();
    const interval = setInterval(refresh, 1500);
    return () => { stopped = true; clearInterval(interval); };
  }, [gameId, player, router]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, []);

  async function action(endpoint: "move" | "restart", body: object = {}) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/remote/game/${gameId}/${endpoint}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Request failed");
      setGame(data.game);
      if (endpoint === "move") setInput("");
    } catch (err) { setError(err instanceof Error ? err.message : "Request failed"); }
    finally { setBusy(false); }
  }

  if (!game) return <Container sx={{ py: 10, textAlign: "center" }}>{error ? <Alert severity="error">{error}</Alert> : <Typography variant="h3">Loading...</Typography>}</Container>;
  if (game.status === "waiting") return <Container sx={{ py: 10 }}>Returning to waiting room...</Container>;
  const winnerName = game.winner === 1 ? game.player1Name : game.player2Name;
  const loserName = game.winner === 1 ? game.player2Name : game.player1Name;
  if (game.status === "game_over") return (
    <Container maxWidth="sm" sx={{ py: 10, textAlign: "center" }}>
      <Typography variant="h1" gutterBottom color="secondary">Replacle</Typography>
      <Typography variant="h2" gutterBottom color="success.main">🎉 {winnerName} Wins!</Typography>
      <Typography sx={{ mb: 3 }}>{game.endReason === "timeout" ? `${loserName} ran out of time!` : `No valid moves left for ${loserName}.`}</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Button variant="outlined" color="secondary" disabled={busy} onClick={() => action("restart")}>Play Again</Button>
    </Container>
  );
  const currentWord = game.history[game.history.length - 1] || "";
  const currentPlayerName = game.currentPlayer === 1 ? game.player1Name : game.player2Name;
  const remaining = game.turnStartTime === null ? TURN_TIME_LIMIT : Math.max(0, Math.ceil(TURN_TIME_LIMIT - (now - game.turnStartTime) / 1000));
  const myTurn = game.currentPlayer === player && remaining > 0;
  return (
    <Container maxWidth="sm" sx={{ py: 4, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Typography variant="h3" color="secondary" sx={{ mb: 3 }}>Replacle</Typography>
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 4, bgcolor: game.currentPlayer === 1 ? "primary.main" : "secondary.main", color: "white", display: "flex", justifyContent: "space-between" }}>
        <Typography variant="h3">{currentPlayerName}&apos;s Turn</Typography><Typography variant="h3">{remaining}s</Typography>
      </Paper>
      <Box sx={{ textAlign: "center", mb: 4, py: 4, border: "2px dashed", borderColor: "primary.main", borderRadius: 4 }}>
        <Typography variant="caption">CURRENT WORD</Typography>
        <Box sx={{ display: "flex", justifyContent: "center", gap: 1, mt: 1 }}>
          {currentWord.split("").map((char, i) => <Paper key={i} elevation={2} sx={{ width: 60, height: 70, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", fontWeight: "bold" }}>{char.toUpperCase()}</Paper>)}
        </Box>
      </Box>
      <Box sx={{ flexGrow: 1, mb: 3 }}><Typography color="text.secondary">Game History</Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>{game.history.map((word, i) => <Chip key={`${word}-${i}`} label={word.toUpperCase()} color={i % 2 ? "secondary" : "primary"} />)}</Box>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
      <Box sx={{ display: "flex", gap: 2 }}>
        <OutlinedInput fullWidth placeholder="Type next word..." value={input} onChange={(e) => setInput(e.target.value.slice(0, 4).toUpperCase())}
          onKeyDown={(e) => { if (e.key === "Enter" && myTurn && input.trim() && !busy) void action("move", { player, word: input }); }} disabled={!myTurn || busy} />
        <Button variant="contained" disabled={!myTurn || !input.trim() || busy} onClick={() => action("move", { player, word: input })} aria-label="Submit word"><ArrowUpwardIcon /></Button>
      </Box>
      {!myTurn && <Typography color="text.secondary" sx={{ mt: 1, textAlign: "center" }}>Waiting for {currentPlayerName}...</Typography>}
    </Container>
  );
}
