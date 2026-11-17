/**
 * @jest-environment node
 */
import {
  PAR_BANDS,
  shortestPath,
  shortestPathLength,
  generateSoloPuzzle,
  validateSoloMove,
} from "@/lib/solo-game";

// cold → cord → card → ward → warm : a clean 4-step ladder
const dictionary = new Set([
  "cold", "cord", "card", "ward", "warm",
  "word", "cord", "wold", "bold", "mold", "cold",
]);

describe("shortestPathLength", () => {
  it("is 0 when start and target are the same word", () => {
    expect(shortestPathLength("cold", "cold", dictionary)).toBe(0);
  });

  it("measures the fewest one-letter hops between two words", () => {
    expect(shortestPathLength("cold", "warm", dictionary)).toBe(4);
    expect(shortestPathLength("cold", "cord", dictionary)).toBe(1);
  });

  it("is null when the target is unreachable", () => {
    expect(shortestPathLength("cold", "zzzz", dictionary)).toBeNull();
  });
});

describe("generateSoloPuzzle", () => {
  it("returns two distinct dictionary words", () => {
    const puzzle = generateSoloPuzzle(dictionary);
    expect(puzzle.start).not.toBe(puzzle.target);
    expect(dictionary.has(puzzle.start)).toBe(true);
    expect(dictionary.has(puzzle.target)).toBe(true);
  });

  it("guarantees a solvable puzzle within the par bounds", () => {
    for (let i = 0; i < 20; i++) {
      const puzzle = generateSoloPuzzle(dictionary, undefined, 2, 3);
      expect(shortestPathLength(puzzle.start, puzzle.target, dictionary)).toBe(puzzle.par);
      expect(puzzle.par).toBeGreaterThanOrEqual(2);
      expect(puzzle.par).toBeLessThanOrEqual(3);
    }
  });

  it("is deterministic under the same seed", () => {
    const seededRng = (initialSeed: number) => {
      let seed = initialSeed;
      return () => {
        seed = (seed * 1103515245 + 12345) % 2147483648;
        return seed / 2147483648;
      };
    };
    const a = generateSoloPuzzle(dictionary, seededRng(42), 2, 3);
    const b = generateSoloPuzzle(dictionary, seededRng(42), 2, 3);
    expect(a).toEqual(b);
  });
});

describe("validateSoloMove", () => {
  const start = "cold";
  const target = "warm";

  it("accepts a legal one-letter step", () => {
    expect(validateSoloMove([start], target, "cord", dictionary)).toEqual({
      accepted: true,
      won: false,
    });
  });

  it("wins the game when the played word is the target", () => {
    expect(validateSoloMove([start, "cord", "card", "ward"], target, "warm", dictionary)).toEqual({
      accepted: true,
      won: true,
    });
  });

  it("rejects words that are not four letters", () => {
    expect(validateSoloMove([start], target, "cords", dictionary)).toEqual({
      accepted: false,
      error: "Word must be 4 letters long!",
    });
  });

  it("rejects repeats", () => {
    expect(validateSoloMove([start, "cord"], target, "cold", dictionary)).toEqual({
      accepted: false,
      error: "Word already used!",
    });
  });

  it("rejects non-dictionary words", () => {
    expect(validateSoloMove([start], target, "xxxx", dictionary)).toEqual({
      accepted: false,
      error: "That's not in my dictionary!",
    });
  });

  it("rejects steps that change more than one letter", () => {
    expect(validateSoloMove([start], target, "card", dictionary)).toEqual({
      accepted: false,
      error: "Must change exactly one letter!",
    });
  });
});

import { readFileSync } from "node:fs";
const realDictionary = new Set(
  readFileSync("public/data/dictionary-4.txt", "utf8").split("\n").filter(Boolean)
);

describe("shortestPath", () => {
  it("returns the word path between neighbours one hop apart", () => {
    expect(shortestPath("cold", "cord", dictionary)).toEqual(["cold", "cord"]);
  });

  it("returns a multi-hop path whose steps are valid dictionary words", () => {
    const path = shortestPath("cold", "cord", dictionary);
    expect(path).not.toBeNull();
    const far = shortestPath("cold", "warm", dictionary);
    expect(far).not.toBeNull();
    for (const w of far!) expect(dictionary.has(w)).toBe(true);
    // Same length as the BFS distance helper reports.
    expect(shortestPathLength("cold", "warm", dictionary)).toBe(far!.length - 1);
  });

  it("returns just the word when start equals target", () => {
    expect(shortestPath("cord", "cord", dictionary)).toEqual(["cord"]);
  });

  it("returns null when no ladder exists", () => {
    expect(shortestPath("cold", "zzzz", dictionary)).toBeNull();
  });
});

describe("PAR_BANDS", () => {
  it("makes easy strictly easier than medium, and medium than hard", () => {
    expect(PAR_BANDS.easy[1]).toBeLessThan(PAR_BANDS.medium[0]);
    expect(PAR_BANDS.medium[1]).toBeLessThan(PAR_BANDS.hard[0]);
  });

  it("lets generateSoloPuzzle honor each difficulty band", () => {
    let i = 0;
    const rng = () => {
      i += 1;
      return (i % 7) / 7;
    };
    for (const [min, max] of Object.values(PAR_BANDS)) {
      const puzzle = generateSoloPuzzle(realDictionary, rng, min, max);
      expect(puzzle.par).toBeGreaterThanOrEqual(min);
      expect(puzzle.par).toBeLessThanOrEqual(max);
    }
  });
});
