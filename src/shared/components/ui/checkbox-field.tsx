"use client";

import * as React from "react";
import { Checkbox } from "./checkbox";
import { cn } from "@/shared/utils/cn.util";

export interface CheckboxFieldProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: React.ReactNode;
  /** Dòng mô tả phụ dưới nhãn. */
  description?: React.ReactNode;
  disabled?: boolean;
  id?: string;
  className?: string;
  labelClassName?: string;
  /** Căn checkbox lên đầu khi nhãn dài nhiều dòng. */
  alignTop?: boolean;
}

/**
 * Checkbox kèm nhãn bấm được — thay cho <input type="checkbox"> viết tay.
 *
 * Nhãn nối với checkbox qua htmlFor/id nên bấm vào chữ cũng đổi trạng thái,
 * và screen reader đọc đúng nhãn.
 */
export const CheckboxField = React.forwardRef<HTMLButtonElement, CheckboxFieldProps>(
  (
    {
      checked,
      onCheckedChange,
      label,
      description,
      disabled,
      id,
      className,
      labelClassName,
      alignTop = false,
    },
    ref,
  ) => {
    const generated = React.useId();
    const inputId = id ?? generated;
    const descriptionId = description ? `${inputId}-description` : undefined;

    return (
      <div
        className={cn(
          "flex gap-2.5",
          alignTop ? "items-start" : "items-center",
          disabled && "opacity-60",
          className,
        )}
      >
        <Checkbox
          ref={ref}
          id={inputId}
          checked={checked}
          disabled={disabled}
          aria-describedby={descriptionId}
          onCheckedChange={(next) => onCheckedChange(next === true)}
          className={cn("cursor-pointer", alignTop && "mt-0.5")}
        />
        <div className="min-w-0">
          <label
            htmlFor={inputId}
            className={cn(
              "cursor-pointer select-none text-sm font-semibold text-foreground",
              disabled && "cursor-not-allowed",
              labelClassName,
            )}
          >
            {label}
          </label>
          {description ? (
            <p id={descriptionId} className="mt-0.5 text-xs text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </div>
    );
  },
);
CheckboxField.displayName = "CheckboxField";
