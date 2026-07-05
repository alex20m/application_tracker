import { describe, it, expect } from "vitest";
import JobInfo from "../../../extension/shared/job-info.js";

describe("cleanText", () => {
  it("collapses whitespace and trims", () => {
    expect(JobInfo.cleanText("  Software \n  Engineer \t ")).toBe("Software Engineer");
  });

  it("handles null and undefined", () => {
    expect(JobInfo.cleanText(null)).toBe("");
    expect(JobInfo.cleanText(undefined)).toBe("");
  });
});

describe("truncate", () => {
  it("cuts values longer than max", () => {
    expect(JobInfo.truncate("abcdef", 3)).toBe("abc");
  });

  it("keeps short values intact", () => {
    expect(JobInfo.truncate("abc", 10)).toBe("abc");
  });
});

describe("normalizeJob", () => {
  it("cleans every field and fills missing ones with empty strings", () => {
    const job = JobInfo.normalizeJob({ company: "  Acme  Inc ", role: "Engineer" });
    expect(job).toEqual({
      company: "Acme Inc",
      role: "Engineer",
      location: "",
      source: "",
      notes: "",
    });
  });

  it("handles a missing input object", () => {
    expect(JobInfo.normalizeJob(null).company).toBe("");
  });
});

describe("isCompleteJob", () => {
  it("requires company and role", () => {
    expect(JobInfo.isCompleteJob({ company: "Acme", role: "Engineer" })).toBe(true);
    expect(JobInfo.isCompleteJob({ company: "Acme", role: "  " })).toBe(false);
    expect(JobInfo.isCompleteJob({ company: "", role: "Engineer" })).toBe(false);
    expect(JobInfo.isCompleteJob(null)).toBe(false);
  });
});

describe("jobKey", () => {
  it("is case-insensitive and whitespace-insensitive", () => {
    expect(JobInfo.jobKey({ company: " ACME ", role: "Engineer" })).toBe("acme::engineer");
  });
});

describe("parseTitleParts", () => {
  it("parses a LinkedIn-style document title", () => {
    const parts = JobInfo.parseTitleParts("Software Engineer | Acme | LinkedIn", "LinkedIn");
    expect(parts).toEqual({ role: "Software Engineer", company: "Acme" });
  });

  it("strips the unread-count prefix", () => {
    const parts = JobInfo.parseTitleParts("(3) Data Analyst | Initech | LinkedIn", "LinkedIn");
    expect(parts).toEqual({ role: "Data Analyst", company: "Initech" });
  });

  it("does not split hyphenated words", () => {
    const parts = JobInfo.parseTitleParts("Front-End Developer - Acme | Indeed.com", "Indeed");
    expect(parts).toEqual({ role: "Front-End Developer", company: "Acme" });
  });

  it("returns empty parts for an empty title", () => {
    expect(JobInfo.parseTitleParts("", "LinkedIn")).toEqual({ role: "", company: "" });
  });
});

describe("firstText", () => {
  it("returns the first selector with text, skipping invalid selectors", () => {
    document.body.innerHTML =
      '<div class="empty"></div><h1 class="title"> Staff  Engineer </h1>';
    const text = JobInfo.firstText(["::bad::", ".empty", ".title"]);
    expect(text).toBe("Staff Engineer");
  });

  it("returns an empty string when nothing matches", () => {
    document.body.innerHTML = "<div></div>";
    expect(JobInfo.firstText([".missing"])).toBe("");
  });
});

describe("elementLabel", () => {
  it("combines aria-label and visible text", () => {
    document.body.innerHTML = '<button aria-label="Yes, I applied"><span> Yes </span></button>';
    expect(JobInfo.elementLabel(document.querySelector("button"))).toBe("Yes, I applied Yes");
  });

  it("handles missing elements and attributes", () => {
    expect(JobInfo.elementLabel(null)).toBe("");
    document.body.innerHTML = "<button>No</button>";
    expect(JobInfo.elementLabel(document.querySelector("button"))).toBe("No");
  });
});

describe("findAncestorMatching", () => {
  const pattern = /did you (finish )?apply/i;

  it("finds the prompt container from a button inside an inline card", () => {
    document.body.innerHTML = `
      <div class="page">
        <div class="card">
          <p>Did you finish applying?</p>
          <button id="yes">Yes</button>
        </div>
      </div>`;
    const found = JobInfo.findAncestorMatching(
      document.getElementById("yes"),
      pattern,
      12,
      1500
    );
    expect(found).toBe(document.querySelector(".card"));
  });

  it("skips containers whose text exceeds the length cap", () => {
    document.body.innerHTML = `
      <div class="huge">
        <p>${"x".repeat(2000)} did you apply</p>
        <button id="yes">Yes</button>
      </div>`;
    const found = JobInfo.findAncestorMatching(
      document.getElementById("yes"),
      pattern,
      12,
      1500
    );
    expect(found).toBeNull();
  });

  it("respects the depth limit", () => {
    document.body.innerHTML = `
      <div class="outer">Did you apply?
        <div><div><div><button id="yes">Yes</button></div></div></div>
      </div>`;
    expect(
      JobInfo.findAncestorMatching(document.getElementById("yes"), pattern, 2, 1500)
    ).toBeNull();
    expect(
      JobInfo.findAncestorMatching(document.getElementById("yes"), pattern, 6, 1500)
    ).toBe(document.querySelector(".outer"));
  });

  it("returns null when nothing matches", () => {
    document.body.innerHTML = '<div><button id="yes">Yes</button></div>';
    expect(
      JobInfo.findAncestorMatching(document.getElementById("yes"), pattern, 12, 1500)
    ).toBeNull();
  });
});
