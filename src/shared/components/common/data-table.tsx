import { ReactNode } from "react";
import { cn } from "@/shared/utils/cn.util";

export function DataTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-900">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-4 py-3 font-bold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-4 font-medium">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Pagination() {
  return (
    <div className="flex items-center justify-end gap-2">
      {[1, 2, 3].map((page) => (
        <button
          key={page}
          className={cn(
            "size-9 rounded-md border text-sm font-bold",
            page === 1
              ? "border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950"
              : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950",
          )}
        >
          {page}
        </button>
      ))}
    </div>
  );
}
