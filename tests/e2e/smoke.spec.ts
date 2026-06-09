import { test, expect } from "@playwright/test";

// Visits every static route and asserts the page renders without a crash.
// Dynamic routes like /applications/[id] are covered by the CRUD specs.

const AUTHENTICATED_ROUTES = [
  "/dashboard",
  "/applications",
  "/applications/new",
  "/wishlist",
  "/wishlist/new",
  "/analytics",
  "/settings",
];

const PUBLIC_ROUTES = ["/login", "/forgot-password"];

test.describe("page smoke — authenticated routes", () => {
  for (const route of AUTHENTICATED_ROUTES) {
    test(`${route} loads without crash`, async ({ page }) => {
      await page.goto(route);

      // Must not have been bounced to the login page
      await expect(page).not.toHaveURL(/\/login/, { timeout: 10000 });

      // Must not show a Next.js application error boundary
      await expect(
        page.getByText("application error", { exact: false }),
      ).not.toBeVisible();
    });
  }
});

test.describe("page smoke — public routes", () => {
  // Public routes don't need auth — test them with a fresh context
  test.use({ storageState: { cookies: [], origins: [] } });

  for (const route of PUBLIC_ROUTES) {
    test(`${route} loads without crash`, async ({ page }) => {
      await page.goto(route);

      await expect(
        page.getByText("application error", { exact: false }),
      ).not.toBeVisible();
    });
  }
});
