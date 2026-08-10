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

  describe("Code-entry step", () => {
    const sendAction = () =>
      vi.fn().mockResolvedValue({
        success: true,
        otpSent: true,
        message: "We sent a 6-digit code to your email. Enter it below to sign in.",
      });

    async function reachCodeStep(user: ReturnType<typeof userEvent.setup>, verify = noopVerify) {
      const result = render(<LoginForm action={sendAction()} verifyAction={verify} />);
      await user.click(screen.getByRole("button", { name: /use email code/i }));
      await user.type(screen.getByLabelText(/email/i), "user@example.com");
      await user.click(screen.getByRole("button", { name: /send code/i }));
      await screen.findByLabelText(/6-digit code/i);
      return result;
    }

    it("shows which address the code went to", async () => {
      const user = userEvent.setup();
      await reachCodeStep(user);

      expect(screen.getByText("user@example.com")).toBeInTheDocument();
    });

    it("renders the code as six separate slots", async () => {
      const user = userEvent.setup();
      await reachCodeStep(user);

      expect(screen.getAllByTestId("otp-slot")).toHaveLength(6);
    });

    it("keeps the verify button disabled until all six digits are entered", async () => {
      const user = userEvent.setup();
      await reachCodeStep(user);

      expect(screen.getByRole("button", { name: /verify code/i })).toBeDisabled();

      await user.type(screen.getByLabelText(/6-digit code/i), "12345");
      expect(screen.getByRole("button", { name: /verify code/i })).toBeDisabled();
    });

    it("enables the verify button once the code is complete", async () => {
      const user = userEvent.setup();
      await reachCodeStep(user);

      await user.type(screen.getByLabelText(/6-digit code/i), "123456");

      expect(screen.getByRole("button", { name: /verify/i })).toBeEnabled();
    });

    it("submits the code as soon as the sixth digit is typed", async () => {
      const user = userEvent.setup();
      const verify = vi.fn().mockResolvedValue({ success: false });
      await reachCodeStep(user, verify);

      await user.type(screen.getByLabelText(/6-digit code/i), "123456");

      expect(verify).toHaveBeenCalledOnce();
      const formData = verify.mock.calls[0][1] as FormData;
      expect(formData.get("token")).toBe("123456");
      expect(formData.get("email")).toBe("user@example.com");
    });

    it("does not submit a partial code", async () => {
      const user = userEvent.setup();
      const verify = vi.fn().mockResolvedValue({ success: false });
      await reachCodeStep(user, verify);

      await user.type(screen.getByLabelText(/6-digit code/i), "12345");

      expect(verify).not.toHaveBeenCalled();
    });

    it("marks the code field invalid when verification failed", async () => {
      const user = userEvent.setup();
      const verify = vi
        .fn()
        .mockResolvedValue({ success: false, error: "That code is invalid or has expired. Please try again." });
      await reachCodeStep(user, verify);

      await user.type(screen.getByLabelText(/6-digit code/i), "123456");

      expect(
        await screen.findByText(/that code is invalid or has expired/i)
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/6-digit code/i)).toHaveAttribute("aria-invalid", "true");
    });

    it("clears the rejected code so the next one can be typed straight away", async () => {
      const user = userEvent.setup();
      const verify = vi.fn().mockResolvedValue({ success: false, error: "That code is invalid." });
      await reachCodeStep(user, verify);

      await user.type(screen.getByLabelText(/6-digit code/i), "123456");
      await screen.findByText(/that code is invalid/i);

      const codeField = screen.getByLabelText(/6-digit code/i) as HTMLInputElement;
      expect(codeField.value).toBe("");
      expect(codeField).toHaveFocus();
    });

    it("stops flagging the code as invalid once the user retypes", async () => {
      const user = userEvent.setup();
      const verify = vi.fn().mockResolvedValue({ success: false, error: "That code is invalid." });
      await reachCodeStep(user, verify);

      await user.type(screen.getByLabelText(/6-digit code/i), "123456");
      await screen.findByText(/that code is invalid/i);
      await user.type(screen.getByLabelText(/6-digit code/i), "7");

      expect(screen.getByLabelText(/6-digit code/i)).toHaveAttribute("aria-invalid", "false");
    });

    it("resubmits a second code after the first was rejected", async () => {
      const user = userEvent.setup();
      const verify = vi.fn().mockResolvedValue({ success: false, error: "That code is invalid." });
      await reachCodeStep(user, verify);

      await user.type(screen.getByLabelText(/6-digit code/i), "123456");
      await screen.findByText(/that code is invalid/i);
      await user.type(screen.getByLabelText(/6-digit code/i), "654321");

      expect(verify).toHaveBeenCalledTimes(2);
      expect((verify.mock.calls[1][1] as FormData).get("token")).toBe("654321");
    });
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
