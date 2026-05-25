import { vi } from "vitest";

type MockOptions = {
  user?: { id: string; email: string } | null;
  selectData?: unknown;
  selectError?: unknown;
  insertError?: unknown;
  updateError?: unknown;
  deleteError?: unknown;
  signInError?: unknown;
  signUpError?: unknown;
  signInWithOtpError?: unknown;
};

/**
 * Returns a mock Supabase client and auth.getUser stub.
 * Designed to be used with vi.mock('@/lib/supabase/server') and vi.mock('@/lib/auth').
 */
export function buildSupabaseMock(opts: MockOptions = {}) {
  const {
    user = { id: "user-uuid-123", email: "test@example.com" },
    selectData = null,
    selectError = null,
    insertError = null,
    updateError = null,
    deleteError = null,
    signInError = null,
    signUpError = null,
    signInWithOtpError = null,
  } = opts;

  // Chain builder: returns an object mimicking the Supabase query builder
  function makeQueryBuilder(terminalValue: unknown, terminalError: unknown) {
    const builder = {
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: terminalValue, error: terminalError }),
      then: undefined as unknown,
    };
    // Make await-able: resolve to { data, error }
    builder.then = (onfulfilled: (v: unknown) => unknown) =>
      Promise.resolve({ data: terminalValue, error: terminalError }).then(onfulfilled);
    return builder;
  }

  const supabase = {
    from: vi.fn().mockImplementation(() => ({
      select: vi.fn().mockReturnValue(makeQueryBuilder(selectData, selectError)),
      insert: vi.fn().mockResolvedValue({ data: null, error: insertError }),
      update: vi.fn().mockReturnValue(makeQueryBuilder(null, updateError)),
      delete: vi.fn().mockReturnValue(makeQueryBuilder(null, deleteError)),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: signInError }),
      signUp: vi.fn().mockResolvedValue({ data: {}, error: signUpError }),
      signInWithOtp: vi.fn().mockResolvedValue({ data: {}, error: signInWithOtpError }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  };

  return supabase;
}
