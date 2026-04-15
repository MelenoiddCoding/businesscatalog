import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function BusinessNotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-start gap-4 px-4 pb-10 pt-8 sm:px-6">
      <section className="w-full rounded-[24px] bg-white p-5 shadow-soft ring-1 ring-black/5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">404</p>
        <h1 className="mt-2 text-2xl font-black text-zinc-950">Negocio no encontrado</h1>
        <p className="mt-2 text-sm text-zinc-600">
          La ficha no existe o el negocio no esta publicado en el catalogo publico.
        </p>
        <div className="mt-4">
          <Button asChild>
            <Link href="/">Volver al listado</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
