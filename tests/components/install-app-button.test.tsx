import { describe, it, expect, vi, afterEach } from "vitest";
import { act } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { InstallAppButton } from "@/components/install-app-button";
import type { BeforeInstallPromptEvent } from "@/lib/install";

// Stub isStandalone to always return false so the button is visible.
vi.mock("@/lib/install", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/install")>();
  return {
    ...actual,
    isStandalone: () => false,
    detectPlatform: () => "other" as const,
  };
});

function makePromptEvent(outcome: "accepted" | "dismissed"): BeforeInstallPromptEvent {
  return {
    preventDefault: vi.fn(),
    prompt: vi.fn().mockResolvedValue(undefined),
    userChoice: Promise.resolve({ outcome }),
  } as unknown as BeforeInstallPromptEvent;
}

describe("InstallAppButton", () => {
  afterEach(() => {
    window.__pwaInstallPrompt = undefined;
    vi.restoreAllMocks();
  });

  describe("variant=icon", () => {
    it("renders the install button", () => {
      render(<InstallAppButton variant="icon" />);
      expect(screen.getByRole("button", { name: /install apptrack/i })).toBeInTheDocument();
    });

    it("calls prompt() when a native install event is available and hides on accepted", async () => {
      const event = makePromptEvent("accepted");
      window.__pwaInstallPrompt = event;

      render(<InstallAppButton variant="icon" />);
      fireEvent.click(screen.getByRole("button", { name: /install apptrack/i }));

      await waitFor(() => {
        expect(event.prompt).toHaveBeenCalledTimes(1);
      });
      // Button should be hidden after accepted
      await waitFor(() => {
        expect(screen.queryByRole("button", { name: /install apptrack/i })).not.toBeInTheDocument();
      });
    });

    it("shows the instructions modal when no native prompt is available", async () => {
      window.__pwaInstallPrompt = undefined;

      render(<InstallAppButton variant="icon" />);
      fireEvent.click(screen.getByRole("button", { name: /install apptrack/i }));

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });

    it("shows the instructions modal when native prompt is dismissed", async () => {
      const event = makePromptEvent("dismissed");
      window.__pwaInstallPrompt = event;

      render(<InstallAppButton variant="icon" />);
      fireEvent.click(screen.getByRole("button", { name: /install apptrack/i }));

      await waitFor(() => {
        expect(event.prompt).toHaveBeenCalledTimes(1);
      });
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });

    it("picks up the prompt via pwa-install-available event after mount", async () => {
      window.__pwaInstallPrompt = undefined;
      render(<InstallAppButton variant="icon" />);

      // Simulate the SW script capturing the event after hydration.
      // Wrap in act() so the React state update from the event listener is
      // flushed before we click.
      const event = makePromptEvent("accepted");
      await act(async () => {
        window.__pwaInstallPrompt = event;
        window.dispatchEvent(new Event("pwa-install-available"));
      });

      fireEvent.click(screen.getByRole("button", { name: /install apptrack/i }));

      await waitFor(() => {
        expect(event.prompt).toHaveBeenCalledTimes(1);
      });
    });

    it("hides the button when appinstalled event fires", async () => {
      render(<InstallAppButton variant="icon" />);
      expect(screen.getByRole("button", { name: /install apptrack/i })).toBeInTheDocument();

      await act(async () => {
        window.dispatchEvent(new Event("appinstalled"));
      });

      expect(screen.queryByRole("button", { name: /install apptrack/i })).not.toBeInTheDocument();
    });
  });
});
