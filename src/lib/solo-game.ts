import { isOneLetterDifferent } from "@/lib/game-logic";

export interface SoloPuzzle {
  /** The word the player starts from. */
  start: string;
  /** The word the player must reach; the game is won the moment it is played. */
  target: string;
  /** Length of the shortest possible ladder — the score to beat. */
  par: number;
}

const ALPHABET = "abcdefghijklmnopqrstuvwxyz";

/**
 * Fewest one-letter hops from start to target over the dictionary,
 * or null when no ladder exists. Plain breadth-first search: the
 * four-letter dictionary is small enough (~4k words) to search whole.
 */
export function shortestPathLength(
  start: string,
  target: string,
  dictionary: Set<string>
): number | null {
  if (start === target) return 0;
  const visited = new Set([start]);
  let frontier = [start];
  let depth = 0;

  while (frontier.length > 0) {
    depth++;
    const next: string[] = [];
    for (const word of frontier) {
      for (let i = 0; i < word.length; i++) {
        for (const letter of ALPHABET) {
          if (letter === word[i]) continue;
          const candidate = word.slice(0, i) + letter + word.slice(i + 1);
          if (!dictionary.has(candidate) || visited.has(candidate)) continue;
          if (candidate === target) return depth;
          visited.add(candidate);
          next.push(candidate);
        }
      }
    }
    frontier = next;
  }
  return null;
}

/**
 * Builds a puzzle by growing a BFS tree from a random target word and picking
 * the start from a random depth band, so every puzzle is provably solvable and
 * `par` is the optimal ladder length.
 */
export function generateSoloPuzzle(
  dictionary: Set<string>,
  rng: () => number = Math.random,
  minPar = 4,
  maxPar = 6
): SoloPuzzle {
  const words = [...dictionary];
  const pick = <T,>(items: T[]): T => items[Math.floor(rng() * items.length)];

  for (let attempt = 0; attempt < 20; attempt++) {
    const target = pick(words);
    // Bucket every reachable word by its exact distance from the target.
    const byDepth = new Map<number, string[]>();
    const visited = new Set([target]);
    let frontier = [target];
    let depth = 0;

    while (frontier.length > 0 && depth < maxPar) {
      depth++;
      const next: string[] = [];
      for (const word of frontier) {
        for (let i = 0; i < word.length; i++) {
          for (const letter of ALPHABET) {
            if (letter === word[i]) continue;
            const candidate = word.slice(0, i) + letter + word.slice(i + 1);
            if (!dictionary.has(candidate) || visited.has(candidate)) continue;
            visited.add(candidate);
            next.push(candidate);
            const bucket = byDepth.get(depth) ?? [];
            bucket.push(candidate);
            byDepth.set(depth, bucket);
          }
        }
      }
      frontier = next;
    }

    const depths = [...byDepth.keys()].filter((d) => d >= minPar && d <= maxPar);
    if (depths.length === 0) continue;
    const par = pick(depths);
    const starts = byDepth.get(par)!;
    return { start: pick(starts), target, par };
  }
  // Practically unreachable for a real dictionary; kept for exhaustiveness.
  throw new Error("Could not generate a solo puzzle");
}

export type SoloMoveResult =
  | { accepted: true; won: boolean }
  | { accepted: false; error: string };

/** Same word rules as the multiplayer modes; playing the target wins. */
export function validateSoloMove(
  history: string[],
  target: string,
  word: string,
  dictionary: Set<string>
): SoloMoveResult {
  const w = word.trim().toLowerCase();
  if (w.length !== 4) return { accepted: false, error: "Word must be 4 letters long!" };
  if (history.includes(w)) return { accepted: false, error: "Word already used!" };
  if (!dictionary.has(w)) return { accepted: false, error: "That's not in my dictionary!" };
  if (!isOneLetterDifferent(history[history.length - 1], w)) {
    return { accepted: false, error: "Must change exactly one letter!" };
  }
  return { accepted: true, won: w === target };
}
