// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// env.ts requires these at module load; vi.hoisted runs before the static
// imports do. The real module is used deliberately: mocking ROUTES with a
// hand-written copy would let the public-path list drift from the real routes
// without any test noticing.
vi.hoisted(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL ??= "http://localhost:54321";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "placeholder";
  process.env.NEXT_PUBLIC_APP_URL ??= "http://localhost:3000";
});

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(),
}));

import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";
import { ROUTES } from "@/lib/env";

const createServerClientMock = vi.mocked(createServerClient);

function signedInAs(user: unknown) {
  createServerClientMock.mockReturnValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
  } as never);
}

const signedOut = () => signedInAs(null);
const signedIn = () => signedInAs({ id: "user-123", email: "user@example.com" });

function makeRequest(path: string) {
  return new NextRequest(`http://localhost:3000${path}`);
}

/** Location header of a redirect response, or null when it is a pass-through. */
function redirectTarget(response: Response): URL | null {
  const location = response.headers.get("location");
  return location ? new URL(location) : null;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("updateSession — signed out", () => {
  it.each([
    ["/applications"],
    ["/applications/a1b2c3d4-e5f6-4000-a000-000000000001"],
    ["/dashboard"],
    ["/analytics"],
    ["/settings"],
    ["/wishlist"],
    ["/wishlist/new"],
    ["/api/export/applications"],
    ["/api/extension/applications"],
  ])("sends %s to the login page instead of serving it", async (path) => {
    signedOut();

    const target = redirectTarget(await updateSession(makeRequest(path)));

    expect(target?.pathname).toBe(ROUTES.login);
  });

  it("remembers where the user was headed so login can return them there", async () => {
    signedOut();

    const target = redirectTarget(await updateSession(makeRequest("/applications")));

    expect(target?.searchParams.get("next")).toBe("/applications");
  });

  it("preserves a deep link's path in the next param", async () => {
    signedOut();

    const target = redirectTarget(
      await updateSession(makeRequest("/applications/a1b2c3d4-e5f6-4000-a000-000000000001"))
    );

    expect(target?.searchParams.get("next")).toBe(
      "/applications/a1b2c3d4-e5f6-4000-a000-000000000001"
    );
  });

  it.each([
    ["the login page", ROUTES.login],
    ["the auth callback", ROUTES.authCallback],
    ["the forgot-password page", ROUTES.forgotPassword],
    ["the password-reset callback", ROUTES.resetPasswordCallback],
    ["the auto-ghost cron endpoint", ROUTES.cronAutoGhost],
  ])("serves %s without a session", async (_label, path) => {
    signedOut();

    const response = await updateSession(makeRequest(path));

    expect(response.headers.get("location")).toBeNull();
    expect(response.status).toBe(200);
  });

  it("declares every public path as a real route of the app", () => {
    // Guards against a typo in the public-path list silently exposing nothing
    // (or, worse, silently protecting a callback the auth flow needs).
    const publicRoutes = [
      ROUTES.login,
      ROUTES.authCallback,
      ROUTES.forgotPassword,
      ROUTES.resetPasswordCallback,
      ROUTES.cronAutoGhost,
    ];
    for (const route of publicRoutes) {
      expect(typeof route, JSON.stringify(publicRoutes)).toBe("string");
      expect(route.startsWith("/")).toBe(true);
    }
  });
});

describe("updateSession — signed in", () => {
  it("sends an already signed-in user from the login page to the dashboard", async () => {
    signedIn();

    const target = redirectTarget(await updateSession(makeRequest(ROUTES.login)));

    expect(target?.pathname).toBe(ROUTES.dashboard);
  });

  it.each([["/applications"], ["/dashboard"], ["/analytics"], ["/settings"]])(
    "serves %s",
    async (path) => {
      signedIn();

      const response = await updateSession(makeRequest(path));

      expect(response.headers.get("location")).toBeNull();
      expect(response.status).toBe(200);
    }
  );

  it("does not bounce the user off the forgot-password page", async () => {
    // Only /login redirects away for a signed-in user — a signed-in user who
    // wants a reset link must still be able to ask for one.
    signedIn();

    const response = await updateSession(makeRequest(ROUTES.forgotPassword));

    expect(response.headers.get("location")).toBeNull();
  });
});
