"use client";

import { BTN_SECONDARY } from "@/lib/ui";

type Props = {
  filter?: string;
};

export function CsvExportButton({ filter }: Props) {
  const handleExport = async () => {
    const params = new URLSearchParams();
    if (filter) params.set("filter", filter);
    const res = await fetch(`/api/export/applications?${params}`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `applications-${filter ?? "all"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button type="button" onClick={handleExport} className={BTN_SECONDARY}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Export CSV
    </button>
  );
}
