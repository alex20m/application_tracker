"use client";

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
};

export function SearchInput({ value, onChange, placeholder = "Search by company or role", ariaLabel = "Search" }: SearchInputProps) {
  return (
    <div className="relative">
      <svg
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
        width="15"
        height="15"
        viewBox="0 0 15 15"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M10.5 10.5L13.5 13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        aria-label={ariaLabel}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full rounded-[10px] border border-border-base bg-surface pl-[38px] pr-3 py-2 text-sm text-ink placeholder:text-ink-3 transition focus:border-accent-line focus:outline-none focus:ring-[3px] focus:ring-accent/20 mobile:py-2 mobile:text-base"
      />
    </div>
  );
}
