export function isOneLetterDifferent(word1: string, word2: string): boolean {
  if (word1.length !== word2.length) return false;
  let differences = 0;
  for (let i = 0; i < word1.length; i++) {
    if (word1[i] !== word2[i]) {
      differences++;
    }
  }
  return differences === 1;
}

export type GameStatus = "setup" | "playing" | "game_over";

export interface GameState {
  history: string[];
  currentPlayer: 1 | 2;
  status: GameStatus;
  winner: 1 | 2 | null;
  error: string | null;
}

export const INITIAL_STATE: GameState = {
  history: [],
  currentPlayer: 1,
  status: "setup",
  winner: null,
  error: null,
};

export function getValidMoves(currentWord: string, dictionary: Set<string>, history: string[]): string[] {
  const moves: string[] = [];
  for (const word of dictionary) {
    if (word.length === 4 && !history.includes(word) && isOneLetterDifferent(currentWord, word)) {
      moves.push(word);
    }
  }
  return moves;
}

export function checkGameOver(currentWord: string, dictionary: Set<string>, history: string[]): boolean {
  return getValidMoves(currentWord, dictionary, history).length === 0;
}