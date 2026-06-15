import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { InstallInstructionsModal } from "@/components/install-instructions-modal";

describe("InstallInstructionsModal", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    onClose.mockReset();
  });

  it("renders the dialog with the correct title for ios", () => {
    render(<InstallInstructionsModal platform="ios" onClose={onClose} />);
    expect(screen.getByRole("dialog", { name: /add to home screen/i })).toBeInTheDocument();
  });

  it("renders the dialog with the correct title for safari-macos", () => {
    render(<InstallInstructionsModal platform="safari-macos" onClose={onClose} />);
    expect(screen.getByRole("dialog", { name: /add to dock/i })).toBeInTheDocument();
  });

  it("renders the dialog with the correct title for desktop-chromium", () => {
    render(<InstallInstructionsModal platform="desktop-chromium" onClose={onClose} />);
    expect(screen.getByRole("dialog", { name: /install apptrack/i })).toBeInTheDocument();
  });

  it("calls onClose when the close button is clicked", () => {
    render(<InstallInstructionsModal platform="ios" onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the 'Got it' button is clicked", () => {
    render(<InstallInstructionsModal platform="ios" onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /got it/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the backdrop is clicked", () => {
    render(<InstallInstructionsModal platform="android" onClose={onClose} />);
    const backdrop = document.querySelector('[aria-hidden="true"]') as HTMLElement;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Escape is pressed", () => {
    render(<InstallInstructionsModal platform="other" onClose={onClose} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("portals the modal to document.body", () => {
    const { baseElement } = render(
      <InstallInstructionsModal platform="ios" onClose={onClose} />,
    );
    // The modal panel should be a descendant of body, not of the render root div.
    const dialog = screen.getByRole("dialog");
    expect(baseElement.contains(dialog)).toBe(true);
    // The render container (first child of baseElement before body) should NOT contain the dialog.
    // With createPortal the dialog is directly under document.body, not inside the #root div.
    const renderRoot = baseElement.firstElementChild;
    expect(renderRoot?.contains(dialog)).toBe(false);
  });
});
