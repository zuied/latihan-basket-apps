import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/cn";

const HARI = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

const time = (d: Date) =>
  d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

const sameDay = (a: Date, b: Date) =>
  a.getDate() === b.getDate() &&
  a.getMonth() === b.getMonth() &&
  a.getFullYear() === b.getFullYear();

const isToday = (d: Date) => sameDay(d, new Date());

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

export default async function AthleteCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; month?: string }>;
}) {
  const { view = "mingguan", month } = await searchParams;
  const isMonthly = view === "bulanan";

  const user = await requireUser();
  if (user.role !== "ATHLETE") notFound();

  const now = new Date();

  const dayOffset = (now.getDay() + 6) % 7;
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - dayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const monthMatch = month?.match(/^(\d{4})-(\d{2})$/);
  const activeYear = monthMatch ? Number(monthMatch[1]) : now.getFullYear();
  const activeMonth = monthMatch ? Number(monthMatch[2]) - 1 : now.getMonth();
  const monthStart = new Date(activeYear, activeMonth, 1);
  const nextMonthStart = new Date(activeYear, activeMonth + 1, 1);
  const prevMonth = new Date(activeYear, activeMonth - 1, 1);
  const monthLabel = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(monthStart);

  const teams = await prisma.teamMember.findMany({
    where: { athleteId: user.id, status: "active" },
    select: { teamId: true },
  });
  const teamIds = teams.map((t) => t.teamId);

  const sessions = await prisma.session.findMany({
    where: {
      scheduledAt: isMonthly
        ? { gte: monthStart, lt: nextMonthStart }
        : { gte: monday, lte: sunday },
      OR: [{ teamId: { in: teamIds } }, { athleteId: user.id }],
    },
    orderBy: { scheduledAt: "asc" },
    include: {
      _count: { select: { sessionDrills: true } },
    },
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  const sameMonthOfWeek = monday.getMonth() === sunday.getMonth();
  const weekLabel = sameMonthOfWeek
    ? `${monday.getDate()}–${sunday.getDate()} ${new Intl.DateTimeFormat("id-ID", { month: "long" }).format(monday)}`
    : `${new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long" }).format(monday)} – ${new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long" }).format(sunday)}`;

  const sessionsForDay = (d: Date) =>
    sessions.filter((s) => sameDay(s.scheduledAt, d));

  const toggle = (isMonthly: boolean) => (
    <nav
      aria-label="Ganti tampilan jadwal"
      className="mb-5 flex items-center gap-1 self-start rounded-full border border-line-strong bg-panel p-1"
    >
      <Link
        href="/atlet/kalender?view=mingguan"
        className={cn(
          "rounded-full px-3.5 py-1.5 text-tiny font-semibold transition-colors",
          !isMonthly ? "bg-primary text-white" : "text-ink-soft hover:text-ink",
        )}
      >
        Mingguan
      </Link>
      <Link
        href="/atlet/kalender?view=bulanan"
        className={cn(
          "rounded-full px-3.5 py-1.5 text-tiny font-semibold transition-colors",
          isMonthly ? "bg-primary text-white" : "text-ink-soft hover:text-ink",
        )}
      >
        Bulanan
      </Link>
    </nav>
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-h2 font-bold tracking-tight">Jadwal</h1>
          <p className="mt-1 text-small text-ink-soft">
            {isMonthly ? monthLabel : weekLabel}
          </p>
        </div>
        {toggle(isMonthly)}
      </div>

      {isMonthly ? (
        <div>
          <div className="mb-3 flex items-center justify-center gap-3">
            <Link
              href={`/atlet/kalender?view=bulanan&month=${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}`}
              className="rounded-lg border border-line bg-panel px-3 py-1.5 text-tiny font-medium text-ink transition-colors hover:bg-neutral-soft"
            >
              ← {new Intl.DateTimeFormat("id-ID", { month: "short" }).format(prevMonth)}
            </Link>
            <span className="min-w-40 text-center text-small font-bold">{monthLabel}</span>
            <Link
              href={`/atlet/kalender?view=bulanan&month=${nextMonthStart.getFullYear()}-${String(nextMonthStart.getMonth() + 1).padStart(2, "0")}`}
              className="rounded-lg border border-line bg-panel px-3 py-1.5 text-tiny font-medium text-ink transition-colors hover:bg-neutral-soft"
            >
              {new Intl.DateTimeFormat("id-ID", { month: "short" }).format(nextMonthStart)} →
            </Link>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-tiny">
            {HARI.map((h) => (
              <div key={h} className="pb-1 text-center font-semibold text-ink-soft">
                {h}
              </div>
            ))}
            {monthGrid(activeYear, activeMonth).map((d, i) =>
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
                    {sessionsForDay(d).slice(0, 2).map((s) => (
                      <Link
                        key={s.id}
                        href={`/atlet/sesi/${s.id}`}
                        className={cn(
                          "block truncate rounded px-1 py-0.5 text-[9px] font-semibold leading-tight",
                          s.athleteId
                            ? "bg-purple-soft text-purple"
                            : "bg-primary-soft text-primary",
                        )}
                        title={`${time(s.scheduledAt)} · ${s.name}`}
                      >
                        {time(s.scheduledAt)} {s.athleteId ? "Personal" : "Tim"}
                      </Link>
                    ))}
                    {sessionsForDay(d).length > 2 ? (
                      <div className="truncate pl-1 text-[9px] text-ink-faint">
                        +{sessionsForDay(d).length - 2} lagi
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div key={i} className="min-h-16 rounded-lg border border-transparent" />
              ),
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {weekDays.map((d, i) => {
            const daySessions = sessionsForDay(d);
            const today = isToday(d);
            return (
              <div
                key={i}
                className={cn(
                  "rounded-2xl border bg-panel p-4 shadow-sm",
                  today ? "border-primary" : "border-line",
                )}
              >
                <div className="mb-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-small font-bold",
                        today ? "text-primary" : "text-ink",
                      )}
                    >
                      {HARI[i]}
                    </span>
                    <span
                      className={cn(
                        "inline-flex size-7 items-center justify-center rounded-full text-tiny font-bold",
                        today ? "bg-primary text-white" : "text-ink-soft",
                      )}
                    >
                      {d.getDate()}
                    </span>
                  </div>
                  {today && (
                    <span className="rounded-full bg-primary-faint px-2.5 py-0.5 text-tiny font-semibold text-primary">
                      Hari ini
                    </span>
                  )}
                </div>
                {daySessions.length === 0 ? (
                  <p className="text-tiny text-ink-faint">Tidak ada sesi</p>
                ) : (
                  <div className="space-y-2">
                    {daySessions.map((s) => (
                      <Link
                        key={s.id}
                        href={`/atlet/sesi/${s.id}`}
                        className={cn(
                          "flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-neutral-soft",
                          s.athleteId
                            ? "border-l-4 border-purple bg-purple-faint"
                            : "border-l-4 border-primary bg-primary-faint",
                        )}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-small font-semibold text-ink">
                            {s.name}
                          </p>
                          <p className="mt-0.5 text-tiny text-ink-soft">
                            {time(s.scheduledAt)}
                            {" · "}
                            {s._count.sessionDrills} drill
                            {" · "}
                            {s.durationMinutes} menit
                          </p>
                        </div>
                        <span
                          className={cn(
                            "ml-3 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                            s.athleteId
                              ? "bg-purple-soft text-purple"
                              : "bg-primary-soft text-primary",
                          )}
                        >
                          {s.athleteId ? "Personal" : "Tim"}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}