import { test, expect } from "@playwright/test";

test.describe("Security headers", () => {
  test("GET /login response carries all required security headers", async ({ request }) => {
    const response = await request.get("/login");

    // CSP is always required and should contain nonce
    const csp = response.headers()["content-security-policy"];
    expect(csp).toBeTruthy();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self' 'nonce-");
    expect(csp).toContain("frame-ancestors 'none'");

    // Other security headers
    expect(response.headers()["x-frame-options"]).toBe("DENY");
    expect(response.headers()["x-content-type-options"]).toBe("nosniff");
    expect(response.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(response.headers()["permissions-policy"]).toContain("camera=()");
  });

  test("CSP nonce is different per request", async ({ request }) => {
    const r1 = await request.get("/login");
    const r2 = await request.get("/login");

    const csp1 = r1.headers()["content-security-policy"] ?? "";
    const csp2 = r2.headers()["content-security-policy"] ?? "";

    const nonceMatch1 = csp1.match(/nonce-([A-Za-z0-9+/=]+)/);
    const nonceMatch2 = csp2.match(/nonce-([A-Za-z0-9+/=]+)/);

    expect(nonceMatch1).toBeTruthy();
    expect(nonceMatch2).toBeTruthy();
    expect(nonceMatch1![1]).not.toBe(nonceMatch2![1]);
  });
});
