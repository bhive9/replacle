import { render, screen, act } from "@testing-library/react";
import TurnCountdown from "@/components/TurnCountdown";

jest.useFakeTimers();

beforeEach(() => {
  jest.setSystemTime(0);
});

describe("TurnCountdown", () => {
  it("shows the full turn limit immediately", () => {
    render(<TurnCountdown turnStartTime={0} />);
    expect(screen.getByText("30s")).toBeInTheDocument();
  });

  it("counts down once per second", () => {
    render(<TurnCountdown turnStartTime={0} />);
    act(() => jest.advanceTimersByTime(2000));
    expect(screen.getByText("28s")).toBeInTheDocument();
  });

  it("fires onTimeout exactly once when the limit is reached", () => {
    const onTimeout = jest.fn();
    render(<TurnCountdown turnStartTime={0} onTimeout={onTimeout} />);

    act(() => jest.advanceTimersByTime(30_000));
    expect(screen.getByText("0s")).toBeInTheDocument();
    expect(onTimeout).toHaveBeenCalledTimes(1);

    // The interval must stop after expiry — no repeated callbacks.
    act(() => jest.advanceTimersByTime(10_000));
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it("restarts the countdown when a new turn starts", () => {
    const { rerender } = render(<TurnCountdown turnStartTime={0} />);
    act(() => jest.advanceTimersByTime(10_000));
    expect(screen.getByText("20s")).toBeInTheDocument();

    // The new turn starts at the current time (10s after the first one); real
    // call sites remount per turn via key, which rerender exercises here.
    rerender(<TurnCountdown key="turn-2" turnStartTime={10_000} />);
    expect(screen.getByText("30s")).toBeInTheDocument();
  });

  it("shows the full limit without an active turn", () => {
    render(<TurnCountdown turnStartTime={null} />);
    act(() => jest.advanceTimersByTime(60_000));
    expect(screen.getByText("30s")).toBeInTheDocument();
  });

  it("rounds up with sub-second ticks (remote-style countdown)", () => {
    render(<TurnCountdown turnStartTime={0} tickMs={250} rounding="ceil" />);
    act(() => jest.advanceTimersByTime(750));
    expect(screen.getByText("30s")).toBeInTheDocument();
    act(() => jest.advanceTimersByTime(250));
    expect(screen.getByText("29s")).toBeInTheDocument();
  });
});
