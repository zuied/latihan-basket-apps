"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { approveConsent, rejectConsent, type ConsentState } from "../actions";

type PendingLink = {
  id: string;
  athleteName: string;
  relationship: string;
  createdAt: Date;
};

export function ConsentList({ links }: { links: PendingLink[] }) {
  const router = useRouter();

  if (links.length === 0) {
    return (
      <EmptyState
        title="Tidak ada undangan pending"
        description="Semua permintaan akses sudah diproses."
      />
    );
  }

  return (
    <div className="space-y-4">
      {links.map((link) => (
        <ConsentCard key={link.id} link={link} onDone={() => router.refresh()} />
      ))}
    </div>
  );
}

function ConsentCard({
  link,
  onDone,
}: {
  link: PendingLink;
  onDone: () => void;
}) {
  const [approveState, approveAction, isApprovePending] = useActionState<
    ConsentState,
    FormData
  >(async () => {
    const result = await approveConsent(link.id);
    onDone();
    return result;
  }, undefined);

  const [rejectState, rejectAction, isRejectPending] = useActionState<
    ConsentState,
    FormData
  >(async () => {
    const result = await rejectConsent(link.id);
    onDone();
    return result;
  }, undefined);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{link.athleteName}</CardTitle>
            <CardDescription>
              Hubungan: {link.relationship}
            </CardDescription>
          </div>
          <Badge variant="warning">Menunggu</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-tiny text-ink-soft">
          Pelatih meminta Anda menjadi orang tua yang ditautkan ke atlet ini.
          Setujui untuk melihat data latihan dan progres.
        </p>
        {approveState?.error || rejectState?.error ? (
          <p className="mb-2 text-tiny text-danger">
            {approveState?.error || rejectState?.error}
          </p>
        ) : null}
        <div className="flex items-center gap-2">
          <form action={approveAction}>
            <Button type="submit" size="sm" disabled={isApprovePending || isRejectPending}>
              {isApprovePending ? "Memproses…" : "Setujui"}
            </Button>
          </form>
          <form action={rejectAction}>
            <Button type="submit" size="sm" variant="ghost" disabled={isApprovePending || isRejectPending}>
              {isRejectPending ? "Memproses…" : "Tolak"}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
