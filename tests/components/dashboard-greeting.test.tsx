import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardGreeting } from "@/components/dashboard-greeting";

describe("DashboardGreeting", () => {
  it("renders without crashing with no applications", () => {
    render(<DashboardGreeting activeCount={0} attentionCount={0} />);
    expect(screen.getByText(/add your first application/i)).toBeInTheDocument();
  });

  it("shows active count when applications exist", () => {
    render(<DashboardGreeting activeCount={5} attentionCount={0} />);
    expect(screen.getByText(/5 active application/i)).toBeInTheDocument();
    expect(screen.getByText(/everything looks good/i)).toBeInTheDocument();
  });

  it("shows attention count when items need attention", () => {
    render(<DashboardGreeting activeCount={3} attentionCount={2} />);
    expect(screen.getByText(/3 active application/i)).toBeInTheDocument();
    expect(screen.getByText(/2 thing/i)).toBeInTheDocument();
  });

  it("shows greeting and date stamp from local time after hydration", () => {
    render(<DashboardGreeting activeCount={1} attentionCount={0} />);
    // After effects flush, greeting should be one of the time-of-day variants
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.textContent).toMatch(/good (morning|afternoon|evening)/i);
  });
});
