import { describe, it, expect, vi, afterEach } from "vitest";
import * as ui from "@/lib/ui";
import { sanitizeActionError, GENERIC_ACTION_ERROR, ERROR_BANNER, SUCCESS_BANNER } from "@/lib/ui";

afterEach(() => {
  vi.restoreAllMocks();
});

function silenceConsole() {
  return vi.spyOn(console, "error").mockImplementation(() => {});
}

describe("sanitizeActionError", () => {
  it("returns the generic error message", () => {
    silenceConsole();
    expect(sanitizeActionError(new Error("db exploded"), "test:context")).toBe(
      GENERIC_ACTION_ERROR
    );
  });

  it.each([
    ["a Postgres error message", new Error('relation "applications" does not exist')],
    ["a Supabase error object", { message: "JWT expired", code: "PGRST301" }],
    ["a connection string", new Error("connect ECONNREFUSED 10.0.0.5:5432")],
    ["a plain string", "password authentication failed for user \"postgres\""],
    ["a stack trace", (() => { const e = new Error("boom"); e.stack = "at /srv/app/secret.ts:12"; return e; })()],
  ])("does not leak %s to the user", (_label, err) => {
    silenceConsole();

    const message = sanitizeActionError(err, "app:create");

    // Whatever went wrong internally, the user sees one fixed sentence — the
    // point of this helper is that database and infrastructure detail never
    // reaches the browser.
    expect(message).toBe(GENERIC_ACTION_ERROR);
  });

  it("logs the context and the original error for the server operator", () => {
    const spy = silenceConsole();
    const err = new Error("something internal");

    sanitizeActionError(err, "app:create");

    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith("[app:create]", err);
  });

  it("returns the same message regardless of the error or context", () => {
    silenceConsole();

    const messages = [
      sanitizeActionError(new Error("a"), "ctx-one"),
      sanitizeActionError({ code: "23505" }, "ctx-two"),
      sanitizeActionError(null, "ctx-three"),
      sanitizeActionError(undefined, "ctx-four"),
    ];

    // A message that varied with the failure would let a caller distinguish,
    // say, "row not found" from "permission denied" on someone else's data.
    expect(new Set(messages)).toEqual(new Set([GENERIC_ACTION_ERROR]));
  });

  it("offers the user something to do next", () => {
    expect(GENERIC_ACTION_ERROR).toMatch(/try again/i);
  });
});

describe("status banners", () => {
  const banners = [
    ["ERROR_BANNER", ERROR_BANNER],
    ["SUCCESS_BANNER", SUCCESS_BANNER],
  ] as const;

  it.each(banners)("%s is outlined on every side, not tagged with a left rule", (_label, banner) => {
    // A thick coloured bar down one edge is a stock look the rest of this UI
    // does not use — cards, inputs and badges all carry an even hairline.
    expect(banner).not.toMatch(/\bborder-l\b|\bborder-l-\d/);
    expect(banner).not.toContain("border-left-color");
    expect(banner.split(/\s+/)).toContain("border");
  });

  it.each(banners)("%s tints its border with its own status colour", (_label, banner) => {
    // Not border-border-base: a red banner outlined in neutral grey reads as a
    // panel that happens to be pink, rather than as an error.
    expect(banner).toMatch(/\[border-color:color-mix\(in_oklab,var\(--st-(rejected|offer)\)/);
  });
});

describe("class-name constants", () => {
  const constants = Object.entries(ui).filter(
    ([, value]) => typeof value === "string"
  ) as [string, string][];

  it("exports class strings for every styled element", () => {
    expect(constants.length).toBeGreaterThan(10);
  });

  it.each(constants)("%s keeps each arbitrary value in one whitespace-free token", (_name, value) => {
    // The browser splits a class attribute on whitespace, so a space inside
    // brackets — "[background:color-mix(in oklab,…)]" — silently becomes two
    // class names that match no rule and the style just never applies.
    // Tailwind's underscore stands in for the space.
    for (const token of value.split(/\s+/)) {
      const opens = (token.match(/\[/g) ?? []).length;
      const closes = (token.match(/\]/g) ?? []).length;
      expect({ token, opens, closes }).toEqual({ token, opens, closes: opens });
    }
  });
});
