"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

export function FormattedDate({ dateString }: { dateString: string }) {
  const formatted = useSyncExternalStore(
    noop,
    () => new Date(dateString).toLocaleDateString(),
    () => ""
  );

  return <>{formatted}</>;
}
