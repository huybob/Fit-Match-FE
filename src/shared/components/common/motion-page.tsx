"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

export function MotionPage({ children }: { children: ReactNode }) {
  return (
    <motion.div
      className="flex-1 motion-reduce:transform-none motion-reduce:opacity-100"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.32,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
