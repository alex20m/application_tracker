import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildSupabaseMock } from "../../helpers/supabase-mock";
import { makeUser } from "../../helpers/factories";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

// revalidatePath is already mocked in tests/setup.ts
import { GET, POST } from "@/app/api/extension/applications/route";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const createClientMock = vi.mocked(createSupabaseServerClient);
const mockUser = makeUser();

function useSupabase(mock: ReturnType<typeof buildSupabaseMock>) {
  createClientMock.mockResolvedValue(mock as never);
  return mock;
}

function makePostRequest(body: unknown): Request {
  return new Request("http://localhost/api/extension/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function insertedRows(mock: ReturnType<typeof buildSupabaseMock>): unknown[] {
  return mock.from.mock.results.flatMap((result) => {
    const insert = (result.value as { insert: ReturnType<typeof vi.fn> }).insert;
    return insert.mock.calls.flatMap((call) => call[0] as unknown[]);
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/extension/applications", () => {
  it("returns 401 when not signed in", async () => {
    useSupabase(buildSupabaseMock({ user: null }));

    const response = await GET();
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ authenticated: false });
  });

  it("returns the user email when signed in", async () => {
    useSupabase(buildSupabaseMock({ user: mockUser }));

    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.authenticated).toBe(true);
    expect(body.email).toBe(mockUser.email);
  });
});

describe("POST /api/extension/applications", () => {
  it("returns 401 when not signed in", async () => {
    useSupabase(buildSupabaseMock({ user: null }));

    const response = await POST(makePostRequest({ company: "Acme", role: "Engineer" }));
    expect(response.status).toBe(401);
  });

  it("returns 400 for invalid JSON", async () => {
    useSupabase(buildSupabaseMock({ user: mockUser }));

    const response = await POST(makePostRequest("not json"));
    expect(response.status).toBe(400);
  });

  it("returns 400 when company is missing", async () => {
    useSupabase(buildSupabaseMock({ user: mockUser }));

    const response = await POST(makePostRequest({ role: "Engineer" }));
    expect(response.status).toBe(400);
  });

  it("inserts an application with applied status and defaults", async () => {
    const mock = useSupabase(buildSupabaseMock({ user: mockUser }));

    const response = await POST(
      makePostRequest({ company: "Acme", role: "Engineer", source: "LinkedIn" })
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.duplicate).toBe(false);
    expect(body.id).toBeTruthy();

    const rows = insertedRows(mock) as Array<Record<string, unknown>>;
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      user_id: mockUser.id,
      company: "Acme",
      role: "Engineer",
      location: "Unknown",
      source: "LinkedIn",
      status: "applied",
    });
    expect(rows[0].applied_on).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(rows[0].events).toEqual([
      expect.objectContaining({ from_status: null, to_status: "applied" }),
    ]);
  });

  it("skips the insert and reports a duplicate for a same-day match", async () => {
    const mock = useSupabase(
      buildSupabaseMock({ user: mockUser, selectData: [{ id: "existing-id" }] })
    );

    const response = await POST(makePostRequest({ company: "Acme", role: "Engineer" }));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.duplicate).toBe(true);
    expect(body.id).toBe("existing-id");
    expect(insertedRows(mock)).toHaveLength(0);
  });

  it("returns 500 when the insert fails", async () => {
    useSupabase(buildSupabaseMock({ user: mockUser, insertError: { message: "db error" } }));

    const response = await POST(makePostRequest({ company: "Acme", role: "Engineer" }));
    expect(response.status).toBe(500);
  });

  it("looks for duplicates only among the signed-in user's same-day applications", async () => {
    const mock = useSupabase(buildSupabaseMock({ user: mockUser }));

    await POST(
      makePostRequest({ company: "Acme", role: "Engineer", applied_on: "2026-05-01" })
    );

    const dedupe = mock.onlyQuery("select");
    expect(dedupe.eqValue("user_id")).toBe(mockUser.id);
    expect(dedupe.eqValue("applied_on")).toBe("2026-05-01");
  });

  it.each([
    ["a percent sign", "Acme %", "Acme \\%"],
    ["an underscore", "Acme_Corp", "Acme\\_Corp"],
    ["a backslash", "Acme\\Corp", "Acme\\\\Corp"],
  ])("escapes %s in the company before matching duplicates", async (_label, company, expected) => {
    // ilike treats % and _ as wildcards. Unescaped, "Acme %" matches every
    // company starting with "Acme " — so a genuinely new application would be
    // reported as a duplicate and silently never saved.
    const mock = useSupabase(buildSupabaseMock({ user: mockUser }));

    await POST(makePostRequest({ company, role: "Engineer" }));

    const dedupe = mock.onlyQuery("select");
    expect(dedupe.filters).toContainEqual({ op: "ilike", column: "company", value: expected });
  });

  it("escapes wildcards in the role as well as the company", async () => {
    const mock = useSupabase(buildSupabaseMock({ user: mockUser }));

    await POST(makePostRequest({ company: "Acme", role: "100% Remote_Engineer" }));

    expect(mock.onlyQuery("select").filters).toContainEqual({
      op: "ilike",
      column: "role",
      value: "100\\% Remote\\_Engineer",
    });
  });

  it("saves a genuinely new application whose company contains a wildcard character", async () => {
    const mock = useSupabase(buildSupabaseMock({ user: mockUser, selectData: [] }));

    const response = await POST(makePostRequest({ company: "50% Ltd", role: "Engineer" }));

    expect(response.status).toBe(201);
    const rows = insertedRows(mock) as Array<Record<string, unknown>>;
    expect(rows[0]).toMatchObject({ company: "50% Ltd" });
  });

  it("uses the submitted applied_on when the extension provides one", async () => {
    const mock = useSupabase(buildSupabaseMock({ user: mockUser }));

    await POST(
      makePostRequest({ company: "Acme", role: "Engineer", applied_on: "2026-03-14" })
    );

    const rows = insertedRows(mock) as Array<Record<string, unknown>>;
    expect(rows[0].applied_on).toBe("2026-03-14");
  });

  it("rejects a malformed applied_on rather than storing it", async () => {
    const mock = useSupabase(buildSupabaseMock({ user: mockUser }));

    const response = await POST(
      makePostRequest({ company: "Acme", role: "Engineer", applied_on: "14/03/2026" })
    );

    expect(response.status).toBe(400);
    expect(insertedRows(mock)).toHaveLength(0);
  });

  it("rejects a company longer than the 200-character column limit", async () => {
    const mock = useSupabase(buildSupabaseMock({ user: mockUser }));

    const response = await POST(
      makePostRequest({ company: "a".repeat(201), role: "Engineer" })
    );

    expect(response.status).toBe(400);
    expect(insertedRows(mock)).toHaveLength(0);
  });

  it("rejects a blank company rather than saving an unnamed application", async () => {
    const mock = useSupabase(buildSupabaseMock({ user: mockUser }));

    const response = await POST(makePostRequest({ company: "   ", role: "Engineer" }));

    expect(response.status).toBe(400);
    expect(insertedRows(mock)).toHaveLength(0);
  });

  it("does not save anything when the request is unauthenticated", async () => {
    const mock = useSupabase(buildSupabaseMock({ user: null }));

    await POST(makePostRequest({ company: "Acme", role: "Engineer" }));

    expect(mock.queries).toHaveLength(0);
  });
});
