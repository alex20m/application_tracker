import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { AppShell } from "@/components/app-shell";

vi.mock("@/lib/env", () => ({
  NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
  APP_URL: "http://localhost:3000",
  ROUTES: {
    login: "/login",
    dashboard: "/dashboard",
    applications: "/applications",
    newApplication: "/applications/new",
    wishlist: "/wishlist",
    analytics: "/analytics",
    settings: "/settings",
  },
}));

// AppShell instantiates a Supabase browser client on sign-out.
vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: vi.fn(() => ({
    auth: { signOut: vi.fn().mockResolvedValue({ error: null }) },
  })),
}));

function openDrawer() {
  render(<AppShell email="jane.doe@example.com">content</AppShell>);
  fireEvent.click(screen.getByRole("button", { name: /open menu/i }));
  return screen.getByRole("dialog", { name: /navigation menu/i });
}

describe("AppShell mobile drawer", () => {
  it("opens the navigation drawer from the hamburger trigger", () => {
    const drawer = openDrawer();
    expect(drawer).toBeInTheDocument();
    expect(within(drawer).getByRole("button", { name: /sign out/i })).toBeInTheDocument();
  });

  it("constrains the drawer to the dynamic viewport height so it fits the phone", () => {
    const drawer = openDrawer();
    // h-dvh/max-h-dvh keep the drawer within the visible viewport instead of the
    // larger layout viewport, so the bottom of the menu is never pushed off-screen.
    expect(drawer.className).toContain("h-dvh");
    expect(drawer.className).toContain("max-h-dvh");
  });

  it("makes the nav the internal scroll region while header and footer stay pinned", () => {
    const drawer = openDrawer();
    const nav = within(drawer).getByRole("navigation");
    // The nav grows/shrinks and scrolls internally (flex-1 + min-h-0 + overflow-y-auto)
    // so the footer with Sign out never has to be reached by scrolling the page.
    expect(nav.className).toContain("flex-1");
    expect(nav.className).toContain("min-h-0");
    expect(nav.className).toContain("overflow-y-auto");
  });
});
