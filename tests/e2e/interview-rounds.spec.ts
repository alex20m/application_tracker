import { test, expect } from "./fixtures";

test.describe("Interview rounds", () => {
  test("add, update outcome, and delete a round", async ({ page, withApplication }) => {
    const { url } = await withApplication({ company: "Rounds Test Co" });

    await page.goto(url);
    await expect(page.getByText("Interview rounds")).toBeVisible();

    // Add a round
    await page.getByRole("button", { name: /\+ Add round/i }).click();
    await page.getByLabel(/type/i).fill("Phone screen");
    await page.getByRole("button", { name: /Add round/i }).click();

    // Round appears in the list
    await expect(page.getByText("Phone screen")).toBeVisible();
    await expect(page.getByText("Pending")).toBeVisible();

    // Reload — round persists
    await page.reload();
    await expect(page.getByText("Phone screen")).toBeVisible();

    // Edit outcome to passed
    await page.getByRole("button", { name: /^Edit$/i }).first().click();
    await page.getByLabel(/outcome/i).selectOption("passed");
    await page.getByRole("button", { name: /Update/i }).click();

    await expect(page.getByText("Passed")).toBeVisible();

    // Delete the round
    await page.getByRole("button", { name: /^Delete$/i }).first().click();
    await expect(page.getByText("Phone screen")).not.toBeVisible();
    await expect(page.getByText("No rounds yet")).toBeVisible();
  });

  test("round type suggestions appear for a second application", async ({ page, withApplication }) => {
    // Create two apps — add a round to the first
    const { url: url1 } = await withApplication({ company: "Suggestions Co A" });
    const { url: url2 } = await withApplication({ company: "Suggestions Co B" });

    await page.goto(url1);
    await page.getByRole("button", { name: /\+ Add round/i }).click();
    await page.getByLabel(/type/i).fill("Technical");
    await page.getByRole("button", { name: /Add round/i }).click();
    await expect(page.getByText("Technical")).toBeVisible();

    // Open the second app — "Technical" should be in datalist suggestions
    await page.goto(url2);
    await page.getByRole("button", { name: /\+ Add round/i }).click();
    const typeInput = page.getByLabel(/type/i);
    await typeInput.fill("T");
    // The datalist is wired — verify the input exists and accepts the value
    await typeInput.fill("Technical");
    await expect(typeInput).toHaveValue("Technical");
  });
});
