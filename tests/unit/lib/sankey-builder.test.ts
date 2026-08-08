import { describe, it, expect } from "vitest";
import { buildSankeyData } from "@/lib/sankey-builder";
import { SANKEY_ROOT, STATUS } from "@/lib/statuses";
import { makeApplication, makeStatusEvent } from "../../helpers/factories";
import type { SankeyData } from "@/lib/types";

/** Resolves the numeric link indices back to names, so assertions read as flows. */
function flows({ nodes, links }: SankeyData): Array<{ from: string; to: string; value: number }> {
  return links.map((l) => ({
    from: nodes[l.source].name,
    to: nodes[l.target].name,
    value: l.value,
  }));
}

describe("buildSankeyData", () => {
  it("returns nothing to draw for no applications", () => {
    expect(buildSankeyData([])).toEqual({ nodes: [], links: [] });
  });

  it("returns nothing to draw when every application is still on the wishlist", () => {
    const app = makeApplication({ status: STATUS.wishlist });
    expect(buildSankeyData([app])).toEqual({ nodes: [], links: [] });
  });

  it("draws the applied-then-interviewed journey as two flows off the root", () => {
    const app = makeApplication({
      status: STATUS.interviews,
      events: [
        makeStatusEvent({ from_status: null, to_status: STATUS.applied }),
        makeStatusEvent({ from_status: STATUS.applied, to_status: STATUS.interviews }),
      ],
    });

    const data = buildSankeyData([app]);

    expect(data.nodes.map((n) => n.name)).toEqual([
      SANKEY_ROOT,
      STATUS.applied,
      STATUS.interviews,
    ]);
    expect(flows(data)).toEqual([
      { from: SANKEY_ROOT, to: STATUS.applied, value: 1 },
      { from: STATUS.applied, to: STATUS.interviews, value: 1 },
    ]);
  });

  it("treats an event with no source status as flowing from the root", () => {
    const app = makeApplication({
      status: STATUS.applied,
      events: [makeStatusEvent({ from_status: null, to_status: STATUS.applied })],
    });

    expect(flows(buildSankeyData([app]))).toEqual([
      { from: SANKEY_ROOT, to: STATUS.applied, value: 1 },
    ]);
  });

  it("adds up applications that share the same transition", () => {
    const mkApp = () =>
      makeApplication({
        status: STATUS.interviews,
        events: [makeStatusEvent({ from_status: STATUS.applied, to_status: STATUS.interviews })],
      });

    expect(flows(buildSankeyData([mkApp(), mkApp(), mkApp()]))).toEqual([
      { from: STATUS.applied, to: STATUS.interviews, value: 3 },
    ]);
  });

  it("keeps distinct transitions apart instead of merging their counts", () => {
    const rejected = makeApplication({
      status: STATUS.rejected,
      events: [makeStatusEvent({ from_status: STATUS.applied, to_status: STATUS.rejected })],
    });
    const interviewed = makeApplication({
      status: STATUS.interviews,
      events: [makeStatusEvent({ from_status: STATUS.applied, to_status: STATUS.interviews })],
    });

    expect(flows(buildSankeyData([rejected, interviewed]))).toEqual(
      expect.arrayContaining([
        { from: STATUS.applied, to: STATUS.rejected, value: 1 },
        { from: STATUS.applied, to: STATUS.interviews, value: 1 },
      ])
    );
    expect(buildSankeyData([rejected, interviewed]).links).toHaveLength(2);
  });

  it("drops a self-loop rather than drawing a status flowing into itself", () => {
    const app = makeApplication({
      status: STATUS.applied,
      events: [makeStatusEvent({ from_status: STATUS.applied, to_status: STATUS.applied })],
    });

    expect(buildSankeyData([app]).links).toEqual([]);
  });

  it("drops events that move into the wishlist", () => {
    const app = makeApplication({
      status: STATUS.applied,
      events: [
        makeStatusEvent({ from_status: STATUS.applied, to_status: STATUS.wishlist }),
        makeStatusEvent({ from_status: null, to_status: STATUS.applied }),
      ],
    });

    expect(flows(buildSankeyData([app]))).toEqual([
      { from: SANKEY_ROOT, to: STATUS.applied, value: 1 },
    ]);
  });

  it("drops events that move out of the wishlist", () => {
    // The wishlist is a staging area, not a pipeline stage — a wishlist→applied
    // hop would draw a column the chart is not meant to show.
    const app = makeApplication({
      status: STATUS.applied,
      events: [
        makeStatusEvent({ from_status: STATUS.wishlist, to_status: STATUS.applied }),
        makeStatusEvent({ from_status: STATUS.applied, to_status: STATUS.interviews }),
      ],
    });

    const data = buildSankeyData([app]);

    expect(data.nodes.map((n) => n.name)).not.toContain(STATUS.wishlist);
    expect(flows(data)).toEqual([
      { from: STATUS.applied, to: STATUS.interviews, value: 1 },
    ]);
  });

  it("excludes an application still on the wishlist from the counts", () => {
    const shared = () =>
      makeStatusEvent({ from_status: STATUS.applied, to_status: STATUS.interviews });
    const onWishlist = makeApplication({ status: STATUS.wishlist, events: [shared()] });
    const applied = makeApplication({ status: STATUS.interviews, events: [shared()] });

    // Both carry the same transition, so a broken filter shows up as a doubled
    // count rather than an extra node.
    expect(flows(buildSankeyData([onWishlist, applied]))).toEqual([
      { from: STATUS.applied, to: STATUS.interviews, value: 1 },
    ]);
  });

  it("survives an application whose events are missing", () => {
    const app = makeApplication({
      status: STATUS.applied,
      events: undefined as never,
    });

    expect(buildSankeyData([app])).toEqual({ nodes: [{ name: SANKEY_ROOT }], links: [] });
  });

  it("indexes every link into a node that exists", () => {
    const app = makeApplication({
      status: STATUS.offer,
      events: [
        makeStatusEvent({ from_status: null, to_status: STATUS.applied }),
        makeStatusEvent({ from_status: STATUS.applied, to_status: STATUS.interviews }),
        makeStatusEvent({ from_status: STATUS.interviews, to_status: STATUS.offer }),
      ],
    });

    const { nodes, links } = buildSankeyData([app]);

    expect(links).toHaveLength(3);
    for (const link of links) {
      expect(nodes[link.source]).toBeDefined();
      expect(nodes[link.target]).toBeDefined();
    }
  });
});
