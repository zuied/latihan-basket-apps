"use client";

import { useTransition } from "react";

export function PrintButton() {
  const [isPending, startTransition] = useTransition();

  const handleDownloadPdf = () => {
    startTransition(async () => {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);

      const element = document.querySelector("main") ?? document.body;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      const pdf = new jsPDF("p", "mm", "a4");
      const image = canvas.toDataURL("image/png");

      pdf.addImage(image, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(image, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const title = document.querySelector("h1")?.textContent ?? "rapor";
      pdf.save(`${title.toLowerCase().replace(/\s+/g, "-")}.pdf`);
    });
  };

  return (
    <div className="flex gap-2 print:hidden">
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-panel px-3 py-1.5 text-tiny font-semibold text-ink transition-colors hover:bg-neutral-soft"
      >
        <svg viewBox="0 0 16 16" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
          <path d="M4 6V2h8v4" />
          <path d="M4 12H2V8h12v4h-2" />
          <path d="M4 10h8v4H4z" />
        </svg>
        Cetak
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={handleDownloadPdf}
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-tiny font-semibold text-white transition-colors hover:bg-primary-strong disabled:opacity-60"
      >
        <svg viewBox="0 0 16 16" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
          <path d="M8 2v8m0 0l-3-3m3 3l3-3" />
          <path d="M2 12v1a1 1 0 001 1h10a1 1 0 001-1v-1" />
        </svg>
        {isPending ? "Membuat PDF..." : "Download PDF"}
      </button>
    </div>
  );
}
