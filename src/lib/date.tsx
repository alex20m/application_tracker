"use client";

import { useEffect, useState } from "react";

export function FormattedDate({ dateString }: { dateString: string }) {
  const [formatted, setFormatted] = useState("");

  useEffect(() => {
    setFormatted(new Date(dateString).toLocaleDateString());
  }, [dateString]);

  return <>{formatted}</>;
}
