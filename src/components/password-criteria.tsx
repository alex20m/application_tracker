"use client";

import { PASSWORD_RULES } from "@/lib/schemas";

type PasswordCriteriaProps = {
  value: string;
};

export function PasswordCriteria({ value }: PasswordCriteriaProps) {
  return (
    <ul className="mt-1.5 space-y-0.5">
      {PASSWORD_RULES.map((rule) => {
        const met = value.length > 0 && rule.test(value);
        return (
          <li
            key={rule.id}
            className={`flex items-center gap-1.5 text-xs ${
              met
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            <span className="w-3 text-center">{met ? "✓" : "•"}</span>
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
