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
      await page.getByRole("button", { name: /^add$/i }).click();

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

    // Cleanup. Every application is deleted through the detail page's edit mode,
    // reached by URL so the teardown does not depend on where the test left the
    // browser. A row left behind pollutes the shared E2E account and makes later
    // runs assert against stale data, so a failure to delete is raised rather
    // than skipped.
    const undeleted: string[] = [];
    for (const id of created) {
      await page.goto(`/applications/${id}?mode=edit`);

      const deleteBtn = page.getByRole("button", { name: /^delete$/i });
      if ((await deleteBtn.count()) === 0) {
        undeleted.push(id);
        continue;
      }

      page.once("dialog", (d) => d.accept());
      await deleteBtn.click();

      try {
        await expect(page).toHaveURL(/\/applications(\?filter=.*)?$/, { timeout: 10000 });
      } catch {
        undeleted.push(id);
      }
    }

    if (undeleted.length > 0) {
      throw new Error(
        `Test data left behind — could not delete application(s): ${undeleted.join(", ")}`
      );
    }
  },
});

export { expect };
