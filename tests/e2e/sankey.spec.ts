import { test, expect } from "./fixtures";
import { SANKEY_ROOT_LABEL, STATUS_NAMES } from "@/lib/statuses";

test.describe("Application flow chart", () => {
  test("shows an empty state until there is a journey to draw", async ({ page }) => {
    await page.goto("/analytics");

    // The card is always present; only its contents depend on the data.
    await expect(page.getByRole("heading", { name: /application flow/i })).toBeVisible();
  });

  test("draws the applied-to-interviews journey after a transition", async ({
    page,
    withApplication,
  }) => {
    const company = `SankeyTest Co ${Date.now()}`;
    await withApplication({ company });

    await page.goto("/applications");
    await page.getByRole("button", { name: /^Move/i }).first().click();
    await page.getByRole("menuitem", { name: STATUS_NAMES.interviews }).click();
    await expect(page.getByText(STATUS_NAMES.interviews).first()).toBeVisible({ timeout: 10000 });

    await page.goto("/analytics");

    const chart = page.locator("svg").filter({ hasText: SANKEY_ROOT_LABEL });
    await expect(chart).toBeVisible({ timeout: 10000 });

    // The chart must actually name the stages it is flowing between, not merely
    // render an SVG element.
    const chartText = await chart.textContent();
    expect(chartText).toContain(SANKEY_ROOT_LABEL);
    expect(chartText).toContain(STATUS_NAMES.interviews);
  });
});
