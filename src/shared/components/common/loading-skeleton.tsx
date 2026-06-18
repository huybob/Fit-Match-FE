export function LoadingSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="h-48 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800"
        />
      ))}
    </div>
  );
}
