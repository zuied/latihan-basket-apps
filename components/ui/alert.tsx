import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "info" | "success" | "warning" | "danger";

const tones: Record<Tone, { box: string; dot: string }> = {
  info: { box: "bg-primary-faint border-primary-soft", dot: "bg-primary" },
  success: { box: "bg-success-faint border-success-soft", dot: "bg-success" },
  warning: { box: "bg-warning-faint border-warning-soft", dot: "bg-warning-strong" },
  danger: { box: "bg-danger-faint border-danger-soft", dot: "bg-danger" },
};

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: Tone;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const style = tones[tone];
  return (
    <div className={cn("flex gap-3 rounded-xl border p-4 text-small", style.box, className)}>
      <span className={cn("mt-1 size-2 shrink-0 rounded-full", style.dot)} />
      <div className="min-w-0">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={cn(title && "mt-0.5", "text-ink-soft")}>{children}</div> : null}
      </div>
    </div>
  );
}