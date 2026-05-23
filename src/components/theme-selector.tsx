"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const options = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
] as const;

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — only render the active state after mount
  useEffect(() => setMounted(true), []);

  return (
    <div className="flex gap-2 mobile:flex-col">
      {options.map((option) => {
        const isActive = mounted && theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setTheme(option.value)}
            className={[
              "flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors mobile:min-h-11 mobile:text-base",
              isActive
                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300"
                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100",
            ].join(" ")}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
