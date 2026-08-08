import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { ApplicationsResults } from "@/app/applications/applications-results";
import { buildSupabaseMock } from "../helpers/supabase-mock";
import { makeApplication } from "../helpers/factories";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/app/applications/actions", () => ({
  deleteAllApplicationsAction: vi.fn(),
  transitionApplicationStatusAction: vi.fn(),
}));

const applications = [makeApplication({ company: "Acme Corp", status: "applied" })];

vi.mock("@/lib/auth", () => ({
  requireUser: vi.fn(async () => {
    const supabase = buildSupabaseMock({ selectData: applications });
    return { supabase, user: { id: "user-uuid-123", email: "test@example.com" } };
  }),
}));

describe("ApplicationsResults toolbar", () => {
  it("renders the action buttons in order: add, export, delete all", async () => {
    const { container } = render(await ApplicationsResults({ filter: "open" }));

    const labels = Array.from(container.querySelectorAll("a, button")).map(
      (el) => el.textContent ?? "",
    );

    const addIndex = labels.findIndex((t) => t.includes("Add"));
    const exportIndex = labels.findIndex((t) => t.includes("Export"));
    const deleteIndex = labels.findIndex((t) => t.includes("Delete all"));

    expect(addIndex).toBeGreaterThanOrEqual(0);
    expect(exportIndex).toBeGreaterThan(addIndex);
    expect(deleteIndex).toBeGreaterThan(exportIndex);
  });
});
