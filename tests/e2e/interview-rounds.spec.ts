import type { Page } from "@playwright/test";
import { test, expect } from "./fixtures";
import { STATUS_NAMES } from "@/lib/statuses";

/** Moves the open detail page to the interviews stage and waits for the round controls. */
async function enterInterviews(page: Page) {
  await page.getByRole("button", { name: STATUS_NAMES.interviews, exact: true }).click();
  await expect(page.getByRole("button", { name: /\+ Add round/i })).toBeVisible();
}

/** Fills and submits the add-round form. */
async function addRound(page: Page, type: string, notes?: string) {
  await page.getByRole("button", { name: /\+ Add round/i }).click();
  await page.getByLabel(/type/i).fill(type);
  await page.getByLabel(/date/i).click();
  await page.getByRole("button", { name: "Today", exact: true }).click();
  if (notes) await page.getByLabel(/notes/i).fill(notes);
  await page.getByRole("button", { name: /Add round/i }).click();
  await expect(page.getByText(type).first()).toBeVisible();
}

test.describe("Interview rounds", () => {
  test("add, update outcome, and delete a round", async ({ page, withApplication }) => {
    const { url } = await withApplication({ company: `Rounds Test Co ${Date.now()}` });

    await page.goto(url);
    // Card is always visible (shows round history even outside interviews stage)
    await expect(page.getByText("Interview Rounds").first()).toBeVisible();

    await enterInterviews(page);
    await addRound(page, "Phone screen");

    // A new round starts pending, so only forward moves are offered.
    await expect(page.getByRole("button", { name: "Passed" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Pending" })).not.toBeVisible();

    // Reload — round persists
    await page.reload();
    await expect(page.getByText("Phone screen").first()).toBeVisible();

    await page.getByRole("button", { name: "Passed" }).click();
    await expect(page.getByText("Set outcome:")).not.toBeVisible();

    await page.getByRole("button", { name: /^Delete$/i }).click();
    await expect(page.getByText("Phone screen").first()).not.toBeVisible();
    await expect(page.getByText("No rounds yet")).toBeVisible();
  });

  test("refuses to leave the interviews stage while a round is still open", async ({
    page,
    withApplication,
  }) => {
    const { url } = await withApplication({ company: `Pending Gate Co ${Date.now()}` });

    await page.goto(url);
    await enterInterviews(page);
    await addRound(page, "Phone screen");

    // The round is pending, so the stage must not advance.
    await page.getByRole("button", { name: STATUS_NAMES.offer, exact: true }).click();

    await expect(
      page.getByText(/close the ongoing interview round/i)
    ).toBeVisible({ timeout: 10000 });
    // Still in interviews: the round controls are the proof, since they only
    // render in that stage.
    await expect(page.getByRole("button", { name: /\+ Add round/i })).toBeVisible();

    // Closing the round releases the gate.
    await page.getByRole("button", { name: "Passed" }).click();
    await page.getByRole("button", { name: STATUS_NAMES.offer, exact: true }).click();
    await expect(page.getByRole("button", { name: /\+ Add round/i })).not.toBeVisible({
      timeout: 10000,
    });
  });

  test("does not offer a second round until the previous one is closed", async ({
    page,
    withApplication,
  }) => {
    const { url } = await withApplication({ company: `Serial Rounds Co ${Date.now()}` });

    await page.goto(url);
    await enterInterviews(page);
    await addRound(page, "Phone screen");

    // Rounds are sequential: while one is pending, adding another is not offered.
    await expect(page.getByRole("button", { name: /\+ Add round/i })).toHaveCount(0);

    // A failed round is terminal for the application, so it does not reopen it either.
    await page.getByRole("button", { name: "Failed" }).click();
    await expect(page.getByRole("button", { name: /\+ Add round/i })).toHaveCount(0);
  });

  test("offers the next round once the previous one has passed", async ({
    page,
    withApplication,
  }) => {
    const { url } = await withApplication({ company: `Serial Pass Co ${Date.now()}` });

    await page.goto(url);
    await enterInterviews(page);
    await addRound(page, "Phone screen");

    await page.getByRole("button", { name: "Passed" }).click();

    await expect(page.getByRole("button", { name: /\+ Add round/i })).toBeVisible();
    await addRound(page, "Technical");
    await expect(page.getByText("Phone screen").first()).toBeVisible();
  });

  test("only the latest round has Edit/Delete controls", async ({ page, withApplication }) => {
    const { url } = await withApplication({ company: `Controls Test Co ${Date.now()}` });

    await page.goto(url);
    await enterInterviews(page);
    await addRound(page, "Phone screen");

    // Mark first round as Passed so a second round can be added
    await page.getByRole("button", { name: "Passed" }).click();
    await expect(page.getByText("Set outcome:")).not.toBeVisible();

    await addRound(page, "Technical");

    // Only one set of Edit/Delete buttons — on the latest (Technical) round
    await expect(page.getByRole("button", { name: /^Edit$/i })).toHaveCount(1);
    await expect(page.getByRole("button", { name: /^Delete$/i })).toHaveCount(1);

    // Delete the latest round — Edit/Delete should move to the new latest (Phone screen)
    await page.getByRole("button", { name: /^Delete$/i }).click();
    await expect(page.getByText("Technical").first()).not.toBeVisible();
    await expect(page.getByText("Phone screen").first()).toBeVisible();
    await expect(page.getByRole("button", { name: /^Edit$/i })).toHaveCount(1);
    await expect(page.getByRole("button", { name: /^Delete$/i })).toHaveCount(1);
  });

  test("card shows rounds but hides notes outside interviews stage", async ({
    page,
    withApplication,
  }) => {
    const { url } = await withApplication({ company: `Readonly Test Co ${Date.now()}` });

    await page.goto(url);
    await enterInterviews(page);
    await addRound(page, "Phone screen", "Prep note visible in interviews");
    await expect(page.getByText("Prep note visible in interviews")).toBeVisible();

    // Close the round — a pending round blocks leaving the stage.
    await page.getByRole("button", { name: "Passed" }).click();
    await expect(page.getByText("Set outcome:")).not.toBeVisible();

    await page.getByRole("button", { name: STATUS_NAMES.offer, exact: true }).click();
    await expect(page.getByRole("button", { name: /\+ Add round/i })).not.toBeVisible();

    // Card and round pill are still visible — only notes are hidden
    await expect(page.getByText("Interview Rounds").first()).toBeVisible();
    await expect(page.getByText("Phone screen").first()).toBeVisible();
    await expect(page.getByText("Prep note visible in interviews")).not.toBeVisible();

    // No Edit/Delete/Set-outcome controls outside interviews stage
    await expect(page.getByRole("button", { name: /^Edit$/i })).not.toBeVisible();
    await expect(page.getByRole("button", { name: /^Delete$/i })).not.toBeVisible();
    await expect(page.getByText("Set outcome:")).not.toBeVisible();
  });

  test("offers round types used on other applications as suggestions", async ({
    page,
    withApplication,
  }) => {
    const { url: url1 } = await withApplication({ company: `Suggestions Co A ${Date.now()}` });
    const { url: url2 } = await withApplication({ company: `Suggestions Co B ${Date.now()}` });

    await page.goto(url1);
    await enterInterviews(page);
    await addRound(page, "Panel debrief");

    // Open the second application's add-round form.
    await page.goto(url2);
    await enterInterviews(page);
    await page.getByRole("button", { name: /\+ Add round/i }).click();

    // Assert the suggestion list itself. Typing into the input and reading the
    // value back would pass with no datalist at all — it would only prove that
    // a text input accepts text.
    await expect(
      page.locator('#round-type-suggestions option[value="Panel debrief"]')
    ).toHaveCount(1);
    await expect(page.getByLabel(/type/i)).toHaveAttribute("list", "round-type-suggestions");
  });
});
