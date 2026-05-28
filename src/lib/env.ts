function requireEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const NEXT_PUBLIC_SUPABASE_URL = requireEnv(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  "NEXT_PUBLIC_SUPABASE_URL"
);

export const NEXT_PUBLIC_SUPABASE_ANON_KEY = requireEnv(
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
);

export const APP_URL = requireEnv(process.env.NEXT_PUBLIC_APP_URL, "NEXT_PUBLIC_APP_URL");

export const ROUTES = {
  login: "/login",
  applications: "/applications",
  closedApplications: "/applications/closed",
  newApplication: "/applications/new",
  wishlist: "/wishlist",
  newWishlist: "/wishlist/new",
  analytics: "/analytics",
  settings: "/settings",
  authCallback: "/api/auth/callback",
  signOut: "/auth/signout",
  forgotPassword: "/forgot-password",
  resetPassword: "/auth/reset-password",
  resetPasswordCallback: "/api/auth/reset-password",
} as const;
