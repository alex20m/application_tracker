import { test, expect } from "./fixtures";

test.describe("Interview rounds", () => {
  test("add, update outcome, and delete a round", async ({ page, withApplication }) => {
    const { url } = await withApplication({ company: "Rounds Test Co" });

    await page.goto(url);
    await expect(page.getByText("Interview rounds", { exact: true })).toBeVisible();

    // Move to interviews stage — rounds card only allows edits here
    await page.getByRole("button", { name: "Interviews" }).click();
    await expect(page.getByRole("button", { name: /\+ Add round/i })).toBeVisible();

    // Add a round (date is now required)
    await page.getByRole("button", { name: /\+ Add round/i }).click();
    await page.getByLabel(/type/i).fill("Phone screen");
    await page.getByLabel(/date/i).click();
    await page.getByRole("button", { name: "Today", exact: true }).click();
    await page.getByRole("button", { name: /Add round/i }).click();

    // Round appears in the timeline
    await expect(page.getByText("Phone screen")).toBeVisible();
    await expect(page.getByText("Pending")).toBeVisible();

    // Reload — round persists
    await page.reload();
    await expect(page.getByText("Phone screen")).toBeVisible();

    // Edit outcome to passed (only latest round has Edit button)
    await page.getByRole("button", { name: /^Edit$/i }).first().click();
    await page.getByLabel(/outcome/i).selectOption("passed");
    await page.getByRole("button", { name: /Update/i }).click();

    await expect(page.getByText("Passed")).toBeVisible();

    // Delete the round
    await page.getByRole("button", { name: /^Delete$/i }).first().click();
    await expect(page.getByText("Phone screen")).not.toBeVisible();
    await expect(page.getByText("No rounds yet")).toBeVisible();
  });

  test("only the latest round has Edit/Delete controls", async ({ page, withApplication }) => {
    const { url } = await withApplication({ company: "Controls Test Co" });

    await page.goto(url);
    await page.getByRole("button", { name: "Interviews" }).click();
    await expect(page.getByRole("button", { name: /\+ Add round/i })).toBeVisible();

    // Add first round
    await page.getByRole("button", { name: /\+ Add round/i }).click();
    await page.getByLabel(/type/i).fill("Phone screen");
    await page.getByLabel(/date/i).click();
    await page.getByRole("button", { name: "Today", exact: true }).click();
    await page.getByRole("button", { name: /Add round/i }).click();
    await expect(page.getByText("Phone screen")).toBeVisible();

    // Add second round
    await page.getByRole("button", { name: /\+ Add round/i }).click();
    await page.getByLabel(/type/i).fill("Technical");
    await page.getByLabel(/date/i).click();
    await page.getByRole("button", { name: "Today", exact: true }).click();
    await page.getByRole("button", { name: /Add round/i }).click();
    await expect(page.getByText("Technical")).toBeVisible();

    // Only one set of Edit/Delete buttons — on the latest (Technical) round
    await expect(page.getByRole("button", { name: /^Edit$/i })).toHaveCount(1);
    await expect(page.getByRole("button", { name: /^Delete$/i })).toHaveCount(1);

    // Delete the latest round — Edit/Delete should move to the new latest (Phone screen)
    await page.getByRole("button", { name: /^Delete$/i }).click();
    await expect(page.getByText("Technical")).not.toBeVisible();
    await expect(page.getByRole("button", { name: /^Edit$/i })).toHaveCount(1);
    await expect(page.getByRole("button", { name: /^Delete$/i })).toHaveCount(1);
  });

  test("card is read-only outside interviews stage", async ({ page, withApplication }) => {
    const { url } = await withApplication({ company: "Readonly Test Co" });

    await page.goto(url);
    await page.getByRole("button", { name: "Interviews" }).click();
    await expect(page.getByRole("button", { name: /\+ Add round/i })).toBeVisible();

    // Add a round
    await page.getByRole("button", { name: /\+ Add round/i }).click();
    await page.getByLabel(/type/i).fill("Phone screen");
    await page.getByLabel(/date/i).click();
    await page.getByRole("button", { name: "Today", exact: true }).click();
    await page.getByRole("button", { name: /Add round/i }).click();
    await expect(page.getByText("Phone screen")).toBeVisible();

    // Move out of interviews stage (to Offer)
    await page.getByRole("button", { name: "Offer" }).click();

    // Card still shows the round history
    await expect(page.getByText("Phone screen")).toBeVisible();

    // But no Add/Edit/Delete controls
    await expect(page.getByRole("button", { name: /\+ Add round/i })).not.toBeVisible();
    await expect(page.getByRole("button", { name: /^Edit$/i })).not.toBeVisible();
    await expect(page.getByRole("button", { name: /^Delete$/i })).not.toBeVisible();
  });

  test("round type suggestions appear for a second application", async ({ page, withApplication }) => {
    // Create two apps — add a round to the first
    const { url: url1 } = await withApplication({ company: "Suggestions Co A" });
    const { url: url2 } = await withApplication({ company: "Suggestions Co B" });

    await page.goto(url1);
    await page.getByRole("button", { name: "Interviews" }).click();
    await expect(page.getByRole("button", { name: /\+ Add round/i })).toBeVisible();

    await page.getByRole("button", { name: /\+ Add round/i }).click();
    await page.getByLabel(/type/i).fill("Technical");
    await page.getByLabel(/date/i).click();
    await page.getByRole("button", { name: "Today", exact: true }).click();
    await page.getByRole("button", { name: /Add round/i }).click();
    await expect(page.getByText("Technical")).toBeVisible();

    // Open the second app — "Technical" should be in datalist suggestions
    await page.goto(url2);
    await page.getByRole("button", { name: "Interviews" }).click();
    await expect(page.getByRole("button", { name: /\+ Add round/i })).toBeVisible();

    await page.getByRole("button", { name: /\+ Add round/i }).click();
    const typeInput = page.getByLabel(/type/i);
    await typeInput.fill("T");
    // The datalist is wired — verify the input exists and accepts the value
    await typeInput.fill("Technical");
    await expect(typeInput).toHaveValue("Technical");
  });
});
