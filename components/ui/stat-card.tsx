import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "default" | "primary" | "success" | "warning" | "danger";

const accents: Record<Tone, string> = {
  default: "bg-neutral-soft",
  primary: "bg-primary-soft",
  success: "bg-success-soft",
  warning: "bg-warning-soft",
  danger: "bg-danger-soft",
};

const valueColors: Record<Tone, string> = {
  default: "text-ink",
  primary: "text-primary",
  success: "text-success-strong",
  warning: "text-warning",
  danger: "text-danger-strong",
};

export function StatCard({
  title,
  value,
  hint,
  tone = "default",
  icon,
}: {
  title: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: Tone;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-small font-medium text-ink-soft">{title}</p>
        {icon ? (
          <span
            className={cn(
              "flex size-8 items-center justify-center rounded-lg",
              accents[tone],
            )}
          >
            {icon}
          </span>
        ) : null}
      </div>
      <p className={cn("mt-2 text-h1 font-semibold tracking-tight", valueColors[tone])}>
        {value}
      </p>
      {hint ? <p className="mt-1 truncate text-tiny text-ink-faint">{hint}</p> : null}
    </div>
  );
}