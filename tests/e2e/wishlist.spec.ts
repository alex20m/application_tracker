import type { Page } from "@playwright/test";
import { test, expect, clickAndAwaitAction } from "./fixtures";

/** The wishlist row for one entry, anchored by its stretched link. */
function row(page: Page, company: string) {
  const escaped = company.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return page
    .getByRole("link", { name: new RegExp(`^${escaped} – `) })
    .first()
    .locator("..");
}

/** Today in the browser's local timezone, as the app formats stored dates. */
function localToday(): { iso: string; display: string } {
  const d = new Date();
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
  return { iso, display: d.toLocaleDateString() };
}

async function createWishlistEntry(page: Page, company: string, role = "Wishlist Engineer") {
  await page.goto("/wishlist/new");
  await page.getByLabel(/company/i).fill(company);
  await page.getByLabel(/role/i).fill(role);
  await page.getByLabel(/location/i).fill("Oslo");
  await page.getByRole("button", { name: /add to wishlist/i }).click();
  await expect(page).toHaveURL("/wishlist");
  await expect(page.getByText(company)).toBeVisible();
}

/** Removes a wishlist entry through its detail page. */
async function removeWishlistEntry(page: Page, company: string) {
  await page.goto("/wishlist");
  await page.getByRole("link", { name: new RegExp(company, "i") }).click();
  await expect(page).toHaveURL(/\/wishlist\//);
  await page.getByRole("link", { name: /^Edit$/i }).click();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: /remove/i }).click();
  await expect(page).toHaveURL("/wishlist", { timeout: 10000 });
}

test.describe("Wishlist", () => {
  test("a wishlist entry is not counted as an application", async ({ page }) => {
    const company = `Wishlist Corp ${Date.now()}`;
    await createWishlistEntry(page, company);

    // A wishlist entry has not been applied to, so it must not appear among
    // applications — where it would distort every pipeline metric.
    await page.goto("/applications");
    await expect(page.getByText(company)).toHaveCount(0);

    await page.goto("/applications?filter=all");
    await expect(page.getByText(company)).toHaveCount(0);

    await removeWishlistEntry(page, company);
  });

  test("the apply dialog offers today as the applied date", async ({ page }) => {
    const company = `ApplyModal Corp ${Date.now()}`;
    await createWishlistEntry(page, company);

    await row(page, company).getByRole("button", { name: /^apply now/i }).click();

    await expect(page.getByRole("heading", { name: /mark as applied/i })).toBeVisible();
    // The date field is prefilled, so confirming straight away records today
    // rather than an empty date. The label points at the picker's trigger,
    // which displays the chosen date as locale text.
    await expect(page.getByLabel(/applied on/i)).toContainText(localToday().display);

    await page.getByRole("button", { name: /cancel/i }).click();
    await expect(page.getByRole("heading", { name: /mark as applied/i })).toHaveCount(0);

    await removeWishlistEntry(page, company);
  });

  test("applying moves the entry to applications and records the date", async ({ page }) => {
    const company = `Applied From Wishlist ${Date.now()}`;
    await createWishlistEntry(page, company, "Applied Role");

    // Scoped to this entry: a bare .first() would apply whichever row happened
    // to come first, and the assertions below would then be about that one.
    await row(page, company).getByRole("button", { name: /^apply now/i }).click();
    // The apply action is a server write; the list only drops the row once it
    // has been stored.
    await clickAndAwaitAction(page, page.getByRole("button", { name: /confirm/i }));

    await expect(page.getByText(company)).toHaveCount(0);

    await page.goto("/applications");
    const appRow = row(page, company);
    await expect(appRow).toBeVisible();
    // The applied date is what the whole analytics timeline is measured from.
    await expect(appRow).toContainText(localToday().display);

    // Cleanup — it is a real application now, so delete it as one.
    await page.getByRole("link", { name: new RegExp(company, "i") }).click();
    await expect(page).toHaveURL(/\/applications\//);
    await page.getByRole("link", { name: /^Edit$/i }).click();
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: /^delete$/i }).click();
    await expect(page).toHaveURL(/\/applications/, { timeout: 10000 });
  });

  test("an edited wishlist entry keeps its changes after a reload", async ({ page }) => {
    const company = `EditWishlist Corp ${Date.now()}`;
    await createWishlistEntry(page, company, "Original Role");

    await page.getByRole("link", { name: new RegExp(company, "i") }).click();
    await expect(page).toHaveURL(/\/wishlist\//);
    const detailUrl = page.url();
    await page.getByRole("link", { name: /^Edit$/i }).click();

    await page.getByLabel(/role/i).fill("Updated Role");
    await page.getByRole("button", { name: /save/i }).click();
    await expect(page).toHaveURL(/\/wishlist\//);

    // Reloading is the point: without it this only proves the page re-rendered
    // its own form state, not that anything was stored.
    await page.goto(detailUrl);
    await expect(page.getByText("Updated Role").first()).toBeVisible();
    await expect(page.getByText("Original Role")).toHaveCount(0);

    await removeWishlistEntry(page, company);
  });
});
