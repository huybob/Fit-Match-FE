"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  Info,
  Loader2,
  TriangleAlert,
  X,
  XCircle,
} from "lucide-react";
import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/utils/cn.util";

type ToastType = "success" | "error" | "warning" | "info" | "loading";
type ToastInput = {
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
};
type Toast = ToastInput & { id: string };

const ToastContext = createContext<{
  toast: (toast: ToastInput) => string;
  dismiss: (id: string) => void;
}>({ toast: () => "", dismiss: () => undefined });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { t } = useTranslation();

  const api = useMemo(
    () => ({
      toast: (input: ToastInput) => {
        const id = crypto.randomUUID();
        setToasts((items) => [...items.slice(-3), { ...input, id }]);
        if (input.type !== "loading")
          window.setTimeout(
            () => setToasts((items) => items.filter((item) => item.id !== id)),
            input.duration ?? 4200,
          );
        return id;
      },
      dismiss: (id: string) =>
        setToasts((items) => items.filter((item) => item.id !== id)),
    }),
    [],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 top-4 z-[110] ml-auto flex max-w-sm flex-col gap-3 sm:inset-x-auto sm:right-5 sm:top-5 sm:w-full"
      >
        <AnimatePresence initial={false}>
          {toasts.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              role={item.type === "error" ? "alert" : "status"}
              className={cn(
                "pointer-events-auto relative overflow-hidden rounded-2xl border bg-white/95 p-4 shadow-2xl shadow-zinc-950/15 backdrop-blur-xl dark:bg-zinc-950/95",
                item.type === "success" &&
                  "border-emerald-200 dark:border-emerald-900",
                item.type === "error" && "border-red-200 dark:border-red-900",
                item.type === "warning" &&
                  "border-orange-200 dark:border-orange-900",
                item.type === "info" && "border-blue-200 dark:border-blue-900",
              )}
            >
              <div className="flex gap-3">
                <ToastIcon type={item.type} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-zinc-950 dark:text-white">
                    {item.title}
                  </p>
                  {item.description && (
                    <p className="mt-1 text-sm leading-5 text-zinc-600 dark:text-zinc-300">
                      {item.description}
                    </p>
                  )}
                </div>
                <button
                  aria-label={t("common.close")}
                  className="grid size-8 place-items-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-white"
                  onClick={() => api.dismiss(item.id)}
                >
                  <X className="size-4" />
                </button>
              </div>
              {item.type !== "loading" && (
                <motion.span
                  className={cn(
                    "absolute inset-x-0 bottom-0 h-1 origin-left",
                    item.type === "success" && "bg-emerald-500",
                    item.type === "error" && "bg-red-500",
                    item.type === "warning" && "bg-orange-500",
                    item.type === "info" && "bg-blue-500",
                  )}
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{
                    duration: (item.duration ?? 4200) / 1000,
                    ease: "linear",
                  }}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function ToastIcon({ type }: { type: ToastType }) {
  const className = cn(
    "mt-0.5 size-5 shrink-0",
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
