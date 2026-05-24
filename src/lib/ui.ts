// ─── Layout ──────────────────────────────────────────────────────────────────

export const PAGE_CONTAINER = "mx-auto max-w-6xl px-6 mobile:px-4";
export const PAGE_VERTICAL = "py-8 mobile:py-5";

export const SECTION_STACK = "space-y-6 mobile:space-y-4";
export const ROW_STACK = "space-y-2 mobile:space-y-1.5";
export const FORM_STACK = "space-y-5 mobile:space-y-4";
export const PAGE_HEADER =
  "flex items-start justify-between gap-4 mobile:flex-col mobile:items-stretch mobile:gap-3";

// ─── Typography ──────────────────────────────────────────────────────────────

export const TEXT_H1 =
  "text-2xl font-bold text-gray-900 dark:text-gray-100 mobile:text-xl";
export const TEXT_H2 =
  "text-xl font-semibold text-gray-900 dark:text-gray-100 mobile:text-lg";
export const TEXT_H3 =
  "text-base font-semibold text-gray-900 dark:text-gray-100 mobile:text-sm";
export const TEXT_BODY =
  "text-sm text-gray-700 dark:text-gray-300 mobile:text-[13px]";
export const TEXT_META =
  "text-xs text-gray-500 dark:text-gray-400 mobile:text-[11px]";
export const TEXT_MUTED =
  "text-xs text-gray-500 dark:text-gray-500 mobile:text-[11px]";

// Kept for backward compatibility — prefer TEXT_H3/TEXT_BODY/TEXT_META above
export const TEXT_HEADING =
  "text-lg font-semibold text-gray-900 dark:text-gray-100 mobile:text-base";
export const TEXT_LABEL =
  "text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mobile:text-[11px]";

// ─── Buttons ─────────────────────────────────────────────────────────────────

// mobile: min-h-11 (44px) for iOS tap target; text-base (16px) prevents auto-zoom
export const BTN_PRIMARY =
  "cursor-pointer rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 dark:hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 mobile:min-h-11 mobile:px-4 mobile:py-2.5 mobile:text-base";

export const BTN_PRIMARY_LINK =
  "inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 dark:hover:bg-indigo-500 mobile:min-h-11 mobile:px-4 mobile:py-2.5 mobile:text-base";

export const BTN_GHOST =
  "inline-flex items-center justify-center cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 mobile:min-h-11 mobile:px-3 mobile:py-2.5 mobile:text-base";

// Compact button for quick-action rows — stays small on all screen sizes
export const BTN_SMALL =
  "cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50";

// ─── Cards & containers ───────────────────────────────────────────────────────

export const CARD =
  "rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm mobile:p-4";

// ─── Banners ─────────────────────────────────────────────────────────────────

export const ERROR_BANNER =
  "rounded-lg border-l-4 border-red-400 dark:border-red-500/70 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300";

export const SUCCESS_BANNER =
  "rounded-lg border-l-4 border-emerald-400 dark:border-emerald-500/70 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300";

// ─── Form inputs ──────────────────────────────────────────────────────────────

// mobile:text-base (16px) prevents iOS auto-zoom on focus
// mobile:py-3 keeps tap target ≥44px
// Note: no baked-in mt-* — add spacing via parent (FORM_STACK) or label wrapper
export const INPUT =
  "block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 mobile:py-3 mobile:text-base";

export const INPUT_ON_GRAY =
  "block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition focus:border-indigo-400 focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 mobile:py-3 mobile:text-base";

export const LABEL =
  "block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mobile:text-[11px]";

export const GENERIC_ACTION_ERROR = "Something went wrong. Please try again.";

export function sanitizeActionError(err: unknown, context: string): string {
  console.error(`[${context}]`, err);
  return GENERIC_ACTION_ERROR;
}
