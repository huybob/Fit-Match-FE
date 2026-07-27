"use client";

import { Check, Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  LOCALES,
  LOCALE_LABELS,
  LOCALE_SHORT_LABELS,
  resolveLocale,
  type Locale,
} from "@/i18n/config";
import { setLocale } from "@/i18n/locale-action";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/utils/cn.util";

/**
 * Bộ chuyển ngôn ngữ. Ghi cookie rồi refresh để server render lại messages —
 * URL không thay đổi nên không ảnh hưởng luồng điều hướng hiện có.
 */
export function LocaleSwitch({
  className,
  showLabel = false,
}: {
  className?: string;
  showLabel?: boolean;
}) {
  const t = useTranslations();
  const current = resolveLocale(useLocale());
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function pick(next: Locale) {
    if (next === current) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size={showLabel ? "sm" : "icon-sm"}
              disabled={pending}
              aria-label={t("common.locale.switch")}
              className={cn("cursor-pointer gap-1.5 text-muted-foreground", className)}
            >
              <Languages className="size-4" />
              {showLabel ? (
                <span className="text-xs font-bold">{LOCALE_SHORT_LABELS[current]}</span>
              ) : (
                <span className="sr-only">{LOCALE_LABELS[current]}</span>
              )}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>{t("common.locale.switch")}</TooltipContent>
      </Tooltip>

      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuLabel>{t("common.locale.label")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LOCALES.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onSelect={() => pick(locale)}
            className="cursor-pointer justify-between gap-3"
          >
            <span>{LOCALE_LABELS[locale]}</span>
            {locale === current ? <Check className="size-4 text-primary" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
