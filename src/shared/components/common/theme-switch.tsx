"use client";

import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useThemeMode } from "@/lib/theme-provider";
import { Button } from "@/shared/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/utils/cn.util";

/** Nút chuyển sáng/tối — accessible (aria-label + aria-pressed) + tooltip. */
export function ThemeSwitch({ className }: { className?: string }) {
  const t = useTranslations();
  const { theme, toggleTheme } = useThemeMode();
  const isDark = theme === "dark";
  const label = isDark ? t("common.theme.toLight") : t("common.theme.toDark");

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={toggleTheme}
          aria-label={label}
          aria-pressed={isDark}
          className={cn("cursor-pointer text-muted-foreground", className)}
        >
          {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{isDark ? t("common.theme.light") : t("common.theme.dark")}</TooltipContent>
    </Tooltip>
  );
}
