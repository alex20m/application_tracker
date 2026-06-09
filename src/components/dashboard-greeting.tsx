"use client";

import { useEffect, useState } from "react";

function getGreeting(h: number): string {
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getDateStamp(now: Date): string {
  const day = now.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
  const month = now.toLocaleDateString("en-US", { month: "long" }).toUpperCase();
  const date = now.getDate();
  const year = now.getFullYear();
  return `${day} · ${month} ${date}, ${year}`;
}

export function DashboardGreeting({
  activeCount,
  attentionCount,
}: {
  activeCount: number;
  attentionCount: number;
}) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date()); // read browser-local time once after hydration
  }, []);

  const dateStamp = now ? getDateStamp(now) : "";
  const greeting = now ? getGreeting(now.getHours()) : "";

  return (
    <div>
      <p className="text-[11.5px] font-medium uppercase tracking-[0.08em] text-ink-3 mb-1 min-h-[1em]">
        {dateStamp}
      </p>
      <h1 className="text-[32px] font-bold tracking-[-0.03em] leading-[1.15] text-ink mobile:text-[26px] min-h-[1.15em]">
        {greeting} 👋
      </h1>
      {activeCount > 0 ? (
        <p className="text-[13.5px] text-ink-2 mt-1">
          You have{" "}
          <strong className="font-semibold text-ink">
            {activeCount} active application{activeCount !== 1 ? "s" : ""}
          </strong>
          {attentionCount > 0 ? (
            <>
              {" "}moving and{" "}
              <strong className="font-semibold text-ink">
                {attentionCount} thing{attentionCount !== 1 ? "s" : ""}
              </strong>
              {" "}that need attention.
            </>
          ) : (
            <> · everything looks good.</>
          )}
        </p>
      ) : (
        <p className="text-[13.5px] text-ink-2 mt-1">Add your first application to get started.</p>
      )}
    </div>
  );
}
