export default function BusinessDetailLoading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-5 px-4 pb-10 pt-4 sm:px-6">
      <section className="rounded-[24px] bg-white p-4 shadow-soft ring-1 ring-black/5 sm:p-6">
        <div className="h-4 w-24 animate-pulse rounded bg-zinc-100" />
        <div className="mt-3 h-8 w-2/3 animate-pulse rounded bg-zinc-100" />
        <div className="mt-3 h-4 w-full animate-pulse rounded bg-zinc-100" />
        <div className="mt-2 h-4 w-4/5 animate-pulse rounded bg-zinc-100" />
        <div className="mt-4 h-11 w-full animate-pulse rounded-full bg-zinc-100 sm:w-64" />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-5">
          <div className="rounded-[22px] bg-white p-4 shadow-soft ring-1 ring-black/5 sm:p-5">
            <div className="h-6 w-28 animate-pulse rounded bg-zinc-100" />
            <div className="mt-3 h-40 w-full animate-pulse rounded-2xl bg-zinc-100" />
          </div>
          <div className="rounded-[22px] bg-white p-4 shadow-soft ring-1 ring-black/5 sm:p-5">
            <div className="h-6 w-28 animate-pulse rounded bg-zinc-100" />
            <div className="mt-3 h-16 w-full animate-pulse rounded-2xl bg-zinc-100" />
            <div className="mt-3 h-16 w-full animate-pulse rounded-2xl bg-zinc-100" />
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[22px] bg-white p-4 shadow-soft ring-1 ring-black/5 sm:p-5">
            <div className="h-6 w-28 animate-pulse rounded bg-zinc-100" />
            <div className="mt-3 h-4 w-full animate-pulse rounded bg-zinc-100" />
            <div className="mt-2 h-4 w-full animate-pulse rounded bg-zinc-100" />
          </div>
          <div className="rounded-[22px] bg-white p-4 shadow-soft ring-1 ring-black/5 sm:p-5">
            <div className="h-6 w-24 animate-pulse rounded bg-zinc-100" />
            <div className="mt-3 h-16 w-full animate-pulse rounded-2xl bg-zinc-100" />
          </div>
        </div>
      </section>
    </main>
  );
}
