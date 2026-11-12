"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  Container,
  Typography,
  Button,
  Paper,
  TextField,
  Box,
} from "@mui/material";

export default function RemoteJoinPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RemoteJoinPageInner />
    </Suspense>
  );
}

function RemoteJoinPageInner() {
  const { gameId } = useParams();
  const searchParams = useSearchParams();
  searchParams.get("player");

  const [myName, setMyName] = useState("");
  const [myReady] = useState(false);
  const [opponentName] = useState("");
  const [opponentReady] = useState(false);

  const handleCopyLink = () => {
    // should copy this link to the clipboard
    // `${baseUrl}/game/remote/join/${gameId}?player=2`;
  };

  const handleReady = () => {
    // 1. fires a post request to set name.
    // 2. fires a post request to set ready.
  }

  const hasName = Boolean(myName);

  return (
    <Container maxWidth="sm" sx={{ py: 4, textAlign: "center" }}>
      <Typography variant="h1" gutterBottom color="secondary">
        Replacle
      </Typography>
      <Typography variant="h3" gutterBottom sx={{ mb: 4 }}>
        Waiting Room
      </Typography>

      {/* Share Link Card */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: 1, borderColor: "divider" }}>
        <Button 
          variant="outlined"
          fullWidth
          onClick={handleCopyLink}
          color="secondary"
        >
          Copy Room Link
        </Button>
      </Paper>

      {/* Name Input Card */}
        <Paper elevation={0} sx={{ p: 3, mb: 3, border: 1, borderColor: "divider" }}>
          <TextField
            label="Your Name"
            value={myName}
            onChange={(e) => setMyName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
            autoFocus
            fullWidth
            variant="outlined"
            sx={{ mb: 2 }}
          />
        </Paper>

      {/* Status Card */}
      <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: "divider" }}>
        {!hasName ? (
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: "center" }}>
            Enter your name above to join
          </Typography>
        ) : (
          <>
            <Typography variant="body1" gutterBottom>
              <strong>You:</strong> {myName}
            </Typography>
            <Box sx={{ mb: 2 }}>
              {opponentName ? (
                <Typography variant="body1" gutterBottom>
                  <strong>Opponent:</strong> {opponentName}
                  {opponentReady && <Box component="span" sx={{ ml: 1, color: "success.main" }}>(Ready)</Box>}
                </Typography>
              ) : (
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  Waiting for opponent to join...
                </Typography>
              )}
            </Box>
            {myReady ? (
              <Typography variant="body1" color="success.main" sx={{ textAlign: "center", mt: 2 }}>
                Ready. Waiting for opponent...
              </Typography>
            ) : (
              <Button
                variant="contained"
                color="secondary"
                fullWidth
                size="large"
                onClick={handleReady}
              >
                Ready
              </Button>
            )}
          </>
        )}
      </Paper>
    </Container>
  );
}
