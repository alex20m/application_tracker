import { test as base, expect } from "@playwright/test";

type Fixtures = {
  /** Creates an application via the UI and returns its detail URL, then deletes it after the test. */
  withApplication: (opts?: {
    company?: string;
    role?: string;
    location?: string;
  }) => Promise<{ id: string; url: string }>;
};

export const test = base.extend<Fixtures>({
  withApplication: async ({ page }, use) => {
    const created: string[] = [];

    const factory = async (opts: { company?: string; role?: string; location?: string } = {}) => {
      const company = opts.company ?? `Test Co ${Date.now()}`;
      const role = opts.role ?? "Test Role";
      const location = opts.location ?? "Remote";

      await page.goto("/applications/new");
      await page.getByPlaceholder(/example corporation/i).fill(company);
      await page.getByPlaceholder(/senior engineer/i).fill(role);
      await page.getByPlaceholder(/stockholm/i).fill(location);
      await page.getByRole("button", { name: /save application/i }).click();

      await expect(page).toHaveURL("/applications");
      // Find the new card link
      const link = page.getByRole("link", { name: new RegExp(company, "i") }).first();
      await expect(link).toBeVisible();

      // Navigate to the app to get its ID from the URL
      await page.locator(`text=${company}`).first().click();
      const url = page.url();
      const id = url.split("/applications/")[1]?.split("?")[0] ?? "";
      created.push(id);
      return { id, url };
    };

    await use(factory);

    // Cleanup: delete all created applications
    for (const id of created) {
      await page.goto(`/applications/${id}`);
      const deleteBtn = page.getByRole("button", { name: /delete/i }).first();
      if (await deleteBtn.isVisible()) {
        await deleteBtn.click();
        // Confirm if a dialog appears
        page.once("dialog", (d) => d.accept());
        await expect(page).toHaveURL("/applications", { timeout: 10000 });
      }
    }
  },
});

export { expect };
