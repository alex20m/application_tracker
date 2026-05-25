import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApplicationsSearch } from "@/components/applications-search";
import { makeApplication } from "../helpers/factories";

// ApplicationList uses Link from next/link — stub it
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// ApplicationStatusQuickActions uses useTransition + a server action
vi.mock("@/app/applications/actions", () => ({
  transitionApplicationStatusAction: vi.fn(),
}));

const applications = [
  makeApplication({ company: "Acme Corp", role: "Software Engineer" }),
  makeApplication({ company: "Beta Ltd", role: "Product Manager" }),
  makeApplication({ company: "Gamma Inc", role: "Designer" }),
];

describe("ApplicationsSearch", () => {
  it("renders all applications when query is empty", () => {
    render(<ApplicationsSearch applications={applications} />);
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("Beta Ltd")).toBeInTheDocument();
    expect(screen.getByText("Gamma Inc")).toBeInTheDocument();
  });

  it("filters by company name (case-insensitive)", async () => {
    const user = userEvent.setup();
    render(<ApplicationsSearch applications={applications} />);

    await user.type(screen.getByRole("searchbox"), "acme");

    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.queryByText("Beta Ltd")).not.toBeInTheDocument();
    expect(screen.queryByText("Gamma Inc")).not.toBeInTheDocument();
  });

  it("filters by role (case-insensitive)", async () => {
    const user = userEvent.setup();
    render(<ApplicationsSearch applications={applications} />);

    await user.type(screen.getByRole("searchbox"), "designer");

    expect(screen.queryByText("Acme Corp")).not.toBeInTheDocument();
    expect(screen.getByText("Gamma Inc")).toBeInTheDocument();
  });

  it("shows no-match message when query produces no results", async () => {
    const user = userEvent.setup();
    render(<ApplicationsSearch applications={applications} />);

    await user.type(screen.getByRole("searchbox"), "zzznomatch");

    expect(screen.getByText(/no matches for/i)).toBeInTheDocument();
  });

  it("restores full list when query is cleared", async () => {
    const user = userEvent.setup();
    render(<ApplicationsSearch applications={applications} />);

    await user.type(screen.getByRole("searchbox"), "acme");
    await user.clear(screen.getByRole("searchbox"));

    expect(screen.getByText("Beta Ltd")).toBeInTheDocument();
    expect(screen.getByText("Gamma Inc")).toBeInTheDocument();
  });
});
