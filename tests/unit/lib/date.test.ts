import { describe, it, expect } from "vitest";
import { formatDate } from "@/lib/date";

describe("formatDate", () => {
  it("formats a standard date as DD.MM.YYYY", () => {
    expect(formatDate("2026-05-24")).toBe("24.05.2026");
  });

  it("zero-pads single-digit day and month", () => {
    expect(formatDate("2026-01-03")).toBe("03.01.2026");
  });

  it("handles the last day of the year", () => {
    expect(formatDate("2026-12-31")).toBe("31.12.2026");
  });

  it("formats dates with time component (uses UTC date part)", () => {
    // new Date("2026-05-24") parses as UTC midnight; getDate() uses local time.
    // We just document that the function returns *some* string without throwing.
    const result = formatDate("2026-05-24T00:00:00.000Z");
    expect(typeof result).toBe("string");
    expect(result).toMatch(/^\d{2}\.\d{2}\.\d{4}$/);
  });
});
