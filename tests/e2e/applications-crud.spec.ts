import { test, expect } from "./fixtures";

const COMPANY = `E2E Corp ${Date.now()}`;
const ROLE = "QA Engineer";
const LOCATION = "Helsinki";

test.describe("Application CRUD", () => {
  test("create a new application — appears in the list", async ({ page }) => {
    await page.goto("/applications/new");
    await page.getByPlaceholder(/example corporation/i).fill(COMPANY);
    await page.getByPlaceholder(/senior engineer/i).fill(ROLE);
    await page.getByPlaceholder(/stockholm/i).fill(LOCATION);
    await page.getByRole("button", { name: /save application/i }).click();

    await expect(page).toHaveURL("/applications");
    await expect(page.getByText(COMPANY)).toBeVisible();

    // Cleanup — find and delete
    await page.getByText(COMPANY).click();
    await expect(page).toHaveURL(/\/applications\//);
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: /delete/i }).click();
    await expect(page).toHaveURL("/applications", { timeout: 10000 });
  });

  test("edit company and role from the detail page", async ({ page, withApplication }) => {
    const { url } = await withApplication({ company: "EditMe Co", role: "Junior Dev" });

    await page.goto(url);
    await page.locator('input[name="company"]').fill("Edited Corp");
    await page.locator('input[name="role"]').fill("Senior Dev");
    await page.getByRole("button", { name: /save application/i }).click();

    await expect(page).toHaveURL("/applications");
    await expect(page.getByText("Edited Corp")).toBeVisible();
    await expect(page.getByText("Senior Dev")).toBeVisible();
  });

  test("add a note and verify it persists after reload", async ({ page, withApplication }) => {
    const { url } = await withApplication({ company: "NoteTest Co" });

    await page.goto(url);
    await page.getByPlaceholder(/add any notes/i).fill("This is a test note.");
    await page.getByRole("button", { name: /save application/i }).click();

    await expect(page).toHaveURL("/applications");

    // Reload the application list and check the note appears in the card
    await page.reload();
    await expect(page.getByText("This is a test note.")).toBeVisible();
  });

  test("delete application from the list (inline delete button)", async ({ page }) => {
    // Create via UI
    const company = `DeleteFromList ${Date.now()}`;
    await page.goto("/applications/new");
    await page.getByPlaceholder(/example corporation/i).fill(company);
    await page.getByPlaceholder(/senior engineer/i).fill("Test Role");
    await page.getByPlaceholder(/stockholm/i).fill("Remote");
    await page.getByRole("button", { name: /save application/i }).click();
    await expect(page).toHaveURL("/applications");
    await expect(page.getByText(company)).toBeVisible();

    // Navigate to detail and delete
    await page.getByText(company).click();
    await expect(page).toHaveURL(/\/applications\//);
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: /^delete$/i }).click();

    await expect(page).toHaveURL("/applications", { timeout: 10000 });
    await expect(page.getByText(company)).not.toBeVisible();
  });
});
