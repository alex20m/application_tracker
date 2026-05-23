"use client";

import { useMediaQuery } from "./use-media-query";
import { MOBILE_MAX_WIDTH_PX, MOBILE_MAX_HEIGHT_PX } from "@/lib/responsive";

export function useIsMobile(): boolean {
  const narrow = useMediaQuery(`(max-width: ${MOBILE_MAX_WIDTH_PX}px)`);
  const short = useMediaQuery(`(max-height: ${MOBILE_MAX_HEIGHT_PX}px)`);
  return narrow || short;
}
