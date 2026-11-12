"use client";

import React, { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Container, Typography, CircularProgress } from "@mui/material";

function CreateRemoteGameInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const name = searchParams.get("name");
    if (!name) {
      router.push("/game/remote");
      return;
    }

    async function create() {
      try {
        const res = await fetch("/api/remote/game", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ player1Name: name }),
        });
        if (res.ok) {
          const { gameId } = await res.json();
          router.push(`/game/remote/join/${gameId}?player=1`);
        } else {
          router.push("/game/remote");
        }
      } catch {
        router.push("/game/remote");
      }
    }
    create();
  }, [router, searchParams]);

  return (
    <Container maxWidth="sm" sx={{ py: 10, textAlign: "center" }}>
      <Typography variant="h3" color="secondary">
        Creating room...
      </Typography>
      <CircularProgress sx={{ mt: 3 }} />
    </Container>
  );
}

export default function CreateRemoteGame() {
  return (
    <Suspense fallback={<div>Creating room...</div>}>
      <CreateRemoteGameInner />
    </Suspense>
  );
}