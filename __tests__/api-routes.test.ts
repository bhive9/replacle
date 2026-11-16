/**
 * @jest-environment node
 */
// Mock the database boundary (Redis), not internal logic.
const mockStore = new Map<string, string>();

jest.mock("@upstash/redis", () => {
  const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
  return {
    Redis: jest.fn().mockImplementation(() => ({
      async get(key: string) {
        await tick();
        return mockStore.get(key) ?? null;
      },
      async set(key: string, value: string, options?: { nx?: boolean }) {
        await tick();
        if (options?.nx && mockStore.has(key)) return null;
        mockStore.set(key, value);
        return "OK";
      },
      async del(key: string) {
        await tick();
        return mockStore.delete(key) ? 1 : 0;
      },
      async eval(_script: string, keys: string[], args: string[]) {
        await tick();
        const [key] = keys;
        const [expected, next] = args;
        if (mockStore.get(key) === expected) {
          mockStore.set(key, next);
          return 1;
        }
        return 0;
      },
    })),
  };
});

import request from "supertest";
import { createApiApp, Route, asRoute } from "./helpers/route-app";
import { POST as startLocalGameRaw } from "@/app/api/local/start/route";
import { GET as getLocalGameRoute, PUT as putLocalGame } from "@/app/api/local/game/[gameId]/route";
import { POST as createRemoteGameRouteRaw } from "@/app/api/remote/game/route";
import { POST as setNameRouteRaw } from "@/app/api/remote/game/[gameId]/name/route";
import { POST as setReadyRouteRaw } from "@/app/api/remote/game/[gameId]/ready/route";
import { POST as submitMoveRouteRaw } from "@/app/api/remote/game/[gameId]/move/route";
import { GameState } from "@/lib/game-state";
import { dictionary } from "@/lib/remote-words";

function findLegalMove(word: string): string {
  // Change exactly one letter into another dictionary word — computed from the
  // real dictionary because the ready flow deals a random starting word.
  for (let i = 0; i < word.length; i++) {
    for (const letter of "abcdefghijklmnopqrstuvwxyz") {
      if (letter === word[i]) continue;
      const candidate = word.slice(0, i) + letter + word.slice(i + 1);
      if (dictionary.has(candidate)) return candidate;
    }
  }
  throw new Error(`No legal move found from "${word}"`);
}

const routes: Route[] = [
  { method: "POST", path: "/api/local/start", handler: asRoute(startLocalGameRaw) },
  { method: "GET", path: "/api/local/game/:gameId", handler: asRoute(getLocalGameRoute) },
  { method: "PUT", path: "/api/local/game/:gameId", handler: asRoute(putLocalGame) },
  { method: "POST", path: "/api/remote/game", handler: asRoute(createRemoteGameRouteRaw) },
  { method: "POST", path: "/api/remote/game/:gameId/name", handler: asRoute(setNameRouteRaw) },
  { method: "POST", path: "/api/remote/game/:gameId/ready", handler: asRoute(setReadyRouteRaw) },
  { method: "POST", path: "/api/remote/game/:gameId/move", handler: asRoute(submitMoveRouteRaw) },
];

const app = createApiApp(routes);

async function startPlayingRemoteGame() {
  const create = await request(app).post("/api/remote/game");
  const { gameId } = create.body as { gameId: string };
  await request(app).post(`/api/remote/game/${gameId}/name`).send({ player: 1, name: "Alice" });
  await request(app).post(`/api/remote/game/${gameId}/name`).send({ player: 2, name: "Bob" });
  await request(app).post(`/api/remote/game/${gameId}/ready`).send({ player: 1 });
  await request(app).post(`/api/remote/game/${gameId}/ready`).send({ player: 2 });
  return gameId;
}

beforeEach(() => {
  mockStore.clear();
});

describe("POST /api/local/start", () => {
  it("returns 400 when a player name is missing", async () => {
    await request(app)
      .post("/api/local/start")
      .send({ player1Name: "Alice" })
      .expect(400)
      .expect((res) => expect(res.body.error).toMatch(/player1Name and player2Name/));
  });

  it("creates a game and returns its id", async () => {
    const response = await request(app)
      .post("/api/local/start")
      .send({ player1Name: "Alice", player2Name: "Bob" })
      .expect(200);

    expect(response.body.gameId).toEqual(expect.any(String));
    expect(typeof response.body.gameId).toBe("string");
  });
});

describe("GET /api/local/game/:gameId", () => {
  it("returns 404 for an unknown game", async () => {
    await request(app).get("/api/local/game/missing").expect(404);
  });

  it("returns the saved game state", async () => {
    const { gameId } = (await request(app).post("/api/local/start").send({ player1Name: "Alice", player2Name: "Bob" })).body;

    const response = await request(app).get(`/api/local/game/${gameId}`).expect(200);

    expect(response.body.game.player1Name).toBe("Alice");
    expect(response.body.game.player2Name).toBe("Bob");
    expect(response.body.game.status).toBe("setup");
  });
});

describe("PUT /api/local/game/:gameId", () => {
  it("persists the submitted game state", async () => {
    const { gameId } = (await request(app).post("/api/local/start").send({ player1Name: "Alice", player2Name: "Bob" })).body;

    const state: Partial<GameState> = {
      id: gameId,
      history: ["cold", "cord"],
      currentPlayer: 2,
      status: "playing",
    };
    await request(app).put(`/api/local/game/${gameId}`).send(state).expect(200);

    const response = await request(app).get(`/api/local/game/${gameId}`).expect(200);
    expect(response.body.game.history).toEqual(["cold", "cord"]);
    expect(response.body.game.currentPlayer).toBe(2);
  });

  it("rejects a payload without an id", async () => {
    await request(app).put("/api/local/game/anything").send({ status: "playing" }).expect(400);
  });
});

describe("POST /api/remote/game/:gameId/name", () => {
  it("returns 400 for an invalid player number", async () => {
    const { gameId } = (await request(app).post("/api/remote/game")).body;
    await request(app).post(`/api/remote/game/${gameId}/name`).send({ player: 3, name: "Eve" }).expect(400);
  });

  it("returns 400 for a blank name", async () => {
    const { gameId } = (await request(app).post("/api/remote/game")).body;
    await request(app).post(`/api/remote/game/${gameId}/name`).send({ player: 1, name: "   " }).expect(400);
  });

  it("returns 400 for a name longer than 40 characters", async () => {
    const { gameId } = (await request(app).post("/api/remote/game")).body;
    await request(app)
      .post(`/api/remote/game/${gameId}/name`)
      .send({ player: 1, name: "x".repeat(41) })
      .expect(400);
  });
});

describe("POST /api/remote/game/:gameId/ready", () => {
  it("returns 400 for an invalid player number", async () => {
    const { gameId } = (await request(app).post("/api/remote/game")).body;
    await request(app).post(`/api/remote/game/${gameId}/ready`).send({ player: 0 }).expect(400);
  });
});

describe("POST /api/remote/game/:gameId/move", () => {
  it("returns 400 when the payload lacks a player or word", async () => {
    await request(app).post("/api/remote/game/whatever/move").send({ word: "cord" }).expect(400);
  });

  it("returns 404 for an unknown game", async () => {
    await request(app)
      .post("/api/remote/game/missing/move")
      .send({ player: 1, word: "cord" })
      .expect(404);
  });

  it("accepts a legal move from the player on turn", async () => {
    const gameId = await startPlayingRemoteGame();
    const baseWord = (JSON.parse(mockStore.get(`game:remote:${gameId}`)!) as { history: string[] }).history[0];
    const move = findLegalMove(baseWord);

    const response = await request(app)
      .post(`/api/remote/game/${gameId}/move`)
      .send({ player: 1, word: move })
      .expect(200);

    expect(response.body.game.history).toEqual([baseWord, move]);
    expect(response.body.game.currentPlayer).toBe(2);
  });

  it("rejects a move that is not in the dictionary", async () => {
    const gameId = await startPlayingRemoteGame();

    const response = await request(app)
      .post(`/api/remote/game/${gameId}/move`)
      .send({ player: 1, word: "xxxx" })
      .expect(400);

    expect(response.body.error).toMatch(/dictionary/i);
  });

  it("rejects a move out of turn", async () => {
    const gameId = await startPlayingRemoteGame();

    const response = await request(app)
      .post(`/api/remote/game/${gameId}/move`)
      .send({ player: 2, word: "cord" })
      .expect(400);

    expect(response.body.error).toMatch(/not your turn/i);
  });
});
