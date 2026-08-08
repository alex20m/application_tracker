import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SankeyChart } from "@/components/sankey-chart";
import { SANKEY_ROOT } from "@/lib/statuses";
import { STATUS } from "@/lib/statuses";
import type { SankeyData } from "@/lib/types";

const FLOW: SankeyData = {
  nodes: [{ name: SANKEY_ROOT }, { name: STATUS.applied }, { name: STATUS.interviews }],
  links: [
    { source: 0, target: 1, value: 5 },
    { source: 1, target: 2, value: 2 },
  ],
};

const EMPTY: SankeyData = { nodes: [], links: [] };

function heading() {
  return screen.getByRole("heading", { name: /application flow/i });
}

/** Nearest ancestor (inclusive) that scrolls horizontally, or null. */
function scrollParent(el: HTMLElement): HTMLElement | null {
  for (let node: HTMLElement | null = el; node; node = node.parentElement) {
    if (node.className.includes("overflow-x-auto")) return node;
  }
  return null;
}

describe("SankeyChart mobile scrolling", () => {
  it("keeps the card frame, its edges and the heading out of the scroll area", () => {
    const { container } = render(<SankeyChart data={FLOW} />);

    // The heading must never sit inside a horizontally scrolling element.
    expect(scrollParent(heading())).toBeNull();

    // The card frame itself must not be wider than the viewport, so its
    // borders stay visible — the min-width belongs to the diagram only.
    const card = container.querySelector(".rounded-3xl") as HTMLElement;
    expect(card).not.toBeNull();
    expect(card.className).not.toContain("min-w-");
    expect(scrollParent(card)).toBeNull();
  });

  it("puts the min-width on the diagram inside its own scroll container", () => {
    const { container } = render(<SankeyChart data={FLOW} />);

    const scroller = container.querySelector(".overflow-x-auto") as HTMLElement;
    expect(scroller).not.toBeNull();
    expect(scroller.contains(heading())).toBe(false);

    const diagram = scroller.firstElementChild as HTMLElement;
    expect(diagram.className).toContain("mobile:min-w-[640px]");
  });

  it("does not force a scroll when there is no diagram to show", () => {
    const { container } = render(<SankeyChart data={EMPTY} />);

    expect(container.querySelector(".overflow-x-auto")).toBeNull();
    expect(container.querySelector("[class*='min-w-']")).toBeNull();
    expect(heading()).toBeVisible();
  });
});
