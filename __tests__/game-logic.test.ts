import {
  isOneLetterDifferent,
  getValidMoves,
  checkGameOver,
} from "@/lib/game-logic";

describe("isOneLetterDifferent", () => {
  it("accepts two words differing in exactly one position", () => {
    // Arrange
    const from = "cold";
    const to = "cord";

    // Act
    const result = isOneLetterDifferent(from, to);

    // Assert
    expect(result).toBe(true);
  });

  it("rejects identical words", () => {
    expect(isOneLetterDifferent("word", "word")).toBe(false);
  });

  it("rejects words differing in two positions", () => {
    expect(isOneLetterDifferent("cold", "card")).toBe(false);
  });

  it("rejects words of different lengths", () => {
    expect(isOneLetterDifferent("cold", "colds")).toBe(false);
  });
});

describe("getValidMoves", () => {
  const dictionary = new Set(["cord", "card", "cold", "word", "bold", "cartoon", "wold"]);

  it("returns one-letter variants of the current word", () => {
    const moves = getValidMoves("cold", dictionary, []);
    expect(moves).toEqual(["cord", "bold", "wold"]);
  });

  it("does not match words differing in more than one letter", () => {
    const moves = getValidMoves("cold", dictionary, []);
    expect(moves).not.toContain("word"); // differs in two positions (c→w, l→r)
  });

  it("excludes words that were already played", () => {
    const moves = getValidMoves("cold", dictionary, ["cord"]);
    expect(moves).toEqual(["bold", "wold"]);
  });

  it("ignores dictionary entries that are not four letters", () => {
    const moves = getValidMoves("cold", dictionary, []);
    expect(moves).not.toContain("cartoon");
  });
});

describe("checkGameOver", () => {
  const dictionary = new Set(["cord", "card"]);

  it("returns true when no unused one-letter variant remains", () => {
    expect(checkGameOver("cord", dictionary, ["cord", "card"])).toBe(true);
  });

  it("returns false while at least one move is available", () => {
    expect(checkGameOver("cold", dictionary, [])).toBe(false);
  });
});
