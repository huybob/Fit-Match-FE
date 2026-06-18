import { HTMLAttributes } from "react";
import { cn } from "@/shared/utils/cn.util";

type BadgeProps = HTMLAttributes<HTMLDivElement>;

export function Badge({ className, ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-[#dedfce] bg-white/80 px-3 py-1 text-xs font-bold text-[#505647] shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-[#d8dcc6]",
        className,
      )}
      {...props}
    />
  );
}
