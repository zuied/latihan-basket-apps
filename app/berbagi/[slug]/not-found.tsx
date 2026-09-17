import Link from "next/link";

export default function SharedRaporNotFound() {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-panel">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-4">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary-soft">
            🏀
          </span>
          <span className="text-small font-bold">Rapor Latihan Basket</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-neutral-soft text-2xl">
          🔗
        </div>
        <h1 className="mt-5 text-h2 font-bold tracking-tight">
          Tautan rapor tidak valid
        </h1>
        <p className="mx-auto mt-2 max-w-md text-small text-ink-soft">
          Tautan ini mungkin salah, sudah kedaluwarsa, atau rapor telah dihapus
          oleh pelatih. Silakan minta tautan baru dari pelatih Anda.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 font-medium text-white shadow-sm transition-colors hover:bg-primary-strong"
          >
            Ke beranda
          </Link>
        </div>
      </main>
    </div>
  );
}