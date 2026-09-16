import { SectionTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export function ComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-6xl">
      <SectionTitle title={title} />
      <EmptyState
        title="Segera hadir"
        description={description}
      />
    </div>
  );
}