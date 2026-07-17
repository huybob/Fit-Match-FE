"use client";

import { motion } from "framer-motion";
import { Dumbbell, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Trạng thái rỗng dùng chung (Bước 12). Token-based (dark-mode đúng), icon theo
 * ngữ cảnh và slot action tùy chọn để mời người dùng thao tác tiếp.
 */
export function EmptyState({
  title,
  description,
  icon: Icon = Dumbbell,
  action,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-dashed border-border bg-gradient-to-br from-card via-muted/30 to-muted/10 p-10 text-center shadow-sm"
    >
      <motion.span
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary shadow-inner motion-reduce:animate-none"
      >
        <Icon className="size-7" />
      </motion.span>
      <h3 className="mt-4 text-lg font-black text-foreground">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </motion.div>
  );
}
