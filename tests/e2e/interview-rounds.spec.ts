import type { Page } from "@playwright/test";
import { test, expect, clickAndAwaitAction } from "./fixtures";
import { STATUS_NAMES } from "@/lib/statuses";

/**
 * Re-reads the page from the server.
 *
 * Used where the assertion is about what was *persisted* rather than what the
 * screen currently shows — outcomes and stage changes both render optimistically,
 * so reloading is the difference between checking the write and checking the
 * animation. It is not a workaround: the page does refresh on its own, which the
 * "a new round appears without reloading the page" test asserts directly.
 */
async function reloadCard(page: Page) {
  await page.reload();
}

/** Moves the open detail page to the interviews stage and waits for the round controls. */
async function enterInterviews(page: Page) {
  await clickAndAwaitAction(
    page,
    page.getByRole("button", { name: STATUS_NAMES.interviews, exact: true })
  );
  await expect(page.getByRole("button", { name: /\+ Add round/i })).toBeVisible();
}

/**
 * Picks today in the round form's date field.
 *
 * The picker stores its value in a hidden input, and `required` on a hidden
 * input is not enforced by the browser — so if the calendar has not opened when
 * "Today" is clicked, the form submits with no date, the server rejects it, and
 * the only symptom is a round that never appears. Each step is therefore
 * confirmed before the next.
 */
async function pickToday(page: Page) {
  await page.getByLabel(/date/i).click();
  const calendar = page.getByRole("dialog", { name: /date picker/i });
  await expect(calendar).toBeVisible();
  await calendar.getByRole("button", { name: "Today", exact: true }).click();
  await expect(calendar).toHaveCount(0);
  // The trigger shows "Select date" until a date is chosen.
  await expect(page.getByLabel(/date/i)).not.toContainText(/select date/i);
}

/** Fills and submits the add-round form, and waits for the round to be stored. */
async function addRound(page: Page, type: string, notes?: string) {
  await page.getByRole("button", { name: /\+ Add round/i }).click();
  const typeField = page.getByLabel(/type/i);
  await expect(typeField).toBeVisible();
  await typeField.fill(type);
  await pickToday(page);
  if (notes) await page.getByLabel(/notes/i).fill(notes);

  await clickAndAwaitAction(page, page.getByRole("button", { name: /^Add round$/i }));

  // The form unmounts only on success, so a form still on screen means the
  // submit was rejected — surface that instead of timing out on the pill.
  //
  // Checked on the Type field, not the submit button: the button's label
  // becomes "Saving…" while the action runs, so a check for "Add round" being
  // absent is satisfied mid-submit and would report success for a rejection.
  await expect(
    typeField,
    "the add-round form did not close, so the submission was rejected"
  ).toHaveCount(0);

  // No reload: the round is expected to appear on its own. See the dedicated
  // test below for why that is a real guarantee and not an accident.
  await expect(page.getByText(type).first()).toBeVisible();
}

/** Closes the latest round with an outcome and waits for the write to be stored. */
async function setOutcome(page: Page, outcome: "Passed" | "Failed" | "Cancelled") {
  await clickAndAwaitAction(page, page.getByRole("button", { name: outcome, exact: true }));
  await reloadCard(page);
}

/** Moves the application to another stage and waits for the write to be stored. */
async function moveToStage(page: Page, status: string) {
  await clickAndAwaitAction(page, page.getByRole("button", { name: status, exact: true }));
}

test.describe("Interview rounds", () => {
  test("a new round appears without reloading the page", async ({ page, withApplication }) => {
    // The card is a server component, so a saved round only appears on its own
    // because the action calls revalidateApplicationViews(). Without that call
    // the round is stored but the user keeps looking at a card that does not
    // contain it until they refresh.
    //
    // Verified against Next 16.2.6 with a standalone reproduction: an action
    // that mutates and revalidates *any* path refreshes the page being viewed
    // within ~100ms, while an action that mutates and revalidates nothing never
    // updates it — the write only showed up after a manual reload. So this
    // assertion fails if the revalidation call is dropped.
    const { url } = await withApplication({ company: `Live Refresh Co ${Date.now()}` });

    await page.goto(url);
    await enterInterviews(page);

    await page.getByRole("button", { name: /\+ Add round/i }).click();
    await page.getByLabel(/type/i).fill("Systems design");
    await pickToday(page);
    await clickAndAwaitAction(page, page.getByRole("button", { name: /^Add round$/i }));

    // Deliberately no reload anywhere above this line.
    await expect(page.getByText("Systems design").first()).toBeVisible();
  });

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

    await setOutcome(page, "Passed");
    await expect(page.getByText("Set outcome:")).not.toBeVisible();

    await clickAndAwaitAction(page, page.getByRole("button", { name: /^Delete$/i }));
    await reloadCard(page);
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
    await moveToStage(page, STATUS_NAMES.offer);

    await expect(page.getByText(/close the ongoing interview round/i)).toBeVisible();
    // Still in interviews. "Set outcome:" is the proof: it renders only in that
    // stage and only while the latest round is open — which is exactly the
    // state the gate is protecting. ("+ Add round" is the wrong signal here; it
    // is hidden precisely because a round is pending.)
    await expect(page.getByText("Set outcome:")).toBeVisible();

    // Closing the round releases the gate.
    await setOutcome(page, "Passed");
    await expect(page.getByText("Set outcome:")).not.toBeVisible();
    await moveToStage(page, STATUS_NAMES.offer);
    await reloadCard(page);

    // Now in the offer stage: its own onward moves are what the stepper offers.
    await expect(
      page.getByRole("button", { name: STATUS_NAMES.accepted, exact: true })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /\+ Add round/i })).toHaveCount(0);
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
    await setOutcome(page, "Failed");
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

    await setOutcome(page, "Passed");

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
    await setOutcome(page, "Passed");
    await expect(page.getByText("Set outcome:")).not.toBeVisible();

    await addRound(page, "Technical");

    // Only one set of Edit/Delete buttons — on the latest (Technical) round
    await expect(page.getByRole("button", { name: /^Edit$/i })).toHaveCount(1);
    await expect(page.getByRole("button", { name: /^Delete$/i })).toHaveCount(1);

    // Delete the latest round — Edit/Delete should move to the new latest (Phone screen)
    await clickAndAwaitAction(page, page.getByRole("button", { name: /^Delete$/i }));
    await reloadCard(page);
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
    await setOutcome(page, "Passed");
    await expect(page.getByText("Set outcome:")).not.toBeVisible();

    await moveToStage(page, STATUS_NAMES.offer);
    await reloadCard(page);
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
