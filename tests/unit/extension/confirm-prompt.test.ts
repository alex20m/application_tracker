import { describe, it, expect, vi, beforeEach } from "vitest";
import ConfirmPrompt from "../../../extension/shared/confirm-prompt.js";

const job = {
  company: "Acme",
  role: "Engineer",
  location: "Stockholm",
  source: "LinkedIn",
  notes: "",
};

function buttons(): HTMLButtonElement[] {
  return Array.from(document.querySelectorAll("#app-tracker-confirm-prompt button"));
}

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("ConfirmPrompt", () => {
  it("renders the title, both actions, and a preview of every captured field", () => {
    ConfirmPrompt.show(
      { title: "Save to your tracker?", job, yesLabel: "Save", noLabel: "Don't save" },
      () => {},
      () => {}
    );

    expect(ConfirmPrompt.isVisible()).toBe(true);
    const text = document.getElementById("app-tracker-confirm-prompt")!.textContent!;
    expect(text).toContain("Save to your tracker?");
    expect(text).toContain("Acme");
    expect(text).toContain("Engineer");
    expect(text).toContain("Stockholm");
    expect(text).toContain("LinkedIn");
    expect(buttons().map((b) => b.textContent)).toEqual(["Save", "Don't save"]);
  });

  it("omits preview rows for empty fields", () => {
    ConfirmPrompt.show(
      { title: "Did you apply?", job: { ...job, location: "", source: "" } },
      () => {},
      () => {}
    );

    const text = document.getElementById("app-tracker-confirm-prompt")!.textContent!;
    expect(text).toContain("Company");
    expect(text).toContain("Role");
    expect(text).not.toContain("Location");
    expect(text).not.toContain("Source");
  });

  it("runs onYes and closes when the yes button is clicked", () => {
    const onYes = vi.fn();
    const onNo = vi.fn();
    ConfirmPrompt.show({ title: "Did you apply?", job }, onYes, onNo);

    buttons()[0].click();

    expect(onYes).toHaveBeenCalledOnce();
    expect(onNo).not.toHaveBeenCalled();
    expect(ConfirmPrompt.isVisible()).toBe(false);
  });

  it("runs onNo and closes when the no button is clicked", () => {
    const onYes = vi.fn();
    const onNo = vi.fn();
    ConfirmPrompt.show({ title: "Did you apply?", job }, onYes, onNo);

    buttons()[1].click();

    expect(onNo).toHaveBeenCalledOnce();
    expect(onYes).not.toHaveBeenCalled();
    expect(ConfirmPrompt.isVisible()).toBe(false);
  });

  it("replaces a previous prompt instead of stacking", () => {
    ConfirmPrompt.show({ title: "First", job }, () => {}, () => {});
    ConfirmPrompt.show({ title: "Second", job }, () => {}, () => {});

    const prompts = document.querySelectorAll("#app-tracker-confirm-prompt");
    expect(prompts).toHaveLength(1);
    expect(prompts[0].textContent).toContain("Second");
  });

  it("hide() removes the prompt without running callbacks", () => {
    const onYes = vi.fn();
    const onNo = vi.fn();
    ConfirmPrompt.show({ title: "Did you apply?", job }, onYes, onNo);

    ConfirmPrompt.hide();

    expect(ConfirmPrompt.isVisible()).toBe(false);
    expect(onYes).not.toHaveBeenCalled();
    expect(onNo).not.toHaveBeenCalled();
  });
});
