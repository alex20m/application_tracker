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
  verifyOtpError?: unknown;
  resetPasswordForEmailError?: unknown;
  updateUserError?: unknown;
  rpcError?: unknown;
};

export type QueryMethod = "select" | "insert" | "update" | "delete";

export type QueryFilter = { op: string; column: string; value: unknown };

/**
 * One `from(table).method(...)` chain, with every filter applied to it.
 *
 * Recording filters is the point: this app is multi-tenant, so "the query was
 * scoped to the signed-in user" is a security contract that tests have to be
 * able to assert. A mock that only records that *a* query happened cannot tell
 * a correctly scoped statement from one that touches every user's rows.
 */
export class RecordedQuery {
  readonly filters: QueryFilter[] = [];

  constructor(
    readonly table: string,
    readonly method: QueryMethod,
    /** Insert rows for `insert`, the patch object for `update`, the column list for `select`. */
    readonly payload: unknown
  ) {}

  /** Value of the `eq` filter on `column`, or undefined when the column is not filtered. */
  eqValue(column: string): unknown {
    return this.filters.find((f) => f.op === "eq" && f.column === column)?.value;
  }

  /** Value of the `in` filter on `column`, or undefined when the column is not filtered. */
  inValue(column: string): unknown {
    return this.filters.find((f) => f.op === "in" && f.column === column)?.value;
  }

  /** Every `[op, column]` pair applied, in call order — for asserting a query is *not* over-filtered. */
  filterKeys(): Array<[string, string]> {
    return this.filters.map((f) => [f.op, f.column]);
  }
}

/**
 * Returns a mock Supabase client that records every query it is asked to run.
 *
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
    verifyOtpError = null,
    resetPasswordForEmailError = null,
    updateUserError = null,
    rpcError = null,
  } = opts;

  const queries: RecordedQuery[] = [];

  // Chain builder: mimics the Supabase query builder, recording filters as they
  // are applied and resolving to { data, error } when awaited or `.single()`d.
  function makeQueryBuilder(record: RecordedQuery, terminalValue: unknown, terminalError: unknown) {
    const filter = (op: string) =>
      vi.fn((column: string, value: unknown) => {
        record.filters.push({ op, column, value });
        return builder;
      });

    const builder = {
      eq: filter("eq"),
      neq: filter("neq"),
      in: filter("in"),
      ilike: filter("ilike"),
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

  function record(table: string, method: QueryMethod, payload: unknown) {
    const entry = new RecordedQuery(table, method, payload);
    queries.push(entry);
    return entry;
  }

  const supabase = {
    from: vi.fn().mockImplementation((table: string) => ({
      select: vi.fn((columns?: string) =>
        makeQueryBuilder(record(table, "select", columns), selectData, selectError)
      ),
      insert: vi.fn((rows: unknown) => {
        record(table, "insert", rows);
        return Promise.resolve({ data: null, error: insertError });
      }),
      update: vi.fn((patch: unknown) =>
        makeQueryBuilder(record(table, "update", patch), null, updateError)
      ),
      delete: vi.fn(() => makeQueryBuilder(record(table, "delete", undefined), null, deleteError)),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: signInError }),
      signUp: vi.fn().mockResolvedValue({ data: {}, error: signUpError }),
      signInWithOtp: vi.fn().mockResolvedValue({ data: {}, error: signInWithOtpError }),
      verifyOtp: vi.fn().mockResolvedValue({ data: {}, error: verifyOtpError }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ data: {}, error: resetPasswordForEmailError }),
      updateUser: vi.fn().mockResolvedValue({ data: {}, error: updateUserError }),
      exchangeCodeForSession: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
    rpc: vi.fn().mockResolvedValue({ data: null, error: rpcError }),

    /** Every query issued through this client, in call order. */
    queries,

    /** Queries of one kind, in call order. */
    queriesOf(method: QueryMethod): RecordedQuery[] {
      return queries.filter((q) => q.method === method);
    },

    /**
     * The single query of this kind, asserting there is exactly one. Throws
     * otherwise, so a test can never silently assert against the wrong write.
     */
    onlyQuery(method: QueryMethod): RecordedQuery {
      const matches = queries.filter((q) => q.method === method);
      if (matches.length !== 1) {
        throw new Error(
          `Expected exactly 1 ${method} query, got ${matches.length} ` +
            `(queries: ${queries.map((q) => `${q.method} ${q.table}`).join(", ") || "none"})`
        );
      }
      return matches[0];
    },
  };

  return supabase;
}

export type SupabaseMock = ReturnType<typeof buildSupabaseMock>;

/**
 * Asserts a write is scoped to a single row owned by the signed-in user.
 * Returns the query so callers can go on to assert its payload.
 */
export function expectScopedToUserRow(
  query: RecordedQuery,
  { userId, applicationId }: { userId: string; applicationId: string }
): RecordedQuery {
  if (query.eqValue("user_id") !== userId) {
    throw new Error(
      `${query.method} on "${query.table}" is not scoped to user ${userId} ` +
        `(user_id filter: ${JSON.stringify(query.eqValue("user_id"))})`
    );
  }
  if (query.eqValue("id") !== applicationId) {
    throw new Error(
      `${query.method} on "${query.table}" is not scoped to row ${applicationId} ` +
        `(id filter: ${JSON.stringify(query.eqValue("id"))})`
    );
  }
  return query;
}
