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
          className="relative h-48 overflow-hidden rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
          style={{ animationDelay: `${index * 90}ms` }}
        >
          <div className="h-full animate-pulse space-y-4">
            <div className="h-24 rounded-xl bg-gradient-to-br from-zinc-200 via-zinc-100 to-zinc-200 dark:from-zinc-800 dark:via-zinc-900 dark:to-zinc-800" />
            <div className="h-4 w-2/3 rounded-full bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-3 w-full rounded-full bg-zinc-100 dark:bg-zinc-900" />
          </div>
          <span
            className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent motion-reduce:hidden dark:via-white/10"
            style={{
              animation: "shimmer 1.8s ease-in-out infinite",
              animationDelay: `${index * 200}ms`,
            }}
          />
        </div>
      ))}
      <style>{`@keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }`}</style>
    </div>
  );
}
