import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormattedDate } from "@/lib/date";

/**
 * FormattedDate exists to render a stored `YYYY-MM-DD` as that same calendar
 * day. `new Date("2026-05-24")` parses as UTC midnight, which in any negative
 * UTC offset renders as the 23rd — so the expected values below are written out
 * literally rather than derived from a Date, which would reproduce the very bug
 * the component prevents.
 */
describe("FormattedDate", () => {
  it("renders the stored calendar day, not the UTC-shifted one", async () => {
    render(<FormattedDate dateString="2026-05-24" />);

    const formatted = await screen.findByText(/2026/);
    const parts = formatted.textContent!.match(/\d+/g)!.map(Number);
    // Locale ordering varies; the day, month and year must all be the stored ones.
    expect(parts).toContain(24);
    expect(parts).toContain(5);
    expect(parts).toContain(2026);
  });

  it("renders the stored day for a timestamp, ignoring its time component", async () => {
    // A late-evening UTC timestamp is the case that shifts forward a day in
    // positive offsets if the time part is not dropped.
    render(<FormattedDate dateString="2026-05-24T23:30:00.000Z" />);

    const parts = (await screen.findByText(/2026/)).textContent!.match(/\d+/g)!.map(Number);
    expect(parts).toContain(24);
    expect(parts).toContain(5);
  });

  it("renders the first day of the year without rolling back to December", async () => {
    render(<FormattedDate dateString="2026-01-01" />);

    const parts = (await screen.findByText(/2026/)).textContent!.match(/\d+/g)!.map(Number);
    expect(parts).toContain(1);
    expect(parts).toContain(2026);
    expect(parts).not.toContain(2025);
  });

  it("renders the last day of the year without rolling into the next", async () => {
    render(<FormattedDate dateString="2026-12-31" />);

    const parts = (await screen.findByText(/2026/)).textContent!.match(/\d+/g)!.map(Number);
    expect(parts).toContain(31);
    expect(parts).toContain(12);
    expect(parts).toContain(2026);
  });

  it("renders a leap day as February 29th", async () => {
    render(<FormattedDate dateString="2028-02-29" />);

    const parts = (await screen.findByText(/2028/)).textContent!.match(/\d+/g)!.map(Number);
    expect(parts).toContain(29);
    expect(parts).toContain(2);
  });
});
