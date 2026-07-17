"use client";

import { motion } from "motion/react";

export function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className="glass-surface elevation-md rounded-2xl p-6"
    >
      {children}
    </motion.div>
  );
}
