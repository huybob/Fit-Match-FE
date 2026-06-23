import { HTMLAttributes } from "react";
import { cn } from "@/shared/utils/cn.util";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "group/card relative rounded-2xl border border-[#dedfce]/90 bg-white text-[#10130f] shadow-[0_8px_24px_rgba(16,19,15,0.06)] transition-all duration-300 hover:shadow-[0_18px_42px_rgba(16,19,15,0.12)] dark:border-white/10 dark:bg-[#121610] dark:text-[#f5f5ed] dark:shadow-[0_12px_32px_rgba(0,0,0,0.22)] dark:hover:shadow-[0_18px_42px_rgba(163,255,18,0.08)]",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6", className)} {...props} />;
}

export function CardContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}
