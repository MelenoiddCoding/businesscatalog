"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CircleUserRound, TriangleAlert } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { ApiRequestError, type UserProfile, getMyProfile } from "@/lib/api";
import { buildRedirectPath } from "@/lib/auth-redirect";

export default function ProfilePage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();
  const pathname = usePathname();
  const { isReady, isAuthenticated, logout, runWithSession } = useAuth();

  const redirectPath = buildRedirectPath(pathname);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await runWithSession((accessToken) => getMyProfile(apiUrl, accessToken));
      setProfile(data);
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) {
        router.replace(`/auth?redirect=${encodeURIComponent(redirectPath)}`);
        return;
      }

      setErrorMessage(error instanceof Error ? error.message : "No pudimos cargar tu perfil.");
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

    loadProfile();
  }, [isAuthenticated, isReady, loadProfile, redirectPath, router]);

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  if (!isReady || isLoading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-4 px-4 pb-10 pt-6 sm:px-6">
        <div className="h-8 w-36 animate-pulse rounded bg-zinc-100" />
        <div className="h-32 w-full animate-pulse rounded-2xl bg-zinc-100" />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-5 px-4 pb-10 pt-6 sm:px-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">Perfil</p>
        <h1 className="text-2xl font-black text-zinc-950">Tu cuenta</h1>
        <p className="text-sm text-zinc-600">En B2 el perfil es solo de lectura.</p>
      </header>

      {errorMessage ? (
        <section className="rounded-[22px] bg-rose-50 p-4 text-rose-900 ring-1 ring-rose-200">
          <div className="flex items-start gap-2">
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-sm">{errorMessage}</p>
          </div>
          <Button className="mt-3" onClick={loadProfile}>
            Reintentar
          </Button>
        </section>
      ) : null}

      {profile ? (
        <section className="rounded-[24px] bg-white p-5 shadow-soft ring-1 ring-black/5">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-zinc-100 text-zinc-600">
              <CircleUserRound className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-black text-zinc-950">{profile.name}</p>
              <p className="text-sm text-zinc-600">{profile.email}</p>
            </div>
          </div>

          <dl className="mt-5 grid gap-3 text-sm">
            <div>
              <dt className="font-semibold text-zinc-900">Telefono</dt>
              <dd className="text-zinc-600">{profile.phone ?? "No registrado"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-zinc-900">Miembro desde</dt>
              <dd className="text-zinc-600">{formatDate(profile.created_at)}</dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link href="/favorites">Ver favoritos</Link>
            </Button>
            <Button onClick={handleLogout}>Cerrar sesion</Button>
          </div>
        </section>
      ) : null}
    </main>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(date);
}
