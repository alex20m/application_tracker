import { test, expect } from "./fixtures";
import { STATUS_NAMES } from "@/lib/statuses";

test.describe("Status transitions", () => {
  test("new application starts at Applied status", async ({ page, withApplication }) => {
    await withApplication({ company: "StatusTest Co" });
    await page.goto("/applications/open");

    // The status badge should show "Applied" (the default status)
    await expect(page.getByText(STATUS_NAMES.applied).first()).toBeVisible();
  });

  test("'Move to →' button is visible for a non-terminal application", async ({
    page,
    withApplication,
  }) => {
    await withApplication({ company: "MoveTest Co" });
    await page.goto("/applications/open");
    await expect(page.getByRole("button", { name: /move to/i }).first()).toBeVisible();
  });

  test("clicking 'Move to →' reveals valid next-status buttons", async ({
    page,
    withApplication,
  }) => {
    await withApplication({ company: "ExpandTest Co" });
    await page.goto("/applications/open");

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
    await page.goto("/applications/open");

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
    await page.goto("/applications/open");

    // Transition to Rejected
    await page.getByRole("button", { name: /move to/i }).first().click();
    await page.getByRole("button", { name: STATUS_NAMES.rejected }).click();

    // After rejection the app moves to the Closed page — navigate there to find it
    await page.goto("/applications/closed");
    await expect(page.getByText(STATUS_NAMES.rejected).first()).toBeVisible({ timeout: 10000 });

    // 'Final status' should be shown, not 'Move to →'
    await expect(page.getByText(/final status/i).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /move to/i })).not.toBeVisible();
  });

  test("Open/Closed tabs are visible on the applications page", async ({ page, withApplication }) => {
    await withApplication({ company: "TabTest Co" });
    await page.goto("/applications/open");

    await expect(page.getByRole("link", { name: "Open" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Closed" })).toBeVisible();
  });

  test("newly created app appears on Open page, not on Closed page", async ({
    page,
    withApplication,
  }) => {
    const company = "OpenOnly Co";
    await withApplication({ company });

    await page.goto("/applications/open");
    await expect(page.getByText(company).first()).toBeVisible();

    await page.goto("/applications/closed");
    await expect(page.getByText(company)).not.toBeVisible();
  });

  test("after transitioning to Rejected, app moves from Open to Closed", async ({
    page,
    withApplication,
  }) => {
    const company = "MoveToClosed Co";
    await withApplication({ company });

    await page.goto("/applications/open");
    await expect(page.getByText(company).first()).toBeVisible();

    // Reject the application via quick actions
    await page.getByRole("button", { name: /move to/i }).first().click();
    await page.getByRole("button", { name: STATUS_NAMES.rejected }).click();
    await expect(page.getByText(STATUS_NAMES.rejected).first()).toBeVisible({ timeout: 10000 });

    // Should now be gone from Open
    await expect(page.getByText(company)).not.toBeVisible();

    // And visible on Closed
    await page.goto("/applications/closed");
    await expect(page.getByText(company).first()).toBeVisible();
  });
});
