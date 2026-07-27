"use client";

import * as React from "react";
import { format, isValid, parseISO } from "date-fns";
import { CalendarRange } from "lucide-react";
import { useTranslations } from "next-intl";
import type { DateRange } from "react-day-picker";
import { useDateFormats, useDateLocale } from "@/i18n/use-date-locale";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { cn } from "@/shared/utils/cn.util";
import { InlineClear } from "@/shared/components/ui/inline-clear";

export interface DateRangeValue {
  /** ISO "yyyy-MM-dd" hoặc null. */
  from: string | null;
  to: string | null;
}

export interface DateRangePickerProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  clearable?: boolean;
  minDate?: string;
  maxDate?: string;
  /** Số tháng hiển thị cạnh nhau (mặc định 2, tự co về 1 trên mobile). */
  numberOfMonths?: number;
  id?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
}

const parse = (value: string | null) => {
  if (!value) return undefined;
  const date = parseISO(value);
  return isValid(date) ? date : undefined;
};

/** Chọn khoảng ngày (từ — đến). Dùng cho các bộ lọc báo cáo, doanh thu. */
export function DateRangePicker({
  value,
  onChange,
  placeholder,
  className,
  disabled,
  clearable = true,
  minDate,
  maxDate,
  numberOfMonths = 2,
  id,
  "aria-label": ariaLabel,
  "aria-invalid": ariaInvalid,
}: DateRangePickerProps) {
  const t = useTranslations();
  const locale = useDateLocale();
  const formats = useDateFormats();
  const [open, setOpen] = React.useState(false);

  const from = parse(value.from);
  const to = parse(value.to);
  const hasValue = !!from || !!to;

  const label = React.useMemo(() => {
    if (from && to) {
      return `${format(from, formats.date, { locale })} — ${format(to, formats.date, { locale })}`;
    }
    if (from) return `${t("common.datetime.from")} ${format(from, formats.date, { locale })}`;
    if (to) return `${t("common.datetime.to")} ${format(to, formats.date, { locale })}`;
    return placeholder ?? t("common.datetime.dateRangePlaceholder");
  }, [from, to, formats.date, locale, placeholder, t]);

  function handleSelect(range: DateRange | undefined) {
    onChange({
      from: range?.from ? format(range.from, "yyyy-MM-dd") : null,
      to: range?.to ? format(range.to, "yyyy-MM-dd") : null,
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-label={ariaLabel ?? t("common.datetime.dateRangePlaceholder")}
          aria-invalid={ariaInvalid}
          className={cn(
            "h-11 w-full cursor-pointer justify-start gap-2 rounded-xl border-input bg-card/90 px-3.5 text-sm font-semibold shadow-sm transition hover:border-ring/50 hover:bg-card focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/20 aria-invalid:border-destructive aria-invalid:ring-destructive/20",
            !hasValue && "font-medium text-muted-foreground",
            className,
          )}
        >
          <CalendarRange className="size-4 shrink-0" />
          <span className="truncate">{label}</span>
          {clearable && hasValue && !disabled ? (
            <InlineClear
              label={t("common.actions.resetFilter")}
              onClear={() => onChange({ from: null, to: null })}
              size="md" className="ml-auto"
            />
          ) : null}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="range"
          locale={locale}
          autoFocus
          defaultMonth={from ?? to}
          selected={{ from, to }}
          // 2 tháng cạnh nhau trên desktop, 1 tháng trên mobile để không tràn ngang.
          numberOfMonths={numberOfMonths}
          className="max-sm:[&_.rdp-months]:flex-col"
          disabled={[
            ...(minDate ? [{ before: parseISO(minDate) }] : []),
            ...(maxDate ? [{ after: parseISO(maxDate) }] : []),
          ]}
          onSelect={handleSelect}
        />
        <div className="flex items-center justify-between gap-2 border-t border-border p-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!hasValue}
            onClick={() => onChange({ from: null, to: null })}
            className="cursor-pointer"
          >
            {t("common.actions.reset")}
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => setOpen(false)}
            className="cursor-pointer"
          >
            {t("common.actions.apply")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
