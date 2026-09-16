import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SectionTitle } from "@/components/ui/card";
import { cn } from "@/lib/cn";

const HARI = [
  { short: "Sen", single: "Senin" },
  { short: "Sel", single: "Selasa" },
  { short: "Rab", single: "Rabu" },
  { short: "Kam", single: "Kamis" },
  { short: "Jum", single: "Jumat" },
  { short: "Sab", single: "Sabtu" },
  { short: "Min", single: "Minggu" },
];

const BANDS = [
  { label: "Pagi · 07.00", from: 0, to: 11.99 },
  { label: "Sore · 16.00", from: 12, to: 17.99 },
  { label: "Malam · 19.00", from: 18, to: 24 },
];

const time = (d: Date) =>
  d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

const sameDay = (a: Date, b: Date) =>
  a.getDate() === b.getDate() &&
  a.getMonth() === b.getMonth() &&
  a.getFullYear() === b.getFullYear();

const isToday = (d: Date) => sameDay(d, new Date());

type SessionCard = {
  id: string;
  name: string;
  scheduledAt: Date;
  durationMinutes: number;
  athleteId: string | null;
  athleteName: string | null;
  teamName: string | null;
  drillCount: number;
  logCount: number;
  needsResults: boolean;
};

function monthGrid(y: number, m: number): (Date | null)[] {
  const first = new Date(y, m, 1);
  const startOffset = (first.getDay() + 6) % 7; // Senin = 0
  const cells: (Date | null)[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(y, m, 1 - startOffset + i);
    cells.push(d.getMonth() === m ? d : null);
  }
  return cells;
}

export default async function CoachCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; month?: string }>;
}) {
  const { view = "mingguan", month } = await searchParams;
  const isMonthly = view === "bulanan";

  const user = await requireUser();
  if (!["COACH", "ASSISTANT"].includes(user.role)) notFound();

  const now = new Date();

  // Bulan aktif (untuk view bulanan & navigasi)
  const monthMatch = month?.match(/^(\d{4})-(\d{2})$/);
  const activeYear = monthMatch ? Number(monthMatch[1]) : now.getFullYear();
  const activeMonth = monthMatch ? Number(monthMatch[2]) - 1 : now.getMonth();
  const monthStart = new Date(activeYear, activeMonth, 1);
  const nextMonthStart = new Date(activeYear, activeMonth + 1, 1);
  const prevMonth = new Date(activeYear, activeMonth - 1, 1);
  const monthLabel = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(monthStart);

  // Minggu aktif (default = minggu berjalan)
  const dayOffset = (now.getDay() + 6) % 7; // Senin = 0
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - dayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
  const sameMonthOfWeek = monday.getMonth() === sunday.getMonth();
  const weekLabel = sameMonthOfWeek
    ? `${monday.getDate()}–${sunday.getDate()} ${new Intl.DateTimeFormat("id-ID", { month: "long" }).format(monday)}`
    : `${new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long" }).format(monday)} – ${new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long" }).format(sunday)}`;

  const team = await prisma.team.findFirst({
    where:
      user.role === "ASSISTANT"
        ? { members: { some: { athleteId: user.id, roleInTeam: "assistant_coach" } } }
        : { coachId: user.id },
    select: { id: true },
  });
  if (!team) notFound();

  const rawSessions = await prisma.session.findMany({
    where: {
      scheduledAt: isMonthly
        ? { gte: monthStart, lt: nextMonthStart }
        : { gte: monday, lte: sunday },
    },
    include: {
      team: { select: { name: true } },
      athlete: { select: { fullName: true } },
      _count: { select: { logs: true, sessionDrills: true } },
    },
    orderBy: { scheduledAt: "asc" },
  });

  const sessions: SessionCard[] = rawSessions.map((s) => ({
    id: s.id,
    name: s.name,
    scheduledAt: s.scheduledAt,
    durationMinutes: s.durationMinutes,
    athleteId: s.athleteId,
    athleteName: s.athlete?.fullName ?? null,
    teamName: s.team?.name ?? null,
    drillCount: s._count.sessionDrills,
    logCount: s._count.logs,
    needsResults: s.scheduledAt < now && s._count.logs === 0,
  }));

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <SectionTitle
          title={isMonthly ? "Kalender Jadwal" : "Kalender Jadwal"}
          description={`${isMonthly ? monthLabel : weekLabel} · Semua sesi tim dan personal`}
        />
        <nav
          aria-label="Ganti tampilan kalender"
          className="mb-4 flex items-center gap-1 rounded-full border border-line-strong bg-panel p-1"
        >
          <Link
            href="/pelatih/kalender?view=mingguan"
            className={cn(
              "rounded-full px-3.5 py-1.5 text-tiny font-semibold transition-colors",
              !isMonthly ? "bg-primary text-white" : "text-ink-soft hover:text-ink",
            )}
          >
            Mingguan
          </Link>
          <Link
            href="/pelatih/kalender?view=bulanan"
            className={cn(
              "rounded-full px-3.5 py-1.5 text-tiny font-semibold transition-colors",
              isMonthly ? "bg-primary text-white" : "text-ink-soft hover:text-ink",
            )}
          >
            Bulanan
          </Link>
        </nav>
      </div>

      {isMonthly ? (
        <MonthlyView
          year={activeYear}
          month={activeMonth}
          sessions={sessions}
          navHref={({ y, m }: { y: number; m: number }) => `/pelatih/kalender?view=bulanan&month=${y}-${String(m + 1).padStart(2, "0")}`}
        />
      ) : (
        <WeeklyView sessions={sessions} weekDays={weekDays} />
      )}

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-4 text-tiny">
        <span className="font-medium text-ink-soft">Legenda:</span>
        <span className="flex items-center gap-2">
          <span className="size-2.5 rounded-sm bg-primary" /> Sesi tim
        </span>
        <span className="flex items-center gap-2">
          <span className="size-2.5 rounded-sm bg-purple" /> Sesi personal
        </span>
        <span className="flex items-center gap-2">
          <span className="size-2.5 rounded-sm bg-warning" /> Lewat, belum isi hasil
        </span>
      </div>

      <div className="mt-6 mb-8">
        <Link
          href="/pelatih/program"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-small font-semibold text-white shadow-sm transition-colors hover:bg-primary-strong"
        >
          + Tambah sesi
        </Link>
      </div>
    </div>
  );

  function WeeklyView({
    sessions,
    weekDays,
  }: {
    sessions: SessionCard[];
    weekDays: Date[];
  }) {
    const slotAt = (bandIdx: number, dayIdx: number) =>
      sessions.filter((s) => {
        if (!sameDay(s.scheduledAt, weekDays[dayIdx])) return false;
        const h = s.scheduledAt.getHours();
        if (bandIdx === 0) return h < 12;
        if (bandIdx === 1) return h >= 12 && h < 18;
        return h >= 18;
      });

    return (
      <div className="grid grid-cols-[auto_repeat(7,minmax(90px,1fr))] gap-1.5 text-tiny">
        <div />
        {weekDays.map((d, i) => (
          <div key={i} className="pb-1 text-center font-semibold text-ink-soft">
            {HARI[i].short}
            <span
              className={cn(
                "ml-1 inline-flex size-6 items-center justify-center rounded-full",
                isToday(d) ? "bg-primary text-white" : "font-bold text-ink",
              )}
            >
              {d.getDate()}
            </span>
          </div>
        ))}

        {BANDS.map((band, bi) => (
          <div key={band.label} className="contents">
            <div className="flex items-center pr-2 text-tiny text-ink-faint">
              {band.label}
            </div>
            {weekDays.map((d, di) => {
              const slots = slotAt(bi, di);
              const today = isToday(weekDays[di]);
              return (
                <div
                  key={di}
                  className={cn(
                    "min-h-14 rounded-lg border p-1.5",
                    slots.length > 0
                      ? slots[0].athleteId
                        ? "bg-purple-faint"
                        : "bg-primary-faint"
                      : "border-line/60 bg-panel",
                    today && "border-primary",
                  )}
                >
                  {slots.map((s) => (
                    <div
                      key={s.id}
                      className={cn(
                        "mb-1 rounded-md px-1.5 py-1 text-[11px] font-medium leading-tight",
                        s.athleteId
                          ? "bg-purple-soft text-purple"
                          : "bg-primary-soft text-primary",
                        s.needsResults && "ring-1 ring-warning",
                      )}
                    >
                      <span className="block truncate">
                        {s.athleteId
                          ? `Personal — ${s.athleteName?.split(" ")[0] ?? ""}`
                          : s.teamName ?? "Sesi tim"}
                      </span>
                      <span className="opacity-80">{time(s.scheduledAt)}</span>
                      {s.needsResults ? (
                        <span className="mt-0.5 block rounded bg-warning/90 px-1 py-px text-center text-[9px] font-bold text-white">
                          Belum isi hasil
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  function MonthlyView({
    year,
    month,
    sessions,
    navHref,
  }: {
    year: number;
    month: number;
    sessions: SessionCard[];
    navHref: (p: { y: number; m: number }) => string;
  }) {
    const byDay = sessions.reduce<Record<string, SessionCard[]>>((acc, s) => {
      const key = `${s.scheduledAt.getFullYear()}-${s.scheduledAt.getMonth()}-${s.scheduledAt.getDate()}`;
      (acc[key] ??= []).push(s);
      return acc;
    }, {});

    return (
      <div>
        <div className="mb-3 flex items-center justify-center gap-3">
          <Link
            href={navHref({ y: prevMonth.getFullYear(), m: prevMonth.getMonth() })}
            className="rounded-lg border border-line bg-panel px-3 py-1.5 text-tiny font-medium text-ink transition-colors hover:bg-neutral-soft"
          >
            ← {new Intl.DateTimeFormat("id-ID", { month: "short" }).format(prevMonth)}
          </Link>
          <span className="min-w-40 text-center text-small font-bold">{monthLabel}</span>
          <Link
            href={navHref({ y: nextMonthStart.getFullYear(), m: nextMonthStart.getMonth() })}
            className="rounded-lg border border-line bg-panel px-3 py-1.5 text-tiny font-medium text-ink transition-colors hover:bg-neutral-soft"
          >
            {new Intl.DateTimeFormat("id-ID", { month: "short" }).format(nextMonthStart)} →
          </Link>
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-tiny">
          {HARI.map((h) => (
            <div key={h.short} className="pb-1 text-center font-semibold text-ink-soft">
              {h.short}
            </div>
          ))}
          {monthGrid(year, month).map((d, i) =>
            d ? (
              <div
                key={i}
                className={cn(
                  "min-h-16 rounded-lg border p-1.5",
                  isToday(d) ? "border-primary" : "border-line/60 bg-panel",
                )}
              >
                <span
                  className={cn(
                    "inline-flex size-5 items-center justify-center rounded-full text-[11px] font-bold",
                    isToday(d) ? "bg-primary text-white" : "text-ink",
                  )}
                >
                  {d.getDate()}
                </span>
                <div className="mt-1 space-y-0.5">
                  {byDay[`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`]?.slice(0, 2).map((s) => (
                    <div
                      key={s.id}
                      className={cn(
                        "truncate rounded px-1 py-0.5 text-[9px] font-semibold leading-tight",
                        s.athleteId ? "bg-purple-soft text-purple" : "bg-primary-soft text-primary",
                        s.needsResults && "ring-1 ring-warning",
                      )}
                      title={`${time(s.scheduledAt)} · ${s.name}`}
                    >
                      {time(s.scheduledAt)} {s.athleteId ? "Personal" : s.teamName ?? "Tim"}
                    </div>
                  ))}
                  {(() => {
                    const list =
                      byDay[`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`];
                    return list && list.length > 2 ? (
                      <div className="truncate pl-1 text-[9px] text-ink-faint">
                        +{list.length - 2} lagi
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>
            ) : (
              <div key={i} className="min-h-16 rounded-lg border border-transparent" />
            ),
          )}
        </div>
      </div>
    );
  }
}