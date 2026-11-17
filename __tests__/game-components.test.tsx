import { render, screen, fireEvent } from "@testing-library/react";
import GamePageContainer from "@/components/game/GamePageContainer";
import GameHeader from "@/components/game/GameHeader";
import WordDisplay from "@/components/game/WordDisplay";
import HistoryList from "@/components/game/HistoryList";
import WordInput from "@/components/game/WordInput";
import GameOverScreen from "@/components/game/GameOverScreen";

describe("GamePageContainer", () => {
  it("renders its children", () => {
    render(
      <GamePageContainer>
        <p>game content</p>
      </GamePageContainer>
    );
    expect(screen.getByText("game content")).toBeInTheDocument();
  });
});

describe("GameHeader", () => {
  it("renders the Replacle title as the page's h1", () => {
    render(<GameHeader onNewGame={() => {}} />);
    const heading = screen.getByRole("heading", { level: 1, name: /replacle/i });
    expect(heading).toBeInTheDocument();
  });

  it("reports new-game clicks through an accessible name", () => {
    const onNewGame = jest.fn();
    render(<GameHeader onNewGame={onNewGame} />);
    const button = screen.getByRole("button", { name: /new game/i });
    fireEvent.click(button);
    expect(onNewGame).toHaveBeenCalledTimes(1);
  });

  it("can disable the new game action while a request is in flight", () => {
    const onNewGame = jest.fn();
    render(<GameHeader onNewGame={onNewGame} newGameDisabled />);
    expect(screen.getByRole("button", { name: /new game/i })).toBeDisabled();
    expect(onNewGame).not.toHaveBeenCalled();
  });
});

describe("WordDisplay", () => {
  it("renders each letter of the current word as its own tile", () => {
    render(<WordDisplay word="cold" />);
    for (const letter of ["C", "O", "L", "D"]) {
      expect(screen.getByText(letter)).toBeInTheDocument();
    }
  });

  it("labels the current-word section", () => {
    render(<WordDisplay word="cold" />);
    expect(screen.getByText(/current word/i)).toBeInTheDocument();
  });
});

describe("HistoryList", () => {
  it("renders every played word as a chip", () => {
    render(<HistoryList history={["cold", "cord", "card"]} />);
    for (const word of ["COLD", "CORD", "CARD"]) {
      expect(screen.getByText(word)).toBeInTheDocument();
    }
  });

  it("is an announced live region keyboard users can scroll", () => {
    render(<HistoryList history={["cold"]} />);
    const log = screen.getByRole("log", { name: /move history/i });
    expect(log).toHaveAttribute("tabindex", "0");
  });
});

describe("WordInput", () => {
  const setup = (overrides: Partial<Parameters<typeof WordInput>[0]> = {}) => {
    const props = {
      value: "",
      onChange: jest.fn(),
      onSubmit: jest.fn(),
      ...overrides,
    };
    render(<WordInput {...props} />);
    return props;
  };

  it("submits on Enter and on button click", () => {
    const props = setup({ value: "cord" });
    fireEvent.keyDown(screen.getByLabelText(/your word/i), { key: "Enter" });
    expect(props.onSubmit).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /submit word/i }));
    expect(props.onSubmit).toHaveBeenCalledTimes(2);
  });

  it("does not submit an empty word", () => {
    const props = setup({ value: "" });
    fireEvent.keyDown(screen.getByLabelText(/your word/i), { key: "Enter" });
    expect(props.onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /submit word/i })).toBeDisabled();
  });

  it("uppercases and caps input at four characters", () => {
    const props = setup();
    fireEvent.change(screen.getByLabelText(/your word/i), { target: { value: "cord" } });
    expect(props.onChange).toHaveBeenCalledWith("CORD");

    fireEvent.change(screen.getByLabelText(/your word/i), { target: { value: "cordx" } });
    expect(props.onChange).toHaveBeenCalledWith("CORD");
  });

  it("is disabled while the player cannot act", () => {
    const props = setup({ value: "cord", disabled: true });
    expect(screen.getByLabelText(/your word/i)).toBeDisabled();
    expect(screen.getByRole("button", { name: /submit word/i })).toBeDisabled();

    fireEvent.keyDown(screen.getByLabelText(/your word/i), { key: "Enter" });
    expect(props.onSubmit).not.toHaveBeenCalled();
  });

  it("shows the validation error and lets the player dismiss it", () => {
    const onClearError = jest.fn();
    setup({ error: "Word already used!", onClearError });
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Word already used!");

    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onClearError).toHaveBeenCalledTimes(1);
  });

  it("clears a visible error as soon as the player types", () => {
    const onClearError = jest.fn();
    setup({ error: "Word already used!", onClearError });
    fireEvent.change(screen.getByLabelText(/your word/i), { target: { value: "c" } });
    expect(onClearError).toHaveBeenCalledTimes(1);
  });
});

describe("GameOverScreen", () => {
  it("announces the winner and total words played", () => {
    render(
      <GameOverScreen
        winnerName="Alice"
        loserName="Bob"
        reason="no_moves"
        totalWords={9}
        onPlayAgain={() => {}}
      />
    );
    expect(screen.getByText(/alice wins!/i)).toBeInTheDocument();
    expect(screen.getByText(/total words played: 9/i)).toBeInTheDocument();
  });

  it("says a timeout win ran out of time", () => {
    render(
      <GameOverScreen
        winnerName="Alice"
        loserName="Bob"
        reason="timeout"
        totalWords={5}
        onPlayAgain={() => {}}
      />
    );
    expect(screen.getByText(/bob ran out of time!/i)).toBeInTheDocument();
  });

  it("says a no-moves win left the loser without options", () => {
    render(
      <GameOverScreen
        winnerName="Alice"
        loserName="Bob"
        reason="no_moves"
        totalWords={5}
        onPlayAgain={() => {}}
      />
    );
    expect(screen.getByText(/no valid moves left for bob/i)).toBeInTheDocument();
  });

  it("offers Play Again through the provided callback", () => {
    const onPlayAgain = jest.fn();
    render(
      <GameOverScreen
        winnerName="Alice"
        loserName="Bob"
        reason="no_moves"
        totalWords={5}
        onPlayAgain={onPlayAgain}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /play again/i }));
    expect(onPlayAgain).toHaveBeenCalledTimes(1);
  });

  it("disables Play Again while a rematch request is in flight", () => {
    render(
      <GameOverScreen
        winnerName="Alice"
        loserName="Bob"
        reason="no_moves"
        totalWords={5}
        onPlayAgain={() => {}}
        playAgainDisabled
      />
    );
    expect(screen.getByRole("button", { name: /play again/i })).toBeDisabled();
  });
});
