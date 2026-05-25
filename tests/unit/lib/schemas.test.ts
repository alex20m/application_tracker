import { describe, it, expect } from "vitest";
import {
  ApplicationCreateSchema,
  ApplicationUpdateSchema,
  ApplicationNoteSchema,
} from "@/lib/schemas";
import { STATUS } from "@/lib/statuses";

const validCreate = {
  company: "Acme",
  role: "Engineer",
  location: "Remote",
};

describe("ApplicationCreateSchema", () => {
  it("accepts minimal valid input", () => {
    expect(ApplicationCreateSchema.safeParse(validCreate).success).toBe(true);
  });

  it("requires company", () => {
    expect(ApplicationCreateSchema.safeParse({ ...validCreate, company: "" }).success).toBe(false);
  });

  it("requires role", () => {
    expect(ApplicationCreateSchema.safeParse({ ...validCreate, role: "" }).success).toBe(false);
  });

  it("requires location", () => {
    expect(ApplicationCreateSchema.safeParse({ ...validCreate, location: "" }).success).toBe(false);
  });

  it("trims company, role, location", () => {
    const result = ApplicationCreateSchema.safeParse({
      ...validCreate,
      company: "  Acme  ",
      role: "  Dev  ",
      location: "  Remote  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.company).toBe("Acme");
      expect(result.data.role).toBe("Dev");
      expect(result.data.location).toBe("Remote");
    }
  });

  it("rejects company longer than 200 chars", () => {
    expect(
      ApplicationCreateSchema.safeParse({ ...validCreate, company: "a".repeat(201) }).success
    ).toBe(false);
  });

  it("accepts company of exactly 200 chars", () => {
    expect(
      ApplicationCreateSchema.safeParse({ ...validCreate, company: "a".repeat(200) }).success
    ).toBe(true);
  });

  it("defaults source to empty string when omitted", () => {
    const result = ApplicationCreateSchema.safeParse(validCreate);
    expect(result.success && result.data.source).toBe("");
  });

  it("defaults notes to empty string when omitted", () => {
    const result = ApplicationCreateSchema.safeParse(validCreate);
    expect(result.success && result.data.notes).toBe("");
  });

  it("rejects notes longer than 5000 chars", () => {
    expect(
      ApplicationCreateSchema.safeParse({ ...validCreate, notes: "a".repeat(5001) }).success
    ).toBe(false);
  });

  it("accepts notes of exactly 5000 chars", () => {
    expect(
      ApplicationCreateSchema.safeParse({ ...validCreate, notes: "a".repeat(5000) }).success
    ).toBe(true);
  });
});

describe("ApplicationUpdateSchema", () => {
  it("accepts a valid status from STATUS enum", () => {
    const result = ApplicationUpdateSchema.safeParse({
      ...validCreate,
      status: STATUS.interviews,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid status string", () => {
    const result = ApplicationUpdateSchema.safeParse({
      ...validCreate,
      status: "flying",
    });
    expect(result.success).toBe(false);
  });

  it("requires status field", () => {
    const result = ApplicationUpdateSchema.safeParse(validCreate);
    expect(result.success).toBe(false);
  });
});

describe("ApplicationNoteSchema", () => {
  it("accepts empty notes", () => {
    expect(ApplicationNoteSchema.safeParse({ notes: "" }).success).toBe(true);
  });

  it("accepts notes up to 5000 chars", () => {
    expect(ApplicationNoteSchema.safeParse({ notes: "a".repeat(5000) }).success).toBe(true);
  });

  it("rejects notes over 5000 chars", () => {
    expect(ApplicationNoteSchema.safeParse({ notes: "a".repeat(5001) }).success).toBe(false);
  });
});
