import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InterviewRoundsCard } from "@/components/interview-rounds-card";
import { STATUS } from "@/lib/statuses";
import type { ApplicationRecord, InterviewRound } from "@/lib/types";

const mockAddAction = vi.fn().mockResolvedValue({ success: true });
const mockUpdateAction = vi.fn().mockResolvedValue({ success: true });
const mockDeleteAction = vi.fn().mockResolvedValue({ success: true });

vi.mock("@/app/applications/[id]/actions", () => ({
  addInterviewRoundAction: (...args: unknown[]) => mockAddAction(...args),
  updateInterviewRoundAction: (...args: unknown[]) => mockUpdateAction(...args),
  deleteInterviewRoundAction: (...args: unknown[]) => mockDeleteAction(...args),
}));

const APP_ID = "app-uuid-001";

function makeRound(overrides: Partial<InterviewRound> = {}): InterviewRound {
  return {
    id: "round-1",
    type: "Phone Screen",
    scheduled_at: "2026-05-01",
    outcome: "pending",
    notes: null,
    ...overrides,
  };
}

function makeApp(overrides: Partial<ApplicationRecord> = {}): ApplicationRecord {
  return {
    id: APP_ID,
    user_id: "user-1",
    company: "Acme",
    role: "Engineer",
    location: "Remote",
    source: null,
    status: STATUS.interviews,
    applied_on: "2026-04-01",
    notes: null,
    events: [],
    interview_rounds: [],
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

beforeEach(() => {
  mockUpdateAction.mockReset();
  mockUpdateAction.mockResolvedValue({ success: true });
  mockDeleteAction.mockReset();
  mockDeleteAction.mockResolvedValue({ success: true });
});

describe("InterviewRoundsCard", () => {
  it("renders empty state when no rounds", () => {
    render(
      <InterviewRoundsCard application={makeApp()} existingRoundTypes={[]} />
    );
    expect(screen.getByText(/no rounds yet/i)).toBeInTheDocument();
  });

  it("renders round pills in chronological order (oldest first)", () => {
    const rounds = [
      makeRound({ id: "r1", type: "Phone Screen" }),
      makeRound({ id: "r2", type: "Technical", outcome: "passed" }),
      makeRound({ id: "r3", type: "Final", outcome: "pending" }),
    ];
    render(
      <InterviewRoundsCard application={makeApp({ interview_rounds: rounds })} existingRoundTypes={[]} />
    );
    const pills = screen.getAllByTitle(/Phone Screen|Technical|Final/);
    expect(pills[0]).toHaveAttribute("title", "Phone Screen");
    expect(pills[1]).toHaveAttribute("title", "Technical");
    expect(pills[2]).toHaveAttribute("title", "Final");
  });

  it("shows date caption under round pills", () => {
    const round = makeRound({ scheduled_at: "2026-05-01" });
    render(
      <InterviewRoundsCard application={makeApp({ interview_rounds: [round] })} existingRoundTypes={[]} />
    );
    // Desktop and mobile steppers both render in the DOM (one hidden via CSS), so expect at least one
    const dateCaptions = screen.getAllByText(/2026/);
    expect(dateCaptions.length).toBeGreaterThan(0);
  });

  it("shows 'Set outcome:' buttons when status is interviews", () => {
    const round = makeRound();
    render(
      <InterviewRoundsCard application={makeApp({ interview_rounds: [round] })} existingRoundTypes={[]} />
    );
    expect(screen.getByText("Set outcome:")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Passed" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Failed" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelled" })).toBeInTheDocument();
  });

  it("disables the current outcome button", () => {
    const round = makeRound({ outcome: "pending" });
    render(
      <InterviewRoundsCard application={makeApp({ interview_rounds: [round] })} existingRoundTypes={[]} />
    );
    expect(screen.getByRole("button", { name: "Pending" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Passed" })).not.toBeDisabled();
  });

  it("calls updateInterviewRoundAction with correct formData when outcome is set", async () => {
    const user = userEvent.setup();
    const round = makeRound({ id: "r1", type: "Phone Screen", scheduled_at: "2026-05-01", outcome: "pending", notes: null });
    render(
      <InterviewRoundsCard application={makeApp({ interview_rounds: [round] })} existingRoundTypes={[]} />
    );

    await user.click(screen.getByRole("button", { name: "Passed" }));

    expect(mockUpdateAction).toHaveBeenCalledOnce();
    // Bound action is called as updateInterviewRoundAction(appId, prevState, formData)
    const [_appId, _prevState, formData]: [unknown, unknown, FormData] = mockUpdateAction.mock.calls[0];
    expect(formData.get("id")).toBe("r1");
    expect(formData.get("outcome")).toBe("passed");
    expect(formData.get("type")).toBe("Phone Screen");
    expect(formData.get("scheduled_at")).toBe("2026-05-01");
  });

  it("does not show 'Set outcome:' or Edit/Delete when status is not interviews", () => {
    const round = makeRound();
    render(
      <InterviewRoundsCard
        application={makeApp({ status: STATUS.offer, interview_rounds: [round] })}
        existingRoundTypes={[]}
      />
    );
    expect(screen.queryByText("Set outcome:")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });

  it("shows notes of the latest round in the bottom section", () => {
    const rounds = [
      makeRound({ id: "r1", type: "Phone Screen", notes: "old notes" }),
      makeRound({ id: "r2", type: "Technical", notes: "latest notes" }),
    ];
    render(
      <InterviewRoundsCard application={makeApp({ interview_rounds: rounds })} existingRoundTypes={[]} />
    );
    expect(screen.getByText("latest notes")).toBeInTheDocument();
    expect(screen.queryByText("old notes")).not.toBeInTheDocument();
  });

  it("shows Edit form for the latest round when Edit is clicked", async () => {
    const user = userEvent.setup();
    const round = makeRound();
    render(
      <InterviewRoundsCard application={makeApp({ interview_rounds: [round] })} existingRoundTypes={[]} />
    );

    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByRole("button", { name: "Update" })).toBeInTheDocument();
  });
});
