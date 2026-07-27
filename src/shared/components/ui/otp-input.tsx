"use client";

import * as React from "react";
import { cn } from "@/shared/utils/cn.util";

export interface OtpInputProps {
  value: string;
  onValueChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Gọi khi người dùng nhập đủ `length` số. */
  onComplete?: (value: string) => void;
  className?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

/**
 * Ô nhập mã OTP.
 *
 * Dùng MỘT input thật (che mờ, phủ toàn khối) thay vì N input rời:
 * nhờ vậy tự động điền OTP từ SMS, dán mã, và phím Backspace hoạt động
 * đúng như người dùng mong đợi — còn các ô vuông chỉ là phần hiển thị.
 */
export function OtpInput({
  value,
  onValueChange,
  length = 6,
  disabled,
  autoFocus,
  onComplete,
  className,
  "aria-label": ariaLabel,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: OtpInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [focused, setFocused] = React.useState(false);

  const digits = value.slice(0, length).split("");
  // Ô đang chờ nhập: ô kế tiếp, hoặc ô cuối khi đã nhập đủ.
  const activeIndex = Math.min(digits.length, length - 1);

  const completedRef = React.useRef(false);
  React.useEffect(() => {
    if (value.length === length && !completedRef.current) {
      completedRef.current = true;
      onComplete?.(value);
    } else if (value.length < length) {
      completedRef.current = false;
    }
  }, [value, length, onComplete]);

  return (
    <div
      className={cn("relative flex w-fit items-center gap-2", className)}
      onClick={() => inputRef.current?.focus()}
    >
      <input
        ref={inputRef}
        // Input thật nhưng trong suốt — giữ được autofill/paste của trình duyệt.
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="\d*"
        maxLength={length}
        value={value}
        disabled={disabled}
        autoFocus={autoFocus}
        aria-label={ariaLabel}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(event) => {
          const next = event.target.value.replace(/\D/g, "").slice(0, length);
          onValueChange(next);
        }}
        className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
      />

      {Array.from({ length }, (_, index) => {
        const digit = digits[index];
        const isActive = focused && index === activeIndex && !disabled;
        return (
          <div
            key={index}
            aria-hidden
            className={cn(
              "flex h-13 w-11 items-center justify-center rounded-xl border bg-card/90 text-lg font-black tabular-nums shadow-sm transition-all",
              isActive
                ? "border-ring ring-4 ring-ring/20"
                : "border-input",
              ariaInvalid && "border-destructive ring-destructive/20",
              disabled && "opacity-60",
            )}
          >
            {digit ?? <span className="text-muted-foreground/40">•</span>}
            {isActive && !digit ? (
              <span className="absolute h-5 w-px animate-pulse bg-foreground" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
