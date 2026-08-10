"use client";

import { useEffect, useRef, useState } from "react";

const DEFAULT_LENGTH = 6;

type OtpInputProps = {
  id: string;
  name: string;
  /** How many digits the code has. */
  length?: number;
  disabled?: boolean;
  /** Paints the slots in the rejected colour — set once a code came back wrong. */
  invalid?: boolean;
  autoFocus?: boolean;
  onChange?: (value: string) => void;
  /** Fires when the last digit lands, once per distinct complete code. */
  onComplete?: (value: string) => void;
};

/**
 * A segmented code field: one real input stretched invisibly over a row of
 * slots that draw the digits.
 *
 * The alternative — one input per slot — has to reimplement paste, backspace
 * across boundaries, arrow keys and SMS/email autofill, and gets each of them
 * subtly wrong on some platform. Keeping a single input means the browser still
 * owns all of that (including `autocomplete="one-time-code"`), and the slots are
 * pure decoration marked `aria-hidden`, so assistive tech sees one labelled
 * field rather than six unlabelled ones.
 */
export function OtpInput({
  id,
  name,
  length = DEFAULT_LENGTH,
  disabled = false,
  invalid = false,
  autoFocus = false,
  onChange,
  onComplete,
}: OtpInputProps) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // Which complete code we already announced, so holding a key or re-focusing
  // doesn't fire onComplete (and, upstream, a submit) twice for the same code.
  const completedFor = useRef<string | null>(null);

  // Focus is taken here rather than via the autoFocus attribute, which React
  // only honours on a component's very first mount — a caller that remounts
  // this field to clear a rejected code needs it back every time. Keyed on
  // `disabled` because that remount happens while the failed submission is
  // still in flight, and focus() on a disabled input does nothing; this way the
  // field takes focus the moment it accepts input again.
  const wantsFocus = useRef(autoFocus);
  useEffect(() => {
    if (wantsFocus.current && !disabled) inputRef.current?.focus();
  }, [disabled]);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const next = event.target.value.replace(/\D/g, "").slice(0, length);
    if (next === value) return;

    setValue(next);
    onChange?.(next);

    if (next.length < length) {
      completedFor.current = null;
      return;
    }
    if (completedFor.current !== next) {
      completedFor.current = next;
      onComplete?.(next);
    }
  }

  // Typing always appends, so the caret belongs at the end no matter where the
  // click landed — otherwise clicking slot 2 of a filled code inserts mid-string.
  function caretToEnd() {
    const input = inputRef.current;
    if (!input) return;
    const end = input.value.length;
    if (input.selectionStart !== end || input.selectionEnd !== end) {
      input.setSelectionRange(end, end);
    }
  }

  const activeIndex = Math.min(value.length, length - 1);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        id={id}
        name={name}
        value={value}
        onChange={handleChange}
        onFocus={() => {
          setFocused(true);
          caretToEnd();
        }}
        onBlur={() => setFocused(false)}
        onPointerUp={caretToEnd}
        onSelect={caretToEnd}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern={`\\d{${length}}`}
        // No maxLength: the browser would truncate a pasted "903 214" to
        // "903 21" before handleChange gets to strip the separator, silently
        // eating the last digit. Trimming to `length` happens there instead.
        required
        disabled={disabled}
        aria-invalid={invalid}
        // Invisible, but still the element that owns focus, the caret, autofill
        // and the mobile keypad. Sits above the slots so clicks reach it.
        className="absolute inset-0 z-10 h-full w-full cursor-pointer rounded-xl bg-transparent text-transparent caret-transparent opacity-0 outline-none disabled:cursor-not-allowed"
      />

      <div aria-hidden="true" className="flex items-stretch gap-2 mobile:gap-1.5">
        {Array.from({ length }, (_, index) => {
          const digit = value[index] ?? "";
          const isActive = focused && !disabled && index === activeIndex;
          const isCaret = focused && !disabled && index === value.length;

          return (
            <div
              key={index}
              data-testid="otp-slot"
              data-active={isActive}
              data-filled={digit !== ""}
              data-invalid={invalid}
              className={[
                "relative flex h-14 flex-1 items-center justify-center rounded-xl border text-[19px] font-semibold tabular-nums transition-all duration-150 mobile:h-[52px] mobile:text-[17px]",
                disabled ? "opacity-50" : "",
                invalid
                  ? "text-ink [border-color:color-mix(in_oklab,var(--st-rejected)_55%,transparent)] [background:color-mix(in_oklab,var(--st-rejected)_7%,var(--surface))]"
                  : digit !== ""
                    ? "border-border-strong bg-surface text-ink"
                    : "border-border-base bg-surface-2 text-ink",
                isActive && !invalid
                  ? "z-10 border-accent-line bg-surface ring-[3px] ring-accent/20"
                  : "",
                isActive && invalid
                  ? "z-10 [box-shadow:0_0_0_3px_color-mix(in_oklab,var(--st-rejected)_20%,transparent)]"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {digit || (isCaret ? <span className="otp-caret" /> : null)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
