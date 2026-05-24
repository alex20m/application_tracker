import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const routes = ["/applications", "/applications/new", "/sankey", "/settings"];

for (const route of routes) {
  test(`${route} has no serious accessibility violations`, async ({ page }) => {
    await page.goto(route);
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    const serious = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );

    expect(
      serious,
      `Found ${serious.length} serious violation(s) on ${route}:\n` +
        serious.map((v) => `  [${v.impact}] ${v.id}: ${v.description}`).join("\n")
    ).toHaveLength(0);
  });
}

test("/login has no serious accessibility violations (public page)", async ({ page }) => {
  // Use fresh context without auth
  await page.context().clearCookies();
  await page.goto("/login");
  await page.waitForLoadState("networkidle");

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();

  const serious = results.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious"
  );

  expect(serious).toHaveLength(0);
});
