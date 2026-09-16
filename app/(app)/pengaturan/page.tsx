import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/pengaturan/settings-form";

export default async function PengaturanPage() {
  const user = await requireUser();
  if (user.role === "PARENT") notFound();

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: {
      fullName: true,
      phone: true,
      position: true,
      heightCm: true,
      weightKg: true,
    },
  });
  if (!profile) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-h2 font-bold tracking-tight">Pengaturan</h1>
      <p className="mb-6 text-small text-ink-soft">
        Kelola data profil dan keamanan akun Anda.
      </p>
      <SettingsForm
        fullName={profile.fullName}
        phone={profile.phone}
        position={profile.position}
        heightCm={profile.heightCm}
        weightKg={profile.weightKg}
      />
    </div>
  );
}