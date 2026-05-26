import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { FormattedDate } from "@/lib/date";

describe("FormattedDate", () => {
  it("renders the locale-formatted date after mount", async () => {
    const dateString = "2026-05-24";
    render(<FormattedDate dateString={dateString} />);
    const expected = new Date(dateString).toLocaleDateString();
    await waitFor(() => {
      expect(screen.getByText(expected)).toBeTruthy();
    });
  });

});
