"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const ITEMS = [
  {
    label: "Beranda",
    href: "/atlet",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z" />
      </svg>
    ),
  },
  {
    label: "Jadwal",
    href: "/atlet/kalender",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M3 9h18M8 3v3M16 3v3" />
      </svg>
    ),
  },
  {
    label: "Progres",
    href: "/atlet/progres",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19V9M12 19V5M20 19v-7" />
      </svg>
    ),
  },
  {
    label: "Pesan",
    href: "#",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
];

export function AthleteBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="flex justify-around border-t border-line bg-panel px-2 py-2 lg:hidden">
      {ITEMS.map((item) => {
        const active = item.href !== "#" && pathname === item.href;
        const cls = cn(
          "flex flex-col items-center gap-0.5 rounded-lg px-4 py-1.5 text-tiny font-medium",
          active ? "text-primary" : item.href === "#" ? "text-ink-faint/60" : "text-ink-faint",
        );
        if (item.href === "#") {
          return (
            <span key={item.label} className={cn(cls, "cursor-default")} aria-disabled>
              {item.icon}
              {item.label}
            </span>
          );
        }
        return (
          <Link
            key={item.label}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cls}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}