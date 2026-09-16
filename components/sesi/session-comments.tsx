"use client";

import React, { useTransition } from "react";
import { cn } from "@/lib/cn";

export type SessionCommentItem = {
  id: string;
  authorName: string;
  role: string;
  content: string;
  createdAt: string;
};

export function SessionComments({
  sessionId,
  comments,
  currentUserIsCoach,
}: {
  sessionId: string;
  comments: SessionCommentItem[];
  currentUserIsCoach: boolean;
}) {
  const [text, setText] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    if (!text.trim()) {
      setError("Tulis komentar terlebih dahulu.");
      return;
    }
    startTransition(async () => {
      const { addSessionComment } = await import(
        "@/app/(app)/atlet/sesi/actions"
      );
      const res = await addSessionComment(sessionId, text);
      if (!res.ok) {
        setError(res.error ?? "Gagal menambah komentar.");
        return;
      }
      setText("");
    });
  };

  return (
    <div className="mt-8">
      <p className="mb-3 text-small font-bold">Komentar sesi</p>

      <div className="space-y-2">
        {comments.length === 0 ? (
          <p className="text-tiny text-ink-faint">Belum ada komentar.</p>
        ) : (
          comments.map((c) => (
            <div
              key={c.id}
              className={cn(
                "rounded-xl border px-3 py-2.5",
                currentUserIsCoach && c.role === "COACH"
                  ? "border-primary-soft bg-primary-faint"
                  : !currentUserIsCoach && c.role === "ATHLETE"
                    ? "border-purple-soft bg-purple-faint"
                    : "border-line bg-panel",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-tiny font-semibold text-ink">
                  {c.authorName}
                  <span className="ml-1.5 font-normal text-ink-faint">
                    {c.role === "COACH"
                      ? "Pelatih"
                      : c.role === "ASSISTANT"
                        ? "Asisten"
                        : "Atlet"}
                  </span>
                </p>
                <span className="text-[10px] text-ink-faint">{c.createdAt}</span>
              </div>
              <p className="mt-1 text-tiny text-ink-soft">{c.content}</p>
            </div>
          ))
        )}
      </div>

      <div className="mt-3 flex items-start gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Tulis komentar…"
          className="min-h-16 w-full resize-none rounded-lg border border-line bg-panel px-3 py-2 text-small text-ink placeholder:text-ink-faint focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft"
        />
        <button
          type="button"
          disabled={isPending}
          onClick={submit}
          className="shrink-0 rounded-lg bg-primary px-3 py-2 text-small font-semibold text-white transition-colors hover:bg-primary-strong disabled:opacity-60"
        >
          Kirim
        </button>
      </div>
      {error ? <p className="mt-1 text-tiny text-danger">{error}</p> : null}
    </div>
  );
}