import { test, expect } from "./fixtures";

const COMPANY = `Wishlist Corp ${Date.now()}`;
const ROLE = "Wishlist Engineer";
const LOCATION = "Oslo";

test.describe("Wishlist", () => {
  test("create a wishlist entry — appears on /wishlist, not on /applications", async ({
    page,
  }) => {
    await page.goto("/wishlist/new");
    await page.getByLabel(/company/i).fill(COMPANY);
    await page.getByLabel(/role/i).fill(ROLE);
    await page.getByLabel(/location/i).fill(LOCATION);
    await page.getByRole("button", { name: /add to wishlist/i }).click();

    await expect(page).toHaveURL("/wishlist");
    await expect(page.getByText(COMPANY)).toBeVisible();

    // Should NOT appear on /applications
    await page.goto("/applications");
    await expect(page.getByText(COMPANY)).not.toBeVisible();

    // Cleanup
    await page.goto("/wishlist");
    await page.getByRole("link", { name: new RegExp(COMPANY, "i") }).click();
    await expect(page).toHaveURL(/\/wishlist\//);
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: /remove/i }).click();
    await expect(page).toHaveURL("/wishlist", { timeout: 10000 });
  });

  test("clicking Apply opens a modal with today's date", async ({ page }) => {
    // Create a wishlist entry first
    await page.goto("/wishlist/new");
    const company = `ApplyModal Corp ${Date.now()}`;
    await page.getByLabel(/company/i).fill(company);
    await page.getByLabel(/role/i).fill("Test Role");
    await page.getByLabel(/location/i).fill("Remote");
    await page.getByRole("button", { name: /add to wishlist/i }).click();
    await expect(page).toHaveURL("/wishlist");

    // Click Apply
    await page.getByRole("button", { name: /^apply$/i }).first().click();

    // Modal should be visible with a date input
    await expect(page.getByRole("heading", { name: /mark as applied/i })).toBeVisible();
    await expect(page.getByLabel(/applied on/i)).toBeVisible();

    // Close modal
    await page.getByRole("button", { name: /cancel/i }).click();

    // Cleanup
    await page.goto("/wishlist");
    await page.getByRole("link", { name: new RegExp(company, "i") }).click();
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: /remove/i }).click();
    await expect(page).toHaveURL("/wishlist", { timeout: 10000 });
  });

  test("applying moves row from wishlist to /applications with chosen date", async ({
    page,
  }) => {
    const company = `Applied From Wishlist ${Date.now()}`;
    await page.goto("/wishlist/new");
    await page.getByLabel(/company/i).fill(company);
    await page.getByLabel(/role/i).fill("Applied Role");
    await page.getByLabel(/location/i).fill("Remote");
    await page.getByRole("button", { name: /add to wishlist/i }).click();
    await expect(page).toHaveURL("/wishlist");

    // Apply with a specific date
    await page.getByRole("button", { name: /^apply$/i }).first().click();
    // Fill the hidden date input inside the open dialog (the visible element is a trigger button)
    await page.locator("dialog[open] input[name='applied_on']").fill("2026-01-15", { force: true });
    await page.getByRole("button", { name: /confirm/i }).click();

    // Row should no longer be on /wishlist
    await expect(page.getByText(company)).not.toBeVisible({ timeout: 10000 });

    // Row should appear on /applications
    await page.goto("/applications");
    await expect(page.getByText(company)).toBeVisible();

    // Cleanup — delete from applications
    await page.getByRole("link", { name: new RegExp(company, "i") }).click();
    await expect(page).toHaveURL(/\/applications\//);
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: /delete/i }).click();
    await expect(page).toHaveURL("/applications", { timeout: 10000 });
  });

  test("editing a wishlist entry persists changes", async ({ page }) => {
    const company = `EditWishlist Corp ${Date.now()}`;
    await page.goto("/wishlist/new");
    await page.getByLabel(/company/i).fill(company);
    await page.getByLabel(/role/i).fill("Original Role");
    await page.getByLabel(/location/i).fill("Remote");
    await page.getByRole("button", { name: /add to wishlist/i }).click();
    await expect(page).toHaveURL("/wishlist");

    // Navigate to edit page
    await page.getByRole("link", { name: new RegExp(company, "i") }).click();
    await expect(page).toHaveURL(/\/wishlist\//);

    await page.getByLabel(/role/i).fill("Updated Role");
    await page.getByRole("button", { name: /save/i }).click();

    await expect(page).toHaveURL("/wishlist");
    await expect(page.getByText("Updated Role").first()).toBeVisible();

    // Cleanup
    await page.getByRole("link", { name: new RegExp(company, "i") }).click();
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: /remove/i }).click();
    await expect(page).toHaveURL("/wishlist", { timeout: 10000 });
  });
});
