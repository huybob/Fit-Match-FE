import { SelectHTMLAttributes } from "react";
import { cn } from "@/shared/utils/cn.util";

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 rounded-xl border border-[#d6d8c6] bg-white/90 px-3.5 text-sm font-semibold text-[#10130f] shadow-sm outline-none transition hover:border-[#b9bda8] focus:border-[#88d900] focus:ring-4 focus:ring-[#a3ff12]/20 dark:border-white/10 dark:bg-[#121610] dark:text-white",
        className,
      )}
      {...props}
    />
  );
}
