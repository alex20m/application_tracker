import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeleteAccountForm } from "@/components/delete-account-form";

const noopAction = vi.fn().mockResolvedValue({ success: false });

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(window, "confirm").mockReturnValue(true);
});

describe("DeleteAccountForm", () => {
  it("renders a password field and delete button", () => {
    render(<DeleteAccountForm action={noopAction} />);
    expect(screen.getByLabelText(/confirm your password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete my account/i })).toBeInTheDocument();
  });

  it("shows error banner from server state", async () => {
    const errorAction = vi.fn().mockResolvedValue({ success: false, error: "Incorrect password." });
    const user = userEvent.setup();
    render(<DeleteAccountForm action={errorAction} />);

    await user.type(screen.getByLabelText(/confirm your password/i), "wrongpass");
    await user.click(screen.getByRole("button", { name: /delete my account/i }));

    expect(await screen.findByText(/incorrect password/i)).toBeInTheDocument();
  });

  it("does not submit when confirm dialog is cancelled", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    render(<DeleteAccountForm action={noopAction} />);

    await user.type(screen.getByLabelText(/confirm your password/i), "mypassword");
    await user.click(screen.getByRole("button", { name: /delete my account/i }));

    expect(noopAction).not.toHaveBeenCalled();
  });
});
