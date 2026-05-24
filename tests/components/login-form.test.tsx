import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "@/components/login-form";

const noopAction = vi.fn().mockResolvedValue({ success: false });

describe("LoginForm", () => {
  it("renders email field always", () => {
    render(<LoginForm action={noopAction} />);
    expect(screen.getByPlaceholderText(/you@example\.com/i)).toBeInTheDocument();
  });

  it("renders password field in default (password) mode", () => {
    render(<LoginForm action={noopAction} />);
    expect(screen.getByPlaceholderText(/•{4,}/)).toBeInTheDocument();
  });

  it("shows 'Sign In' submit button by default", () => {
    render(<LoginForm action={noopAction} />);
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("switches to magic link mode when 'Use email sign-in link' is clicked", async () => {
    const user = userEvent.setup();
    render(<LoginForm action={noopAction} />);

    await user.click(screen.getByRole("button", { name: /use email sign-in link/i }));

    // Password field should be hidden
    expect(screen.queryByPlaceholderText(/•{4,}/)).not.toBeInTheDocument();
    // Submit label changes
    expect(screen.getByRole("button", { name: /send sign-in link/i })).toBeInTheDocument();
  });

  it("switches back to password mode when 'Use password' is clicked", async () => {
    const user = userEvent.setup();
    render(<LoginForm action={noopAction} />);

    await user.click(screen.getByRole("button", { name: /use email sign-in link/i }));
    await user.click(screen.getByRole("button", { name: /use password/i }));

    expect(screen.getByPlaceholderText(/•{4,}/)).toBeInTheDocument();
  });

  it("switches to signup mode when 'Create account' is clicked", async () => {
    const user = userEvent.setup();
    render(<LoginForm action={noopAction} />);

    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(screen.getByRole("button", { name: /create account/i, hidden: false })).toBeInTheDocument();
    // The toggle text flips to "Sign in instead"
    expect(screen.getByRole("button", { name: /sign in instead/i })).toBeInTheDocument();
  });

  it("hidden inputs carry the correct authMode and authIntent", () => {
    const { container } = render(<LoginForm action={noopAction} />);
    const authMode = container.querySelector('input[name="authMode"]') as HTMLInputElement;
    const authIntent = container.querySelector('input[name="authIntent"]') as HTMLInputElement;
    expect(authMode.value).toBe("password");
    expect(authIntent.value).toBe("signin");
  });

  it("hidden authMode changes to 'magic' after toggling", async () => {
    const user = userEvent.setup();
    const { container } = render(<LoginForm action={noopAction} />);

    await user.click(screen.getByRole("button", { name: /use email sign-in link/i }));

    const authMode = container.querySelector('input[name="authMode"]') as HTMLInputElement;
    expect(authMode.value).toBe("magic");
  });
});
