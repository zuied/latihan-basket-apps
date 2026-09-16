import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  render,
}: {
  items: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  render?: (item: { value: T; label: string }) => ReactNode;
}) {
  return (
    <div
      role="tablist"
      className="flex flex-wrap items-center gap-1 rounded-xl bg-neutral-soft p-1"
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(item.value)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-small font-medium transition-colors",
              active
                ? "bg-panel text-ink shadow-sm"
                : "text-ink-soft hover:text-ink",
            )}
          >
            {render ? render(item) : item.label}
          </button>
        );
      })}
    </div>
  );
}