"use client";

import { useRouter } from "next/navigation";
import { Container, Typography, Button } from "@mui/material";

export default function HomePage() {
  const router = useRouter();

  return (
    <Container maxWidth="sm" sx={{ py: 10, textAlign: "center" }}>
      <Typography variant="h1" gutterBottom color="secondary">
        Replacle
      </Typography>
      <Button
        variant="contained"
        size="large"
        onClick={() => router.push("/game/local/join")}
        color="secondary"
        fullWidth
      >
        Pass and Play
      </Button>
    </Container>
  );
}