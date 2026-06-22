import { HTMLAttributes } from "react";
import { cn } from "@/shared/utils/cn.util";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[#dedfce]/90 bg-white text-[#10130f] shadow-[0_8px_24px_rgba(16,19,15,0.06)] dark:border-white/10 dark:bg-[#121610] dark:text-[#f5f5ed] dark:shadow-[0_12px_32px_rgba(0,0,0,0.22)]",
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
