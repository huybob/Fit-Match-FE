"use client";

import { Moon, Sun } from "lucide-react";
import { useThemeMode } from "@/lib/theme-provider";
import { cn } from "@/shared/utils/cn.util";

/** Nút chuyển sáng/tối — accessible (aria-label + aria-pressed). */
export function ThemeSwitch({ className }: { className?: string }) {
  const { theme, toggleTheme } = useThemeMode();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
      aria-pressed={isDark}
      title={isDark ? "Giao diện sáng" : "Giao diện tối"}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
