export type GameStatus = "setup" | "playing" | "game_over";

export interface GameState {
  id: string;
  player1Name: string;
  player2Name: string;
  history: string[];
  currentPlayer: 1 | 2;
  status: GameStatus;
  winner: 1 | 2 | null;
  error: string | null;
  turnStartTime: number | null;
  timeRemaining: number;
  createdAt: number;
  updatedAt: number;
}

export const generateGameId = () => Math.random().toString(36).substring(2, 8);

export const StateMachine = {
  isValidTransition(current: GameStatus, next: GameStatus): boolean {
    const transitions: Record<GameStatus, GameStatus[]> = {
      setup: ["playing"],
      playing: ["game_over"],
      game_over: ["playing"],
    };
    return transitions[current].includes(next);
  },
};
