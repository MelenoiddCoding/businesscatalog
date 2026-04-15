"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { ApiRequestError } from "@/lib/api";
import { sanitizeRedirectPath } from "@/lib/auth-redirect";

type AuthMode = "login" | "register";

export default function AuthPage() {
  const router = useRouter();
  const { isReady, isAuthenticated, login, register } = useAuth();

  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getRedirectTarget = () => {
    if (typeof window === "undefined") {
      return "/";
    }

    const params = new URLSearchParams(window.location.search);
    return sanitizeRedirectPath(params.get("redirect"));
  };

  useEffect(() => {
    if (isReady && isAuthenticated) {
      router.replace(getRedirectTarget());
    }
  }, [isAuthenticated, isReady, router]);

  const submitAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      if (mode === "login") {
        await login({
          email: email.trim().toLowerCase(),
          password
        });
      } else {
        await register({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone: phone.trim() || undefined
        });
      }

      router.replace(getRedirectTarget());
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setErrorMessage(error.message);
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("No pudimos completar la autenticacion.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-5 px-4 pb-10 pt-6 sm:px-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">Cuenta</p>
        <h1 className="text-2xl font-black tracking-tight text-zinc-950">Accede para guardar favoritos</h1>
        <p className="text-sm text-zinc-600">
          B2 incluye registro, inicio de sesion, persistencia y cierre de sesion.
        </p>
      </header>

      <section className="rounded-[24px] bg-white p-5 shadow-soft ring-1 ring-black/5">
        <div className="mb-4 grid grid-cols-2 gap-2 rounded-full bg-zinc-100 p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={[
              "rounded-full px-3 py-2 text-sm font-semibold transition",
              mode === "login" ? "bg-zinc-950 text-white" : "text-zinc-700 hover:bg-zinc-200"
            ].join(" ")}
          >
            Iniciar sesion
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={[
              "rounded-full px-3 py-2 text-sm font-semibold transition",
              mode === "register" ? "bg-zinc-950 text-white" : "text-zinc-700 hover:bg-zinc-200"
            ].join(" ")}
          >
            Registro
          </button>
        </div>

        <form className="space-y-3" onSubmit={submitAuth}>
          {mode === "register" ? (
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">Nombre</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                minLength={2}
                className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm text-zinc-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
              />
            </label>
          ) : null}

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">Email</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              autoComplete="email"
              className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm text-zinc-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">Password</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm text-zinc-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            />
          </label>

          {mode === "register" ? (
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
                Telefono (opcional)
              </span>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                type="tel"
                autoComplete="tel"
                className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm text-zinc-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
              />
            </label>
          ) : null}

          {errorMessage ? (
            <p className="rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-800 ring-1 ring-rose-200">{errorMessage}</p>
          ) : null}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Procesando..." : mode === "login" ? "Entrar" : "Crear cuenta"}
          </Button>
        </form>
      </section>

      <div className="text-sm text-zinc-600">
        <Button asChild variant="ghost" size="sm">
          <Link href="/">Volver al catalogo publico</Link>
        </Button>
      </div>
    </main>
  );
}
