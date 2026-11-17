import { render, screen, fireEvent } from "@testing-library/react";
import SoloWinScreen from "@/components/game/SoloWinScreen";

describe("SoloWinScreen", () => {
  const renderWin = (overrides = {}) =>
    render(<SoloWinScreen moves={5} par={4} target="warm" onPlayAgain={() => {}} {...overrides} />);

  it("celebrates the solve and shows the ladder stats", () => {
    renderWin();
    expect(screen.getByText(/you made it to warm!/i)).toBeInTheDocument();
    expect(screen.getByText(/solved in 5 moves/i)).toBeInTheDocument();
    expect(screen.getByText(/par was 4/i)).toBeInTheDocument();
  });

  it("marks a par-perfect solve", () => {
    renderWin({ moves: 4 });
    expect(screen.getByText(/perfect ladder/i)).toBeInTheDocument();
  });

  it("names the target word", () => {
    renderWin();
    expect(screen.getByText(/warm/i)).toBeInTheDocument();
  });

  it("starts a new puzzle through the provided callback", () => {
    const onPlayAgain = jest.fn();
    renderWin({ onPlayAgain });
    fireEvent.click(screen.getByRole("button", { name: /new puzzle/i }));
    expect(onPlayAgain).toHaveBeenCalledTimes(1);
  });
});
