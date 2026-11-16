import { StateMachine, generateGameId, GameStatus } from "@/lib/game-state";

describe("StateMachine.isValidTransition", () => {
  const legal: Array<[GameStatus, GameStatus]> = [
    ["setup", "playing"],
    ["playing", "game_over"],
    ["game_over", "playing"],
  ];

  it.each(legal)("allows %s -> %s", (from, to) => {
    expect(StateMachine.isValidTransition(from, to)).toBe(true);
  });

  const illegal: Array<[GameStatus, GameStatus]> = [
    ["setup", "game_over"],
    ["playing", "setup"],
    ["setup", "setup"],
    ["playing", "playing"],
    ["game_over", "game_over"],
  ];

  it.each(illegal)("rejects %s -> %s", (from, to) => {
    expect(StateMachine.isValidTransition(from, to)).toBe(false);
  });
});

describe("generateGameId", () => {
  it("produces a short alphanumeric id", () => {
    const id = generateGameId();
    expect(id).toMatch(/^[a-z0-9]+$/);
    expect(id.length).toBeGreaterThanOrEqual(4);
    expect(id.length).toBeLessThanOrEqual(8);
  });

  it("generates unique ids across many calls", () => {
    const ids = new Set(Array.from({ length: 1000 }, () => generateGameId()));
    expect(ids.size).toBe(1000);
  });
});
