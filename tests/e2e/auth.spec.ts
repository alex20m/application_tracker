import { test, expect, type Page } from "@playwright/test";

// Auth tests run without storageState (fresh browser context)
test.use({ storageState: { cookies: [], origins: [] } });

// Validated at config load time (playwright.config.ts). No fallback: a default
// credential would turn "the env is not configured" into a confusing auth
// failure several steps later.
const E2E_USER = process.env.E2E_USER!;
const E2E_PASSWORD = process.env.E2E_PASSWORD!;

// The single message the sign-in path reports for every failure, deliberately
// identical for a wrong password and an unregistered email.
const SIGN_IN_FAILURE_MESSAGE = "Invalid credentials or request failed.";

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(E2E_USER);
  await page.getByLabel(/password/i).fill(E2E_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
}

test.describe("Authentication flows", () => {
  test.describe("signed out", () => {
    test("sends a protected page to login and remembers where to return", async ({ page }) => {
      await page.goto("/applications");

      await expect(page).toHaveURL(/\/login/);
      expect(decodeURIComponent(page.url())).toContain("next=/applications");
      // The protected page's own content must not have been served.
      await expect(page.getByRole("heading", { name: /^applications$/i })).not.toBeVisible();
    });

    for (const path of ["/analytics", "/settings", "/wishlist", "/dashboard"]) {
      test(`sends ${path} to login`, async ({ page }) => {
        await page.goto(path);
        await expect(page).toHaveURL(/\/login/);
      });
    }

    test("does not serve another user's application by direct link", async ({ page }) => {
      await page.goto("/applications/a1b2c3d4-e5f6-4000-a000-000000000001");
      await expect(page).toHaveURL(/\/login/);
    });

    async function attemptSignIn(page: Page, email: string, password: string) {
      await page.goto("/login");
      await page.getByLabel(/email/i).fill(email);
      await page.getByLabel(/password/i).fill(password);
      await page.getByRole("button", { name: /sign in/i }).click();
      const banner = page.getByText(SIGN_IN_FAILURE_MESSAGE);
      await expect(banner).toBeVisible({ timeout: 15000 });
      return banner;
    }

    test("rejects a wrong password and stays signed out", async ({ page }) => {
      await attemptSignIn(page, E2E_USER, "definitely-not-the-password-1");

      await expect(page).toHaveURL(/\/login/);
      // The failed attempt must not have established a session.
      await page.goto("/applications");
      await expect(page).toHaveURL(/\/login/);
    });

    test("gives the same rejection for an unknown email as for a wrong password", async ({
      page,
    }) => {
      // Differing messages would turn the login form into an account-enumeration
      // oracle, so both paths must report the same thing.
      const unknown = await attemptSignIn(
        page,
        `nobody-${Date.now()}@example.com`,
        "definitely-not-the-password-1"
      );
      const unknownText = await unknown.textContent();

      const wrongPassword = await attemptSignIn(page, E2E_USER, "definitely-not-the-password-1");

      expect(await wrongPassword.textContent()).toBe(unknownText);
      expect(unknownText).not.toMatch(/no account|not found|unregistered|does not exist/i);
    });
  });

  test.describe("signed in", () => {
    test("sign in with email/password lands on /dashboard", async ({ page }) => {
      await signIn(page);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });

    test("can reach a protected page after signing in", async ({ page }) => {
      await signIn(page);

      await page.goto("/applications");

      await expect(page).toHaveURL(/\/applications$/);
      await expect(page.getByRole("heading", { name: /^applications$/i })).toBeVisible();
    });

    test("visiting /login while signed in redirects to /dashboard", async ({ page }) => {
      await signIn(page);

      await page.goto("/login");

      await expect(page).toHaveURL(/\/dashboard/);
    });

    test("signing out revokes access to protected pages", async ({ page }) => {
      await signIn(page);

      await page.request.post("/auth/signout");

      // The real contract is not "we land on /login" but "the session is gone":
      // a protected page must now bounce us out again.
      await page.goto("/applications");
      await expect(page).toHaveURL(/\/login/);
      await expect(page.getByRole("heading", { name: /^applications$/i })).not.toBeVisible();
    });
  });
});
