import type { Locator, Page } from "@playwright/test";
import { test, expect } from "./fixtures";
import { STATUS_NAMES } from "@/lib/statuses";

/**
 * Every assertion here is scoped to the row of the application under test.
 * A page-wide `getByText("Applied")` would pass because some *other* row in the
 * shared E2E account happens to say Applied, which is exactly the kind of false
 * green this suite has to avoid.
 */
function row(page: Page, company: string): Locator {
  // Each row is anchored by a stretched link whose accessible name is
  // "<company> – <role>"; its parent element is the row itself.
  const escaped = company.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return page
    .getByRole("link", { name: new RegExp(`^${escaped} – `) })
    .first()
    .locator("..");
}

/** The "Move →" control belonging to one application's row. */
function moveButton(page: Page, company: string): Locator {
  return row(page, company).getByRole("button", { name: /^Move/i });
}

test.describe("Status transitions", () => {
  test("a new application starts at Applied", async ({ page, withApplication }) => {
    const company = `StatusTest Co ${Date.now()}`;
    await withApplication({ company });

    await page.goto("/applications");

    await expect(row(page, company)).toContainText(STATUS_NAMES.applied);
  });

  test("offers exactly the transitions allowed from Applied", async ({
    page,
    withApplication,
  }) => {
    const company = `ExpandTest Co ${Date.now()}`;
    await withApplication({ company });
    await page.goto("/applications");

    await moveButton(page, company).click();

    const menu = page.getByRole("menu");
    await expect(menu.getByRole("menuitem", { name: STATUS_NAMES.cancelled })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: STATUS_NAMES.rejected })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: STATUS_NAMES.interviews })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: STATUS_NAMES.ghosted })).toBeVisible();
    // Nothing further along the pipeline is reachable in one hop.
    await expect(menu.getByRole("menuitem", { name: STATUS_NAMES.offer })).toHaveCount(0);
    await expect(menu.getByRole("menuitem", { name: STATUS_NAMES.accepted })).toHaveCount(0);
    await expect(menu.getByRole("menuitem")).toHaveCount(4);
  });

  test("moving to Interviews updates that row and no other", async ({
    page,
    withApplication,
  }) => {
    const moved = `TransitionTest Co ${Date.now()}`;
    const untouched = `Bystander Co ${Date.now()}`;
    await withApplication({ company: moved });
    await withApplication({ company: untouched });
    await page.goto("/applications");

    await moveButton(page, moved).click();
    await page.getByRole("menuitem", { name: STATUS_NAMES.interviews }).click();

    await expect(row(page, moved)).toContainText(STATUS_NAMES.interviews, { timeout: 10000 });
    await expect(row(page, untouched)).toContainText(STATUS_NAMES.applied);
  });

  test("a terminal status offers no further move", async ({ page, withApplication }) => {
    const company = `TerminalTest Co ${Date.now()}`;
    await withApplication({ company });
    await page.goto("/applications");

    await moveButton(page, company).click();
    await page.getByRole("menuitem", { name: STATUS_NAMES.rejected }).click();

    // Rejected is terminal, so the row moves to Closed and loses its Move control.
    await page.goto("/applications?filter=closed");
    await expect(row(page, company)).toContainText(STATUS_NAMES.rejected, { timeout: 10000 });
    await expect(moveButton(page, company)).toHaveCount(0);
  });

  test("a new application shows on Open and not on Closed", async ({
    page,
    withApplication,
  }) => {
    const company = `OpenOnly Co ${Date.now()}`;
    await withApplication({ company });

    await page.goto("/applications");
    await expect(page.getByText(company).first()).toBeVisible();

    await page.goto("/applications?filter=closed");
    await expect(page.getByText(company)).toHaveCount(0);
  });

  test("rejecting an application moves it from Open to Closed", async ({
    page,
    withApplication,
  }) => {
    const company = `MoveToClosed Co ${Date.now()}`;
    await withApplication({ company });

    await page.goto("/applications");
    await moveButton(page, company).click();
    await page.getByRole("menuitem", { name: STATUS_NAMES.rejected }).click();
    await expect(page.getByText(company)).toHaveCount(0, { timeout: 10000 });

    await page.goto("/applications?filter=closed");
    await expect(row(page, company)).toContainText(STATUS_NAMES.rejected);
  });

  test("the Open and Closed tabs are both offered", async ({ page, withApplication }) => {
    await withApplication({ company: `TabTest Co ${Date.now()}` });
    await page.goto("/applications");

    await expect(page.locator("button").filter({ hasText: /^Open/ })).toBeVisible();
    await expect(page.locator("button").filter({ hasText: /^Closed/ })).toBeVisible();
  });
});
