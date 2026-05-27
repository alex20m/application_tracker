import { test, expect } from "./fixtures";
import { STATUS_NAMES } from "@/lib/statuses";

test.describe("Status transitions", () => {
  test("new application starts at Applied status", async ({ page, withApplication }) => {
    await withApplication({ company: "StatusTest Co" });
    await page.goto("/applications");

    // The status badge should show "Applied" (the default status)
    await expect(page.getByText(STATUS_NAMES.applied).first()).toBeVisible();
  });

  test("'Move to →' button is visible for a non-terminal application", async ({
    page,
    withApplication,
  }) => {
    await withApplication({ company: "MoveTest Co" });
    await page.goto("/applications");
    await expect(page.getByRole("button", { name: /move to/i }).first()).toBeVisible();
  });

  test("clicking 'Move to →' reveals valid next-status buttons", async ({
    page,
    withApplication,
  }) => {
    await withApplication({ company: "ExpandTest Co" });
    await page.goto("/applications");

    const moveBtn = page.getByRole("button", { name: /move to/i }).first();
    await moveBtn.click();

    // applied → cancelled, rejected, interviews
    await expect(page.getByRole("button", { name: STATUS_NAMES.cancelled })).toBeVisible();
    await expect(page.getByRole("button", { name: STATUS_NAMES.rejected })).toBeVisible();
    await expect(page.getByRole("button", { name: STATUS_NAMES.interviews })).toBeVisible();
  });

  test("transitioning to Interviews changes the status badge", async ({
    page,
    withApplication,
  }) => {
    await withApplication({ company: "TransitionTest Co" });
    await page.goto("/applications");

    await page.getByRole("button", { name: /move to/i }).first().click();
    await page.getByRole("button", { name: STATUS_NAMES.interviews }).click();

    // Wait for revalidation and re-render
    await expect(page.getByText(STATUS_NAMES.interviews).first()).toBeVisible({ timeout: 10000 });
  });

  test("terminal status (Rejected) shows 'Final status' instead of move button", async ({
    page,
    withApplication,
  }) => {
    await withApplication({ company: "TerminalTest Co" });
    await page.goto("/applications");

    // Transition to Rejected
    await page.getByRole("button", { name: /move to/i }).first().click();
    await page.getByRole("button", { name: STATUS_NAMES.rejected }).click();
    await expect(page.getByText(STATUS_NAMES.rejected).first()).toBeVisible({ timeout: 10000 });

    // 'Final status' should now be shown, not 'Move to →'
    await expect(page.getByText(/final status/i).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /move to/i })).not.toBeVisible();
  });
});
