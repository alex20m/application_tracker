import type { Page } from "@playwright/test";
import { test, expect, clickAndAwaitAction } from "./fixtures";
import { SANKEY_ROOT_LABEL, STATUS_NAMES } from "@/lib/statuses";

/** The list row for one application, anchored by its stretched link. */
function row(page: Page, company: string) {
  const escaped = company.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return page
    .getByRole("link", { name: new RegExp(`^${escaped} – `) })
    .first()
    .locator("..");
}

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
    // Scoped to this application's row: a bare .first() would move whichever
    // row happened to sort first and then assert against a chart built from
    // someone else's journey.
    await row(page, company).getByRole("button", { name: /^Move/i }).click();
    // The badge updates optimistically, so it is not evidence the event was
    // stored — and the chart is built from stored events.
    await clickAndAwaitAction(
      page,
      page.getByRole("menuitem", { name: STATUS_NAMES.interviews })
    );
    await expect(row(page, company)).toContainText(STATUS_NAMES.interviews);

    await page.goto("/analytics");

    const chart = page.locator("svg").filter({ hasText: SANKEY_ROOT_LABEL });
    await expect(chart).toBeVisible();

    // The chart must actually name the stages it is flowing between, not merely
    // render an SVG element.
    const chartText = await chart.textContent();
    expect(chartText).toContain(SANKEY_ROOT_LABEL);
    expect(chartText).toContain(STATUS_NAMES.interviews);
  });
});
