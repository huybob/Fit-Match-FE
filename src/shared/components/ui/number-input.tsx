"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "./input";
import { IconButton } from "./icon-button";
import { cn } from "@/shared/utils/cn.util";

export interface NumberInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "type" | "value" | "onChange" | "min" | "max" | "step"
  > {
  value: number | null;
  onValueChange: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Chỉ cho phép số nguyên (mặc định: true). */
  integer?: boolean;
  /** Số chữ số thập phân tối đa khi integer = false. */
  decimalPlaces?: number;
  /** Ẩn cặp nút +/-. */
  hideStepper?: boolean;
  /** Hậu tố hiển thị bên trong ô, vd. "kg", "%", "VNĐ". */
  suffix?: string;
}

const clamp = (n: number, min?: number, max?: number) => {
  if (min !== undefined && n < min) return min;
  if (max !== undefined && n > max) return max;
  return n;
};

/**
 * Ô nhập số. Dùng type="text" + inputMode để tránh spinner mặc định của
 * trình duyệt và tránh việc lăn chuột làm đổi giá trị ngoài ý muốn.
 * Cặp nút tăng/giảm đều có tooltip.
 */
export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      value,
      onValueChange,
      min,
      max,
      step = 1,
      integer = true,
      decimalPlaces = 2,
      hideStepper = false,
      suffix,
      className,
      disabled,
      ...props
    },
    ref,
  ) => {
    const t = useTranslations();

    // Text nội bộ để người dùng gõ được trạng thái trung gian ("-", "1.").
    const [text, setText] = React.useState(() => (value === null ? "" : String(value)));

    // Đồng bộ khi giá trị bị đổi từ bên ngoài (reset form, set lại...).
    React.useEffect(() => {
      const next = value === null ? "" : String(value);
      setText((prev) => (Number(prev) === value && prev !== "" ? prev : next));
    }, [value]);

    const pattern = integer ? /^-?\d*$/ : new RegExp(`^-?\\d*(\\.\\d{0,${decimalPlaces}})?$`);

    function commit(raw: string) {
      if (raw === "" || raw === "-") {
        onValueChange(null);
        return;
      }
      const parsed = Number(raw);
      if (Number.isNaN(parsed)) {
        onValueChange(null);
        return;
      }
      const next = clamp(parsed, min, max);
      onValueChange(next);
      setText(String(next));
    }

    function nudge(direction: 1 | -1) {
      const base = value ?? 0;
      const raw = base + direction * step;
      // Chặn sai số dấu phẩy động kiểu 0.1 + 0.2 = 0.30000000000000004
      const rounded = integer ? Math.round(raw) : Number(raw.toFixed(decimalPlaces));
      const next = clamp(rounded, min, max);
      onValueChange(next);
      setText(String(next));
    }

    const atMin = min !== undefined && value !== null && value <= min;
    const atMax = max !== undefined && value !== null && value >= max;

    return (
      <div className="relative flex items-center">
        <Input
          ref={ref}
          type="text"
          inputMode={integer ? "numeric" : "decimal"}
          role="spinbutton"
          aria-valuenow={value ?? undefined}
          aria-valuemin={min}
          aria-valuemax={max}
          value={text}
          disabled={disabled}
          onChange={(event) => {
            const next = event.target.value;
            if (pattern.test(next)) setText(next);
          }}
          onBlur={(event) => {
            commit(text);
            props.onBlur?.(event);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowUp") {
              event.preventDefault();
              nudge(1);
            } else if (event.key === "ArrowDown") {
              event.preventDefault();
              nudge(-1);
            }
            props.onKeyDown?.(event);
          }}
          className={cn(
            "tabular-nums",
            suffix && "pr-14",
            !hideStepper && "pr-20",
            !hideStepper && suffix && "pr-32",
            className,
          )}
          {...props}
        />

        {suffix ? (
          <span
            className={cn(
              "pointer-events-none absolute text-xs font-semibold text-muted-foreground",
              hideStepper ? "right-3.5" : "right-20",
            )}
          >
            {suffix}
          </span>
        ) : null}

        {hideStepper ? null : (
          <div className="absolute right-1 flex items-center gap-0.5">
            <IconButton
              tooltip={t("common.actions.decrease")}
              tabIndex={-1}
              disabled={disabled || atMin}
              onClick={() => nudge(-1)}
              className="size-8 text-muted-foreground"
            >
              <Minus className="size-3.5" />
            </IconButton>
            <IconButton
              tooltip={t("common.actions.increase")}
              tabIndex={-1}
              disabled={disabled || atMax}
              onClick={() => nudge(1)}
              className="size-8 text-muted-foreground"
            >
              <Plus className="size-3.5" />
            </IconButton>
          </div>
        )}
      </div>
    );
  },
);
NumberInput.displayName = "NumberInput";
