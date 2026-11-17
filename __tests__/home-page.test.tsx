import { render, screen, fireEvent } from "@testing-library/react";
import HomePage from "@/app/page";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

describe("HomePage", () => {
  it("renders a heading", () => {
    render(<HomePage />);
    const heading = screen.getByRole("heading", { name: /replacle/i });
    expect(heading).toBeInTheDocument();
  });

  it("navigates to the solo challenge when Solo Challenge is clicked", () => {
    render(<HomePage />);
    fireEvent.click(screen.getByRole("button", { name: /solo challenge/i }));
    expect(mockPush).toHaveBeenCalledWith("/game/solo");
  });

  it("navigates to the local join page when Pass and Play is clicked", () => {
    render(<HomePage />);
    fireEvent.click(screen.getByRole("button", { name: /pass and play/i }));
    expect(mockPush).toHaveBeenCalledWith("/game/local/join");
  });

  it("navigates to the remote lobby when Play Remote is clicked", () => {
    render(<HomePage />);
    fireEvent.click(screen.getByRole("button", { name: /play remote/i }));
    expect(mockPush).toHaveBeenCalledWith("/game/remote");
  });
});
