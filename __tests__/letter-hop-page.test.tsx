import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import LetterHopPage from "@/app/game/letter-hop/page";

// cold → cord → card → ward → warm : a clean 4-step ladder.
// Depths from warm: ward/word 1, card 2, cord/wold 3, cold 4 — covers the
// easy (2–3) and medium (4–5) bands.
const dictionary = new Set(["cold", "cord", "card", "ward", "warm", "word", "wold"]);
const DIFFICULTY_KEY = "replacle:solo-difficulty";

const fetchDictionary = () =>
  Promise.resolve({ text: () => [...dictionary].join("\n") + "\n" } as unknown as Response);

const fetchPending = () => new Promise<Response>(() => {});

const oneLetterDiff = (a: string, b: string) =>
  a.length === b.length && [...a].filter((c, i) => c !== b[i]).length === 1;

const currentStart = () => {
  const tiles = screen.getByText("Start").parentElement!;
  return within(tiles)
    .getAllByText(/^[A-Z]$/)
    .map((el) => el.textContent)
    .join("")
    .toLowerCase();
};

const play = (word: string) => {
  fireEvent.change(screen.getByLabelText("Your word"), { target: { value: word } });
  fireEvent.keyDown(screen.getByLabelText("Your word"), { key: "Enter" });
};

/** Plays the first legal move away from whatever start word was generated. */
const playFirstMove = () => {
  const start = currentStart();
  const move = [...dictionary].find(
    (w) => w !== start && oneLetterDiff(start, w) && !screen.queryByText(new RegExp(w, "i"))
  )!;
  play(move);
  return move;
};

beforeEach(() => {
  localStorage.clear();
  global.fetch = jest.fn(fetchDictionary) as unknown as typeof fetch;
});

afterEach(() => {
  (global.fetch as jest.Mock).mockReset();
});

describe("LetterHopPage", () => {
  it("shows a skeleton with a status announcement while the dictionary loads", async () => {
    global.fetch = jest.fn(fetchPending) as unknown as typeof fetch;
    render(<LetterHopPage />);
    expect(screen.getByRole("status")).toHaveTextContent(/shuffling a puzzle/i);
    expect(screen.getAllByTestId("skeleton-tile").length).toBeGreaterThan(0);
  });

  it("groups the difficulty chips under an accessible label", async () => {
    render(<LetterHopPage />);
    const group = await screen.findByRole("group", { name: /difficulty/i });
    for (const name of ["Easy", "Medium", "Hard"]) {
      expect(within(group).getByRole("button", { name })).toBeInTheDocument();
    }
  });

  it("switches difficulty immediately when no moves have been made", async () => {
    render(<LetterHopPage />);
    await screen.findByText("Target");
    fireEvent.click(screen.getByRole("button", { name: "Easy" }));
    await waitFor(() => expect(screen.getByText(/par [23]/i)).toBeInTheDocument());
  });

  it("asks for confirmation before discarding an in-progress run", async () => {
    render(<LetterHopPage />);
    await screen.findByText("Target");
    const move = playFirstMove();
    await waitFor(() => expect(screen.getByText(move.toUpperCase())).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Easy" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent(/start over/i);
    expect(dialog).toHaveTextContent(/discarded/i);

    fireEvent.click(within(dialog).getByRole("button", { name: /cancel/i }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByText(move.toUpperCase())).toBeInTheDocument(); // run kept
  });

  it("starts the confirmed difficulty after confirmation", async () => {
    render(<LetterHopPage />);
    await screen.findByText("Target");
    const move = playFirstMove();
    await waitFor(() => expect(screen.getByText(move.toUpperCase())).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Easy" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: /start over/i }));
    await waitFor(() => expect(screen.getByText(/par [23]/i)).toBeInTheDocument());
    expect(screen.queryByText(move.toUpperCase())).not.toBeInTheDocument();
  });

  it("keeps the chosen difficulty across reloads", async () => {
    const { unmount } = render(<LetterHopPage />);
    await screen.findByText("Target");
    fireEvent.click(screen.getByRole("button", { name: "Easy" }));
    await waitFor(() => expect(screen.getByText(/par [23]/i)).toBeInTheDocument());
    expect(localStorage.getItem(DIFFICULTY_KEY)).toBe("easy");
    unmount();

    render(<LetterHopPage />);
    await screen.findByText("Target");
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Easy" })).toHaveAttribute("aria-pressed", "true")
    );
  });

  it("badges the hint button with the number of hints used", async () => {
    render(<LetterHopPage />);
    await screen.findByText("Target");
    fireEvent.click(screen.getByRole("button", { name: /hint: reveal/i }));
    await waitFor(() => expect(screen.getByText("1")).toBeInTheDocument());
  });
});
