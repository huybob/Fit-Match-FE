"use client";

import * as React from "react";
import { type FieldError } from "react-hook-form";
import { Label } from "@/shared/components/ui/label";
import { cn } from "@/shared/utils/cn.util";

export function FieldShell({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: FieldError | { message?: string };
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label>{label}</Label>
      {children}
      {error?.message && (
        <p role="alert" aria-live="polite" className="text-xs font-semibold text-destructive">
          {error.message}
        </p>
      )}
    </div>
  );
}

export const inputClassName = cn(
  "flex h-11 w-full rounded-xl border border-input bg-card/90 px-3.5 text-sm font-semibold text-foreground shadow-sm outline-none transition",
  "placeholder:font-medium placeholder:text-muted-foreground",
  "hover:border-ring/50 focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/20",
  "disabled:cursor-not-allowed disabled:opacity-60",
);

export const selectClassName = cn(inputClassName, "cursor-pointer");
