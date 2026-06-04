export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header skeleton */}
      <div className="sticky top-0 z-30 border-b border-black/10 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 sm:px-6 lg:px-8">
          <div className="h-9 w-24 animate-pulse rounded-md bg-slate-200" />
          <div className="hidden items-center gap-4 md:flex">
            <div className="h-4 w-14 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-14 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-14 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-14 animate-pulse rounded bg-slate-200" />
          </div>
          <div className="h-9 w-28 animate-pulse rounded-full bg-slate-200" />
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
        {/* Hero skeleton */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
          <div className="mt-4 h-10 w-full max-w-xl animate-pulse rounded bg-slate-200" />
          <div className="mt-3 h-4 w-full max-w-3xl animate-pulse rounded bg-slate-200" />
          <div className="mt-2 h-4 w-full max-w-2xl animate-pulse rounded bg-slate-200" />
          <div className="mt-8 flex gap-3">
            <div className="h-10 w-40 animate-pulse rounded-full bg-slate-200" />
            <div className="h-10 w-40 animate-pulse rounded-full bg-slate-200" />
          </div>
        </section>

        {/* Grid skeleton */}
        <section className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <article key={index} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="h-40 animate-pulse rounded-xl bg-slate-200" />
              <div className="mt-4 h-5 w-3/4 animate-pulse rounded bg-slate-200" />
              <div className="mt-2 h-4 w-full animate-pulse rounded bg-slate-200" />
              <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-slate-200" />
              <div className="mt-5 h-9 w-32 animate-pulse rounded-full bg-slate-200" />
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
