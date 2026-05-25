import { describe, it, expect, vi, afterEach } from "vitest";
import { sanitizeActionError, GENERIC_ACTION_ERROR } from "@/lib/ui";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("sanitizeActionError", () => {
  it("returns the generic error message", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const result = sanitizeActionError(new Error("db exploded"), "test:context");
    expect(result).toBe(GENERIC_ACTION_ERROR);
  });

  it("calls console.error with the context and the original error", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const err = new Error("something internal");
    sanitizeActionError(err, "app:create");
    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith("[app:create]", err);
  });

  it("handles non-Error objects", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const result = sanitizeActionError("plain string error", "ctx");
    expect(result).toBe(GENERIC_ACTION_ERROR);
  });
});
