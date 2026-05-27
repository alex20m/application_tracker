"use client";

import { useState, useSyncExternalStore } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

import { BTN_GHOST, INPUT } from "@/lib/ui";

type DatePickerProps = {
  name: string;
  id?: string;
  defaultValue?: string;
  required?: boolean;
};

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

const CalendarIcon = () => (
  <svg
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500"
  >
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
  </svg>
);

export function DatePicker({ name, id, defaultValue, required }: DatePickerProps) {
  const [selected, setSelected] = useState<Date | undefined>(
    defaultValue ? parseIso(defaultValue) : undefined,
  );
  const [open, setOpen] = useState(false);

  // Hydration-safe: SSR shows raw defaultValue, client upgrades to locale format.
  const displayLabel = useSyncExternalStore(
    () => () => {},
    () => (selected ? selected.toLocaleDateString() : ""),
    () => defaultValue ?? "",
  );

  const close = () => setOpen(false);

  const handleSelect = (date: Date | undefined) => {
    setSelected(date);
    setOpen(false);
  };

  return (
    <>
      <input type="hidden" name={name} value={selected ? toIsoDate(selected) : ""} required={required} />

      <button
        type="button"
        id={id}
        onClick={() => setOpen(true)}
        className={`${INPUT} flex items-center justify-between gap-2 cursor-pointer text-left`}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className={selected ? "" : "text-gray-400 dark:text-gray-500 italic"}>
          {displayLabel || "Select date"}
        </span>
        <CalendarIcon />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onKeyDown={(e) => e.key === "Escape" && close()}
          role="dialog"
          aria-modal="true"
          aria-label="Date picker"
        >
          <div
            className="absolute inset-0 bg-black/40"
            aria-hidden="true"
            onClick={close}
          />
          <div className="relative z-10 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-xl w-[min(20rem,calc(100vw-2rem))]">
            <DayPicker
              mode="single"
              selected={selected}
              onSelect={handleSelect}
              defaultMonth={selected ?? new Date()}
              showOutsideDays
            />
            <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => handleSelect(new Date())}
                className={`${BTN_GHOST} !text-sm !px-3 !py-1.5 !min-h-0`}
              >
                Today
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
