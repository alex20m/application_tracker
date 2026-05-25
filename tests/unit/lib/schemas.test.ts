import { describe, it, expect } from "vitest";
import {
  ApplicationCreateSchema,
  ApplicationUpdateSchema,
  ApplicationNoteSchema,
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

describe("PasswordSchema", () => {
  it("accepts a password of exactly 8 characters", () => {
    expect(PasswordSchema.safeParse("12345678").success).toBe(true);
  });

  it("rejects a password shorter than 8 characters", () => {
    expect(PasswordSchema.safeParse("short").success).toBe(false);
  });

  it("rejects a password longer than 72 characters", () => {
    expect(PasswordSchema.safeParse("a".repeat(73)).success).toBe(false);
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
