import { test, expect } from "@playwright/test";

/** Splits a CSP header into its directives, keyed by name. */
function directives(csp: string): Record<string, string> {
  return Object.fromEntries(
    csp.split(";").map((part) => {
      const [name, ...values] = part.trim().split(/\s+/);
      return [name, values.join(" ")];
    })
  );
}

test.describe("Security headers", () => {
  for (const path of ["/login", "/applications"]) {
    test(`GET ${path} carries the required security headers`, async ({ request }) => {
      const response = await request.get(path);
      const headers = response.headers();

      const csp = headers["content-security-policy"];
      expect(csp, `${path} served no CSP`).toBeTruthy();

      const csp_ = directives(csp);
      expect(csp_["default-src"]).toBe("'self'");
      expect(csp_["script-src"]).toMatch(/^'self' 'nonce-[^']+'$/);
      // 'unsafe-eval' or a wildcard in script-src would defeat the nonce.
      expect(csp_["script-src"]).not.toContain("unsafe-eval");
      expect(csp_["script-src"]).not.toContain("*");
      expect(csp_["frame-ancestors"]).toBe("'none'");
      expect(csp_["base-uri"]).toBe("'self'");
      expect(csp_["form-action"]).toBe("'self'");
      expect(csp_["object-src"] ?? csp_["default-src"]).toBe("'self'");

      expect(headers["x-frame-options"]).toBe("DENY");
      expect(headers["x-content-type-options"]).toBe("nosniff");
      expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
      expect(headers["permissions-policy"]).toContain("camera=()");
      expect(headers["permissions-policy"]).toContain("microphone=()");
      expect(headers["permissions-policy"]).toContain("geolocation=()");
    });
  }

  test("does not allow the app to be framed", async ({ request }) => {
    // Both headers must say no — older browsers honour only X-Frame-Options.
    const headers = (await request.get("/login")).headers();

    expect(headers["x-frame-options"]).toBe("DENY");
    expect(directives(headers["content-security-policy"])["frame-ancestors"]).toBe("'none'");
  });

  test("issues a fresh CSP nonce for every request", async ({ request }) => {
    const nonces = await Promise.all(
      [1, 2, 3].map(async () => {
        const csp = (await request.get("/login")).headers()["content-security-policy"] ?? "";
        const match = csp.match(/nonce-([A-Za-z0-9+/=]+)/);
        expect(match, "no nonce in CSP").toBeTruthy();
        return match![1];
      })
    );

    // A reused nonce lets an injected script ride along on a value the attacker
    // has already observed.
    expect(new Set(nonces).size).toBe(nonces.length);
  });
});
