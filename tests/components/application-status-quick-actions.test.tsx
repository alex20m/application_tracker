import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApplicationStatusQuickActions } from "@/components/application-status-quick-actions";
import { STATUS, STATUS_NAMES, STATUS_NEXT } from "@/lib/statuses";

const mockTransitionAction = vi.fn();

vi.mock("@/app/applications/actions", () => ({
  transitionApplicationStatusAction: (...args: unknown[]) => mockTransitionAction(...args),
}));

const APP_ID = "app-uuid-001";

describe("ApplicationStatusQuickActions", () => {
  it("renders 'Move to →' button for a non-terminal status", () => {
    render(
      <ApplicationStatusQuickActions
        applicationId={APP_ID}
        currentStatus={STATUS.applied}
      />
    );
    expect(screen.getByRole("button", { name: /move to/i })).toBeInTheDocument();
  });

  it("renders 'Final status' text for a terminal status (no transitions)", () => {
    render(
      <ApplicationStatusQuickActions
        applicationId={APP_ID}
        currentStatus={STATUS.accepted}
      />
    );
    expect(screen.getByText(/final status/i)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("reveals exactly the STATUS_NEXT targets after clicking 'Move to →'", async () => {
    const user = userEvent.setup();
    render(
      <ApplicationStatusQuickActions
        applicationId={APP_ID}
        currentStatus={STATUS.applied}
      />
    );

    await user.click(screen.getByRole("button", { name: /move to/i }));

    const expectedTargets = STATUS_NEXT[STATUS.applied];
    for (const target of expectedTargets) {
      expect(
        screen.getByRole("button", { name: STATUS_NAMES[target] })
      ).toBeInTheDocument();
    }
  });

  it("shows a Cancel button when expanded", async () => {
    const user = userEvent.setup();
    render(
      <ApplicationStatusQuickActions
        applicationId={APP_ID}
        currentStatus={STATUS.applied}
      />
    );
    await user.click(screen.getByRole("button", { name: /move to/i }));
    // Use exact string to avoid matching the "Cancelled" status button
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("collapses back when Cancel is clicked", async () => {
    const user = userEvent.setup();
    render(
      <ApplicationStatusQuickActions
        applicationId={APP_ID}
        currentStatus={STATUS.applied}
      />
    );
    await user.click(screen.getByRole("button", { name: /move to/i }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("button", { name: /move to/i })).toBeInTheDocument();
  });

  it("calls the transition action with correct formData when a target is clicked", async () => {
    const user = userEvent.setup();
    render(
      <ApplicationStatusQuickActions
        applicationId={APP_ID}
        currentStatus={STATUS.applied}
      />
    );

    await user.click(screen.getByRole("button", { name: /move to/i }));
    await user.click(screen.getByRole("button", { name: STATUS_NAMES[STATUS.interviews] }));

    expect(mockTransitionAction).toHaveBeenCalledOnce();
    const calledWithFormData: FormData = mockTransitionAction.mock.calls[0][0];
    expect(calledWithFormData.get("application_id")).toBe(APP_ID);
    expect(calledWithFormData.get("next_status")).toBe(STATUS.interviews);
  });
});
