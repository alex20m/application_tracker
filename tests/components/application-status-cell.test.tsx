import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApplicationStatusCell } from "@/components/application-status-cell";
import { STATUS, STATUS_NAMES, STATUS_NEXT } from "@/lib/statuses";

const mockTransitionAction = vi.fn();

vi.mock("@/app/applications/actions", () => ({
  transitionApplicationStatusAction: (...args: unknown[]) => mockTransitionAction(...args),
}));

const APP_ID = "app-uuid-001";

describe("ApplicationStatusCell", () => {
  it("renders 'Move →' button for a non-terminal status", () => {
    render(
      <ApplicationStatusCell
        applicationId={APP_ID}
        currentStatus={STATUS.applied}
      />
    );
    expect(screen.getByRole("button", { name: /move/i })).toBeInTheDocument();
  });

  it("renders no move button for a terminal status (no transitions)", () => {
    render(
      <ApplicationStatusCell
        applicationId={APP_ID}
        currentStatus={STATUS.accepted}
      />
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("reveals exactly the STATUS_NEXT targets after clicking 'Move →'", async () => {
    const user = userEvent.setup();
    render(
      <ApplicationStatusCell
        applicationId={APP_ID}
        currentStatus={STATUS.applied}
      />
    );

    await user.click(screen.getByRole("button", { name: /move/i }));

    const expectedTargets = STATUS_NEXT[STATUS.applied];
    for (const target of expectedTargets) {
      expect(
        screen.getByRole("menuitem", { name: STATUS_NAMES[target] })
      ).toBeInTheDocument();
    }
  });

  it("collapses popover on Escape key", async () => {
    const user = userEvent.setup();
    render(
      <ApplicationStatusCell
        applicationId={APP_ID}
        currentStatus={STATUS.applied}
      />
    );
    await user.click(screen.getByRole("button", { name: /move/i }));
    expect(screen.getByRole("menu")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("collapses popover when clicking outside", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <ApplicationStatusCell
          applicationId={APP_ID}
          currentStatus={STATUS.applied}
        />
        <button type="button">Outside</button>
      </div>
    );
    await user.click(screen.getByRole("button", { name: /move/i }));
    expect(screen.getByRole("menu")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Outside" }));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("calls the transition action with correct formData when a target is clicked", async () => {
    const user = userEvent.setup();
    render(
      <ApplicationStatusCell
        applicationId={APP_ID}
        currentStatus={STATUS.applied}
      />
    );

    await user.click(screen.getByRole("button", { name: /move/i }));
    await user.click(screen.getByRole("menuitem", { name: STATUS_NAMES[STATUS.interviews] }));

    expect(mockTransitionAction).toHaveBeenCalledOnce();
    const calledWithFormData: FormData = mockTransitionAction.mock.calls[0][0];
    expect(calledWithFormData.get("application_id")).toBe(APP_ID);
    expect(calledWithFormData.get("next_status")).toBe(STATUS.interviews);
  });
});
