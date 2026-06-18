import { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      className={`rounded-md border border-[#dedfce] bg-white px-3 py-2 text-sm outline-none transition focus:border-[#a3ff12] focus:ring-2 focus:ring-[#a3ff12]/30 dark:border-white/10 dark:bg-[#121610] ${className}`}
      {...props}
    />
  );
}
