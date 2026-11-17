"use client";

import { useRouter } from "next/navigation";
import { Box, Button, Container, Paper, Typography } from "@mui/material";

export default function HomePage() {
  const router = useRouter();

  return (
    <Container maxWidth="sm" sx={{ py: 8, textAlign: "center" }}>
      <Typography variant="h1" gutterBottom color="secondary">
        Replacle
      </Typography>

      {/* Single-player mode, its own card */}
      <Paper
        elevation={0}
        sx={{ p: 3, mb: 5, border: 1, borderColor: "divider", borderRadius: 4 }}
      >
        <Typography variant="h2" gutterBottom>
          Letter Hop
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          One player, this device. Hop from the start word to the target,
          one letter at a time.
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => router.push("/game/letter-hop")}
          color="secondary"
          fullWidth
        >
          Letter Hop
        </Button>
      </Paper>

      {/* Two-player modes, grouped */}
      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Two players
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => router.push("/game/local/join")}
          color="secondary"
          fullWidth
          sx={{ mb: 2 }}
        >
          Pass and Play
        </Button>
        <Button
          variant="outlined"
          size="large"
          onClick={() => router.push("/game/remote")}
          color="secondary"
          fullWidth
        >
          Play Remote
        </Button>
      </Box>
    </Container>
  );
}
