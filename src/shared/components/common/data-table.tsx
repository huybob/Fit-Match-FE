import { ReactNode } from "react";
import { Button } from "@/shared/components/ui/button";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Separator } from "@/shared/components/ui/separator";
import { cn } from "@/shared/utils/cn.util";

export function DataTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <ScrollArea>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-muted/60">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column}
                    className="px-5 py-4 text-[11px] font-black uppercase tracking-wider text-muted-foreground"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="transition-colors hover:bg-primary/5"
                >
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-5 py-4 font-medium text-foreground">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ScrollArea>
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}) {
  const current = page ?? 0;
  const total = totalPages ?? 1;

  return (
    <div className="flex items-center justify-end gap-2">
      {Array.from({ length: total }, (_, i) => (
        <Button
          key={i}
          type="button"
          variant={i === current ? "default" : "outline"}
          size="icon-sm"
          className={cn(i === current && "pointer-events-none")}
          onClick={() => onPageChange?.(i)}
        >
          {i + 1}
        </Button>
      ))}
    </div>
  );
}

export { Separator as TableSeparator };
