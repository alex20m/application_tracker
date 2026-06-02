import { describe, it, expect } from "vitest";
import { detectPlatform } from "@/lib/install";

function withUA(ua: string, fn: () => void) {
  const original = navigator.userAgent;
  Object.defineProperty(navigator, "userAgent", {
    configurable: true,
    get: () => ua,
  });
  fn();
  Object.defineProperty(navigator, "userAgent", {
    configurable: true,
    get: () => original,
  });
}

describe("detectPlatform", () => {
  it("detects iPhone as ios", () => {
    withUA(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      () => {
        expect(detectPlatform()).toBe("ios");
      },
    );
  });

  it("detects iPad as ios", () => {
    withUA(
      "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      () => {
        expect(detectPlatform()).toBe("ios");
      },
    );
  });

  it("detects Chrome on Android as android", () => {
    withUA(
      "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Mobile Safari/537.36",
      () => {
        expect(detectPlatform()).toBe("android");
      },
    );
  });

  it("detects Edge on Windows as desktop-chromium", () => {
    withUA(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36 Edg/117.0.0.0",
      () => {
        expect(detectPlatform()).toBe("desktop-chromium");
      },
    );
  });

  it("detects Chrome on macOS as desktop-chromium", () => {
    withUA(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36",
      () => {
        expect(detectPlatform()).toBe("desktop-chromium");
      },
    );
  });

  it("detects Safari on macOS as safari-macos", () => {
    withUA(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
      () => {
        expect(detectPlatform()).toBe("safari-macos");
      },
    );
  });

  it("detects Firefox on desktop as other", () => {
    withUA(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/117.0",
      () => {
        expect(detectPlatform()).toBe("other");
      },
    );
  });
});
