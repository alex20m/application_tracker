import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildSupabaseMock, expectScopedToUserRow } from "../../helpers/supabase-mock";
import { makeUser, makeApplication, makeInterviewRound } from "../../helpers/factories";
import { STATUS } from "@/lib/statuses";
import type { InterviewRound } from "@/lib/types";

const mockUser = makeUser();
let mockSupabase = buildSupabaseMock({ user: mockUser });

vi.mock("@/lib/auth", () => ({
  requireUser: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

import {
  addInterviewRoundAction,
  updateInterviewRoundAction,
  deleteInterviewRoundAction,
} from "@/app/applications/[id]/actions";
import { requireUser } from "@/lib/auth";

const requireUserMock = vi.mocked(requireUser);

const APP_ID = "a1b2c3d4-e5f6-4000-a000-000000000010";
const ROUND_ID = "b1b2c3d4-e5f6-4000-a000-000000000011";
const OTHER_ROUND_ID = "c1b2c3d4-e5f6-4000-a000-000000000012";

/** Points the actions at a client whose select returns `stored`, and returns that client. */
function givenStoredApplication(stored: unknown) {
  mockSupabase = buildSupabaseMock({ user: mockUser, selectData: stored });
  requireUserMock.mockResolvedValue({ supabase: mockSupabase as never, user: mockUser as never });
  return mockSupabase;
}

/** An application parked in the interviews stage with the given rounds. */
function interviewingApp(rounds: InterviewRound[]) {
  return makeApplication({
    id: APP_ID,
    user_id: mockUser.id,
    status: STATUS.interviews,
    interview_rounds: rounds,
  });
}

/** The interview_rounds array the action wrote back. */
function writtenRounds(supabase = mockSupabase): InterviewRound[] {
  return (supabase.onlyQuery("update").payload as { interview_rounds: InterviewRound[] })
    .interview_rounds;
}

function roundFormData(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  fd.set("type", overrides.type ?? "Phone screen");
  fd.set("scheduled_at", overrides.scheduled_at ?? "2026-06-01");
  if (overrides.outcome !== undefined) fd.set("outcome", overrides.outcome);
  if (overrides.notes !== undefined) fd.set("notes", overrides.notes);
  if (overrides.id !== undefined) fd.set("id", overrides.id);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  givenStoredApplication(interviewingApp([]));
});

describe("addInterviewRoundAction", () => {
  it("appends the round to the signed-in user's own application", async () => {
    const result = await addInterviewRoundAction(APP_ID, null, roundFormData());

    expect(result.success).toBe(true);
    const rounds = writtenRounds();
    expect(rounds).toHaveLength(1);
    expect(rounds[0]).toMatchObject({
      type: "Phone screen",
      scheduled_at: "2026-06-01",
      outcome: "pending",
      notes: null,
    });
    expect(rounds[0].id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expectScopedToUserRow(mockSupabase.onlyQuery("update"), {
      userId: mockUser.id,
      applicationId: APP_ID,
    });
  });

  it("keeps the existing rounds when appending a new one", async () => {
    const closed = makeInterviewRound({ id: ROUND_ID, type: "Recruiter", outcome: "passed" });
    givenStoredApplication(interviewingApp([closed]));

    await addInterviewRoundAction(APP_ID, null, roundFormData({ type: "Technical" }));

    const rounds = writtenRounds();
    expect(rounds).toHaveLength(2);
    expect(rounds[0]).toEqual(closed);
    expect(rounds[1].type).toBe("Technical");
  });

  it("stores a blank note as null", async () => {
    await addInterviewRoundAction(APP_ID, null, roundFormData({ notes: "" }));

    expect(writtenRounds()[0].notes).toBeNull();
  });

  it.each([
    ["pending", "pending"],
    ["failed", "failed"],
  ])("refuses a new round while the previous one is still %s", async (_label, outcome) => {
    givenStoredApplication(
      interviewingApp([makeInterviewRound({ id: ROUND_ID, outcome: outcome as "pending" })])
    );

    const result = await addInterviewRoundAction(APP_ID, null, roundFormData());

    expect(result.success).toBe(false);
    expect(mockSupabase.queriesOf("update")).toHaveLength(0);
  });

  it.each([
    ["passed", "passed"],
    ["cancelled", "cancelled"],
  ])("allows a new round once the previous one is %s", async (_label, outcome) => {
    givenStoredApplication(
      interviewingApp([makeInterviewRound({ id: ROUND_ID, outcome: outcome as "passed" })])
    );

    const result = await addInterviewRoundAction(APP_ID, null, roundFormData());

    expect(result.success).toBe(true);
    expect(writtenRounds()).toHaveLength(2);
  });

  it("refuses to add a round to an application that is not in the interviews stage", async () => {
    givenStoredApplication(
      makeApplication({ id: APP_ID, user_id: mockUser.id, status: STATUS.applied })
    );

    const result = await addInterviewRoundAction(APP_ID, null, roundFormData());

    expect(result.success).toBe(false);
    expect(mockSupabase.queriesOf("update")).toHaveLength(0);
  });

  it("refuses when the application is not found (another user's row)", async () => {
    givenStoredApplication(null);

    const result = await addInterviewRoundAction(APP_ID, null, roundFormData());

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not found/i);
    expect(mockSupabase.queriesOf("update")).toHaveLength(0);
  });

  it.each([
    ["the type is blank", { type: "" }],
    ["the type is only whitespace", { type: "   " }],
    ["the type exceeds 60 characters", { type: "a".repeat(61) }],
    ["the date is missing", { scheduled_at: "" }],
    ["the date is not YYYY-MM-DD", { scheduled_at: "01/06/2026" }],
    ["the outcome is not a known outcome", { outcome: "maybe" }],
  ])("refuses the round when %s", async (_label, overrides) => {
    const result = await addInterviewRoundAction(APP_ID, null, roundFormData(overrides));

    expect(result.success).toBe(false);
    expect(mockSupabase.queriesOf("update")).toHaveLength(0);
  });

  it("accepts a type of exactly 60 characters", async () => {
    const result = await addInterviewRoundAction(
      APP_ID,
      null,
      roundFormData({ type: "a".repeat(60) })
    );

    expect(result.success).toBe(true);
  });

  it("reads and writes nothing for a non-UUID application id", async () => {
    const result = await addInterviewRoundAction("nope", null, roundFormData());

    expect(result.success).toBe(false);
    expect(mockSupabase.queries).toHaveLength(0);
  });
});

describe("updateInterviewRoundAction", () => {
  const pendingRound = () => makeInterviewRound({ id: ROUND_ID, type: "Onsite", outcome: "pending" });

  it("updates the latest round in place on the user's own application", async () => {
    givenStoredApplication(interviewingApp([pendingRound()]));

    const result = await updateInterviewRoundAction(
      APP_ID,
      null,
      roundFormData({ id: ROUND_ID, type: "Onsite", outcome: "passed", notes: "Went well" })
    );

    expect(result.success).toBe(true);
    const rounds = writtenRounds();
    expect(rounds).toHaveLength(1);
    expect(rounds[0]).toMatchObject({
      id: ROUND_ID,
      type: "Onsite",
      outcome: "passed",
      notes: "Went well",
    });
    expectScopedToUserRow(mockSupabase.onlyQuery("update"), {
      userId: mockUser.id,
      applicationId: APP_ID,
    });
  });

  it("leaves earlier rounds untouched", async () => {
    const earlier = makeInterviewRound({ id: OTHER_ROUND_ID, type: "Recruiter", outcome: "passed" });
    givenStoredApplication(interviewingApp([earlier, pendingRound()]));

    await updateInterviewRoundAction(
      APP_ID,
      null,
      roundFormData({ id: ROUND_ID, outcome: "failed" })
    );

    const rounds = writtenRounds();
    expect(rounds).toHaveLength(2);
    expect(rounds[0]).toEqual(earlier);
    expect(rounds[1].outcome).toBe("failed");
  });

  it("refuses to edit a round that is not the latest one", async () => {
    // Only the newest round is editable — rewriting history would change
    // outcomes the pipeline already acted on.
    const earlier = makeInterviewRound({ id: OTHER_ROUND_ID, outcome: "passed" });
    givenStoredApplication(interviewingApp([earlier, pendingRound()]));

    const result = await updateInterviewRoundAction(
      APP_ID,
      null,
      roundFormData({ id: OTHER_ROUND_ID, outcome: "failed" })
    );

    expect(result.success).toBe(false);
    expect(mockSupabase.queriesOf("update")).toHaveLength(0);
  });

  it("refuses to edit a round on an application outside the interviews stage", async () => {
    givenStoredApplication(
      makeApplication({
        id: APP_ID,
        user_id: mockUser.id,
        status: STATUS.offer,
        interview_rounds: [pendingRound()],
      })
    );

    const result = await updateInterviewRoundAction(
      APP_ID,
      null,
      roundFormData({ id: ROUND_ID, outcome: "passed" })
    );

    expect(result.success).toBe(false);
    expect(mockSupabase.queriesOf("update")).toHaveLength(0);
  });

  it("refuses a round id that is not a UUID", async () => {
    givenStoredApplication(interviewingApp([pendingRound()]));

    const result = await updateInterviewRoundAction(
      APP_ID,
      null,
      roundFormData({ id: "round-1", outcome: "passed" })
    );

    expect(result.success).toBe(false);
    expect(mockSupabase.queriesOf("update")).toHaveLength(0);
  });

  it("refuses when the application is not found (another user's row)", async () => {
    givenStoredApplication(null);

    const result = await updateInterviewRoundAction(
      APP_ID,
      null,
      roundFormData({ id: ROUND_ID, outcome: "passed" })
    );

    expect(result.success).toBe(false);
    expect(mockSupabase.queriesOf("update")).toHaveLength(0);
  });
});

describe("deleteInterviewRoundAction", () => {
  it("removes the latest round from the user's own application", async () => {
    const earlier = makeInterviewRound({ id: OTHER_ROUND_ID, outcome: "passed" });
    const latest = makeInterviewRound({ id: ROUND_ID, outcome: "pending" });
    givenStoredApplication(interviewingApp([earlier, latest]));

    const result = await deleteInterviewRoundAction(APP_ID, ROUND_ID);

    expect(result.success).toBe(true);
    expect(writtenRounds()).toEqual([earlier]);
    expectScopedToUserRow(mockSupabase.onlyQuery("update"), {
      userId: mockUser.id,
      applicationId: APP_ID,
    });
  });

  it("empties the list when the only round is deleted", async () => {
    givenStoredApplication(interviewingApp([makeInterviewRound({ id: ROUND_ID })]));

    const result = await deleteInterviewRoundAction(APP_ID, ROUND_ID);

    expect(result.success).toBe(true);
    expect(writtenRounds()).toEqual([]);
  });

  it("refuses to delete a round that is not the latest one", async () => {
    const earlier = makeInterviewRound({ id: OTHER_ROUND_ID, outcome: "passed" });
    givenStoredApplication(interviewingApp([earlier, makeInterviewRound({ id: ROUND_ID })]));

    const result = await deleteInterviewRoundAction(APP_ID, OTHER_ROUND_ID);

    expect(result.success).toBe(false);
    expect(mockSupabase.queriesOf("update")).toHaveLength(0);
  });

  it("refuses to delete a round outside the interviews stage", async () => {
    givenStoredApplication(
      makeApplication({
        id: APP_ID,
        user_id: mockUser.id,
        status: STATUS.no_offer,
        interview_rounds: [makeInterviewRound({ id: ROUND_ID })],
      })
    );

    const result = await deleteInterviewRoundAction(APP_ID, ROUND_ID);

    expect(result.success).toBe(false);
    expect(mockSupabase.queriesOf("update")).toHaveLength(0);
  });

  it.each([
    ["the application id", "nope", ROUND_ID],
    ["the round id", APP_ID, "nope"],
  ])("reads and writes nothing when %s is not a UUID", async (_label, appId, roundId) => {
    const result = await deleteInterviewRoundAction(appId, roundId);

    expect(result.success).toBe(false);
    expect(mockSupabase.queries).toHaveLength(0);
  });
});
