import { ButtonHTMLAttributes } from "react";
import { cn } from "@/shared/utils/cn.util";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ className = "", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#10130f] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#24291f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a3ff12] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#a3ff12] dark:text-[#10130f] dark:hover:bg-[#b7ff3d]",
        className,
      )}
      {...props}
    />
  );
}
