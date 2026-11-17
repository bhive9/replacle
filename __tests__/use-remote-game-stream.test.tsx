import { renderHook, act, waitFor } from "@testing-library/react";
import { useRemoteGameStream } from "@/hooks/useRemoteGameStream";
import type { RemoteGame } from "@/lib/remote-db";

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// jsdom has no EventSource; the subscription is a network boundary, so a fake
// lets tests drive pushes deterministically (testing-patterns: mocks at boundaries).
class FakeEventSource {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;

  static instances: FakeEventSource[] = [];

  url: string;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  readyState = FakeEventSource.CONNECTING;

  constructor(url: string) {
    this.url = url;
    FakeEventSource.instances.push(this);
  }

  close() {
    this.readyState = FakeEventSource.CLOSED;
  }

  emit(game: Partial<RemoteGame>) {
    this.onmessage?.({ data: JSON.stringify(game) });
  }

  connectionLost() {
    this.readyState = FakeEventSource.CLOSED;
    this.onerror?.(new Event("error"));
  }
}

const pushedGame = {
  id: "abc123",
  status: "playing",
  history: ["cold"],
  currentPlayer: 1,
} as unknown as RemoteGame;

beforeEach(() => {
  FakeEventSource.instances = [];
  mockPush.mockClear();
  mockReplace.mockClear();
  (global as { EventSource: unknown }).EventSource = FakeEventSource;
});

afterEach(() => {
  delete (global as { EventSource?: unknown }).EventSource;
});

describe("useRemoteGameStream", () => {
  it("opens an SSE subscription for the game", () => {
    renderHook(() => useRemoteGameStream("abc123", 1));
    expect(FakeEventSource.instances[0].url).toBe("/api/remote/game/abc123/stream");
  });

  it("starts without game state", () => {
    const { result } = renderHook(() => useRemoteGameStream("abc123", 1));
    expect(result.current.game).toBeNull();
    expect(result.current.error).toBe("");
  });

  it("applies game state pushed by the server", async () => {
    const { result } = renderHook(() => useRemoteGameStream("abc123", 1));
    act(() => FakeEventSource.instances[0].emit(pushedGame));
    await waitFor(() => expect(result.current.game?.status).toBe("playing"));
    expect(result.current.game?.history).toEqual(["cold"]);
  });

  it("redirects to the join screen when the server says the game is waiting", async () => {
    renderHook(() => useRemoteGameStream("abc123", 2));
    act(() =>
      FakeEventSource.instances[0].emit({ ...pushedGame, status: "waiting", history: [] })
    );
    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/game/remote/join/abc123?player=2")
    );
  });

  it("reports an error once the connection is closed for good", async () => {
    const { result } = renderHook(() => useRemoteGameStream("abc123", 1));
    act(() => FakeEventSource.instances[0].connectionLost());
    await waitFor(() => expect(result.current.error).not.toBe(""));
  });

  it("closes the subscription on unmount", () => {
    const { unmount } = renderHook(() => useRemoteGameStream("abc123", 1));
    const source = FakeEventSource.instances[0];
    unmount();
    expect(source.readyState).toBe(FakeEventSource.CLOSED);
  });
});
