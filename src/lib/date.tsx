"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

export function FormattedDate({ dateString }: { dateString: string }) {
  const formatted = useSyncExternalStore(
    noop,
    () => {
      const datePart = dateString.split("T")[0];
      const [y, m, d] = datePart.split("-").map(Number);
      return new Date(y, m - 1, d).toLocaleDateString();
    },
    () => ""
  );

  return <>{formatted}</>;
}
