"use client";

type TabItem<T extends string> = {
  id: T;
  label: string;
};

interface SectionTabsProps<T extends string> {
  tabs: readonly TabItem<T>[] | TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  ariaLabel?: string;
  className?: string;
}

/** Underline tab row — shared by reports, overview, and admin. */
export function SectionTabs<T extends string>({
  tabs,
  value,
  onChange,
  ariaLabel = "Sections",
  className = "",
}: SectionTabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`flex gap-0.5 overflow-x-auto border-b border-ink/10 ${className}`.trim()}
    >
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={`relative shrink-0 px-3.5 py-2.5 text-sm font-medium transition ${
              active
                ? "text-ink after:absolute after:inset-x-3 after:bottom-0 after:h-[2px] after:rounded-full after:bg-teal"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
