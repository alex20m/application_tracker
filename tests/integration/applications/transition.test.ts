import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildSupabaseMock } from "../../helpers/supabase-mock";
import { makeUser, makeApplication } from "../../helpers/factories";
import { STATUS } from "@/lib/statuses";

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

beforeEach(() => {
  vi.clearAllMocks();
  mockSupabase = buildSupabaseMock({
    user: mockUser,
    selectData: makeApplication({
      id: VALID_APP_ID,
      user_id: mockUser.id,
      status: STATUS.no_answer,
    }),
  });
  requireUserMock.mockResolvedValue({ supabase: mockSupabase as never, user: mockUser as never });
});

function makeFormData(applicationId: string, nextStatus: string): FormData {
  const fd = new FormData();
  fd.set("application_id", applicationId);
  fd.set("next_status", nextStatus);
  return fd;
}

describe("transitionApplicationStatusAction", () => {
  it("calls supabase update for a legal transition (no_answer → interviews)", async () => {
    const fd = makeFormData(VALID_APP_ID, STATUS.interviews);
    await transitionApplicationStatusAction(fd);

    const fromInstance = mockSupabase.from.mock.results.find(
      (r) => r.value?.update !== undefined
    );
    expect(fromInstance).toBeDefined();
  });

  it("does nothing for an illegal transition (cancelled → interviews)", async () => {
    const illegalApp = makeApplication({
      id: VALID_APP_ID,
      user_id: mockUser.id,
      status: STATUS.cancelled,
    });
    mockSupabase = buildSupabaseMock({ user: mockUser, selectData: illegalApp });
    requireUserMock.mockResolvedValue({ supabase: mockSupabase as never, user: mockUser as never });

    const fd = makeFormData(VALID_APP_ID, STATUS.interviews);
    await transitionApplicationStatusAction(fd);

    // The from().update() chain should not have been called for an illegal transition;
    // only one from() call for the initial select.
    expect(mockSupabase.from).toHaveBeenCalledTimes(1);
  });

  it("does nothing when applicationId is not a valid UUID", async () => {
    const fd = makeFormData("not-a-uuid", STATUS.interviews);
    await transitionApplicationStatusAction(fd);
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it("does nothing when applicationId is missing", async () => {
    const fd = new FormData();
    fd.set("next_status", STATUS.interviews);
    await transitionApplicationStatusAction(fd);
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it("does nothing when nextStatus is missing", async () => {
    const fd = new FormData();
    fd.set("application_id", VALID_APP_ID);
    await transitionApplicationStatusAction(fd);
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });
});
