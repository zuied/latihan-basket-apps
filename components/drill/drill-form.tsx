"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Modal } from "@/components/ui/modal";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import {
  CATEGORIES,
  SUBCATEGORIES,
  DIFFICULTIES,
  TARGET_TYPES,
  POSITIONS,
  EQUIPMENT_OPTIONS,
  type DrillInput,
  type DrillState,
} from "@/lib/drill";
import { createDrill, updateDrill } from "@/app/(app)/pelatih/drill/actions";

export function DrillFormModal({
  open,
  onClose,
  drill,
}: {
  open: boolean;
  onClose: () => void;
  drill?: DrillInput | null;
}) {
  const action = drill ? updateDrill.bind(null, drill.id) : createDrill;
  const [state, formAction, isPending] = useActionState<DrillState, FormData>(action, {});

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={drill ? "Edit drill" : "Buat drill baru"}
      description={
        drill
          ? "Perbarui detail bank materi latihan Anda."
          : "Tambahkan materi latihan baru ke bank Anda."
      }
      size="lg"
    >
      <DrillForm
        formAction={formAction}
        state={state}
        isPending={isPending}
        drill={drill}
        onCancel={onClose}
      />
    </Modal>
  );
}

function DrillForm({
  formAction,
  state,
  isPending,
  drill,
  onCancel,
}: {
  formAction: (formData: FormData) => void;
  state: DrillState;
  isPending: boolean;
  drill?: DrillInput | null;
  onCancel: () => void;
}) {
  const [mainCategory, setMainCategory] = useState(drill?.mainCategory ?? "");
  const [targetType, setTargetType] = useState(drill?.targetType ?? "reps");
  const [positions, setPositions] = useState<string[]>(
    drill?.relevantPositions ?? [],
  );
  const [equipment, setEquipment] = useState<string[]>(drill?.equipment ?? []);

  const subcategories = mainCategory ? SUBCATEGORIES[mainCategory] ?? [] : [];
  const targetMeta = TARGET_TYPES.find((t) => t.value === targetType);
  const targetUnit =
    targetType === "reps"
      ? "reps"
      : targetType === "time_sec"
        ? "detik"
        : targetType === "percentage"
          ? "%"
          : "m";

  return (
    <form action={formAction} className="space-y-5">
      {state.error ? (
        <Alert tone="danger" title="Tidak dapat menyimpan">
          {state.error}
        </Alert>
      ) : null}

      <div>
        <Label htmlFor="name">Nama drill</Label>
        <Input
          id="name"
          name="name"
          placeholder="Mis. Mikan Drill"
          defaultValue={drill?.name ?? ""}
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="mainCategory">Kategori utama</Label>
          <Select
            id="mainCategory"
            name="mainCategory"
            value={mainCategory}
            onChange={(e) => setMainCategory(e.target.value)}
            required
          >
            <option value="">Pilih kategori...</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="subCategory">Sub kategori</Label>
          <Select
            id="subCategory"
            name="subCategory"
            defaultValue={drill?.subCategory ?? ""}
            required
          >
            <option value="">Pilih sub...</option>
            {subcategories.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="difficulty">Tingkat kesulitan</Label>
          <Select
            id="difficulty"
            name="difficulty"
            defaultValue={drill?.difficulty ?? ""}
            required
          >
            <option value="">Pilih tingkat...</option>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="targetType">Tipe target</Label>
          <Select
            id="targetType"
            name="targetType"
            value={targetType}
            onChange={(e) => setTargetType(e.target.value)}
            required
          >
            {TARGET_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="defaultTargetValue">
          Nilai target default {targetMeta ? `(${targetMeta.label})` : ""}
        </Label>
        <div className="relative">
          <Input
            id="defaultTargetValue"
            name="defaultTargetValue"
            type="number"
            inputMode="decimal"
            step="any"
            defaultValue={drill?.defaultTargetValue ?? ""}
            placeholder="0"
            className="pr-20"
          />
          {targetUnit ? (
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-tiny text-ink-faint">
              {targetUnit}
            </span>
          ) : null}
        </div>
      </div>

      <div>
        <Label>Posisi relevan</Label>
        <div className="flex flex-wrap gap-2">
          {POSITIONS.map((position) => (
            <label
              key={position}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-small font-medium transition-colors",
                positions.includes(position)
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-line bg-panel text-ink-soft hover:bg-neutral-soft",
              )}
            >
              <input
                type="checkbox"
                name="relevantPositions"
                value={position}
                checked={positions.includes(position)}
                onChange={(e) => {
                  const checked = e.target.checked;
                  const value = e.target.value;
                  if (value === "Semua") {
                    setPositions(checked ? ["Semua"] : []);
                    return;
                  }
                  setPositions((prev) => {
                    const withoutAll = prev.filter((p) => p !== "Semua");
                    return checked
                      ? [...withoutAll, value]
                      : withoutAll.filter((p) => p !== value);
                  });
                }}
                className="size-3.5 accent-primary"
              />
              {position}
            </label>
          ))}
        </div>
      </div>

      <div>
        <Label>Peralatan</Label>
        <div className="flex flex-wrap gap-2">
          {EQUIPMENT_OPTIONS.map((item) => (
            <label
              key={item}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-tiny font-medium transition-colors",
                equipment.includes(item)
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-line bg-panel text-ink-soft hover:bg-neutral-soft",
              )}
            >
              <input
                type="checkbox"
                name="equipment"
                value={item}
                checked={equipment.includes(item)}
                onChange={(e) => {
                  const value = e.target.value;
                  setEquipment((prev) =>
                    e.target.checked ? [...prev, value] : prev.filter((x) => x !== value),
                  );
                }}
                className="size-3.5 accent-primary"
              />
              {item}
            </label>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="description">Deskripsi</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Instruksi singkat cara melakukan & fokus teknik..."
          defaultValue={drill?.description ?? ""}
        />
      </div>

      <div>
        <Label htmlFor="variations">Variasi / progresi (satu per baris)</Label>
        <Textarea
          id="variations"
          name="variations"
          rows={3}
          placeholder={"Dua tangan\nFokus follow-through"}
          defaultValue={drill?.variations?.join("\n") ?? ""}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="videoUrl">URL video (opsional)</Label>
          <Input
            id="videoUrl"
            name="videoUrl"
            type="url"
            placeholder="https://youtu.be/..."
            defaultValue={drill?.videoUrl ?? ""}
          />
        </div>
        <div className="flex items-end pb-1">
          <label className="inline-flex cursor-pointer items-center gap-2 text-small font-medium">
            <input
              type="checkbox"
              name="isPublicTemplate"
              className="size-4 accent-primary"
              defaultChecked={drill?.isPublicTemplate ?? false}
            />
            Jadikan template publik
          </label>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-line/70 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Menyimpan..." : drill ? "Simpan perubahan" : "Buat drill"}
        </Button>
      </div>
    </form>
  );
}