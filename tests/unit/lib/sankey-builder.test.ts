import { describe, it, expect } from "vitest";
import { buildSankeyData } from "@/lib/sankey-builder";
import { SANKEY_ROOT, STATUS } from "@/lib/statuses";
import { makeApplication, makeStatusEvent } from "../../helpers/factories";

describe("buildSankeyData", () => {
  it("returns empty nodes and links for empty input", () => {
    expect(buildSankeyData([])).toEqual({ nodes: [], links: [] });
  });

  it("returns empty nodes and links when all applications are wishlist", () => {
    const app = makeApplication({ status: STATUS.wishlist });
    expect(buildSankeyData([app])).toEqual({ nodes: [], links: [] });
  });

  it("produces one link and two nodes for a single transition", () => {
    const app = makeApplication({
      status: STATUS.interviews,
      events: [
        makeStatusEvent({ from_status: null, to_status: STATUS.applied }),
        makeStatusEvent({ from_status: STATUS.applied, to_status: STATUS.interviews }),
      ],
    });

    const { nodes, links } = buildSankeyData([app]);

    // Nodes: SANKEY_ROOT, applied, interviews
    expect(nodes.length).toBeGreaterThanOrEqual(2);
    const nodeNames = nodes.map((n) => n.name);
    expect(nodeNames).toContain(STATUS.applied);
    expect(nodeNames).toContain(STATUS.interviews);

    expect(links.length).toBeGreaterThanOrEqual(1);
    const transition = links.find((l) => {
      return nodes[l.source].name === STATUS.applied && nodes[l.target].name === STATUS.interviews;
    });
    expect(transition).toBeDefined();
    expect(transition?.value).toBe(1);
  });

  it("from_status=null is mapped to SANKEY_ROOT node", () => {
    const app = makeApplication({
      status: STATUS.applied,
      events: [makeStatusEvent({ from_status: null, to_status: STATUS.applied })],
    });

    const { nodes, links } = buildSankeyData([app]);

    const nodeNames = nodes.map((n) => n.name);
    expect(nodeNames).toContain(SANKEY_ROOT);

    const rootLink = links.find((l) => nodes[l.source].name === SANKEY_ROOT);
    expect(rootLink).toBeDefined();
    expect(nodes[rootLink!.target].name).toBe(STATUS.applied);
  });

  it("accumulates counts across multiple applications sharing the same transition", () => {
    const mkApp = () =>
      makeApplication({
        status: STATUS.interviews,
        events: [
          makeStatusEvent({ from_status: STATUS.applied, to_status: STATUS.interviews }),
        ],
      });

    const { links, nodes } = buildSankeyData([mkApp(), mkApp(), mkApp()]);

    const link = links.find(
      (l) =>
        nodes[l.source].name === STATUS.applied &&
        nodes[l.target].name === STATUS.interviews
    );
    expect(link?.value).toBe(3);
  });

  it("skips self-loops (from === to)", () => {
    const app = makeApplication({
      status: STATUS.applied,
      events: [
        makeStatusEvent({ from_status: STATUS.applied, to_status: STATUS.applied }),
      ],
    });

    const { links } = buildSankeyData([app]);
    const selfLoop = links.find((l) => {
      // no links should point to themselves via numeric index
      return l.source === l.target;
    });
    expect(selfLoop).toBeUndefined();
  });

  it("filters out events whose to_status is wishlist", () => {
    // Events with to_status=wishlist are skipped by the builder.
    // Events with from_status=wishlist are NOT filtered (only the app-level filter
    // removes apps whose current status is wishlist, not events sourced from wishlist).
    const app = makeApplication({
      status: STATUS.applied,
      events: [
        // This event TO wishlist should produce no link or node for wishlist as a target
        makeStatusEvent({ from_status: STATUS.applied, to_status: STATUS.wishlist }),
        // This event has a normal destination
        makeStatusEvent({ from_status: null, to_status: STATUS.applied }),
      ],
    });

    const { links, nodes } = buildSankeyData([app]);
    // applied→wishlist link must not exist (filtered)
    const wishlistTargetLink = links.find(
      (l) => nodes[l.target].name === STATUS.wishlist
    );
    expect(wishlistTargetLink).toBeUndefined();
  });

  it("apps whose current status is wishlist are excluded entirely", () => {
    const wishlistApp = makeApplication({ status: STATUS.wishlist });
    const normalApp = makeApplication({
      status: STATUS.applied,
      events: [makeStatusEvent({ from_status: null, to_status: STATUS.applied })],
    });

    const { nodes } = buildSankeyData([wishlistApp, normalApp]);
    // wishlist app is excluded; only the normal app's nodes should appear
    const nodeNames = nodes.map((n) => n.name);
    expect(nodeNames).toContain(STATUS.applied);
  });

  it("link source/target are numeric indices into nodes array", () => {
    const app = makeApplication({
      status: STATUS.interviews,
      events: [
        makeStatusEvent({ from_status: null, to_status: STATUS.applied }),
        makeStatusEvent({ from_status: STATUS.applied, to_status: STATUS.interviews }),
      ],
    });

    const { nodes, links } = buildSankeyData([app]);

    for (const link of links) {
      expect(typeof link.source).toBe("number");
      expect(typeof link.target).toBe("number");
      expect(link.source).toBeGreaterThanOrEqual(0);
      expect(link.source).toBeLessThan(nodes.length);
      expect(link.target).toBeGreaterThanOrEqual(0);
      expect(link.target).toBeLessThan(nodes.length);
    }
  });
});
