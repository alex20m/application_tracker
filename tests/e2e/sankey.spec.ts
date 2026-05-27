import { test, expect } from "./fixtures";
import { SANKEY_ROOT_LABEL } from "@/lib/statuses";

test.describe("Sankey chart", () => {
  test("renders the Analytics page heading", async ({ page }) => {
    await page.goto("/analytics");
    await expect(page.getByRole("heading", { name: /^analytics$/i })).toBeVisible();
  });

  test("shows SVG chart after creating and transitioning an application", async ({
    page,
    withApplication,
  }) => {
    await withApplication({ company: "SankeyTest Co" });

    // Transition to interviews so there's a real flow to render
    await page.goto("/applications");
    await page.getByRole("button", { name: /move to/i }).first().click();
    await page.getByRole("button", { name: /interviews/i }).click();
    await expect(page.getByText(/interviews/i).first()).toBeVisible({ timeout: 10000 });

    // Navigate to analytics page where the sankey chart now lives
    await page.goto("/analytics");
    // Filter to the chart SVG specifically — the page also contains small icon SVGs
    const chart = page.locator("svg").filter({ hasText: SANKEY_ROOT_LABEL });
    await expect(chart).toBeVisible({ timeout: 10000 });

    // The root "Applications" node label should be in the SVG
    const svgText = await chart.textContent();
    expect(svgText).toContain(SANKEY_ROOT_LABEL);
  });
});
