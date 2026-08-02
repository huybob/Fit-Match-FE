"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { ScrollArea } from "./scroll-area";
import { cn } from "@/shared/utils/cn.util";
import { InlineClear } from "@/shared/components/ui/inline-clear";

export interface TimePickerProps {
  /** Giá trị dạng "HH:mm" (24h). */
  value?: string | null;
  onChange?: (value: string | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  clearable?: boolean;
  /** Bước phút trong danh sách chọn (mặc định 5). */
  minuteStep?: number;
  /** Giới hạn giờ nhỏ nhất, dạng "HH:mm". */
  minTime?: string;
  /** Giới hạn giờ lớn nhất, dạng "HH:mm". */
  maxTime?: string;
  id?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
}

const pad = (n: number) => String(n).padStart(2, "0");
const toMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};
const isValidTime = (time?: string | null): time is string =>
  !!time && /^([01]\d|2[0-3]):[0-5]\d$/.test(time);

/**
 * Chọn giờ — thay cho <input type="time">.
 * Hai cột giờ/phút cuộn được, điều hướng bằng bàn phím, có thể xoá chọn.
 */
export function TimePicker({
  value,
  onChange,
  placeholder,
  className,
  disabled,
  clearable = false,
  minuteStep = 5,
  minTime,
  maxTime,
  id,
  "aria-label": ariaLabel,
  "aria-invalid": ariaInvalid,
}: TimePickerProps) {
  const t = useTranslations();
  const [open, setOpen] = React.useState(false);

  const valid = isValidTime(value);
  const [hour, minute] = valid ? value.split(":").map(Number) : [null, null];

  /**
   * Bug S2-15/S2-16: gõ thẳng "0600" hoặc "06:00" thay vì kéo hai cột giờ/phút.
   * Đặt 7 ngày × 2 mốc bằng cách cuộn là việc rất mệt; ô nhập giữ nguyên popover
   * (cột chọn vẫn còn) nên không ai mất cách làm cũ.
   */
  const [draft, setDraft] = React.useState("");
  React.useEffect(() => {
    if (open) setDraft(valid ? value : "");
  }, [open, valid, value]);

  /** Nhận "6", "06", "630", "6:30", "0630" -> "HH:mm"; null nếu không hiểu được. */
  function parseTyped(raw: string): string | null {
    const digits = raw.replace(/\D/g, "");
    if (!digits.length || digits.length > 4) return null;
    const [h, m] =
      digits.length <= 2 ? [Number(digits), 0] : [Number(digits.slice(0, -2)), Number(digits.slice(-2))];
    if (h > 23 || m > 59) return null;
    return `${pad(h)}:${pad(m)}`;
  }

  const draftParsed = parseTyped(draft);
  const draftRejected = draft.trim() !== "" && (draftParsed === null || outOfRangeOf(draftParsed));

  function outOfRangeOf(time: string) {
    const minutes = toMinutes(time);
    if (minTime && minutes < toMinutes(minTime)) return true;
    if (maxTime && minutes > toMinutes(maxTime)) return true;
    return false;
  }

  function commitTyped() {
    if (!draftParsed || outOfRangeOf(draftParsed)) return;
    onChange?.(draftParsed);
    setOpen(false);
  }

  const hours = React.useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const minutes = React.useMemo(
    () => Array.from({ length: Math.ceil(60 / minuteStep) }, (_, i) => i * minuteStep),
    [minuteStep],
  );

  const outOfRange = React.useCallback(
    (time: string) => {
      const value = toMinutes(time);
      if (minTime && value < toMinutes(minTime)) return true;
      if (maxTime && value > toMinutes(maxTime)) return true;
      return false;
    },
    [minTime, maxTime],
  );

  function pick(nextHour: number, nextMinute: number) {
    onChange?.(`${pad(nextHour)}:${pad(nextMinute)}`);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-label={ariaLabel ?? t("common.actions.selectTime")}
          aria-invalid={ariaInvalid}
          className={cn(
            "h-11 w-full cursor-pointer justify-start gap-2 rounded-xl border-input bg-card/90 px-3.5 text-sm font-semibold shadow-sm transition hover:border-ring/50 hover:bg-card focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/20 aria-invalid:border-destructive aria-invalid:ring-destructive/20",
            !valid && "font-medium text-muted-foreground",
            className,
          )}
        >
          <Clock className="size-4 shrink-0" />
          <span className="truncate tabular-nums">
            {valid ? value : (placeholder ?? t("common.datetime.timePlaceholder"))}
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
        {/* Bug S2-15/S2-16: nhập số trực tiếp — nhanh hơn nhiều so với kéo hai cột. */}
        <div className="border-b border-border p-2">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitTyped();
              }
            }}
            onBlur={commitTyped}
            placeholder={t("common.datetime.typeTimePlaceholder")}
            aria-label={t("common.datetime.typeTime")}
            aria-invalid={draftRejected}
            className="h-9 w-full rounded-lg border border-input bg-card px-2.5 text-center text-sm font-semibold tabular-nums outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20 aria-[invalid=true]:border-destructive"
          />
          {draftRejected && (
            <p className="mt-1 text-center text-[11px] font-semibold text-destructive">
              {t("common.datetime.typeTimeInvalid")}
            </p>
          )}
        </div>
        <div className="flex divide-x divide-border" role="group" aria-label={t("common.datetime.time")}>
          <TimeColumn
            label={t("common.datetime.hour")}
            values={hours}
            selected={hour}
            isDisabled={(h) => outOfRange(`${pad(h)}:${pad(minute ?? 0)}`)}
            onPick={(h) => pick(h, minute ?? 0)}
          />
          <TimeColumn
            label={t("common.datetime.minute")}
            values={minutes}
            selected={minute}
            isDisabled={(m) => outOfRange(`${pad(hour ?? 0)}:${pad(m)}`)}
            onPick={(m) => pick(hour ?? 0, m)}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

function TimeColumn({
  label,
  values,
  selected,
  isDisabled,
  onPick,
}: {
  label: string;
  values: number[];
  selected: number | null;
  isDisabled: (value: number) => boolean;
  onPick: (value: number) => void;
}) {
  return (
    <div className="flex w-20 flex-col">
      <span className="border-b border-border px-3 py-2 text-center text-[11px] font-black uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <ScrollArea className="h-56">
        <div className="flex flex-col gap-0.5 p-1.5">
          {values.map((value) => {
            const disabled = isDisabled(value);
            return (
              <Button
                key={value}
                type="button"
                variant={selected === value ? "default" : "ghost"}
                size="sm"
                disabled={disabled}
                aria-selected={selected === value}
                onClick={() => onPick(value)}
                className="h-8 shrink-0 cursor-pointer justify-center tabular-nums"
              >
                {pad(value)}
              </Button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
