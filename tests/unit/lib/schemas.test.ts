import { describe, it, expect } from "vitest";
import {
  ApplicationCreateSchema,
  ApplicationUpdateSchema,
  ApplicationNoteSchema,
  InterviewRoundCreateSchema,
  InterviewRoundUpdateSchema,
  PasswordSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  ChangePasswordSchema,
  DeleteAccountSchema,
} from "@/lib/schemas";
import { STATUS } from "@/lib/statuses";

const validCreate = {
  company: "Acme",
  role: "Engineer",
  location: "Remote",
  applied_on: "2026-05-01",
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

  it("requires applied_on", () => {
    const { applied_on: _, ...withoutDate } = validCreate;
    expect(ApplicationCreateSchema.safeParse(withoutDate).success).toBe(false);
  });

  it("rejects applied_on with wrong format", () => {
    expect(
      ApplicationCreateSchema.safeParse({ ...validCreate, applied_on: "01-05-2026" }).success
    ).toBe(false);
  });
});

describe("ApplicationUpdateSchema", () => {
  const validUpdate = { ...validCreate, status: STATUS.interviews };

  it("accepts a valid status from STATUS enum", () => {
    expect(ApplicationUpdateSchema.safeParse(validUpdate).success).toBe(true);
  });

  it("rejects an invalid status string", () => {
    expect(ApplicationUpdateSchema.safeParse({ ...validCreate, status: "flying" }).success).toBe(false);
  });

  it("requires status field", () => {
    expect(ApplicationUpdateSchema.safeParse(validCreate).success).toBe(false);
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

describe("PasswordSchema", () => {
  it("accepts a password of exactly 8 characters with a letter and a number", () => {
    expect(PasswordSchema.safeParse("pass1234").success).toBe(true);
  });

  it("rejects a password shorter than 8 characters", () => {
    expect(PasswordSchema.safeParse("pass1").success).toBe(false);
  });

  it("rejects a password longer than 72 characters", () => {
    expect(PasswordSchema.safeParse("a1".repeat(37)).success).toBe(false);
  });

  it("rejects a password with no letters", () => {
    const result = PasswordSchema.safeParse("12345678");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.toLowerCase().includes("letter"))).toBe(true);
    }
  });

  it("rejects a password with no numbers", () => {
    const result = PasswordSchema.safeParse("password");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.toLowerCase().includes("number"))).toBe(true);
    }
  });
});

describe("ForgotPasswordSchema", () => {
  it("accepts a valid email", () => {
    expect(ForgotPasswordSchema.safeParse({ email: "user@example.com" }).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(ForgotPasswordSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
  });
});

describe("ResetPasswordSchema", () => {
  it("accepts matching passwords of sufficient length", () => {
    expect(
      ResetPasswordSchema.safeParse({ password: "newpassword1", confirmPassword: "newpassword1" }).success
    ).toBe(true);
  });

  it("rejects when passwords do not match", () => {
    const result = ResetPasswordSchema.safeParse({ password: "newpassword1", confirmPassword: "different1" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("confirmPassword"))).toBe(true);
    }
  });

  it("rejects when password is too short", () => {
    expect(
      ResetPasswordSchema.safeParse({ password: "short", confirmPassword: "short" }).success
    ).toBe(false);
  });
});

describe("ChangePasswordSchema", () => {
  const validChange = {
    currentPassword: "current1234",
    newPassword: "newpassword1",
    confirmPassword: "newpassword1",
  };

  it("accepts valid input where new differs from current", () => {
    expect(ChangePasswordSchema.safeParse(validChange).success).toBe(true);
  });

  it("rejects when new password equals current password", () => {
    const result = ChangePasswordSchema.safeParse({
      ...validChange,
      newPassword: "current1234",
      confirmPassword: "current1234",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("newPassword"))).toBe(true);
    }
  });

  it("rejects when new passwords do not match", () => {
    const result = ChangePasswordSchema.safeParse({
      ...validChange,
      confirmPassword: "different1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("confirmPassword"))).toBe(true);
    }
  });

  it("rejects when new password is too short", () => {
    expect(
      ChangePasswordSchema.safeParse({ ...validChange, newPassword: "short", confirmPassword: "short" }).success
    ).toBe(false);
  });

  it("rejects when currentPassword is empty", () => {
    expect(
      ChangePasswordSchema.safeParse({ ...validChange, currentPassword: "" }).success
    ).toBe(false);
  });
});

describe("DeleteAccountSchema", () => {
  it("accepts a non-empty password", () => {
    expect(DeleteAccountSchema.safeParse({ password: "anypassword" }).success).toBe(true);
  });

  it("rejects an empty password", () => {
    const result = DeleteAccountSchema.safeParse({ password: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/required/i);
    }
  });

  it("rejects when password field is missing", () => {
    expect(DeleteAccountSchema.safeParse({}).success).toBe(false);
  });
});

// ─── InterviewRoundCreateSchema ───────────────────────────────────────────────

describe("InterviewRoundCreateSchema", () => {
  const valid = { type: "Phone screen", scheduled_at: "2026-03-01", outcome: "pending", notes: null };

  it("accepts minimal valid input", () => {
    expect(InterviewRoundCreateSchema.safeParse(valid).success).toBe(true);
  });

  it("defaults outcome to pending when omitted", () => {
    const result = InterviewRoundCreateSchema.safeParse({ type: "Technical", scheduled_at: "2026-03-01" });
    expect(result.success && result.data.outcome).toBe("pending");
  });

  it("trims type", () => {
    const result = InterviewRoundCreateSchema.safeParse({ ...valid, type: "  HR call  " });
    expect(result.success && result.data.type).toBe("HR call");
  });

  it("rejects empty type", () => {
    expect(InterviewRoundCreateSchema.safeParse({ ...valid, type: "" }).success).toBe(false);
  });

  it("rejects type longer than 60 chars", () => {
    expect(
      InterviewRoundCreateSchema.safeParse({ ...valid, type: "a".repeat(61) }).success
    ).toBe(false);
  });

  it("accepts type of exactly 60 chars", () => {
    expect(
      InterviewRoundCreateSchema.safeParse({ ...valid, type: "a".repeat(60) }).success
    ).toBe(true);
  });

  it("rejects invalid outcome", () => {
    expect(
      InterviewRoundCreateSchema.safeParse({ ...valid, outcome: "hired" }).success
    ).toBe(false);
  });

  it("accepts all valid outcomes", () => {
    for (const outcome of ["pending", "passed", "failed", "cancelled"] as const) {
      expect(
        InterviewRoundCreateSchema.safeParse({ ...valid, outcome }).success
      ).toBe(true);
    }
  });

  it("rejects notes longer than 2000 chars", () => {
    expect(
      InterviewRoundCreateSchema.safeParse({ ...valid, notes: "a".repeat(2001) }).success
    ).toBe(false);
  });

  it("transforms empty notes to null", () => {
    const result = InterviewRoundCreateSchema.safeParse({ ...valid, notes: "" });
    expect(result.success && result.data.notes).toBeNull();
  });

  it("rejects invalid date format for scheduled_at", () => {
    expect(
      InterviewRoundCreateSchema.safeParse({ ...valid, scheduled_at: "01-03-2026" }).success
    ).toBe(false);
  });

  it("rejects empty scheduled_at", () => {
    expect(InterviewRoundCreateSchema.safeParse({ ...valid, scheduled_at: "" }).success).toBe(false);
  });

  it("rejects null scheduled_at", () => {
    expect(InterviewRoundCreateSchema.safeParse({ ...valid, scheduled_at: null }).success).toBe(false);
  });
});

describe("InterviewRoundUpdateSchema", () => {
  const valid = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    type: "Technical",
    scheduled_at: "2026-03-01",
    outcome: "passed",
  };

  it("accepts valid input with id", () => {
    expect(InterviewRoundUpdateSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects when id is missing", () => {
    expect(InterviewRoundUpdateSchema.safeParse({ type: "Technical", outcome: "passed" }).success).toBe(false);
  });

  it("rejects non-uuid id", () => {
    expect(
      InterviewRoundUpdateSchema.safeParse({ ...valid, id: "not-a-uuid" }).success
    ).toBe(false);
  });
});
