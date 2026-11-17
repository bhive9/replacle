import { render, screen } from "@testing-library/react";
import LadderGoal from "@/components/game/LadderGoal";
import HistoryList from "@/components/game/HistoryList";

describe("LadderGoal", () => {
  it("shows the start and target words with their roles", () => {
    render(<LadderGoal start="cold" target="warm" par={4} />);
    expect(screen.getByText(/start/i)).toBeInTheDocument();
    expect(screen.getByText(/target/i)).toBeInTheDocument();
    for (const letter of ["C", "O", "L", "D"]) {
      expect(screen.getByText(letter)).toBeInTheDocument();
    }
    for (const letter of ["W", "A", "R", "M"]) {
      expect(screen.getByText(letter)).toBeInTheDocument();
    }
  });

  it("shows the par to beat", () => {
    render(<LadderGoal start="cold" target="warm" par={4} />);
    expect(screen.getByText(/par/i)).toBeInTheDocument();
    expect(screen.getByText(/4/)).toBeInTheDocument();
  });
});

describe("HistoryList header action", () => {
  it("renders an action node at the end of the history header when given", () => {
    render(
      <HistoryList history={["cold"]} headerAction={<button>Reset</button>} />
    );
    expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
  });
});
