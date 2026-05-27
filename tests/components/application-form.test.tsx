import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ApplicationForm } from "@/components/application-form";
import { makeApplication } from "../helpers/factories";
import { STATUS, STATUS_NAMES, STATUS_NEXT } from "@/lib/statuses";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/lib/env", () => ({
  ROUTES: {
    applications: "/applications",
  },
}));

const noopAction = vi.fn().mockResolvedValue({ success: false });

describe("ApplicationForm — create mode (no application prop)", () => {
  it("renders without a status select (hidden input instead)", () => {
    render(<ApplicationForm action={noopAction} />);
    expect(screen.queryByRole("combobox", { name: /status/i })).not.toBeInTheDocument();
  });

  it("renders Company, Role, Location inputs", () => {
    render(<ApplicationForm action={noopAction} />);
    expect(screen.getByLabelText(/company/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
  });

  it("shows Save Application submit button", () => {
    render(<ApplicationForm action={noopAction} />);
    expect(screen.getByRole("button", { name: /save application/i })).toBeInTheDocument();
  });
});

describe("ApplicationForm — edit mode (application prop provided)", () => {
  const app = makeApplication({ status: STATUS.applied });

  it("renders a status select element", () => {
    render(<ApplicationForm application={app} action={noopAction} />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("includes the current status as an option", () => {
    render(<ApplicationForm application={app} action={noopAction} />);
    const select = screen.getByRole("combobox");
    expect(select).toHaveValue(STATUS.applied);
    expect(screen.getByRole("option", { name: STATUS_NAMES[STATUS.applied] })).toBeInTheDocument();
  });

  it("includes only STATUS_NEXT targets as additional options", () => {
    render(<ApplicationForm application={app} action={noopAction} />);
    const options = screen.getAllByRole("option");
    const optionValues = options.map((o) => (o as HTMLOptionElement).value);

    const expectedValues = [STATUS.applied, ...STATUS_NEXT[STATUS.applied]];
    expect(optionValues).toEqual(expectedValues);
  });

  it("pre-fills company and role fields with existing values", () => {
    const richApp = makeApplication({ company: "Prefilled Co", role: "Prefilled Role" });
    render(<ApplicationForm application={richApp} action={noopAction} />);
    expect(screen.getByDisplayValue("Prefilled Co")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Prefilled Role")).toBeInTheDocument();
  });
});

describe("ApplicationForm — error state", () => {
  it("does not show an error banner on initial render", () => {
    render(<ApplicationForm action={noopAction} />);
    // useActionState starts with { success: false } — no error key → no banner
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
