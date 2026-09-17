"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteDrill } from "@/app/(app)/pelatih/drill/actions";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { TrashIcon } from "@/components/ui/icons";

export function DrillDeleteModal({
  drillId,
  drillName,
}: {
  drillId: string;
  drillName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleting, startDelete] = useTransition();

  const handleDelete = () => {
    startDelete(async () => {
      const ok = await deleteDrill(drillId);
      if (ok) router.push("/pelatih/drill");
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg px-3 py-1.5 text-small font-medium text-ink-faint transition-colors hover:bg-danger-soft hover:text-danger"
      >
        <TrashIcon /> Hapus drill
      </button>

      {open ? (
        <Modal
          open
          onClose={() => setOpen(false)}
          title="Hapus drill?"
          description="Tindakan ini tidak dapat dibatalkan."
        >
          <div className="space-y-4">
            <p className="text-small text-ink-soft">
              Drill <span className="font-semibold text-ink">{drillName}</span> akan dihapus permanen dari bank materi Anda.
            </p>
            <div className="flex items-center justify-end gap-3 border-t border-line/70 pt-4">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isDeleting}>
                Batal
              </Button>
              <Button type="button" variant="danger" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "Menghapus…" : "Hapus drill"}
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  );
}