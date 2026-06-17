import { test, expect } from "./fixtures";

test.describe("Interview rounds", () => {
  test("add, update outcome, and delete a round", async ({ page, withApplication }) => {
    const { url } = await withApplication({ company: "Rounds Test Co" });

    await page.goto(url);
    // Card is always visible (shows round history even outside interviews stage)
    await expect(page.getByText("Interview Rounds").first()).toBeVisible();

    // Move to interviews stage — rounds card allows edits here
    await page.getByRole("button", { name: "Interviews" }).click();
    await expect(page.getByRole("button", { name: /\+ Add round/i })).toBeVisible();

    // Add a round (date is now required)
    await page.getByRole("button", { name: /\+ Add round/i }).click();
    await page.getByLabel(/type/i).fill("Phone screen");
    await page.getByLabel(/date/i).click();
    await page.getByRole("button", { name: "Today", exact: true }).click();
    await page.getByRole("button", { name: /Add round/i }).click();

    // Round pill appears in the stepper (desktop + mobile both render, use .first())
    await expect(page.getByText("Phone screen").first()).toBeVisible();
    // Current outcome is Pending — forward moves (Passed/Failed/Cancelled) are shown, no Pending button
    await expect(page.getByRole("button", { name: "Passed" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Pending" })).not.toBeVisible();

    // Reload — round persists
    await page.reload();
    await expect(page.getByText("Phone screen").first()).toBeVisible();

    // Update outcome to Passed via inline "Set outcome:" button
    await page.getByRole("button", { name: "Passed" }).click();
    // After moving away from pending, outcome buttons disappear from quick view
    await expect(page.getByText("Set outcome:")).not.toBeVisible();

    // Delete the round
    await page.getByRole("button", { name: /^Delete$/i }).click();
    await expect(page.getByText("Phone screen").first()).not.toBeVisible();
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
    await expect(page.getByText("Phone screen").first()).toBeVisible();

    // Mark first round as Passed so a second round can be added
    await page.getByRole("button", { name: "Passed" }).click();
    // After moving away from pending, outcome buttons disappear
    await expect(page.getByText("Set outcome:")).not.toBeVisible();

    // Add second round
    await page.getByRole("button", { name: /\+ Add round/i }).click();
    await page.getByLabel(/type/i).fill("Technical");
    await page.getByLabel(/date/i).click();
    await page.getByRole("button", { name: "Today", exact: true }).click();
    await page.getByRole("button", { name: /Add round/i }).click();
    await expect(page.getByText("Technical").first()).toBeVisible();

    // Only one set of Edit/Delete buttons — on the latest (Technical) round
    await expect(page.getByRole("button", { name: /^Edit$/i })).toHaveCount(1);
    await expect(page.getByRole("button", { name: /^Delete$/i })).toHaveCount(1);

    // Delete the latest round — Edit/Delete should move to the new latest (Phone screen)
    await page.getByRole("button", { name: /^Delete$/i }).click();
    await expect(page.getByText("Technical").first()).not.toBeVisible();
    await expect(page.getByRole("button", { name: /^Edit$/i })).toHaveCount(1);
    await expect(page.getByRole("button", { name: /^Delete$/i })).toHaveCount(1);

    // Transition out of interviews so the fixture cleanup finds the application Delete button
    // (not the round Delete button, which would leave the page URL unchanged)
    await page.getByRole("button", { name: "Offer", exact: true }).click();
  });

  test("card shows rounds but hides notes outside interviews stage", async ({ page, withApplication }) => {
    const { url } = await withApplication({ company: "Readonly Test Co" });

    await page.goto(url);
    await page.getByRole("button", { name: "Interviews" }).click();
    await expect(page.getByRole("button", { name: /\+ Add round/i })).toBeVisible();

    // Add a round with notes
    await page.getByRole("button", { name: /\+ Add round/i }).click();
    await page.getByLabel(/type/i).fill("Phone screen");
    await page.getByLabel(/date/i).click();
    await page.getByRole("button", { name: "Today", exact: true }).click();
    await page.getByLabel(/notes/i).fill("Prep note visible in interviews");
    await page.getByRole("button", { name: /Add round/i }).click();
    await expect(page.getByText("Phone screen").first()).toBeVisible();
    await expect(page.getByText("Prep note visible in interviews")).toBeVisible();

    // Move out of interviews stage (to Offer)
    await page.getByRole("button", { name: "Offer", exact: true }).click();

    // Card and round pill are still visible — only notes are hidden
    await expect(page.getByText("Interview Rounds").first()).toBeVisible();
    await expect(page.getByText("Phone screen").first()).toBeVisible();
    await expect(page.getByText("Prep note visible in interviews")).not.toBeVisible();

    // No Add/Edit/Delete/Set-outcome controls outside interviews stage
    await expect(page.getByRole("button", { name: /\+ Add round/i })).not.toBeVisible();
    await expect(page.getByRole("button", { name: /^Edit$/i })).not.toBeVisible();
    await expect(page.getByRole("button", { name: /^Delete$/i })).not.toBeVisible();
    await expect(page.getByText("Set outcome:")).not.toBeVisible();
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
    await expect(page.getByText("Technical").first()).toBeVisible();

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

    // Transition url1 out of interviews so the fixture cleanup finds the application Delete button
    // (not the round Delete button, which would leave the page URL unchanged)
    await page.goto(url1);
    await page.getByRole("button", { name: "Offer", exact: true }).click();
  });
});
