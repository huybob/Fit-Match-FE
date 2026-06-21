"use client";

import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { CheckCircle2, Info, Loader2, TriangleAlert, X, XCircle } from "lucide-react";
import { cn } from "@/shared/utils/cn.util";

type ToastType = "success" | "error" | "warning" | "info" | "loading";

type Toast = {
  id: number;
  type: ToastType;
  title: string;
  description?: string;
};

const ToastContext = createContext<{
  toast: (toast: Omit<Toast, "id">) => void;
}>({
  toast: () => undefined,
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const api = useMemo(
    () => ({
      toast: (toast: Omit<Toast, "id">) => {
        const id = Date.now();
        setToasts((items) => [...items, { ...toast, id }]);
        if (toast.type !== "loading") {
          window.setTimeout(() => {
            setToasts((items) => items.filter((item) => item.id !== id));
          }, 3000);
        }
      },
    }),
    [],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed right-4 top-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="rounded-lg border border-zinc-200 bg-white p-4 shadow-xl shadow-zinc-950/10 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex gap-3">
              <ToastIcon type={toast.type} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-zinc-950 dark:text-white">
                  {toast.title}
                </p>
                {toast.description && (
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {toast.description}
                  </p>
                )}
              </div>
              <button
                onClick={() =>
                  setToasts((items) => items.filter((item) => item.id !== toast.id))
                }
                className="text-zinc-400 transition hover:text-zinc-700"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastIcon({ type }: { type: ToastType }) {
  const className = cn(
    "mt-0.5 size-5",
    type === "success" && "text-emerald-500",
    type === "error" && "text-red-500",
    type === "warning" && "text-orange-500",
    type === "info" && "text-blue-500",
    type === "loading" && "animate-spin text-zinc-500",
  );

  if (type === "success") return <CheckCircle2 className={className} />;
  if (type === "error") return <XCircle className={className} />;
  if (type === "warning") return <TriangleAlert className={className} />;
  if (type === "loading") return <Loader2 className={className} />;
  return <Info className={className} />;
}

export function useToast() {
  return useContext(ToastContext);
}
