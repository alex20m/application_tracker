import { test, expect } from "./fixtures";
import { SANKEY_ROOT_LABEL, STATUS_NAMES } from "@/lib/statuses";

// The analytics view returns a "No data yet" placeholder when the account has
// no applications and never renders the flow card at all, so there is no
// page-level empty state for this chart to assert without depending on the
// whole account being empty — an ordering dependency between spec files.
// SankeyChart's own empty-data rendering is covered by its component test.
test.describe("Application flow chart", () => {
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
