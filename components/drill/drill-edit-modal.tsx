"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DrillFormModal } from "./drill-form";
import type { DrillInput } from "@/lib/drill";

export function DrillEditModal({ drill }: { drill: DrillInput }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        Edit drill
      </Button>
      {open ? (
        <DrillFormModal open={open} onClose={() => setOpen(false)} drill={drill} />
      ) : null}
    </>
  );
}