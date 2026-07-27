"use client";

import * as React from "react";
import { format, isValid, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useDateFormats, useDateLocale } from "@/i18n/use-date-locale";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { cn } from "@/shared/utils/cn.util";
import { InlineClear } from "@/shared/components/ui/inline-clear";

export interface DatePickerProps {
  /** Giá trị dạng ISO "yyyy-MM-dd". */
  value?: string | null;
  onChange?: (value: string | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  clearable?: boolean;
  /** Không cho chọn ngày trước mốc này (ISO "yyyy-MM-dd"). */
  minDate?: string;
  /** Không cho chọn ngày sau mốc này (ISO "yyyy-MM-dd"). */
  maxDate?: string;
  id?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
}

/** Chọn ngày — thay cho <input type="date">. Lịch hiển thị theo ngôn ngữ đang chọn. */
export function DatePicker({
  value,
  onChange,
  placeholder,
  className,
  disabled,
  clearable = false,
  minDate,
  maxDate,
  id,
  "aria-label": ariaLabel,
  "aria-invalid": ariaInvalid,
}: DatePickerProps) {
  const t = useTranslations();
  const locale = useDateLocale();
  const formats = useDateFormats();
  const [open, setOpen] = React.useState(false);

  const date = value ? parseISO(value) : undefined;
  const valid = date !== undefined && isValid(date);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-label={ariaLabel ?? t("common.actions.selectDate")}
          aria-invalid={ariaInvalid}
          className={cn(
            "h-11 w-full cursor-pointer justify-start gap-2 rounded-xl border-input bg-card/90 px-3.5 text-sm font-semibold shadow-sm transition hover:border-ring/50 hover:bg-card focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/20 aria-invalid:border-destructive aria-invalid:ring-destructive/20",
            !valid && "font-medium text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="size-4 shrink-0" />
          <span className="truncate">
            {valid
              ? format(date!, formats.date, { locale })
              : (placeholder ?? t("common.datetime.datePlaceholder"))}
          </span>
          {clearable && valid && !disabled ? (
            <InlineClear
              label={t("common.datetime.clearDate")}
              onClear={() => onChange?.(null)}
              size="md" className="ml-auto"
            />
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={locale}
          autoFocus
          defaultMonth={valid ? date : undefined}
          selected={valid ? date : undefined}
          disabled={[
            ...(minDate ? [{ before: parseISO(minDate) }] : []),
            ...(maxDate ? [{ after: parseISO(maxDate) }] : []),
          ]}
          onSelect={(picked) => {
            if (!picked) return;
            onChange?.(format(picked, "yyyy-MM-dd"));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
