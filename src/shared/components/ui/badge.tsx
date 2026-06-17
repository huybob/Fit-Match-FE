import { HTMLAttributes } from "react";
import { cn } from "@/shared/utils/cn.util";

type BadgeProps = HTMLAttributes<HTMLDivElement>;

export function Badge({ className, ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700 shadow-sm",
        className,
      )}
      {...props}
    />
  );
}
