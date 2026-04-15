"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, TriangleAlert } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { ApiRequestError, type FavoriteItem, getFavorites, removeFavorite } from "@/lib/api";
import { buildRedirectPath } from "@/lib/auth-redirect";

export default function FavoritesPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();
  const pathname = usePathname();
  const { isReady, isAuthenticated, runWithSession } = useAuth();

  const redirectPath = buildRedirectPath(pathname);

  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadFavorites = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await runWithSession((accessToken) => getFavorites(apiUrl, accessToken));
      setItems(response.items);
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) {
        router.replace(`/auth?redirect=${encodeURIComponent(redirectPath)}`);
        return;
      }

      setErrorMessage(error instanceof Error ? error.message : "No pudimos cargar tus favoritos.");
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, redirectPath, router, runWithSession]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!isAuthenticated) {
      router.replace(`/auth?redirect=${encodeURIComponent(redirectPath)}`);
      return;
    }

    loadFavorites();
  }, [isAuthenticated, isReady, loadFavorites, redirectPath, router]);

  const handleRemove = async (businessId: string) => {
    try {
      await runWithSession((accessToken) => removeFavorite(apiUrl, businessId, accessToken));
      setItems((current) => current.filter((item) => item.business_id !== businessId));
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) {
        router.replace(`/auth?redirect=${encodeURIComponent(redirectPath)}`);
        return;
      }

      setErrorMessage(error instanceof Error ? error.message : "No pudimos actualizar favoritos.");
    }
  };

  if (!isReady || (isLoading && items.length === 0)) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-4 px-4 pb-10 pt-6 sm:px-6">
        <div className="h-8 w-36 animate-pulse rounded bg-zinc-100" />
        <div className="h-24 w-full animate-pulse rounded-2xl bg-zinc-100" />
        <div className="h-24 w-full animate-pulse rounded-2xl bg-zinc-100" />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-5 px-4 pb-10 pt-6 sm:px-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">Favoritos</p>
        <h1 className="text-2xl font-black text-zinc-950">Tus negocios guardados</h1>
        <p className="text-sm text-zinc-600">Abre una ficha o quita elementos que ya no quieras en tu lista.</p>
      </header>

      {errorMessage ? (
        <section className="rounded-[22px] bg-rose-50 p-4 text-rose-900 ring-1 ring-rose-200">
          <div className="flex items-start gap-2">
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-sm">{errorMessage}</p>
          </div>
          <Button className="mt-3" onClick={loadFavorites}>
            Reintentar
          </Button>
        </section>
      ) : null}

      {!isLoading && items.length === 0 ? (
        <section className="rounded-[22px] bg-white p-5 text-center shadow-soft ring-1 ring-black/5">
          <Heart className="mx-auto h-7 w-7 text-zinc-400" />
          <h2 className="mt-2 text-lg font-bold text-zinc-950">Aun no guardas favoritos</h2>
          <p className="mt-1 text-sm text-zinc-600">Explora el catalogo y guarda negocios para revisarlos despues.</p>
          <Button asChild className="mt-4">
            <Link href="/">Volver a explorar</Link>
          </Button>
        </section>
      ) : null}

      {items.length > 0 ? (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.business_id}
              className="flex flex-col gap-3 rounded-[22px] bg-white p-4 shadow-soft ring-1 ring-black/5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-base font-bold text-zinc-950">{item.name}</p>
                <p className="text-sm text-zinc-600">{item.zone ?? "Zona no especificada"}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild variant="secondary" size="sm">
                  <Link href={`/businesses/${item.slug}`}>Ver ficha</Link>
                </Button>
                <Button size="sm" onClick={() => handleRemove(item.business_id)}>
                  Quitar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}
