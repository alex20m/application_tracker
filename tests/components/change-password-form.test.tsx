import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChangePasswordForm } from "@/components/change-password-form";

const noopAction = vi.fn().mockResolvedValue({ success: false });

describe("ChangePasswordForm", () => {
  it("renders current, new, and confirm password fields", () => {
    render(<ChangePasswordForm action={noopAction} />);
    expect(screen.getByLabelText("Current password")).toBeInTheDocument();
    expect(screen.getByLabelText("New password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm new password")).toBeInTheDocument();
  });

  it("renders 'Update password' submit button", () => {
    render(<ChangePasswordForm action={noopAction} />);
    expect(screen.getByRole("button", { name: /update password/i })).toBeInTheDocument();
  });

  it("shows client-side error when new passwords do not match", async () => {
    const user = userEvent.setup();
    render(<ChangePasswordForm action={noopAction} />);

    await user.type(screen.getByLabelText("Current password"), "current1234");
    await user.type(screen.getByLabelText("New password"), "newpassword1");
    await user.type(screen.getByLabelText("Confirm new password"), "different123");
    await user.click(screen.getByRole("button", { name: /update password/i }));

    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    expect(noopAction).not.toHaveBeenCalled();
  });

  it("shows client-side error when new password is too short", async () => {
    const user = userEvent.setup();
    render(<ChangePasswordForm action={noopAction} />);

    await user.type(screen.getByLabelText("Current password"), "current1234");
    await user.type(screen.getByLabelText("New password"), "short");
    await user.type(screen.getByLabelText("Confirm new password"), "short");
    await user.click(screen.getByRole("button", { name: /update password/i }));

    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    expect(noopAction).not.toHaveBeenCalled();
  });

  it("shows success message from server state", async () => {
    const successAction = vi.fn().mockResolvedValue({ success: true, message: "Password updated." });
    const user = userEvent.setup();
    render(<ChangePasswordForm action={successAction} />);

    await user.type(screen.getByLabelText("Current password"), "current1234");
    await user.type(screen.getByLabelText("New password"), "newpassword1");
    await user.type(screen.getByLabelText("Confirm new password"), "newpassword1");
    await user.click(screen.getByRole("button", { name: /update password/i }));

    expect(await screen.findByText(/password updated/i)).toBeInTheDocument();
  });
});
