import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
        Next.js App Router
      </p>
      <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-slate-950 sm:text-6xl">
        Clean Architecture, feature-first, ready for enterprise modules.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
        Project skeleton with domain entities, DTOs, repositories, use cases,
        API clients, hooks, validation, shared contracts, and infrastructure
        adapters.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/users"
          className="rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Open User Module
        </Link>
        <a
          href="https://nextjs.org/docs/app"
          className="rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-white"
        >
          App Router Docs
        </a>
      </div>
    </main>
  );
}
