import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResetPasswordForm } from "@/components/reset-password-form";

const noopAction = vi.fn().mockResolvedValue({ success: false });

describe("ResetPasswordForm", () => {
  it("renders new password and confirm password fields", () => {
    render(<ResetPasswordForm action={noopAction} />);
    expect(screen.getByLabelText("New password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm new password")).toBeInTheDocument();
  });

  it("renders 'Set new password' submit button", () => {
    render(<ResetPasswordForm action={noopAction} />);
    expect(screen.getByRole("button", { name: /set new password/i })).toBeInTheDocument();
  });

  it("shows client-side error when passwords do not match", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm action={noopAction} />);

    await user.type(screen.getByLabelText("New password"), "password123");
    await user.type(screen.getByLabelText("Confirm new password"), "different123");
    await user.click(screen.getByRole("button", { name: /set new password/i }));

    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    expect(noopAction).not.toHaveBeenCalled();
  });

  it("shows client-side error when password is too short", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm action={noopAction} />);

    await user.type(screen.getByLabelText("New password"), "short");
    await user.type(screen.getByLabelText("Confirm new password"), "short");
    await user.click(screen.getByRole("button", { name: /set new password/i }));

    expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    expect(noopAction).not.toHaveBeenCalled();
  });

  it("shows client-side error when password has no number", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm action={noopAction} />);

    await user.type(screen.getByLabelText("New password"), "newpassword");
    await user.type(screen.getByLabelText("Confirm new password"), "newpassword");
    await user.click(screen.getByRole("button", { name: /set new password/i }));

    expect(screen.getByText(/must contain a number/i)).toBeInTheDocument();
    expect(noopAction).not.toHaveBeenCalled();
  });

  it("shows password criteria checklist below the password field", () => {
    render(<ResetPasswordForm action={noopAction} />);
    expect(screen.getByText("At least 8 characters")).toBeInTheDocument();
    expect(screen.getByText("Contains a letter")).toBeInTheDocument();
    expect(screen.getByText("Contains a number")).toBeInTheDocument();
  });
});
