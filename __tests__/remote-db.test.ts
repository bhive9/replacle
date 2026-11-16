/**
 * @jest-environment node
 */
// Mock the database boundary, not internal logic (see testing-patterns: "Mock at Boundaries Only").
const mockStore = new Map<string, string>();

jest.mock("@upstash/redis", () => {
  // Small delay makes interleaved reads realistic, like two serverless instances.
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
      // The compare-and-set Lua script used by remote-db.ts:
      // if GET(KEYS[1]) == ARGV[1] then SET(KEYS[1], ARGV[2]); return 1
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

import {
  createRemoteGame,
  getRemoteGame,
  setPlayerName,
  setReady,
  restartGame,
  submitMove,
  RemoteGame,
} from "@/lib/remote-db";

const dictionary = new Set(["cold", "cord", "card", "ward"]);

async function playingGame() {
  const game = await createRemoteGame();
  await setPlayerName(game.id, 1, "Alice");
  await setPlayerName(game.id, 2, "Bob");
  await setReady(game.id, 1, ["cold"]);
  await setReady(game.id, 2, ["cold"]);
  return game.id;
}

beforeEach(() => {
  mockStore.clear();
});

describe("createRemoteGame", () => {
  it("creates a waiting game with an empty history", async () => {
    const game = await createRemoteGame();

    expect(game.status).toBe("waiting");
    expect(game.history).toEqual([]);
    expect(game.currentPlayer).toBe(1);
    expect(game.winner).toBeNull();
  });

  it("is invisible under a different id lookup", async () => {
    const game = await createRemoteGame();
    expect(await getRemoteGame(`${game.id}-nope`)).toBeNull();
  });
});

describe("setPlayerName", () => {
  it("records each player's name while waiting", async () => {
    const game = await createRemoteGame();
    await setPlayerName(game.id, 1, "Alice");
    await setPlayerName(game.id, 2, "Bob");

    const saved = await getRemoteGame(game.id);
    expect(saved?.player1Name).toBe("Alice");
    expect(saved?.player2Name).toBe("Bob");
  });

  it("rejects a second player claiming a taken slot", async () => {
    const game = await createRemoteGame();
    await setPlayerName(game.id, 1, "Alice");

    await expect(setPlayerName(game.id, 1, "Mallory")).rejects.toThrow(
      "This player slot is already taken"
    );
  });

  it("rejects name changes after the game has started", async () => {
    const id = await playingGame();
    await expect(setPlayerName(id, 1, "Newname")).rejects.toThrow("Game has already started");
  });
});

describe("setReady", () => {
  it("rejects a player without a name", async () => {
    const game = await createRemoteGame();
    await expect(setReady(game.id, 1, ["cold"])).rejects.toThrow("Enter your name first");
  });

  it("keeps the game waiting until both players are ready", async () => {
    const game = await createRemoteGame();
    await setPlayerName(game.id, 1, "Alice");
    await setPlayerName(game.id, 2, "Bob");

    await setReady(game.id, 1, ["cold"]);
    expect((await getRemoteGame(game.id))?.status).toBe("waiting");

    await setReady(game.id, 2, ["cold"]);
    expect((await getRemoteGame(game.id))?.status).toBe("playing");
  });

  it("starts with a starting word and player 1 on the clock", async () => {
    const id = await playingGame();
    const game = (await getRemoteGame(id))!;
    expect(game.history).toEqual(["cold"]);
    expect(game.currentPlayer).toBe(1);
    expect(game.turnStartTime).not.toBeNull();
    expect(game.timeRemaining).toBe(30);
  });
});

describe("submitMove", () => {
  it("rejects a move out of turn", async () => {
    const id = await playingGame();
    await expect(submitMove(id, 2, "cord", dictionary)).rejects.toThrow("It is not your turn");
  });

  it("rejects words that are not four letters", async () => {
    const id = await playingGame();
    await expect(submitMove(id, 1, "cords", dictionary)).rejects.toThrow("4 letters");
  });

  it("rejects words already used", async () => {
    const id = await playingGame();
    await expect(submitMove(id, 1, "cold", dictionary)).rejects.toThrow("already used");
  });

  it("rejects words outside the dictionary", async () => {
    const id = await playingGame();
    await expect(submitMove(id, 1, "xxxx", dictionary)).rejects.toThrow("dictionary");
  });

  it("rejects words differing by more than one letter", async () => {
    const id = await playingGame();
    await expect(submitMove(id, 1, "card", dictionary)).rejects.toThrow("exactly one letter");
  });

  it("passes the turn and records the word", async () => {
    const id = await playingGame();
    const state = (await submitMove(id, 1, "cord", dictionary))!;

    expect(state.currentPlayer).toBe(2);
    expect(state.status).toBe("playing");
    expect(state.history).toEqual(["cold", "cord"]);
    expect((await getRemoteGame(id))?.history).toEqual(["cold", "cord"]);
  });

  it("ends the game with no_moves when the mover wins", async () => {
    const id = await playingGame();
    // Player 2 faces "cord" with only "card" reachable; after that, no moves remain.
    const finalState = (await submitMove(id, 1, "cord", dictionary))!;
    expect(finalState.status).toBe("playing");

    const restricted = new Set(["cord", "card"]);
    const state = (await submitMove(id, 2, "card", restricted))!;

    expect(state.status).toBe("game_over");
    expect(state.winner).toBe(2);
    expect(state.endReason).toBe("no_moves");
  });
});

describe("turn timeout", () => {
  it("forfeits the stale player's turn when the time limit passes", async () => {
    const id = await playingGame();

    // Age the current turn beyond the limit, as time would.
    const raw = JSON.stringify(await getRemoteGame(id));
    const stale = JSON.parse(raw) as RemoteGame;
    stale.turnStartTime = Date.now() - 31_000;
    mockStore.set(`game:remote:${id}`, JSON.stringify(stale));

    const game = (await getRemoteGame(id))!;
    expect(game?.status).toBe("game_over");
    expect(game?.winner).toBe(2);
    expect(game?.endReason).toBe("timeout");
    expect(game?.timeRemaining).toBe(0);
    expect(game?.turnStartTime).toBeNull();
  });
});

describe("restartGame", () => {
  it("rejects a restart while the game is in progress", async () => {
    const id = await playingGame();
    await expect(restartGame(id, ["cold"])).rejects.toThrow("still in progress");
  });

  it("deals a fresh game after a finished one", async () => {
    const id = await playingGame();
    await submitMove(id, 1, "cord", new Set(["cord", "card"]));
    await submitMove(id, 2, "card", new Set(["cord", "card"]));

    const game = (await restartGame(id, ["cold"]))!;
    expect(game.status).toBe("playing");
    expect(game.history).toEqual(["cold"]);
    expect(game.winner).toBeNull();
    expect(game.endReason).toBeNull();
  });
});
