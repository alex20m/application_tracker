import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "@/components/login-form";

vi.mock("@/lib/env", () => ({
  NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
  APP_URL: "http://localhost:3000",
  ROUTES: {
    login: "/login",
    applications: "/applications",
    authCallback: "/api/auth/callback",
    signOut: "/auth/signout",
    forgotPassword: "/forgot-password",
    resetPassword: "/auth/reset-password",
    resetPasswordCallback: "/api/auth/reset-password",
  },
}));

const noopAction = vi.fn().mockResolvedValue({ success: false });

describe("LoginForm", () => {
  it("renders email field always", () => {
    render(<LoginForm action={noopAction} />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it("renders password field in default (password) mode", () => {
    render(<LoginForm action={noopAction} />);
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
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
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
    // Submit label changes
    expect(screen.getByRole("button", { name: /send sign-in link/i })).toBeInTheDocument();
  });

  it("switches back to password mode when 'Use password' is clicked", async () => {
    const user = userEvent.setup();
    render(<LoginForm action={noopAction} />);

    await user.click(screen.getByRole("button", { name: /use email sign-in link/i }));
    await user.click(screen.getByRole("button", { name: /use password/i }));

    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
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

  describe("Password criteria (signup mode)", () => {
    it("shows criteria checklist when in signup mode", async () => {
      const user = userEvent.setup();
      render(<LoginForm action={noopAction} />);

      await user.click(screen.getByRole("button", { name: /create account/i }));

      expect(screen.getByText("At least 8 characters")).toBeInTheDocument();
      expect(screen.getByText("Contains a letter")).toBeInTheDocument();
      expect(screen.getByText("Contains a number")).toBeInTheDocument();
    });

    it("does not show criteria in signin mode", () => {
      render(<LoginForm action={noopAction} />);
      expect(screen.queryByText("At least 8 characters")).not.toBeInTheDocument();
    });
  });

  describe("Forgot password link", () => {
    it("shows 'Forgot password?' link in default password+signin mode", () => {
      render(<LoginForm action={noopAction} />);
      expect(screen.getByRole("link", { name: /forgot password/i })).toBeInTheDocument();
    });

    it("links to /forgot-password", () => {
      render(<LoginForm action={noopAction} />);
      expect(screen.getByRole("link", { name: /forgot password/i })).toHaveAttribute(
        "href",
        "/forgot-password"
      );
    });

    it("hides 'Forgot password?' link in magic link mode", async () => {
      const user = userEvent.setup();
      render(<LoginForm action={noopAction} />);
      await user.click(screen.getByRole("button", { name: /use email sign-in link/i }));
      expect(screen.queryByRole("link", { name: /forgot password/i })).not.toBeInTheDocument();
    });

    it("hides 'Forgot password?' link in signup mode", async () => {
      const user = userEvent.setup();
      render(<LoginForm action={noopAction} />);
      await user.click(screen.getByRole("button", { name: /create account/i }));
      expect(screen.queryByRole("link", { name: /forgot password/i })).not.toBeInTheDocument();
    });
  });
});
