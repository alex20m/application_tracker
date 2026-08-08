import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildSupabaseMock, expectScopedToUserRow } from "../../helpers/supabase-mock";
import { makeUser, makeApplication, makeInterviewRound, makeStatusEvent } from "../../helpers/factories";
import { STATUS, STATUS_NEXT, type ApplicationStatus } from "@/lib/statuses";
import type { StatusEvent } from "@/lib/types";

const mockUser = makeUser();
let mockSupabase = buildSupabaseMock({ user: mockUser });

vi.mock("@/lib/auth", () => ({
  requireUser: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

import { transitionApplicationStatusAction } from "@/app/applications/actions";
import { requireUser } from "@/lib/auth";

const requireUserMock = vi.mocked(requireUser);

const VALID_APP_ID = "a1b2c3d4-e5f6-4000-a000-000000000001";
const OTHER_USER_APP_ID = "a1b2c3d4-e5f6-4000-a000-0000000000ff";

/** Points the action at a client whose select returns `stored`, and returns that client. */
function givenStoredApplication(stored: unknown) {
  mockSupabase = buildSupabaseMock({ user: mockUser, selectData: stored });
  requireUserMock.mockResolvedValue({ supabase: mockSupabase as never, user: mockUser as never });
  return mockSupabase;
}

beforeEach(() => {
  vi.clearAllMocks();
  givenStoredApplication(
    makeApplication({ id: VALID_APP_ID, user_id: mockUser.id, status: STATUS.applied })
  );
});

function makeFormData(applicationId: string, nextStatus: string): FormData {
  const fd = new FormData();
  fd.set("application_id", applicationId);
  fd.set("next_status", nextStatus);
  return fd;
}

describe("transitionApplicationStatusAction", () => {
  it("writes the new status for a legal transition (applied → interviews)", async () => {
    await transitionApplicationStatusAction(makeFormData(VALID_APP_ID, STATUS.interviews));

    const update = mockSupabase.onlyQuery("update");
    expect(update.table).toBe("applications");
    expect((update.payload as { status: string }).status).toBe(STATUS.interviews);
  });

  it("records the transition as a status event carrying the previous status", async () => {
    const priorEvent = makeStatusEvent({
      from_status: STATUS.wishlist,
      to_status: STATUS.applied,
      changed_at: "2026-01-01T00:00:00.000Z",
    });
    givenStoredApplication(
      makeApplication({
        id: VALID_APP_ID,
        user_id: mockUser.id,
        status: STATUS.interviews,
        events: [priorEvent],
      })
    );

    await transitionApplicationStatusAction(makeFormData(VALID_APP_ID, STATUS.offer));

    const events = (mockSupabase.onlyQuery("update").payload as { events: StatusEvent[] }).events;
    expect(events).toHaveLength(2);
    expect(events[0]).toEqual(priorEvent);
    expect(events[1]).toMatchObject({
      from_status: STATUS.interviews,
      to_status: STATUS.offer,
    });
  });

  it("scopes both the read and the write to the signed-in user's own row", async () => {
    await transitionApplicationStatusAction(makeFormData(VALID_APP_ID, STATUS.interviews));

    // Without the user_id filter, any signed-in user could move another user's
    // application by guessing its id.
    expectScopedToUserRow(mockSupabase.onlyQuery("select"), {
      userId: mockUser.id,
      applicationId: VALID_APP_ID,
    });
    expectScopedToUserRow(mockSupabase.onlyQuery("update"), {
      userId: mockUser.id,
      applicationId: VALID_APP_ID,
    });
  });

  it("writes nothing when the id belongs to another user (row not found)", async () => {
    givenStoredApplication(null);

    await transitionApplicationStatusAction(makeFormData(OTHER_USER_APP_ID, STATUS.interviews));

    expect(mockSupabase.queriesOf("update")).toHaveLength(0);
  });

  it("refuses a transition that is not allowed from the stored status", async () => {
    // The *stored* status governs, not anything the client sends: cancelled is
    // terminal, so no next status may be applied to it.
    givenStoredApplication(
      makeApplication({ id: VALID_APP_ID, user_id: mockUser.id, status: STATUS.cancelled })
    );

    await transitionApplicationStatusAction(makeFormData(VALID_APP_ID, STATUS.interviews));

    expect(mockSupabase.queriesOf("update")).toHaveLength(0);
  });

  it("refuses every transition that STATUS_NEXT does not allow from applied", async () => {
    const allowed = STATUS_NEXT[STATUS.applied];
    const forbidden = (Object.values(STATUS) as ApplicationStatus[]).filter(
      (s) => !allowed.includes(s)
    );
    expect(forbidden.length).toBeGreaterThan(0);

    for (const target of forbidden) {
      const supabase = givenStoredApplication(
        makeApplication({ id: VALID_APP_ID, user_id: mockUser.id, status: STATUS.applied })
      );
      await transitionApplicationStatusAction(makeFormData(VALID_APP_ID, target));
      expect(supabase.queriesOf("update"), `applied → ${target} must be refused`).toHaveLength(0);
    }
  });

  it("refuses to leave interviews while a round is still pending, and explains why", async () => {
    givenStoredApplication(
      makeApplication({
        id: VALID_APP_ID,
        user_id: mockUser.id,
        status: STATUS.interviews,
        interview_rounds: [
          makeInterviewRound({ outcome: "passed" }),
          makeInterviewRound({ outcome: "pending" }),
        ],
      })
    );

    const result = await transitionApplicationStatusAction(
      makeFormData(VALID_APP_ID, STATUS.offer)
    );

    expect(result.error).toBe(
      "Close the ongoing interview round before moving to the next stage."
    );
    expect(mockSupabase.queriesOf("update")).toHaveLength(0);
  });

  it("allows leaving interviews once every round is closed", async () => {
    givenStoredApplication(
      makeApplication({
        id: VALID_APP_ID,
        user_id: mockUser.id,
        status: STATUS.interviews,
        interview_rounds: [
          makeInterviewRound({ outcome: "passed" }),
          makeInterviewRound({ outcome: "cancelled" }),
        ],
      })
    );

    const result = await transitionApplicationStatusAction(
      makeFormData(VALID_APP_ID, STATUS.offer)
    );

    expect(result.error).toBeUndefined();
    expect((mockSupabase.onlyQuery("update").payload as { status: string }).status).toBe(
      STATUS.offer
    );
  });

  it("does not read or write when applicationId is not a valid UUID", async () => {
    await transitionApplicationStatusAction(makeFormData("not-a-uuid", STATUS.interviews));
    expect(mockSupabase.queries).toHaveLength(0);
  });

  it("does not read or write when applicationId is missing", async () => {
    const fd = new FormData();
    fd.set("next_status", STATUS.interviews);
    await transitionApplicationStatusAction(fd);
    expect(mockSupabase.queries).toHaveLength(0);
  });

  it("does not read or write when nextStatus is missing", async () => {
    const fd = new FormData();
    fd.set("application_id", VALID_APP_ID);
    await transitionApplicationStatusAction(fd);
    expect(mockSupabase.queries).toHaveLength(0);
  });
});
