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

    expect(screen.getByText(/no matching applications/i)).toBeInTheDocument();
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

describe("ApplicationsSearch — status filter", () => {
  const multiStatusApps = [
    makeApplication({ company: "Acme Corp", role: "Engineer", status: "applied" }),
    makeApplication({ company: "Beta Ltd", role: "Designer", status: "interviews" }),
    makeApplication({ company: "Gamma Inc", role: "Manager", status: "offer" }),
  ];

  it("renders Status filter button when multiple statuses exist", () => {
    render(<ApplicationsSearch applications={multiStatusApps} />);
    expect(screen.getByRole("button", { name: /status/i })).toBeInTheDocument();
  });

  it("opens status dropdown on click and shows status options", async () => {
    const user = userEvent.setup();
    render(<ApplicationsSearch applications={multiStatusApps} />);

    await user.click(screen.getByRole("button", { name: /status/i }));

    expect(screen.getByLabelText("Applied")).toBeInTheDocument();
    expect(screen.getByLabelText("Interviews")).toBeInTheDocument();
    expect(screen.getByLabelText("Offer")).toBeInTheDocument();
  });

  it("filters to only selected status", async () => {
    const user = userEvent.setup();
    render(<ApplicationsSearch applications={multiStatusApps} />);

    await user.click(screen.getByRole("button", { name: /status/i }));
    await user.click(screen.getByLabelText("Applied"));

    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.queryByText("Beta Ltd")).not.toBeInTheDocument();
    expect(screen.queryByText("Gamma Inc")).not.toBeInTheDocument();
  });

  it("clears status filter via Clear all", async () => {
    const user = userEvent.setup();
    render(<ApplicationsSearch applications={multiStatusApps} />);

    // Open dropdown and select Applied — dropdown stays open
    await user.click(screen.getByRole("button", { name: /status/i }));
    await user.click(screen.getByLabelText("Applied"));
    // Clear all is visible while dropdown is open
    await user.click(screen.getByRole("button", { name: /clear all/i }));

    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("Beta Ltd")).toBeInTheDocument();
    expect(screen.getByText("Gamma Inc")).toBeInTheDocument();
  });
});

describe("ApplicationsSearch — location filter", () => {
  const multiLocationApps = [
    makeApplication({ company: "Acme Corp", role: "Engineer", location: "Remote" }),
    makeApplication({ company: "Beta Ltd", role: "Designer", location: "New York" }),
    makeApplication({ company: "Gamma Inc", role: "Manager", location: "London" }),
  ];

  it("renders Location filter button when multiple locations exist", () => {
    render(<ApplicationsSearch applications={multiLocationApps} />);
    expect(screen.getByRole("button", { name: /location/i })).toBeInTheDocument();
  });

  it("filters to only selected location", async () => {
    const user = userEvent.setup();
    render(<ApplicationsSearch applications={multiLocationApps} />);

    await user.click(screen.getByRole("button", { name: /location/i }));
    await user.click(screen.getByLabelText("Remote"));

    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.queryByText("Beta Ltd")).not.toBeInTheDocument();
    expect(screen.queryByText("Gamma Inc")).not.toBeInTheDocument();
  });

  it("shows no-match message when filters produce no results", async () => {
    const user = userEvent.setup();
    render(<ApplicationsSearch applications={multiLocationApps} />);

    await user.click(screen.getByRole("button", { name: /location/i }));
    await user.click(screen.getByLabelText("Remote"));
    await user.click(document.body); // close dropdown

    await user.type(screen.getByRole("searchbox"), "zzznomatch");

    expect(screen.getByText(/no matching applications/i)).toBeInTheDocument();
  });

  it("clears all filters via Clear filters button", async () => {
    const user = userEvent.setup();
    render(<ApplicationsSearch applications={multiLocationApps} />);

    await user.click(screen.getByRole("button", { name: /location/i }));
    await user.click(screen.getByLabelText("Remote"));
    await user.click(document.body); // close dropdown

    expect(screen.getByRole("button", { name: /clear filters/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /clear filters/i }));

    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("Beta Ltd")).toBeInTheDocument();
    expect(screen.getByText("Gamma Inc")).toBeInTheDocument();
  });
});
