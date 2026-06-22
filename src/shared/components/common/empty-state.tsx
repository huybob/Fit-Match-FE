import { Dumbbell } from "lucide-react";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 bg-gradient-to-br from-white to-zinc-50 p-10 text-center shadow-sm dark:border-zinc-800 dark:from-zinc-950 dark:to-zinc-900/70">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-lime-300/20 text-lime-700 dark:text-lime-300">
        <Dumbbell className="size-7" />
      </span>
      <h3 className="mt-4 text-lg font-bold">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
        {description}
      </p>
    </div>
  );
}
