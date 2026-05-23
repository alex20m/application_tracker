// ─── Layout ──────────────────────────────────────────────────────────────────

export const PAGE_CONTAINER = "mx-auto max-w-6xl px-6 mobile:px-4";
export const PAGE_VERTICAL = "py-8 mobile:py-5";

// ─── Typography ──────────────────────────────────────────────────────────────

export const TEXT_HEADING = "text-lg font-semibold text-gray-900 mobile:text-base";
export const TEXT_BODY = "text-sm text-gray-700 mobile:text-base";
export const TEXT_META = "text-xs text-gray-500 mobile:text-sm";
export const TEXT_LABEL = "text-xs font-semibold uppercase tracking-wide text-gray-500 mobile:text-sm";

// ─── Buttons ─────────────────────────────────────────────────────────────────

// mobile: min-h-11 (44px) for iOS tap target; text-base (16px) prevents auto-zoom
export const BTN_PRIMARY =
  "cursor-pointer rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 mobile:min-h-11 mobile:px-4 mobile:py-2.5 mobile:text-base";

export const BTN_PRIMARY_LINK =
  "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 mobile:min-h-11 mobile:px-4 mobile:py-2.5 mobile:text-base";

export const BTN_GHOST =
  "cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 mobile:min-h-11 mobile:px-3 mobile:py-2.5 mobile:text-base";

// ─── Cards & containers ───────────────────────────────────────────────────────

export const CARD = "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm mobile:p-4";

// ─── Banners ─────────────────────────────────────────────────────────────────

export const ERROR_BANNER =
  "rounded-lg border-l-4 border-red-400 bg-red-50 px-4 py-3 text-sm text-red-700 mobile:text-base";

export const SUCCESS_BANNER =
  "rounded-lg border-l-4 border-emerald-400 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 mobile:text-base";

// ─── Form inputs ──────────────────────────────────────────────────────────────

// mobile:text-base (16px) prevents iOS auto-zoom on focus
// mobile:py-3 keeps tap target ≥44px
export const INPUT =
  "mt-1.5 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 mobile:py-3 mobile:text-base";

export const INPUT_ON_GRAY =
  "mt-1.5 block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 mobile:py-3 mobile:text-base";

export const LABEL = "block text-xs font-semibold uppercase tracking-wide text-gray-500 mobile:text-sm";
