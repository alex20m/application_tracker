import { describe, it, expect, vi, afterEach } from "vitest";
import { sanitizeActionError, GENERIC_ACTION_ERROR } from "@/lib/ui";

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
