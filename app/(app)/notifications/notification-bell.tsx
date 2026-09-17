"use client";

import { useEffect, useState, useTransition } from "react";
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from "./actions";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: Date | null;
  createdAt: Date;
};

const TYPE_ICON: Record<string, string> = {
  schedule_change: "📅",
  load_alert: "⚠️",
  comment: "💬",
  announcement: "📢",
  consent: "👨‍👩‍👧",
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isPending, startTransition] = useTransition();

  const fetchNotifications = () => {
    startTransition(async () => {
      const [unread, items] = await Promise.all([
        getUnreadCount(),
        getNotifications(),
      ]);
      setCount(unread);
      setNotifications(items as Notification[]);
    });
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkRead = async (id: string) => {
    await markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date() } : n)),
    );
    setCount((c) => Math.max(0, c - 1));
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date() })));
    setCount(0);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          if (!open) fetchNotifications();
        }}
        className="relative rounded-lg p-2 text-ink-soft transition-colors hover:bg-neutral-soft hover:text-ink"
        aria-label="Notifikasi"
      >
        <svg viewBox="0 0 20 20" width={18} height={18} fill="currentColor">
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
        </svg>
        {count > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 max-h-96 overflow-y-auto rounded-2xl border border-line bg-panel shadow-xl">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="text-small font-bold">Notifikasi</p>
              {count > 0 ? (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-tiny text-primary hover:underline"
                >
                  Tandai semua dibaca
                </button>
              ) : null}
            </div>
            {isPending && notifications.length === 0 ? (
              <p className="py-6 text-center text-tiny text-ink-soft">Memuat...</p>
            ) : notifications.length === 0 ? (
              <p className="py-6 text-center text-tiny text-ink-soft">
                Belum ada notifikasi.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {notifications.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => {
                        handleMarkRead(n.id);
                        if (n.link) {
                          setOpen(false);
                          // navigate via Link below
                        }
                      }}
                      className={`w-full px-4 py-3 text-left transition-colors hover:bg-neutral-soft ${
                        !n.readAt ? "bg-primary-faint/30" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 text-base">
                          {TYPE_ICON[n.type] ?? "🔔"}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className={`text-small ${!n.readAt ? "font-bold" : "font-medium"}`}>
                            {n.title}
                          </p>
                          {n.body ? (
                            <p className="mt-0.5 text-tiny text-ink-soft line-clamp-2">
                              {n.body}
                            </p>
                          ) : null}
                          <p className="mt-1 text-[10px] text-ink-faint">
                            {new Intl.DateTimeFormat("id-ID", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            }).format(new Date(n.createdAt))}
                          </p>
                        </div>
                        {!n.readAt ? (
                          <span className="size-2 shrink-0 rounded-full bg-primary" />
                        ) : null}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
