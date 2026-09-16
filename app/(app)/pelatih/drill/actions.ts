"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import type { DrillState } from "@/lib/drill";

function parseFormData(formData: FormData) {
  const name = formData.get("name") as string;
  const mainCategory = formData.get("mainCategory") as string;
  const subCategory = formData.get("subCategory") as string;
  const difficulty = formData.get("difficulty") as string;
  const targetType = formData.get("targetType") as string;
  const defaultTargetValueStr = formData.get("defaultTargetValue") as string;
  const description = formData.get("description") as string;
  const videoUrl = formData.get("videoUrl") as string;
  const positionsRaw = formData.getAll("relevantPositions") as string[];
  const equipmentRaw = formData.getAll("equipment") as string[];
  const variationsRaw = formData.get("variations") as string;
  const isPublicTemplate = formData.get("isPublicTemplate") === "on";

  if (!name?.trim()) return { error: "Nama drill wajib diisi." };
  if (!mainCategory) return { error: "Kategori utama wajib dipilih." };
  if (!subCategory) return { error: "Sub kategori wajib dipilih." };
  if (!difficulty) return { error: "Tingkat kesulitan wajib dipilih." };
  if (!targetType) return { error: "Tipe target wajib dipilih." };

  const defaultTargetValue = defaultTargetValueStr
    ? parseFloat(defaultTargetValueStr)
    : null;

  if (defaultTargetValue !== null && Number.isNaN(defaultTargetValue)) {
    return { error: "Nilai target harus berupa angka." };
  }

  return {
    data: {
      name: name.trim(),
      mainCategory,
      subCategory,
      difficulty,
      targetType,
      defaultTargetValue,
      description: description?.trim() || null,
      videoUrl: videoUrl?.trim() || null,
      relevantPositions: positionsRaw.length > 0 ? positionsRaw : ["Semua"],
      equipment: equipmentRaw.length > 0 ? equipmentRaw : [],
      variations: variationsRaw
        ? variationsRaw
            .split("\n")
            .map((v) => v.trim())
            .filter(Boolean)
        : [],
      isPublicTemplate,
    },
  };
}

export async function createDrill(
  _prevState: DrillState,
  formData: FormData,
): Promise<DrillState> {
  const user = await requireUser();

  const parsed = parseFormData(formData);
  if ("error" in parsed) return { error: parsed.error };

  await prisma.drill.create({
    data: { ...parsed.data, ownerId: user.id },
  });

  revalidatePath("/pelatih/drill");
  redirect("/pelatih/drill");
}

export async function updateDrill(
  drillId: string,
  _prevState: DrillState,
  formData: FormData,
): Promise<DrillState> {
  const user = await requireUser();

  const existing = await prisma.drill.findUnique({ where: { id: drillId } });
  if (!existing || existing.ownerId !== user.id) {
    return { error: "Drill tidak ditemukan atau bukan milik Anda." };
  }

  const parsed = parseFormData(formData);
  if ("error" in parsed) return { error: parsed.error };

  await prisma.drill.update({
    where: { id: drillId },
    data: parsed.data,
  });

  revalidatePath("/pelatih/drill");
  redirect("/pelatih/drill");
}

export async function deleteDrill(drillId: string): Promise<boolean> {
  const user = await requireUser();

  const existing = await prisma.drill.findUnique({ where: { id: drillId } });
  if (!existing || existing.ownerId !== user.id) return false;

  await prisma.drill.delete({ where: { id: drillId } });
  revalidatePath("/pelatih/drill");
  return true;
}