"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const options = [
  {
    value: "light",
    label: "Light",
    swatch: (
      <div className="w-full h-10 rounded-lg overflow-hidden flex border border-border-base">
        <div className="flex-1 bg-[oklch(0.985_0.004_95)]" />
        <div className="w-1/3 bg-[oklch(1_0_0)] border-l border-[oklch(0.912_0.006_90)]" />
      </div>
    ),
  },
  {
    value: "dark",
    label: "Dark",
    swatch: (
      <div className="w-full h-10 rounded-lg overflow-hidden flex border border-border-base">
        <div className="flex-1 bg-[oklch(0.175_0.012_255)]" />
        <div className="w-1/3 bg-[oklch(0.212_0.014_255)] border-l border-[oklch(0.305_0.014_255)]" />
      </div>
    ),
  },
  {
    value: "system",
    label: "System",
    swatch: (
      <div className="w-full h-10 rounded-lg overflow-hidden flex border border-border-base">
        <div className="flex-1 bg-[oklch(0.985_0.004_95)]" />
        <div className="flex-1 bg-[oklch(0.175_0.012_255)]" />
      </div>
    ),
  },
] as const;

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  return (
    <div className="flex gap-3 mobile:flex-col">
      {options.map((option) => {
        const isActive = mounted && theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setTheme(option.value)}
            className={[
              "flex-1 flex cursor-pointer flex-col gap-2 rounded-[13px] border p-3 text-sm font-medium text-left transition-all mobile:min-h-11",
              isActive
                ? "border-accent bg-accent-soft text-accent-strong ring-2 ring-accent/20"
                : "border-border-base bg-surface text-ink-2 hover:bg-surface-2 hover:text-ink hover:border-border-strong",
            ].join(" ")}
          >
            {option.swatch}
            <span className="text-[13px] font-semibold">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
