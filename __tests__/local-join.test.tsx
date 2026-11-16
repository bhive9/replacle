import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LocalGameJoin from "@/app/game/local/join/page";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

const fetchMock = jest.fn();

// jsdom has no Response global; the component only uses ok/status/json.
const jsonResponse = (body: object, status: number) => ({
  ok: status < 400,
  status,
  json: async () => body,
});

beforeEach(() => {
  mockPush.mockClear();
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof global.fetch;
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "debug").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

function fillPlayerNames(player1: string, player2: string) {
  fireEvent.change(screen.getByLabelText(/player 1 name/i), { target: { value: player1 } });
  fireEvent.change(screen.getByLabelText(/player 2 name/i), { target: { value: player2 } });
}

describe("LocalGameJoin", () => {
  it("renders the local game heading and both name inputs", () => {
    render(<LocalGameJoin />);
    expect(screen.getByRole("heading", { name: /local game/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/player 1 name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/player 2 name/i)).toBeInTheDocument();
  });

  it("disables Start Game until both player names are entered", () => {
    render(<LocalGameJoin />);
    const start = screen.getByRole("button", { name: /start game/i });

    expect(start).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/player 1 name/i), { target: { value: "Alice" } });
    expect(start).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/player 2 name/i), { target: { value: "Bob" } });
    expect(start).toBeEnabled();
  });

  it("does not call the API when the button is still disabled", () => {
    render(<LocalGameJoin />);
    fireEvent.click(screen.getByRole("button", { name: /start game/i }));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("creates the game with trimmed names and navigates to it", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ gameId: "abc123" }, 200));
    render(<LocalGameJoin />);
    fillPlayerNames("  Alice  ", "Bob");
    fireEvent.click(screen.getByRole("button", { name: /start game/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/local/start",
        expect.objectContaining({ method: "POST" })
      );
    });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      player1Name: "Alice",
      player2Name: "Bob",
    });
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/game/local/abc123");
    });
  });

  it("stays on the page and logs when the API reports a failure", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: "nope" }, 500));
    render(<LocalGameJoin />);
    fillPlayerNames("Alice", "Bob");
    fireEvent.click(screen.getByRole("button", { name: /start game/i }));

    await waitFor(() => expect(console.error).toHaveBeenCalledWith("Failed to start game"));
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("stays on the page and logs when the network request fails", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    render(<LocalGameJoin />);
    fillPlayerNames("Alice", "Bob");
    fireEvent.click(screen.getByRole("button", { name: /start game/i }));

    await waitFor(() => expect(console.error).toHaveBeenCalledWith("Error starting game", expect.any(Error)));
    expect(mockPush).not.toHaveBeenCalled();
  });
});
