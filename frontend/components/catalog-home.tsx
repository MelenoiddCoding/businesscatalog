"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { LocateFixed, MapPin, Search, Star, Store, TriangleAlert } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { FavoriteToggleButton } from "@/components/favorite-toggle-button";
import { Button } from "@/components/ui/button";
import {
  type BusinessListItem,
  type BusinessesResponse,
  type CategoryItem,
  getBusinesses,
  getCategories
} from "@/lib/api";

const PAGE_SIZE = 20;

const EMPTY_BUSINESSES: BusinessesResponse = {
  items: [],
  pagination: {
    page: 1,
    page_size: PAGE_SIZE,
    total_items: 0,
    total_pages: 0
  }
};

type Coordinates = {
  lat: number;
  lng: number;
};

export function CatalogHome() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const { isReady, isAuthenticated, runWithSession } = useAuth();
  const [searchDraft, setSearchDraft] = useState("");
  const [zoneDraft, setZoneDraft] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [locationFilter, setLocationFilter] = useState<Coordinates | null>(null);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [page, setPage] = useState(1);
  const [retryTick, setRetryTick] = useState(0);

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const [businesses, setBusinesses] = useState<BusinessesResponse>(EMPTY_BUSINESSES);
  const [isBusinessesLoading, setIsBusinessesLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const requestSeq = useRef(0);

  useEffect(() => {
    let cancelled = false;

    if (!apiUrl) {
      setCategories([]);
      return;
    }

    const loadCategories = async () => {
      if (isReady && isAuthenticated) {
        return runWithSession((accessToken) => getCategories(apiUrl, accessToken));
      }

      return getCategories(apiUrl);
    };

    setIsCategoriesLoading(true);
    loadCategories()
      .then((items) => {
        if (!cancelled) {
          setCategories(items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCategories([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsCategoriesLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [apiUrl, isAuthenticated, isReady, runWithSession]);

  useEffect(() => {
    const currentRequest = requestSeq.current + 1;
    requestSeq.current = currentRequest;

    const loadBusinesses = async () => {
      const params = {
        q: searchDraft.trim() || undefined,
        category: selectedCategory || undefined,
        zone: zoneDraft.trim() || undefined,
        near_lat: locationFilter?.lat,
        near_lng: locationFilter?.lng,
        sort: locationFilter ? "distance" : "relevance",
        page,
        page_size: PAGE_SIZE
      } as const;

      if (isReady && isAuthenticated) {
        return runWithSession((accessToken) => getBusinesses(apiUrl, params, accessToken));
      }

      return getBusinesses(apiUrl, params);
    };

    setIsBusinessesLoading(true);
    setListError(null);

    loadBusinesses()
      .then((response) => {
        if (requestSeq.current === currentRequest) {
          setBusinesses(response);
        }
      })
      .catch((error: unknown) => {
        if (requestSeq.current === currentRequest) {
          const message =
            error instanceof Error
              ? error.message
              : "No pudimos cargar negocios por ahora. Intenta nuevamente.";
          setListError(message);
          setBusinesses(EMPTY_BUSINESSES);
        }
      })
      .finally(() => {
        if (requestSeq.current === currentRequest) {
          setIsBusinessesLoading(false);
        }
      });
  }, [
    apiUrl,
    isAuthenticated,
    isReady,
    locationFilter,
    page,
    retryTick,
    runWithSession,
    searchDraft,
    selectedCategory,
    zoneDraft
  ]);

  const zones = useMemo(() => {
    const unique = new Set<string>();

    for (const business of businesses.items) {
      if (business.zone) {
        unique.add(business.zone);
      }
    }

    if (zoneDraft.trim()) {
      unique.add(zoneDraft.trim());
    }

    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [businesses.items, zoneDraft]);

  const clearFilters = () => {
    setSearchDraft("");
    setZoneDraft("");
    setSelectedCategory("");
    setLocationFilter(null);
    setLocationMessage(null);
    setPage(1);
  };

  const applySearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setRetryTick((value) => value + 1);
  };

  const activateNearMe = () => {
    if (!navigator.geolocation) {
      setLocationMessage("Tu navegador no permite usar geolocalizacion.");
      return;
    }

    setIsLocating(true);
    setLocationMessage(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationFilter({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationMessage("Mostrando resultados por cercania.");
        setPage(1);
        setIsLocating(false);
      },
      () => {
        setLocationFilter(null);
        setLocationMessage("No pudimos acceder a tu ubicacion. Puedes continuar filtrando por zona.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const isEmpty = !isBusinessesLoading && !listError && businesses.items.length === 0;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-5 px-4 pb-10 pt-4 sm:px-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">Tepic Catalog</p>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="secondary">
              <Link href="/favorites">Favoritos</Link>
            </Button>
            {isReady && isAuthenticated ? (
              <Button asChild size="sm" variant="ghost">
                <Link href="/profile">Perfil</Link>
              </Button>
            ) : (
              <Button asChild size="sm">
                <Link href="/auth">Entrar</Link>
              </Button>
            )}
          </div>
        </div>
        <h1 className="text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">
          Descubre negocios locales en menos de dos toques
        </h1>
        <p className="text-sm text-zinc-600">
          Busca por texto, aplica filtros por categoria o zona, y explora resultados por cercania.
        </p>
      </header>

      <section className="rounded-[24px] bg-white p-4 shadow-soft ring-1 ring-black/5 sm:p-5">
        <form className="grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={applySearch}>
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Buscar negocio, categoria o producto"
              className="h-11 w-full rounded-full border border-zinc-200 bg-white pl-10 pr-4 text-sm text-zinc-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            />
          </label>
          <Button type="submit" className="w-full sm:w-auto">
            Buscar
          </Button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          <CategoryChip
            active={selectedCategory === ""}
            onClick={() => {
              setSelectedCategory("");
              setPage(1);
            }}
            label="Todas"
          />
          {isCategoriesLoading ? (
            <p className="text-sm text-zinc-500">Cargando categorias...</p>
          ) : (
            categories.map((category) => (
              <CategoryChip
                key={category.id}
                active={selectedCategory === category.slug}
                onClick={() => {
                  setSelectedCategory(category.slug);
                  setPage(1);
                }}
                label={category.name}
              />
            ))
          )}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">Zona</label>
            <input
              value={zoneDraft}
              onChange={(event) => {
                setZoneDraft(event.target.value);
                setPage(1);
              }}
              list="zone-suggestions"
              placeholder="Ej. Centro"
              className="mt-1 h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm text-zinc-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            />
            <datalist id="zone-suggestions">
              {zones.map((zone) => (
                <option key={zone} value={zone} />
              ))}
            </datalist>
          </div>

          <Button type="button" variant={locationFilter ? "default" : "secondary"} onClick={activateNearMe}>
            <LocateFixed className="h-4 w-4" />
            {isLocating ? "Ubicando..." : locationFilter ? "Cerca de mi activo" : "Cerca de mi"}
          </Button>

          <Button type="button" variant="ghost" onClick={clearFilters}>
            Limpiar filtros
          </Button>
        </div>

        {locationMessage ? <p className="mt-3 text-sm text-zinc-600">{locationMessage}</p> : null}
      </section>

      <section className="space-y-3">
        {isBusinessesLoading ? <LoadingState /> : null}

        {listError ? (
          <article className="rounded-[22px] bg-rose-50 p-4 text-rose-900 ring-1 ring-rose-200">
            <div className="flex items-start gap-2">
              <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">No pudimos cargar el catalogo publico.</p>
                <p className="mt-1 text-sm">{listError}</p>
              </div>
            </div>
            <Button className="mt-4" onClick={() => setRetryTick((value) => value + 1)}>
              Reintentar
            </Button>
          </article>
        ) : null}

        {isEmpty ? (
          <article className="rounded-[22px] bg-white p-5 text-center shadow-soft ring-1 ring-black/5">
            <h2 className="text-lg font-bold text-zinc-950">No encontramos negocios con esos filtros</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Limpia la busqueda, cambia categoria o prueba otra zona para seguir explorando.
            </p>
            <Button className="mt-4" onClick={clearFilters}>
              Limpiar y explorar
            </Button>
          </article>
        ) : null}

        {!isBusinessesLoading && !listError && businesses.items.length > 0 ? (
          <>
            <p className="text-sm font-medium text-zinc-600">
              {businesses.pagination.total_items} resultados en pagina {businesses.pagination.page}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {businesses.items.map((business) => (
                <BusinessCard key={business.id} business={business} />
              ))}
            </div>

            <footer className="flex items-center justify-between rounded-[18px] bg-white p-3 ring-1 ring-black/5">
              <Button
                variant="secondary"
                disabled={businesses.pagination.page <= 1}
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
              >
                Anterior
              </Button>
              <span className="text-sm text-zinc-600">
                Pagina {businesses.pagination.page} de {Math.max(businesses.pagination.total_pages, 1)}
              </span>
              <Button
                variant="secondary"
                disabled={
                  businesses.pagination.total_pages <= 0 ||
                  businesses.pagination.page >= businesses.pagination.total_pages
                }
                onClick={() => setPage((current) => current + 1)}
              >
                Siguiente
              </Button>
            </footer>
          </>
        ) : null}
      </section>
    </main>
  );
}

function CategoryChip({
  active,
  label,
  onClick
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full border px-4 py-2 text-sm font-semibold transition",
        active
          ? "border-brand-500 bg-brand-500 text-white"
          : "border-zinc-200 bg-white text-zinc-700 hover:border-brand-200 hover:bg-brand-50"
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function BusinessCard({ business }: { business: BusinessListItem }) {
  return (
    <article className="relative overflow-hidden rounded-[22px] bg-white shadow-soft ring-1 ring-black/5 transition hover:shadow-lg">
      <div className="absolute right-3 top-3 z-10">
        <FavoriteToggleButton
          businessId={business.id}
          businessName={business.name}
          initialIsFavorited={business.is_favorited}
          compact
        />
      </div>

      <Link
        href={`/businesses/${business.slug}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        aria-label={`Ver ficha de ${business.name}`}
      >
        {business.cover_image_url ? (
          <img src={business.cover_image_url} alt={business.name} className="h-36 w-full object-cover" />
        ) : (
          <div className="grid h-36 place-items-center bg-gradient-to-br from-brand-100 via-brand-50 to-white text-zinc-500">
            <Store className="h-8 w-8" />
          </div>
        )}

        <div className="space-y-3 p-4">
          <header>
            <h2 className="line-clamp-1 text-base font-black text-zinc-950">{business.name}</h2>
            <p className="line-clamp-2 text-sm text-zinc-600">
              {business.description ?? "Sin descripcion disponible por ahora."}
            </p>
          </header>

          <div className="flex flex-wrap gap-1.5">
            {business.categories.length > 0 ? (
              business.categories.map((category) => (
                <span key={category} className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
                  {category}
                </span>
              ))
            ) : (
              <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-500">
                Sin categoria
              </span>
            )}
          </div>

          <dl className="space-y-1 text-sm text-zinc-600">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-zinc-400" />
              <dd className="line-clamp-1">{business.zone ?? business.address ?? "Zona no especificada"}</dd>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              <dd>
                {formatRating(business.rating_avg, business.rating_count)}
                {business.distance_m !== null ? ` - ${formatDistance(business.distance_m)}` : ""}
              </dd>
            </div>
          </dl>

          <p className="text-sm font-semibold text-brand-700">Ver ficha</p>
        </div>
      </Link>
    </article>
  );
}

function LoadingState() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-[22px] bg-white ring-1 ring-black/5">
          <div className="h-36 animate-pulse bg-zinc-100" />
          <div className="space-y-2 p-4">
            <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-100" />
            <div className="h-3 w-full animate-pulse rounded bg-zinc-100" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-zinc-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function formatDistance(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)} km`;
  }

  return `${Math.round(value)} m`;
}

function formatRating(rating: number | null, count: number | null): string {
  if (rating === null || count === null || count <= 0) {
    return "Sin calificaciones";
  }

  return `${rating.toFixed(1)} (${count})`;
}
