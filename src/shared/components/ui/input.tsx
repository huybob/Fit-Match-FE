import { InputHTMLAttributes } from "react";
import { cn } from "@/shared/utils/cn.util";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-[#d6d8c6] bg-white/90 px-3.5 text-sm font-semibold text-[#10130f] shadow-sm outline-none transition placeholder:font-medium placeholder:text-[#858a78] hover:border-[#b9bda8] focus:border-[#88d900] focus:ring-4 focus:ring-[#a3ff12]/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-[#121610] dark:text-white",
        className,
      )}
      {...props}
    />
  );
}
