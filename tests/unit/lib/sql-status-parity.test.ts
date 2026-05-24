import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { STATUS } from "@/lib/statuses";

describe("SQL CHECK constraint parity", () => {
  it("status values in migration match STATUS constants exactly", () => {
    const migrationPath = resolve(
      __dirname,
      "../../../supabase/migrations/20260520000100_init_schema.sql"
    );
    const sql = readFileSync(migrationPath, "utf-8");

    // Extract the CHECK constraint: CHECK (status IN ('...', '...'))
    const match = sql.match(/CHECK\s*\(\s*status\s+IN\s*\(([^)]+)\)/i);
    expect(match, "Could not find CHECK constraint in migration").toBeTruthy();

    const sqlValues = match![1]
      .split(",")
      .map((v) => v.trim().replace(/'/g, ""));

    const codeValues = Object.values(STATUS).sort();
    expect([...sqlValues].sort()).toEqual(codeValues);
  });
});
