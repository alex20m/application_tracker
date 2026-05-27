import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DatePicker } from "@/components/date-picker";

// DayPicker imports react-day-picker/style.css; jest/vitest can't parse CSS.
vi.mock("react-day-picker/style.css", () => ({}));

describe("DatePicker — uncontrolled / form mode", () => {
  it("renders a hidden input with the given name", () => {
    render(<DatePicker name="applied_on" />);
    const hidden = document.querySelector('input[type="hidden"][name="applied_on"]') as HTMLInputElement;
    expect(hidden).not.toBeNull();
  });

  it("populates hidden input with defaultValue", () => {
    render(<DatePicker name="applied_on" defaultValue="2026-05-01" />);
    const hidden = document.querySelector('input[type="hidden"][name="applied_on"]') as HTMLInputElement;
    expect(hidden?.value).toBe("2026-05-01");
  });

  it("renders the trigger button", () => {
    render(<DatePicker name="applied_on" />);
    expect(screen.getByRole("button", { name: /select date/i })).toBeInTheDocument();
  });

  it("opens the calendar on button click", async () => {
    render(<DatePicker name="applied_on" />);
    fireEvent.click(screen.getByRole("button", { name: /select date/i }));
    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: /date picker/i })).toBeInTheDocument();
    });
  });
});

describe("DatePicker — controlled mode", () => {
  it("does not render a hidden input when name is omitted", () => {
    render(<DatePicker value="2026-05-15" onChange={vi.fn()} />);
    expect(document.querySelector('input[type="hidden"]')).toBeNull();
  });

  it("shows the provided value as a locale date string", async () => {
    render(<DatePicker value="2026-05-15" onChange={vi.fn()} />);
    const expected = new Date(2026, 4, 15).toLocaleDateString();
    await waitFor(() => {
      expect(screen.getByText(expected)).toBeInTheDocument();
    });
  });

  it("shows placeholder when value is empty string", () => {
    render(<DatePicker value="" onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: /select date/i })).toBeInTheDocument();
  });

  it("calls onChange with ISO string when Today is clicked in the calendar", async () => {
    const handleChange = vi.fn();
    render(<DatePicker value="" onChange={handleChange} />);

    // Open calendar
    fireEvent.click(screen.getByRole("button", { name: /select date/i }));
    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: /date picker/i })).toBeInTheDocument();
    });

    // Click the "Today" footer button (not the DayPicker day cell that also says "Today")
    fireEvent.click(screen.getByText("Today", { selector: "button" }));

    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    expect(handleChange).toHaveBeenCalledWith(`${y}-${m}-${d}`);
  });
});
