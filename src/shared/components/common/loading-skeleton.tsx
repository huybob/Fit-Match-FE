export function LoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="h-48 overflow-hidden rounded-2xl border border-zinc-200/70 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="h-full animate-pulse space-y-4">
            <div className="h-24 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-2/3 rounded-full bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-3 w-full rounded-full bg-zinc-100 dark:bg-zinc-900" />
          </div>
        </div>
      ))}
    </div>
  );
}
