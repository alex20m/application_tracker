import { test, expect } from "@playwright/test";

// Auth tests run without storageState (fresh browser context)
test.use({ storageState: { cookies: [], origins: [] } });

const E2E_USER = process.env.E2E_USER ?? "admin@outlook.com";
const E2E_PASSWORD = process.env.E2E_PASSWORD ?? "admin@outlook.com";

test.describe("Authentication flows", () => {
  test("unauthenticated /applications redirects to /login with next param", async ({ page }) => {
    await page.goto("/applications");
    await expect(page).toHaveURL(/\/login/);
    expect(page.url()).toContain("next=/applications");
  });

  test("unauthenticated /sankey redirects to /login", async ({ page }) => {
    await page.goto("/sankey");
    await expect(page).toHaveURL(/\/login/);
  });

  test("sign in with email/password lands on /applications", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(E2E_USER);
    await page.getByLabel(/password/i).fill(E2E_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/applications/, { timeout: 15000 });
  });

  test("visiting /login while signed in redirects to /applications", async ({ page }) => {
    // Sign in first
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(E2E_USER);
    await page.getByLabel(/password/i).fill(E2E_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/applications/, { timeout: 15000 });

    // Now try visiting /login again
    await page.goto("/login");
    await expect(page).toHaveURL(/\/applications/);
  });

  test("sign out via /auth/signout redirects to /login", async ({ page }) => {
    // Sign in first
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(E2E_USER);
    await page.getByLabel(/password/i).fill(E2E_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/applications/, { timeout: 15000 });

    // Sign out
    await page.request.post("/auth/signout");
    await page.goto("/login");
    await expect(page).toHaveURL(/\/login/);
  });
});
