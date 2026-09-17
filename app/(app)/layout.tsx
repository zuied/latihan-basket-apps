import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { logoutAction } from "@/app/login/actions";
import { AthleteBottomNav } from "@/components/nav/athlete-bottom-nav";
import { cn } from "@/lib/cn";

const NAV: Record<string, { label: string; href: string }[]> = {
  COACH: [
    { label: "Dashboard", href: "/pelatih" },
    { label: "Kelola Tim", href: "/pelatih/tim" },
    { label: "Tim & Atlet", href: "/pelatih/atlet" },
    { label: "Program", href: "/pelatih/program" },
    { label: "Periodisasi", href: "/pelatih/periodisasi" },
    { label: "Kalender", href: "/pelatih/kalender" },
    { label: "Kehadiran", href: "/pelatih/kehadiran" },
    { label: "Statistik", href: "/pelatih/statistik" },
    { label: "Drill", href: "/pelatih/drill" },
    { label: "Asesmen", href: "/pelatih/asesmen" },
    { label: "Rapor", href: "/pelatih/rapor" },
    { label: "Pengumuman", href: "/pengumuman" },
    { label: "Pengaturan", href: "/pengaturan" },
  ],
  ASSISTANT: [
    { label: "Dashboard", href: "/pelatih" },
    { label: "Kelola Tim", href: "/pelatih/tim" },
    { label: "Tim & Atlet", href: "/pelatih/atlet" },
    { label: "Program", href: "/pelatih/program" },
    { label: "Periodisasi", href: "/pelatih/periodisasi" },
    { label: "Kalender", href: "/pelatih/kalender" },
    { label: "Kehadiran", href: "/pelatih/kehadiran" },
    { label: "Statistik", href: "/pelatih/statistik" },
    { label: "Asesmen", href: "/pelatih/asesmen" },
    { label: "Pengumuman", href: "/pengumuman" },
    { label: "Pengaturan", href: "/pengaturan" },
  ],
  ATHLETE: [
    { label: "Beranda", href: "/atlet" },
    { label: "Jadwal", href: "/atlet/kalender" },
    { label: "Progres", href: "/atlet/progres" },
    { label: "Pengaturan", href: "/pengaturan" },
  ],
  PARENT: [
    { label: "Beranda", href: "/orangtua" },
    { label: "Rapor", href: "/orangtua/rapor" },
  ],
};

const ROLE_LABEL: Record<string, string> = {
  COACH: "Pelatih",
  ASSISTANT: "Asisten Pelatih",
  ATHLETE: "Atlet",
  PARENT: "Orang Tua / Wali",
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  const initial = user.fullName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-panel lg:flex">
        <Link href="/" className="flex items-center gap-2.5 px-5 py-5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary-soft text-lg">
            🏀
          </span>
          <span className="text-base font-bold tracking-tight">Latihan Basket</span>
        </Link>
        <nav className="flex-1 space-y-1 px-3 py-2">
          {NAV[user.role]?.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-small font-medium text-ink-soft transition-colors hover:bg-neutral-soft hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-line px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-small font-semibold text-white">
              {initial}
            </span>
            <div className="min-w-0">
              <p className="truncate text-small font-semibold">{user.fullName}</p>
              <p className="text-tiny text-ink-soft">{ROLE_LABEL[user.role]}</p>
            </div>
          </div>
          <form action={logoutAction} className="mt-3">
            <button
              type="submit"
              className="w-full rounded-lg px-3 py-1.5 text-start text-tiny font-medium text-ink-faint transition-colors hover:bg-neutral-soft hover:text-danger"
            >
              Keluar
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-line bg-panel px-5 py-3 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary-soft">🏀</span>
            <span className="text-small font-bold">Latihan Basket</span>
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className={cn(
                "rounded-lg border border-line px-3 py-1.5 text-tiny font-medium text-ink-soft",
              )}
            >
              Keluar
            </button>
          </form>
        </header>

        <main className="flex-1 px-4 py-6 pb-20 sm:px-6 lg:px-8 lg:pb-6">{children}</main>
      </div>

      {user.role === "ATHLETE" ? <AthleteBottomNav /> : null}
    </div>
  );
}