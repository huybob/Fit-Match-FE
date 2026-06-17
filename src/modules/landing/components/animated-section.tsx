"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/shared/utils/cn.util";

type AnimatedSectionProps = {
  children: ReactNode;
  className?: string;
  id?: string;
};

export function AnimatedSection({
  children,
  className,
  ...props
}: AnimatedSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-120px" }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className={cn("px-4 py-16 sm:px-6 lg:px-8 lg:py-24", className)}
      {...props}
    >
      {children}
    </motion.section>
  );
}
