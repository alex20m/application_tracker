import { test as base, expect, type Dialog } from "@playwright/test";

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
    // runs assert against stale data, so a genuine failure to delete is raised
    // rather than skipped.
    const acceptDialog = (d: Dialog) => d.accept();
    page.on("dialog", acceptDialog);

    const undeleted: string[] = [];
    for (const id of created) {
      try {
        await page.goto(`/applications/${id}?mode=edit`);

        // waitFor, not count(): the detail route streams behind a Suspense
        // fallback, so on a hard navigation the button is not in the DOM at the
        // moment `goto` resolves. count() does not retry and would read 0.
        const deleteBtn = page.getByRole("button", { name: /^delete$/i }).first();
        await deleteBtn.waitFor({ state: "visible", timeout: 15000 });
        await deleteBtn.click();
        await page.waitForURL(/\/applications(\?filter=[^/]*)?$/, { timeout: 15000 });
      } catch {
        // Fall through to the check below — what matters is whether the row is
        // gone, not whether this particular path to deleting it worked.
      }

      // Verify against the row itself rather than trusting the redirect. This
      // also waits rather than sampling, for the same streaming reason.
      await page.goto(`/applications/${id}`);
      const gone = await page
        .getByText("Application not found.")
        .waitFor({ state: "visible", timeout: 15000 })
        .then(() => true)
        .catch(() => false);
      if (!gone) undeleted.push(id);
    }

    page.off("dialog", acceptDialog);

    if (undeleted.length > 0) {
      throw new Error(
        `Test data left behind — could not delete application(s): ${undeleted.join(", ")}`
      );
    }
  },
});

export { expect };
