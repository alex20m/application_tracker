import { test as setup, expect } from "@playwright/test";
import path from "path";

const E2E_USER = process.env.E2E_USER ?? "admin@outlook.com";
const E2E_PASSWORD = process.env.E2E_PASSWORD ?? "admin@outlook.com";

const authFile = path.join(__dirname, ".auth/user.json");

setup("authenticate", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(E2E_USER);
  await page.getByLabel(/password/i).fill(E2E_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();

  // Wait for redirect to applications list after successful sign-in
  await expect(page).toHaveURL(/\/applications/, { timeout: 15000 });

  await page.context().storageState({ path: authFile });
});
