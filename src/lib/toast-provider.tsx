"use client";

import { ReactNode } from "react";
import { toast as sonnerToast } from "sonner";
import { Toaster } from "@/shared/components/ui/sonner";

type ToastType = "success" | "error" | "warning" | "info" | "loading";
type ToastInput = {
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
};

export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster richColors closeButton />
    </>
  );
}

export function useToast() {
  const toast = (input: ToastInput): string => {
    const opts = {
      description: input.description,
      duration: input.type === "loading" ? Infinity : (input.duration ?? 4200),
    };
    const id = String(Date.now());
    switch (input.type) {
      case "success":
        sonnerToast.success(input.title, { ...opts, id });
        break;
      case "error":
        sonnerToast.error(input.title, { ...opts, id });
        break;
      case "warning":
        sonnerToast.warning(input.title, { ...opts, id });
        break;
      case "loading":
        sonnerToast.loading(input.title, { ...opts, id });
        break;
      default:
        sonnerToast.info(input.title, { ...opts, id });
    }
    return id;
  };

  const dismiss = (id: string) => sonnerToast.dismiss(id);

  return { toast, dismiss };
}
