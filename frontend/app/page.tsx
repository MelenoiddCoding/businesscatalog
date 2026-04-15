import type { ReactNode } from "react";
import { ShieldCheck, Sparkles, MapPinned, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getApiHealth } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const appEnvironment = process.env.NEXT_PUBLIC_APP_ENV ?? "local";
  const health = await getApiHealth(apiUrl);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-10 pt-4 sm:max-w-6xl sm:px-6 lg:px-8">
      <header className="flex items-center justify-between pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">
            Tepic Catalog
          </p>
          <h1 className="text-2xl font-black tracking-tight text-zinc-950 sm:text-4xl">
            Discover local businesses without friction.
          </h1>
        </div>
        <div className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-brand-700 shadow-soft ring-1 ring-black/5">
          {appEnvironment}
        </div>
      </header>

      <section className="relative overflow-hidden rounded-[28px] bg-zinc-950 p-5 text-white shadow-soft sm:p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/40 via-transparent to-transparent" />
        <div className="relative space-y-5">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
              Mobile-first
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
              Desktop-friendly
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
              Vercel + Render
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
              {appEnvironment}
            </span>
          </div>

          <p className="max-w-sm text-sm leading-6 text-zinc-200">
            This scaffold is wired to the backend URL through{" "}
            <code className="mx-1 rounded bg-white/10 px-1.5 py-0.5 text-[0.78rem]">
              NEXT_PUBLIC_API_URL
            </code>{" "}
            so the same frontend can run locally, in preview, and in production.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button className="bg-brand-500 text-white hover:bg-brand-600">
              Start exploring
            </Button>
            <Button variant="secondary" className="bg-white/10 text-white hover:bg-white/15">
              Review architecture
            </Button>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <StatusCard
          icon={<ShieldCheck className="h-5 w-5 text-brand-600" />}
          title="Backend health"
          value={health.ok ? "Connected" : "Waiting"}
          detail={health.message}
        />
        <StatusCard
          icon={<MapPinned className="h-5 w-5 text-brand-600" />}
          title="Deployment target"
          value="Vercel frontend"
          detail="Render API + Render Postgres are separate services."
        />
      </section>

      <section className="mt-6 grid gap-4">
        <FeatureRow
          icon={<Sparkles className="h-5 w-5" />}
          title="Why this is deployable"
          detail="The frontend only depends on API URL, and the backend reads DATABASE_URL from the environment."
        />
        <FeatureRow
          icon={<Store className="h-5 w-5" />}
          title="Agent-friendly structure"
          detail="Each layer has a dedicated manifest and docs, so later agents can work without guessing ownership."
        />
      </section>
    </main>
  );
}

function StatusCard({
  icon,
  title,
  value,
  detail
}: {
  icon: ReactNode;
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-[24px] bg-white p-4 shadow-soft ring-1 ring-black/5">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-50">{icon}</div>
        <div>
          <p className="text-sm font-semibold text-zinc-500">{title}</p>
          <p className="text-lg font-black text-zinc-950">{value}</p>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-zinc-600">{detail}</p>
    </article>
  );
}

function FeatureRow({
  icon,
  title,
  detail
}: {
  icon: ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <article className="rounded-[24px] bg-white p-4 shadow-soft ring-1 ring-black/5">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700">
          {icon}
        </div>
        <div>
          <h2 className="text-base font-extrabold text-zinc-950">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-600">{detail}</p>
        </div>
      </div>
    </article>
  );
}
