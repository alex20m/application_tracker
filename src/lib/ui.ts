// ─── Layout ──────────────────────────────────────────────────────────────────

export const PAGE_CONTAINER = "mx-auto max-w-[1180px] px-7 mobile:px-4";
export const PAGE_VERTICAL = "py-8 mobile:py-5";

export const SECTION_STACK = "space-y-[22px] mobile:space-y-4";
export const ROW_STACK = "space-y-2";
export const FORM_STACK = "space-y-5 mobile:space-y-4";
export const PAGE_HEADER = "flex items-end justify-between gap-4 flex-wrap mobile:flex-col mobile:items-stretch mobile:gap-3";

// ─── Typography ──────────────────────────────────────────────────────────────

export const TEXT_H1 = "text-[27px] font-bold tracking-[-0.025em] leading-[1.18] text-ink mobile:text-2xl";
export const TEXT_H2 = "text-[17px] font-semibold tracking-[-0.015em] text-ink";
export const TEXT_H3 = "text-sm font-semibold text-ink";
export const TEXT_BODY = "text-[13px] text-ink-2";
export const TEXT_META = "text-xs text-ink-3";
export const TEXT_MUTED = "text-xs text-ink-3";
export const TEXT_LABEL = "font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink-3";

// Kept for backward compatibility
export const TEXT_HEADING = "text-[17px] font-semibold tracking-[-0.015em] text-ink";
export const LABEL = TEXT_LABEL;

// ─── Buttons ─────────────────────────────────────────────────────────────────

// mobile: min-h-11 (44px) for iOS tap target; text-base (16px) prevents auto-zoom
export const BTN_PRIMARY =
  "cursor-pointer rounded-[10px] bg-accent px-4 py-2.5 text-[13.5px] font-semibold text-accent-ink shadow-sm transition hover:bg-accent-strong hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed mobile:min-h-11 mobile:text-base";

export const BTN_PRIMARY_LINK =
  "inline-flex items-center justify-center gap-1.5 cursor-pointer rounded-[10px] bg-accent px-4 py-2.5 text-[13.5px] font-semibold text-accent-ink shadow-sm transition hover:bg-accent-strong hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed mobile:min-h-11 mobile:text-base";

export const BTN_GHOST =
  "inline-flex items-center justify-center cursor-pointer rounded-[10px] px-3 py-1.5 text-[13.5px] font-medium text-ink-2 transition hover:bg-surface-2 hover:text-ink mobile:min-h-11 mobile:text-base";

export const BTN_SECONDARY =
  "inline-flex items-center justify-center gap-1.5 cursor-pointer rounded-[10px] border border-border-strong bg-surface px-4 py-2.5 text-[13.5px] font-semibold text-ink shadow-sm transition hover:bg-surface-2";

// Compact button for quick-action rows — stays small on all screen sizes
export const BTN_SMALL =
  "cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-medium transition disabled:opacity-50";

// ─── Cards & containers ───────────────────────────────────────────────────────

export const CARD = "rounded-2xl border border-border-base bg-surface p-[22px] shadow-sm mobile:p-4";

// ─── Banners ─────────────────────────────────────────────────────────────────

export const ERROR_BANNER =
  "rounded-lg border-l-4 px-4 py-3 text-sm [border-left-color:var(--st-rejected)] [background:color-mix(in_oklch,var(--st-rejected)_8%,var(--surface))] [color:var(--st-rejected)]";

export const SUCCESS_BANNER =
  "rounded-lg border-l-4 px-4 py-3 text-sm [border-left-color:var(--st-offer)] [background:color-mix(in_oklch,var(--st-offer)_8%,var(--surface))] [color:var(--st-offer)]";

// ─── Form inputs ──────────────────────────────────────────────────────────────

// mobile:text-base (16px) prevents iOS auto-zoom on focus
// mobile:py-3 keeps tap target ≥44px
export const INPUT =
  "block w-full rounded-[10px] border border-border-base bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-3 transition focus:border-accent-line focus:outline-none focus:ring-[3px] focus:ring-accent/20 mobile:py-3 mobile:text-base";

export const INPUT_ON_GRAY = INPUT;

export const GENERIC_ACTION_ERROR = "Something went wrong. Please try again.";

export function sanitizeActionError(err: unknown, context: string): string {
  console.error(`[${context}]`, err);
  return GENERIC_ACTION_ERROR;
}
