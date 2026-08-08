import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "fs";
import { resolve } from "path";
import { STATUS } from "@/lib/statuses";

const MIGRATIONS_DIR = resolve(__dirname, "../../../supabase/migrations");
const CHECK_CONSTRAINT = /CHECK\s*\(\s*status\s+IN\s*\(([^)]+)\)/i;

/**
 * The status CHECK constraint as the database will actually enforce it: the
 * newest migration that redefines it wins. Pinning one filename would silently
 * keep testing a superseded constraint once a later migration changes it.
 */
function effectiveStatusConstraint(): string[] {
  const migrations = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort(); // timestamp-prefixed, so lexical order is apply order

  for (const file of [...migrations].reverse()) {
    const match = readFileSync(resolve(MIGRATIONS_DIR, file), "utf-8").match(CHECK_CONSTRAINT);
    if (match) {
      return match[1].split(",").map((v) => v.trim().replace(/'/g, ""));
    }
  }

  throw new Error(`No status CHECK constraint found in ${MIGRATIONS_DIR}`);
}

describe("SQL CHECK constraint parity", () => {
  it("accepts exactly the statuses the application code can produce", () => {
    // A status in the code but not the constraint makes every write of it fail
    // at runtime; one in the constraint but not the code is dead schema that
    // masks a typo.
    expect(effectiveStatusConstraint().sort()).toEqual(Object.values(STATUS).sort());
  });

  it("reads the constraint from a migration that is actually applied", () => {
    const migrations = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql"));
    expect(migrations.length).toBeGreaterThan(0);
    expect(
      migrations.some((f) => CHECK_CONSTRAINT.test(readFileSync(resolve(MIGRATIONS_DIR, f), "utf-8")))
    ).toBe(true);
  });
});
