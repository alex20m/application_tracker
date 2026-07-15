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
const noopVerify = vi.fn().mockResolvedValue({ success: false });

function renderForm(action = noopAction) {
  return render(<LoginForm action={action} verifyAction={noopVerify} />);
}

describe("LoginForm", () => {
  it("renders email field always", () => {
    renderForm();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it("renders password field in default (password) mode", () => {
    renderForm();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("shows 'Sign In' submit button by default", () => {
    renderForm();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("switches to OTP mode when 'Use email code' is clicked", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: /use email code/i }));

    // Password field should be hidden
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
    // Submit label changes
    expect(screen.getByRole("button", { name: /send code/i })).toBeInTheDocument();
  });

  it("switches back to password mode when 'Use password' is clicked", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: /use email code/i }));
    await user.click(screen.getByRole("button", { name: /use password/i }));

    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("switches to signup mode when 'Create account' is clicked", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(screen.getByRole("button", { name: /create account/i, hidden: false })).toBeInTheDocument();
    // The toggle text flips to "Sign in instead"
    expect(screen.getByRole("button", { name: /sign in instead/i })).toBeInTheDocument();
  });

  it("hidden inputs carry the correct authMode and authIntent", () => {
    const { container } = renderForm();
    const authMode = container.querySelector('input[name="authMode"]') as HTMLInputElement;
    const authIntent = container.querySelector('input[name="authIntent"]') as HTMLInputElement;
    expect(authMode.value).toBe("password");
    expect(authIntent.value).toBe("signin");
  });

  it("hidden authMode changes to 'otp' after toggling", async () => {
    const user = userEvent.setup();
    const { container } = renderForm();

    await user.click(screen.getByRole("button", { name: /use email code/i }));

    const authMode = container.querySelector('input[name="authMode"]') as HTMLInputElement;
    expect(authMode.value).toBe("otp");
  });

  it("shows the code-entry step once a code has been sent", async () => {
    const user = userEvent.setup();
    const sendAction = vi
      .fn()
      .mockResolvedValue({ success: true, otpSent: true, message: "We sent a 6-digit code to your email." });
    renderForm(sendAction);

    await user.click(screen.getByRole("button", { name: /use email code/i }));
    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.click(screen.getByRole("button", { name: /send code/i }));

    expect(await screen.findByLabelText(/6-digit code/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /verify code/i })).toBeInTheDocument();
  });

  describe("Password criteria (signup mode)", () => {
    it("shows criteria checklist when in signup mode", async () => {
      const user = userEvent.setup();
      renderForm();

      await user.click(screen.getByRole("button", { name: /create account/i }));

      expect(screen.getByText("At least 8 characters")).toBeInTheDocument();
      expect(screen.getByText("Contains a letter")).toBeInTheDocument();
      expect(screen.getByText("Contains a number")).toBeInTheDocument();
    });

    it("does not show criteria in signin mode", () => {
      renderForm();
      expect(screen.queryByText("At least 8 characters")).not.toBeInTheDocument();
    });
  });

  describe("Forgot password link", () => {
    it("shows 'Forgot password?' link in default password+signin mode", () => {
      renderForm();
      expect(screen.getByRole("link", { name: /forgot password/i })).toBeInTheDocument();
    });

    it("links to /forgot-password", () => {
      renderForm();
      expect(screen.getByRole("link", { name: /forgot password/i })).toHaveAttribute(
        "href",
        "/forgot-password"
      );
    });

    it("hides 'Forgot password?' link in OTP mode", async () => {
      const user = userEvent.setup();
      renderForm();
      await user.click(screen.getByRole("button", { name: /use email code/i }));
      expect(screen.queryByRole("link", { name: /forgot password/i })).not.toBeInTheDocument();
    });

    it("hides 'Forgot password?' link in signup mode", async () => {
      const user = userEvent.setup();
      renderForm();
      await user.click(screen.getByRole("button", { name: /create account/i }));
      expect(screen.queryByRole("link", { name: /forgot password/i })).not.toBeInTheDocument();
    });
  });
});
