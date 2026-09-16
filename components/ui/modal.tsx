"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: "md" | "lg" | "xl";
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => onClose();
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    dialog.addEventListener("keydown", handleKey);
    return () => dialog.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const sizeClass =
    size === "xl"
      ? "w-full max-w-3xl"
      : size === "lg"
        ? "w-full max-w-xl"
        : "w-full max-w-md";

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={headingId}
      className="m-auto w-fit max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-panel p-0 shadow-xl backdrop:bg-ink/40 backdrop:backdrop-blur-sm"
    >
      <div className={`${sizeClass} max-h-[85vh] overflow-y-auto`}>
        <div className="flex items-start justify-between gap-4 border-b border-line/70 px-5 py-4">
          <div>
            {title ? (
              <h3 id={headingId} className="text-h3 font-semibold tracking-tight">
                {title}
              </h3>
            ) : null}
            {description ? (
              <p className="mt-0.5 text-small text-ink-soft">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-lg p-1.5 text-ink-soft transition-colors hover:bg-neutral-soft hover:text-ink"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </dialog>
  );
}