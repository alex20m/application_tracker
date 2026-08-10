import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OtpInput } from "@/components/otp-input";

function renderInput(props: Partial<React.ComponentProps<typeof OtpInput>> = {}) {
  return render(
    <>
      <label htmlFor="token">6-digit code</label>
      <OtpInput id="token" name="token" {...props} />
    </>
  );
}

function slots() {
  return screen.getAllByTestId("otp-slot");
}

function digits() {
  return slots().map((slot) => slot.textContent);
}

function field() {
  return screen.getByLabelText(/6-digit code/i) as HTMLInputElement;
}

describe("OtpInput", () => {
  it("renders one empty slot per digit of the code", () => {
    renderInput();
    expect(slots()).toHaveLength(6);
    expect(digits()).toEqual(["", "", "", "", "", ""]);
  });

  it("shows each typed digit in its own slot, left to right", async () => {
    const user = userEvent.setup();
    renderInput();

    await user.type(field(), "428");

    expect(digits()).toEqual(["4", "2", "8", "", "", ""]);
  });

  it("ignores characters that are not digits", async () => {
    const user = userEvent.setup();
    renderInput();

    await user.type(field(), "1a2-b3");

    expect(digits()).toEqual(["1", "2", "3", "", "", ""]);
    expect(field().value).toBe("123");
  });

  it("stops accepting input after the sixth digit", async () => {
    const user = userEvent.setup();
    renderInput();

    await user.type(field(), "12345678");

    expect(digits()).toEqual(["1", "2", "3", "4", "5", "6"]);
    expect(field().value).toBe("123456");
  });

  it("fills every slot when a whole code is pasted at once", async () => {
    const user = userEvent.setup();
    renderInput();

    await user.click(field());
    await user.paste("903214");

    expect(digits()).toEqual(["9", "0", "3", "2", "1", "4"]);
  });

  it("strips separators out of a pasted code", async () => {
    const user = userEvent.setup();
    renderInput();

    await user.click(field());
    await user.paste("903 214");

    expect(digits()).toEqual(["9", "0", "3", "2", "1", "4"]);
  });

  it("removes the last digit on backspace", async () => {
    const user = userEvent.setup();
    renderInput();

    await user.type(field(), "1234");
    await user.type(field(), "{Backspace}");

    expect(digits()).toEqual(["1", "2", "3", "", "", ""]);
  });

  it("highlights the slot the next digit will land in", async () => {
    const user = userEvent.setup();
    renderInput();

    await user.click(field());
    expect(slots()[0]).toHaveAttribute("data-active", "true");

    await user.type(field(), "12");
    expect(slots()[0]).toHaveAttribute("data-active", "false");
    expect(slots()[2]).toHaveAttribute("data-active", "true");
  });

  it("highlights no slot while the field is unfocused", async () => {
    const user = userEvent.setup();
    renderInput();

    await user.click(field());
    await user.tab();

    expect(slots().every((slot) => slot.getAttribute("data-active") === "false")).toBe(true);
  });

  it("marks filled slots so they read differently from empty ones", async () => {
    const user = userEvent.setup();
    renderInput();

    await user.type(field(), "12");

    expect(slots()[0]).toHaveAttribute("data-filled", "true");
    expect(slots()[2]).toHaveAttribute("data-filled", "false");
  });

  it("calls onComplete once the sixth digit is entered", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    renderInput({ onComplete });

    await user.type(field(), "12345");
    expect(onComplete).not.toHaveBeenCalled();

    await user.type(field(), "6");
    expect(onComplete).toHaveBeenCalledExactlyOnceWith("123456");
  });

  it("does not call onComplete again while the same code stays in the field", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    renderInput({ onComplete });

    await user.type(field(), "1234567");

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("calls onComplete again after the code is corrected", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    renderInput({ onComplete });

    await user.type(field(), "123456");
    await user.type(field(), "{Backspace}9");

    expect(onComplete).toHaveBeenCalledTimes(2);
    expect(onComplete).toHaveBeenLastCalledWith("123459");
  });

  it("reports every change to onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderInput({ onChange });

    await user.type(field(), "12");

    expect(onChange).toHaveBeenNthCalledWith(1, "1");
    expect(onChange).toHaveBeenNthCalledWith(2, "12");
  });

  it("submits the code under the given field name", async () => {
    const user = userEvent.setup();
    renderInput({ name: "token" });

    await user.type(field(), "246810");

    expect(field().name).toBe("token");
    expect(field().value).toBe("246810");
  });

  it("accepts no input while disabled", async () => {
    const user = userEvent.setup();
    renderInput({ disabled: true });

    await user.type(field(), "123456");

    expect(digits()).toEqual(["", "", "", "", "", ""]);
  });

  it("flags the field as invalid when the code was rejected", () => {
    renderInput({ invalid: true });

    expect(field()).toHaveAttribute("aria-invalid", "true");
    expect(slots()[0]).toHaveAttribute("data-invalid", "true");
  });

  it("is not flagged invalid by default", () => {
    renderInput();

    expect(field()).toHaveAttribute("aria-invalid", "false");
    expect(slots()[0]).toHaveAttribute("data-invalid", "false");
  });

  it("offers the code to one-time-code autofill and the numeric keypad", () => {
    renderInput();

    expect(field()).toHaveAttribute("autocomplete", "one-time-code");
    expect(field()).toHaveAttribute("inputmode", "numeric");
  });
});
