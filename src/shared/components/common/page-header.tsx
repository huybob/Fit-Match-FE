import * as React from "react";
import { cn } from "@/shared/utils/cn.util";

export function PageHeader({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative mb-6 overflow-hidden rounded-3xl border border-border bg-card/80 p-6 shadow-sm sm:p-7",
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-10 -top-16 size-40 rounded-full bg-primary/20 blur-3xl" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2">
            {icon && <span className="text-primary">{icon}</span>}
            <div className="h-1 w-10 rounded-full bg-accent" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">{title}</h1>
          {description && (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </section>
  );
}
