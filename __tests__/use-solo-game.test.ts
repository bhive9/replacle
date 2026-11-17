import { renderHook, act, waitFor } from "@testing-library/react";
import { useSoloGame } from "@/hooks/useSoloGame";

// cold → cord → card → ward → warm : a clean 4-step ladder
const dictionary = new Set(["cold", "cord", "card", "ward", "warm", "word", "wold"]);
const STORAGE_KEY = "replacle:solo";

beforeEach(() => {
  localStorage.clear();
});

describe("useSoloGame", () => {
  it("stays loading until the dictionary is ready", () => {
    const { result } = renderHook(() => useSoloGame(false, dictionary));
    expect(result.current.status).toBe("loading");
    expect(result.current.puzzle).toBeNull();
  });

  it("generates a solvable puzzle once the dictionary arrives", async () => {
    const { result } = renderHook(() => useSoloGame(true, dictionary));
    await waitFor(() => expect(result.current.status).toBe("playing"));
    const { puzzle, history } = result.current;
    expect(dictionary.has(puzzle!.start)).toBe(true);
    expect(dictionary.has(puzzle!.target)).toBe(true);
    expect(puzzle!.start).not.toBe(puzzle!.target);
    expect(history).toEqual([puzzle!.start]);
  });

  it("accepts a legal move and remembers it across reloads", async () => {
    const { result } = renderHook(() => useSoloGame(true, dictionary));
    await waitFor(() => expect(result.current.status).toBe("playing"));
    const start = result.current.puzzle!.start;
    const move = [...dictionary].find(
      (w) => w !== start && shortestStep(start, w)
    )!;
    const target = result.current.puzzle!.target;
    if (move === target) return; // puzzle was trivial; other tests cover wins

    act(() => result.current.play(move));
    expect(result.current.history).toEqual([start, move]);

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(saved.history).toEqual([start, move]);

    const reloaded = renderHook(() => useSoloGame(true, dictionary));
    await waitFor(() => expect(reloaded.result.current.status).toBe("playing"));
    expect(reloaded.result.current.history).toEqual([start, move]);
    expect(reloaded.result.current.puzzle!.target).toBe(target);
  });

  it("rejects an illegal move without touching history", async () => {
    const { result } = renderHook(() => useSoloGame(true, dictionary));
    await waitFor(() => expect(result.current.status).toBe("playing"));
    const before = result.current.history;

    act(() => result.current.play("xxxx"));
    expect(result.current.history).toEqual(before);
    expect(result.current.error).toBe("That's not in my dictionary!");

    act(() => result.current.clearError());
    expect(result.current.error).toBeNull();
  });

  it("wins when the target is played and clears the saved run", async () => {
    const { result } = renderHook(() => useSoloGame(true, dictionary));
    await waitFor(() => expect(result.current.status).toBe("playing"));
    const target = result.current.puzzle!.target;

    // Walk the BFS ladder to the target so the win is reached legally.
    const ladder = solveTo(result.current.puzzle!.start, target, dictionary);
    for (const word of ladder.slice(1)) {
      act(() => result.current.play(word));
    }
    expect(result.current.status).toBe("won");
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("discards a corrupt saved game and starts fresh", async () => {
    localStorage.setItem(STORAGE_KEY, "{not json");
    const { result } = renderHook(() => useSoloGame(true, dictionary));
    await waitFor(() => expect(result.current.status).toBe("playing"));
    expect(result.current.history).toHaveLength(1);
  });
});

function shortestStep(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diffs = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) diffs++;
  return diffs === 1;
}

function solveTo(start: string, target: string, dictionary: Set<string>): string[] {
  const visited = new Set([start]);
  const queue: Array<{ word: string; path: string[] }> = [{ word: start, path: [start] }];
  while (queue.length) {
    const { word, path } = queue.shift()!;
    for (let i = 0; i < word.length; i++) {
      for (const letter of "abcdefghijklmnopqrstuvwxyz") {
        if (letter === word[i]) continue;
        const candidate = word.slice(0, i) + letter + word.slice(i + 1);
        if (!dictionary.has(candidate) || visited.has(candidate)) continue;
        const nextPath = [...path, candidate];
        if (candidate === target) return nextPath;
        visited.add(candidate);
        queue.push({ word: candidate, path: nextPath });
      }
    }
  }
  throw new Error("unsolvable");
}
