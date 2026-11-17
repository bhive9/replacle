"use client";

import { useRouter } from "next/navigation";
import { Box, Button, Container, Typography } from "@mui/material";

export default function HomePage() {
  const router = useRouter();

  return (
    <Container maxWidth="sm" sx={{ py: 8, textAlign: "center" }}>
      <Typography variant="h1" gutterBottom color="secondary">
        Replacle
      </Typography>

      {/* Single-player mode */}
      <Box sx={{ mb: 5 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Single player
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
      </Box>

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
