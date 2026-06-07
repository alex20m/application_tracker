import { test as setup, expect } from "@playwright/test";
import path from "path";

// Validated at config load time (playwright.config.ts) — safe to assert here
const E2E_USER = process.env.E2E_USER!;
const E2E_PASSWORD = process.env.E2E_PASSWORD!;

const authFile = path.join(__dirname, ".auth/user.json");

setup("authenticate", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(E2E_USER);
  await page.getByLabel(/password/i).fill(E2E_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();

  // Wait for redirect to dashboard after successful sign-in
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

  await page.context().storageState({ path: authFile });
});
