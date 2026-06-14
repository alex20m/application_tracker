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

  it("renders Filters button when multiple statuses exist", () => {
    render(<ApplicationsSearch applications={multiStatusApps} />);
    expect(screen.getByRole("button", { name: "Filters" })).toBeInTheDocument();
  });

  it("opens dropdown and shows status section with options", async () => {
    const user = userEvent.setup();
    render(<ApplicationsSearch applications={multiStatusApps} />);

    await user.click(screen.getByRole("button", { name: "Filters" }));

    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByLabelText("Applied")).toBeInTheDocument();
    expect(screen.getByLabelText("Interviews")).toBeInTheDocument();
    expect(screen.getByLabelText("Offer")).toBeInTheDocument();
  });

  it("filters to only selected status", async () => {
    const user = userEvent.setup();
    render(<ApplicationsSearch applications={multiStatusApps} />);

    await user.click(screen.getByRole("button", { name: "Filters" }));
    await user.click(screen.getByLabelText("Applied"));

    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.queryByText("Beta Ltd")).not.toBeInTheDocument();
    expect(screen.queryByText("Gamma Inc")).not.toBeInTheDocument();
  });

  it("clears status filter via Clear all", async () => {
    const user = userEvent.setup();
    render(<ApplicationsSearch applications={multiStatusApps} />);

    await user.click(screen.getByRole("button", { name: "Filters" }));
    await user.click(screen.getByLabelText("Applied"));
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

  it("renders Filters button when multiple locations exist", () => {
    render(<ApplicationsSearch applications={multiLocationApps} />);
    expect(screen.getByRole("button", { name: "Filters" })).toBeInTheDocument();
  });

  it("opens dropdown and shows location section with options", async () => {
    const user = userEvent.setup();
    render(<ApplicationsSearch applications={multiLocationApps} />);

    await user.click(screen.getByRole("button", { name: "Filters" }));

    expect(screen.getByText("Location")).toBeInTheDocument();
    expect(screen.getByLabelText("Remote")).toBeInTheDocument();
    expect(screen.getByLabelText("New York")).toBeInTheDocument();
    expect(screen.getByLabelText("London")).toBeInTheDocument();
  });

  it("filters to only selected location", async () => {
    const user = userEvent.setup();
    render(<ApplicationsSearch applications={multiLocationApps} />);

    await user.click(screen.getByRole("button", { name: "Filters" }));
    await user.click(screen.getByLabelText("Remote"));

    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.queryByText("Beta Ltd")).not.toBeInTheDocument();
    expect(screen.queryByText("Gamma Inc")).not.toBeInTheDocument();
  });

  it("shows no-match message when filters produce no results", async () => {
    const user = userEvent.setup();
    render(<ApplicationsSearch applications={multiLocationApps} />);

    await user.click(screen.getByRole("button", { name: "Filters" }));
    await user.click(screen.getByLabelText("Remote"));
    await user.click(document.body); // close dropdown

    await user.type(screen.getByRole("searchbox"), "zzznomatch");

    expect(screen.getByText(/no matching applications/i)).toBeInTheDocument();
  });

  it("clears all filters via Clear all inside dropdown", async () => {
    const user = userEvent.setup();
    render(<ApplicationsSearch applications={multiLocationApps} />);

    await user.click(screen.getByRole("button", { name: "Filters" }));
    await user.click(screen.getByLabelText("Remote"));
    await user.click(screen.getByRole("button", { name: /clear all/i }));

    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("Beta Ltd")).toBeInTheDocument();
    expect(screen.getByText("Gamma Inc")).toBeInTheDocument();
  });
});

describe("ApplicationsSearch — combined filters", () => {
  const combinedApps = [
    makeApplication({ company: "Acme Corp", role: "Engineer", status: "applied", location: "Remote" }),
    makeApplication({ company: "Beta Ltd", role: "Designer", status: "interviews", location: "New York" }),
    makeApplication({ company: "Gamma Inc", role: "Manager", status: "offer", location: "London" }),
  ];

  it("shows both Location and Status sections in the unified dropdown", async () => {
    const user = userEvent.setup();
    render(<ApplicationsSearch applications={combinedApps} />);

    await user.click(screen.getByRole("button", { name: "Filters" }));

    expect(screen.getByText("Location")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
  });

  it("badge count reflects combined selection across both groups", async () => {
    const user = userEvent.setup();
    render(<ApplicationsSearch applications={combinedApps} />);

    await user.click(screen.getByRole("button", { name: "Filters" }));
    await user.click(screen.getByLabelText("Remote"));
    await user.click(screen.getByLabelText("Applied"));

    // Badge should show 2 (1 location + 1 status)
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("Clear all inside dropdown resets both location and status filters", async () => {
    const user = userEvent.setup();
    render(<ApplicationsSearch applications={combinedApps} />);

    await user.click(screen.getByRole("button", { name: "Filters" }));
    await user.click(screen.getByLabelText("Remote"));
    await user.click(screen.getByLabelText("Applied"));
    await user.click(screen.getByRole("button", { name: /clear all/i }));

    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("Beta Ltd")).toBeInTheDocument();
    expect(screen.getByText("Gamma Inc")).toBeInTheDocument();
  });
});
