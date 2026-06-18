import { SelectHTMLAttributes } from "react";
import { cn } from "@/shared/utils/cn.util";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 rounded-md border border-[#dedfce] bg-white px-3 text-sm font-semibold text-[#10130f] outline-none transition focus:border-[#a3ff12] focus:ring-2 focus:ring-[#a3ff12]/30 dark:border-white/10 dark:bg-[#121610] dark:text-white",
        className,
      )}
      {...props}
    />
  );
}
