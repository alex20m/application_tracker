import type { ApplicationRecord, InterviewRound, StatusEvent } from "@/lib/types";
import type { ApplicationStatus } from "@/lib/statuses";

let _idCounter = 0;
function nextId() {
  _idCounter++;
  return `00000000-0000-4000-a000-${String(_idCounter).padStart(12, "0")}`;
}

export function makeUser(overrides: Partial<{ id: string; email: string }> = {}) {
  return {
    id: nextId(),
    email: "test@example.com",
    ...overrides,
  };
}

export function makeStatusEvent(overrides: Partial<StatusEvent> = {}): StatusEvent {
  return {
    from_status: null,
    to_status: "applied",
    changed_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export function makeInterviewRound(overrides: Partial<InterviewRound> = {}): InterviewRound {
  return {
    id: nextId(),
    type: "Phone screen",
    scheduled_at: "2026-03-01",
    outcome: "pending",
    notes: null,
    ...overrides,
  };
}

export function makeApplication(overrides: Partial<ApplicationRecord> = {}): ApplicationRecord {
  const id = nextId();
  return {
    id,
    user_id: nextId(),
    company: "Acme Corp",
    role: "Software Engineer",
    location: "Remote",
    source: "LinkedIn",
    status: "applied" as ApplicationStatus,
    applied_on: "2026-01-01",
    notes: null,
    events: [makeStatusEvent({ from_status: null, to_status: "applied" })],
    interview_rounds: [],
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}
