"use client";

import { motion } from "framer-motion";
import { Dumbbell } from "lucide-react";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-dashed border-zinc-300 bg-gradient-to-br from-white via-zinc-50 to-lime-50/40 p-10 text-center shadow-sm"
    >
      <motion.span
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        className="mx-auto grid size-14 place-items-center rounded-2xl bg-lime-300/25 text-lime-700 shadow-inner motion-reduce:animate-none"
      >
        <Dumbbell className="size-7" />
      </motion.span>
      <h3 className="mt-4 text-lg font-black">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
        {description}
      </p>
    </motion.div>
  );
}
