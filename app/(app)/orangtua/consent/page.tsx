import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SectionTitle } from "@/components/ui/card";
import { ConsentList } from "./consent-list";

export default async function ConsentPage() {
  const user = await requireUser();
  if (user.role !== "PARENT") {
    return (
      <div className="mx-auto max-w-3xl">
        <SectionTitle
          title="Persetujuan Orang Tua"
          description="Anda tidak memiliki akses ke halaman ini."
        />
      </div>
    );
  }

  const pendingLinks = await prisma.parentAthleteLink.findMany({
    where: { parentId: user.id, status: "pending" },
    include: { athlete: { select: { fullName: true } } },
    orderBy: { createdAt: "desc" },
  });

  const links = pendingLinks.map((l) => ({
    id: l.id,
    athleteName: l.athlete.fullName,
    relationship: l.relationship,
    createdAt: l.createdAt,
  }));

  return (
    <div className="mx-auto max-w-3xl">
      <SectionTitle
        title="Persetujuan Orang Tua"
        description="Tinjau permintaan tautan dari pelatih."
      />
      <ConsentList links={links} />
    </div>
  );
}
