"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label, FieldError } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { createProgram } from "@/app/(app)/pelatih/program/actions";

export function CreateProgramModal({
  open,
  onClose,
  defaultType = "team",
}: {
  open: boolean;
  onClose: () => void;
  defaultType?: "team" | "personal";
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"team" | "personal">(defaultType);
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const submit = () => {
    setError(null);
    if (!name.trim()) {
      setError("Nama program wajib diisi.");
      return;
    }
    startTransition(async () => {
      const res = await createProgram({
        name,
        type,
        description,
        startDate: startDate || null,
        endDate: endDate || null,
      });
      if (!res.ok || !res.id) {
        setError(res.error ?? "Gagal membuat program.");
        return;
      }
      router.refresh();
      onClose();
    });
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Buat Program Baru"
      description="Program dibuat dengan kerangka awal (fase + minggu + jadwal sesi) yang siap diisi drill dari Bank Materi."
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="program-name">Nama program</Label>
          <Input
            id="program-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="mis. Program Pra-Musim Tim"
          />
        </div>

        <div>
          <Label>Tipe program</Label>
          <div className="flex items-center gap-1 rounded-xl border border-line-strong bg-canvas p-1">
            {(
              [
                ["team", "Program Tim"],
                ["personal", "Program Personal"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setType(value)}
                className={cn(
                  "flex-1 rounded-lg px-3 py-2 text-small font-semibold transition-colors",
                  type === value
                    ? "bg-panel text-ink shadow-sm"
                    : "text-ink-soft hover:text-ink",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="program-desc">Deskripsi (opsional)</Label>
          <Textarea
            id="program-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Fokus program, sasaran, atau catatan."
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="program-start">Mulai</Label>
            <Input
              id="program-start"
              type="date"
              value={startDate}
              min={today}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="program-end">Selesai</Label>
            <Input
              id="program-end"
              type="date"
              value={endDate}
              min={startDate || today}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <FieldError>{error ?? undefined}</FieldError>

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Batal
          </Button>
          <Button onClick={submit} disabled={isPending}>
            {isPending ? "Membuat…" : "Buat Program"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}