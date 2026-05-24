import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "@/components/status-badge";
import { STATUS, STATUS_NAMES, STATUS_THEME } from "@/lib/statuses";

describe("StatusBadge", () => {
  it("renders the human-readable status name", () => {
    render(<StatusBadge status={STATUS.interviews} />);
    expect(screen.getByText(STATUS_NAMES[STATUS.interviews])).toBeInTheDocument();
  });

  it("applies the correct badge theme class from STATUS_THEME", () => {
    const { container } = render(<StatusBadge status={STATUS.accepted} />);
    const badge = container.firstChild as HTMLElement;
    const theme = STATUS_THEME[STATUS.accepted];
    // badge class string should contain at least part of the theme string
    expect(badge.className).toContain("rounded-full");
    // The dot span should carry the dot class
    const dot = badge.querySelector("span");
    expect(dot?.className).toContain(theme.dot);
  });

  it("renders for every known status without throwing", () => {
    for (const status of Object.values(STATUS)) {
      const { unmount } = render(<StatusBadge status={status} />);
      expect(screen.getByText(STATUS_NAMES[status])).toBeInTheDocument();
      unmount();
    }
  });
});
