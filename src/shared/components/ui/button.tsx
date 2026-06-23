import { ButtonHTMLAttributes } from "react";
import { cn } from "@/shared/utils/cn.util";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ className = "", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "group/btn relative inline-flex h-11 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#10130f] px-5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#24291f] hover:shadow-lg hover:shadow-[#10130f]/15 active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a3ff12] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-sm dark:bg-[#a3ff12] dark:text-[#10130f] dark:hover:bg-[#b7ff3d] dark:hover:shadow-[#a3ff12]/25",
        className,
      )}
      {...props}
    />
  );
}
