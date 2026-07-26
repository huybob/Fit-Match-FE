"use client";

import * as React from "react";
import { format, isValid, parseISO } from "date-fns";
import { CalendarClock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useDateFormats, useDateLocale } from "@/i18n/use-date-locale";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { ScrollArea } from "./scroll-area";
import { cn } from "@/shared/utils/cn.util";
import { InlineClear } from "@/shared/components/ui/inline-clear";

export interface DateTimePickerProps {
  /**
   * Giá trị dạng "yyyy-MM-ddTHH:mm" — GIỐNG HỆT định dạng của
   * <input type="datetime-local"> để thay thế trực tiếp mà không phải
   * sửa logic gửi lên API.
   */
  value?: string | null;
  onChange?: (value: string | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  clearable?: boolean;
  minuteStep?: number;
  /** Chặn mọi thời điểm trước mốc này, dạng "yyyy-MM-ddTHH:mm". */
  minDateTime?: string;
  id?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
}

const pad = (n: number) => String(n).padStart(2, "0");
/** Định dạng local, KHÔNG dùng toISOString() để tránh bị lệch múi giờ. */
const toLocalValue = (date: Date) => format(date, "yyyy-MM-dd'T'HH:mm");

/** Chọn ngày + giờ — thay cho <input type="datetime-local">. */
export function DateTimePicker({
  value,
  onChange,
  placeholder,
  className,
  disabled,
  clearable = false,
  minuteStep = 5,
  minDateTime,
  id,
  "aria-label": ariaLabel,
  "aria-invalid": ariaInvalid,
}: DateTimePickerProps) {
  const t = useTranslations();
  const locale = useDateLocale();
  const formats = useDateFormats();
  const [open, setOpen] = React.useState(false);

  const parsed = value ? parseISO(value) : undefined;
  const valid = parsed !== undefined && isValid(parsed);

  const minDate = minDateTime ? parseISO(minDateTime) : undefined;
  const minValid = minDate !== undefined && isValid(minDate);

  const hours = React.useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const minutes = React.useMemo(
    () => Array.from({ length: Math.ceil(60 / minuteStep) }, (_, i) => i * minuteStep),
    [minuteStep],
  );

  /** Ghép phần ngày và phần giờ, giữ lại phần còn lại của giá trị hiện tại. */
  function emit(next: Date) {
    if (minValid && next < minDate!) return;
    onChange?.(toLocalValue(next));
  }

  function pickDate(picked: Date) {
    const base = valid ? parsed! : new Date();
    const next = new Date(picked);
    next.setHours(base.getHours(), valid ? base.getMinutes() : 0, 0, 0);
    emit(next);
  }

  function pickTime(part: "hour" | "minute", amount: number) {
    const next = new Date(valid ? parsed! : new Date());
    if (part === "hour") next.setHours(amount);
    else next.setMinutes(amount);
    next.setSeconds(0, 0);
    emit(next);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-label={ariaLabel ?? t("common.datetime.dateTimePlaceholder")}
          aria-invalid={ariaInvalid}
          className={cn(
            "h-11 w-full cursor-pointer justify-start gap-2 rounded-xl border-input bg-card/90 px-3.5 text-sm font-semibold shadow-sm transition hover:border-ring/50 hover:bg-card focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/20 aria-invalid:border-destructive aria-invalid:ring-destructive/20",
            !valid && "font-medium text-muted-foreground",
            className,
          )}
        >
          <CalendarClock className="size-4 shrink-0" />
          <span className="truncate">
            {valid
              ? format(parsed!, formats.dateTime, { locale })
              : (placeholder ?? t("common.datetime.dateTimePlaceholder"))}
          </span>
          {clearable && valid && !disabled ? (
            <InlineClear
              label={t("common.actions.clear")}
              onClear={() => onChange?.(null)}
              size="md" className="ml-auto"
            />
          ) : null}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-auto p-0">
        <div className="flex flex-col sm:flex-row sm:divide-x sm:divide-border">
          <Calendar
            mode="single"
            locale={locale}
            autoFocus
            defaultMonth={valid ? parsed : undefined}
            selected={valid ? parsed : undefined}
            disabled={minValid ? [{ before: minDate! }] : undefined}
            onSelect={(picked) => picked && pickDate(picked)}
          />

          <div
            className="flex divide-x divide-border border-t border-border sm:border-t-0"
            role="group"
            aria-label={t("common.datetime.time")}
          >
            <TimeColumn
              label={t("common.datetime.hour")}
              values={hours}
              selected={valid ? parsed!.getHours() : null}
              onPick={(h) => pickTime("hour", h)}
            />
            <TimeColumn
              label={t("common.datetime.minute")}
              values={minutes}
              selected={valid ? parsed!.getMinutes() : null}
              onPick={(m) => pickTime("minute", m)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border p-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => emit(new Date())}
            className="cursor-pointer"
          >
            {t("common.datetime.now")}
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => setOpen(false)}
            className="cursor-pointer"
          >
            {t("common.actions.confirm")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function TimeColumn({
  label,
  values,
  selected,
  onPick,
}: {
  label: string;
  values: number[];
  selected: number | null;
  onPick: (value: number) => void;
}) {
  return (
    <div className="flex w-20 flex-col">
      <span className="border-b border-border px-3 py-2 text-center text-[11px] font-black uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <ScrollArea className="h-[15.5rem]">
        <div className="flex flex-col gap-0.5 p-1.5">
          {values.map((value) => (
            <Button
              key={value}
              type="button"
              variant={selected === value ? "default" : "ghost"}
              size="sm"
              aria-selected={selected === value}
              onClick={() => onPick(value)}
              className="h-8 shrink-0 cursor-pointer justify-center tabular-nums"
            >
              {pad(value)}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
