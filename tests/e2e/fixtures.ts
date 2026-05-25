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
      await page.getByLabel(/company/i).fill(company);
      await page.getByLabel(/role/i).fill(role);
      await page.getByLabel(/location/i).fill(location);
      await page.getByRole("button", { name: /save application/i }).click();

      await expect(page).toHaveURL("/applications");
      // Find the new card link
      const link = page.getByRole("link", { name: new RegExp(company, "i") }).first();
      await expect(link).toBeVisible();

      // Extract id from the link's href to avoid a navigation race
      const href = await link.getAttribute("href");
      const id = href?.split("/applications/")[1]?.split("?")[0] ?? "";
      if (!id) throw new Error(`Could not extract id from link href: ${href}`);
      const url = href!;
      created.push(id);
      return { id, url };
    };

    await use(factory);

    // Cleanup: delete all created applications
    for (const id of created) {
      await page.goto(`/applications/${id}`);
      const deleteBtn = page.getByRole("button", { name: /delete/i }).first();
      if (await deleteBtn.isVisible()) {
        page.once("dialog", (d) => d.accept());
        await deleteBtn.click();
        await expect(page).toHaveURL("/applications", { timeout: 10000 });
      }
    }
  },
});

export { expect };
