import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock3, MapPin, MessageCircle, Star, Store } from "lucide-react";

import { FavoriteToggleButton } from "@/components/favorite-toggle-button";
import { Button } from "@/components/ui/button";
import {
  ApiRequestError,
  type BusinessDetail,
  type BusinessReview,
  getBusinessDetail,
  getBusinessReviews
} from "@/lib/api";

const DAY_LABELS: Record<string, string> = {
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miercoles",
  thursday: "Jueves",
  friday: "Viernes",
  saturday: "Sabado",
  sunday: "Domingo"
};

export default async function BusinessDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  let business: BusinessDetail;
  try {
    business = await getBusinessDetail(apiUrl, slug);
  } catch (error: unknown) {
    if (error instanceof ApiRequestError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  let reviews;
  try {
    reviews = await getBusinessReviews(apiUrl, slug, { page: 1, page_size: 20 });
  } catch (error: unknown) {
    if (error instanceof ApiRequestError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const whatsappUrl = buildWhatsAppUrl(
    business.whatsapp_number,
    business.name,
    business.categories[0]?.name ?? null
  );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-5 px-4 pb-10 pt-4 sm:px-6">
      <header className="space-y-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Volver al listado
          </Link>
        </Button>

        <section className="rounded-[24px] bg-white p-4 shadow-soft ring-1 ring-black/5 sm:p-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">Ficha de negocio</p>
            <h1 className="text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">{business.name}</h1>
            <p className="text-sm text-zinc-600">
              {business.description ?? "Sin descripcion disponible por ahora."}
            </p>

            <div className="flex flex-wrap gap-2">
              {business.categories.length > 0 ? (
                business.categories.map((category) => (
                  <span
                    key={category.slug}
                    className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700"
                  >
                    {category.name}
                  </span>
                ))
              ) : (
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-500">
                  Sin categoria
                </span>
              )}
            </div>

            <dl className="grid gap-2 text-sm text-zinc-600">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                <dd>{business.address ?? business.zone ?? "Direccion no disponible"}</dd>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" />
                <dd>{formatRating(business.rating_avg, business.rating_count)}</dd>
              </div>
            </dl>
          </div>

          <div className="mt-5">
            <div className="flex flex-wrap items-start gap-2">
              <FavoriteToggleButton
                businessId={business.id}
                businessName={business.name}
                initialIsFavorited={business.is_favorited}
              />

              {whatsappUrl ? (
                <Button asChild className="w-full sm:w-auto">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Contactar por WhatsApp a ${business.name}`}
                  >
                    <MessageCircle className="h-4 w-4" />
                    Contactar por WhatsApp
                  </a>
                </Button>
              ) : (
                <div className="space-y-2">
                  <Button disabled className="w-full sm:w-auto">
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp no disponible
                  </Button>
                  <p className="text-sm text-zinc-600">
                    Este negocio aun no tiene un numero valido para contacto por WhatsApp.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </header>

      <section className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <article className="space-y-5">
          <section className="rounded-[22px] bg-white p-4 shadow-soft ring-1 ring-black/5 sm:p-5">
            <h2 className="text-lg font-black text-zinc-950">Galeria</h2>
            {business.images.length > 0 ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {business.images.map((image, index) => (
                  <img
                    key={`${image.url}-${index}`}
                    src={image.url}
                    alt={`${business.name} imagen ${index + 1}`}
                    className="h-40 w-full rounded-2xl object-cover"
                  />
                ))}
              </div>
            ) : (
              <div className="mt-3 grid h-40 place-items-center rounded-2xl bg-gradient-to-br from-brand-100 via-brand-50 to-white text-zinc-500">
                <Store className="h-8 w-8" />
              </div>
            )}
          </section>

          <section className="rounded-[22px] bg-white p-4 shadow-soft ring-1 ring-black/5 sm:p-5">
            <h2 className="text-lg font-black text-zinc-950">Catalogo</h2>
            {business.products.length > 0 ? (
              <ul className="mt-3 space-y-3">
                {business.products.map((product) => (
                  <li key={product.id} className="rounded-2xl bg-zinc-50 p-3 ring-1 ring-zinc-200/60">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-zinc-900">{product.name}</p>
                        <p className="mt-1 text-sm text-zinc-600">
                          {product.description ?? "Sin descripcion disponible por ahora."}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-zinc-900">
                        {formatPrice(product.price, product.currency)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-zinc-600">Este negocio aun no tiene productos publicados.</p>
            )}
          </section>
        </article>

        <article className="space-y-5">
          <section className="rounded-[22px] bg-white p-4 shadow-soft ring-1 ring-black/5 sm:p-5">
            <h2 className="text-lg font-black text-zinc-950">Horarios</h2>
            <div className="mt-3 space-y-2">
              {formatOpeningHours(business.opening_hours).map((line) => (
                <div key={line.day} className="flex items-start gap-2 text-sm text-zinc-700">
                  <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                  <p>
                    <span className="font-semibold">{line.day}:</span> {line.schedule}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[22px] bg-white p-4 shadow-soft ring-1 ring-black/5 sm:p-5">
            <h2 className="text-lg font-black text-zinc-950">Resenas</h2>
            <p className="mt-1 text-sm text-zinc-600">
              {reviews.summary.rating_count} resenas publicadas - promedio {reviews.summary.rating_avg.toFixed(1)}
            </p>

            {reviews.items.length > 0 ? (
              <ul className="mt-3 space-y-3">
                {reviews.items.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-zinc-600">Este negocio aun no tiene resenas publicadas.</p>
            )}
          </section>
        </article>
      </section>
    </main>
  );
}

function ReviewCard({ review }: { review: BusinessReview }) {
  return (
    <li className="rounded-2xl bg-zinc-50 p-3 ring-1 ring-zinc-200/60">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-zinc-900">{review.author.name ?? "Cliente"}</p>
        <p className="text-sm font-semibold text-amber-600">{formatReviewStars(review.rating)}</p>
      </div>
      <p className="mt-2 text-sm text-zinc-700">{review.comment ?? "Sin comentario"}</p>
      <p className="mt-2 text-xs text-zinc-500">{formatDate(review.created_at)}</p>
    </li>
  );
}

function buildWhatsAppUrl(number: string | null, businessName: string, categoryName: string | null): string | null {
  if (!number) {
    return null;
  }

  const normalizedNumber = number.replace(/[^\d]/g, "");
  if (!normalizedNumber) {
    return null;
  }

  const categoryMessage = categoryName ? ` Me interesa ${categoryName.toLowerCase()}.` : "";
  const message = `Hola, vi ${businessName} en Tepic Catalog.${categoryMessage}`;
  return `https://wa.me/${normalizedNumber}?text=${encodeURIComponent(message)}`;
}

function formatReviewStars(rating: number): string {
  const safeRating = Math.max(1, Math.min(5, Math.round(rating)));
  return `${safeRating}/5`;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(date);
}

function formatPrice(price: number | null, currency: string | null): string {
  if (price === null) {
    return "Precio no disponible";
  }

  const resolvedCurrency = currency ?? "MXN";
  try {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: resolvedCurrency,
      maximumFractionDigits: 2
    }).format(price);
  } catch {
    return `${resolvedCurrency} ${price.toFixed(2)}`;
  }
}

function formatRating(rating: number | null, count: number | null): string {
  if (rating === null || count === null || count <= 0) {
    return "Sin calificaciones";
  }

  return `${rating.toFixed(1)} (${count})`;
}

function formatOpeningHours(openingHours: Record<string, Array<{ open: string; close: string }>>) {
  const dayOrder = Object.keys(DAY_LABELS);
  const rows = dayOrder.map((day) => {
    const ranges = openingHours[day] ?? [];
    const schedule = ranges.length > 0 ? ranges.map((entry) => `${entry.open}-${entry.close}`).join(", ") : "Cerrado";
    return { day: DAY_LABELS[day], schedule };
  });

  const hasAnyOpenSlot = rows.some((row) => row.schedule !== "Cerrado");
  if (!hasAnyOpenSlot) {
    return [{ day: "Horario", schedule: "Sin horarios disponibles por ahora." }];
  }

  return rows;
}
