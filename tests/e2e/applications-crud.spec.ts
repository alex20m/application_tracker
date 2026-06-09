import { test, expect } from "./fixtures";

const COMPANY = `E2E Corp ${Date.now()}`;
const ROLE = "QA Engineer";
const LOCATION = "Helsinki";

test.describe("Application CRUD", () => {
  test("create a new application — appears in the list", async ({ page }) => {
    await page.goto("/applications/new");
    await page.getByLabel(/company/i).fill(COMPANY);
    await page.getByLabel(/role/i).fill(ROLE);
    await page.getByLabel(/location/i).fill(LOCATION);
    await page.getByRole("button", { name: /^add$/i }).click();

    await expect(page).toHaveURL("/applications");
    await expect(page.getByText(COMPANY)).toBeVisible();

    // Cleanup — find and delete (detail page opens in view mode; click Edit first)
    await page.getByRole("link", { name: new RegExp(COMPANY) }).click();
    await expect(page).toHaveURL(/\/applications\//);
    await page.getByRole("link", { name: /^Edit$/i }).click();
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: /delete/i }).click();
    await expect(page).toHaveURL("/applications", { timeout: 10000 });
  });

  test("edit company and role from the detail page", async ({ page, withApplication }) => {
    const { url } = await withApplication({ company: "EditMe Co", role: "Junior Dev" });

    await page.goto(url);
    // Detail page opens in view mode; click Edit to enter edit mode
    await page.getByRole("link", { name: /^Edit$/i }).click();
    await page.getByLabel(/company/i).fill("Edited Corp");
    await page.getByLabel(/role/i).fill("Senior Dev");
    await page.getByRole("button", { name: /^save$/i }).click();

    await expect(page).toHaveURL(/\/applications\//);
    await expect(page.getByText("Edited Corp").first()).toBeVisible();
    await expect(page.getByText("Senior Dev").first()).toBeVisible();
  });

  test("add a note and verify it persists after reload", async ({ page, withApplication }) => {
    const { url } = await withApplication({ company: "NoteTest Co" });

    await page.goto(url);
    // Enter edit mode to access the form
    await page.getByRole("link", { name: /^Edit$/i }).click();
    await page.getByLabel(/notes/i).fill("This is a test note.");
    await page.getByRole("button", { name: /^save$/i }).click();

    await expect(page).toHaveURL(/\/applications\//);

    // Navigate back to the detail page and enter edit mode to verify the note was saved
    await page.goto(url);
    await page.getByRole("link", { name: /^Edit$/i }).click();
    await expect(page.getByLabel(/notes/i)).toHaveValue("This is a test note.");
  });

  test("delete application from the list (inline delete button)", async ({ page }) => {
    // Create via UI
    const company = `DeleteFromList ${Date.now()}`;
    await page.goto("/applications/new");
    await page.getByLabel(/company/i).fill(company);
    await page.getByLabel(/role/i).fill("Test Role");
    await page.getByLabel(/location/i).fill("Remote");
    await page.getByRole("button", { name: /^add$/i }).click();
    await expect(page).toHaveURL("/applications");
    await expect(page.getByText(company)).toBeVisible();

    // Navigate to detail (view mode), click Edit, then delete
    await page.getByRole("link", { name: new RegExp(company) }).click();
    await expect(page).toHaveURL(/\/applications\//);
    await page.getByRole("link", { name: /^Edit$/i }).click();
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: /^delete$/i }).click();

    await expect(page).toHaveURL("/applications", { timeout: 10000 });
    await expect(page.getByText(company)).not.toBeVisible();
  });
});
