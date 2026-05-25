// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
  APP_URL: "http://localhost:3000",
  ROUTES: {
    login: "/login",
    applications: "/applications",
    authCallback: "/api/auth/callback",
    signOut: "/auth/signout",
  },
}));

import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";

const createServerClientMock = vi.mocked(createServerClient);

function makeSupabaseMockClient(user: unknown) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
    cookies: {
      getAll: vi.fn().mockReturnValue([]),
      setAll: vi.fn(),
    },
  };
}

function makeRequest(path: string) {
  return new NextRequest(`http://localhost:3000${path}`);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("updateSession", () => {
  it("redirects unauthenticated request to /login with next param", async () => {
    createServerClientMock.mockReturnValue(makeSupabaseMockClient(null) as never);
    const request = makeRequest("/applications");
    const response = await updateSession(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location") ?? "";
    expect(location).toContain("/login");
    // URL-encodes the path — accept either form
    expect(decodeURIComponent(location)).toContain("next=/applications");
  });

  it("redirects authenticated user away from /login to /applications", async () => {
    createServerClientMock.mockReturnValue(
      makeSupabaseMockClient({ id: "user-123", email: "user@example.com" }) as never
    );
    const request = makeRequest("/login");
    const response = await updateSession(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location") ?? "";
    expect(location).toContain("/applications");
  });

  it("passes through unauthenticated request to /login (public path)", async () => {
    createServerClientMock.mockReturnValue(makeSupabaseMockClient(null) as never);
    const request = makeRequest("/login");
    const response = await updateSession(request);

    // Not a redirect — NextResponse.next()
    expect(response.status).toBe(200);
  });

  it("passes through unauthenticated request to /api/auth/callback (public path)", async () => {
    createServerClientMock.mockReturnValue(makeSupabaseMockClient(null) as never);
    const request = makeRequest("/api/auth/callback");
    const response = await updateSession(request);

    expect(response.status).toBe(200);
  });

  it("allows authenticated request to /applications (protected path)", async () => {
    createServerClientMock.mockReturnValue(
      makeSupabaseMockClient({ id: "user-123" }) as never
    );
    const request = makeRequest("/applications");
    const response = await updateSession(request);

    expect(response.status).toBe(200);
  });
});
