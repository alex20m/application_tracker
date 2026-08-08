import { test, expect } from "@playwright/test";

/**
 * Visits every static route and asserts it actually rendered its own page.
 *
 * Asserting only "no error boundary is visible" would pass for a blank page, a
 * redirect to somewhere else, or a 500 rendered without that text — so each
 * route is checked against a heading only that page produces, plus the HTTP
 * status of the document response.
 */

const AUTHENTICATED_ROUTES = [
  { path: "/dashboard", heading: /good (morning|afternoon|evening)/i },
  { path: "/applications", heading: /^applications$/i },
  { path: "/applications/new", heading: /^add application$/i },
  { path: "/wishlist", heading: /^wishlist$/i },
  { path: "/wishlist/new", heading: /^add to wishlist$/i },
  { path: "/analytics", heading: /^analytics$/i },
  { path: "/settings", heading: /^settings$/i },
] as const;

const PUBLIC_ROUTES = [
  { path: "/login", heading: /^sign in$/i },
  { path: "/forgot-password", heading: /^reset password$/i },
] as const;

test.describe("page smoke — authenticated routes", () => {
  for (const { path, heading } of AUTHENTICATED_ROUTES) {
    test(`${path} serves its own page to a signed-in user`, async ({ page }) => {
      const response = await page.goto(path);

      expect(response?.status(), `${path} responded ${response?.status()}`).toBe(200);
      // The session is valid, so the middleware must not bounce us to login.
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
      await expect(page.getByText("application error", { exact: false })).not.toBeVisible();
    });
  }

  test("every authenticated route renders the app navigation", async ({ page }) => {
    for (const { path } of AUTHENTICATED_ROUTES) {
      await page.goto(path);
      await expect(
        page.getByRole("link", { name: /^applications$/i }).first(),
        `${path} is missing the app shell`
      ).toBeAttached();
    }
  });
});

test.describe("page smoke — public routes", () => {
  // Public routes don't need auth — test them with a fresh context
  test.use({ storageState: { cookies: [], origins: [] } });

  for (const { path, heading } of PUBLIC_ROUTES) {
    test(`${path} serves its own page without a session`, async ({ page }) => {
      const response = await page.goto(path);

      expect(response?.status(), `${path} responded ${response?.status()}`).toBe(200);
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
      await expect(page.getByText("application error", { exact: false })).not.toBeVisible();
    });
  }
});
