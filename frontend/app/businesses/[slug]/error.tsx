"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function BusinessDetailError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-start gap-4 px-4 pb-10 pt-8 sm:px-6">
      <section className="w-full rounded-[24px] bg-rose-50 p-5 ring-1 ring-rose-200">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-700">Error</p>
        <h1 className="mt-2 text-2xl font-black text-rose-950">No pudimos cargar la ficha del negocio</h1>
        <p className="mt-2 text-sm text-rose-900/85">
          {error.message || "Ocurrio un problema temporal al consultar el catalogo publico."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={reset}>Reintentar</Button>
          <Button asChild variant="secondary">
            <Link href="/">Volver al listado</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
