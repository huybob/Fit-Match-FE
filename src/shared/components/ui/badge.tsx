import { HTMLAttributes } from "react";
import { cn } from "@/shared/utils/cn.util";

type BadgeProps = HTMLAttributes<HTMLDivElement>;

export function Badge({ className, ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-[#dedfce] bg-white/85 px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-[#505647] shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/10 dark:text-[#d8dcc6]",
        className,
      )}
      {...props}
    />
  );
}
