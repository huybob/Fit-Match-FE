"use client";

import * as React from "react";
import { Button, type ButtonProps } from "./button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";
import { cn } from "@/shared/utils/cn.util";

export interface IconButtonProps extends Omit<ButtonProps, "aria-label" | "title"> {
  /**
   * BẮT BUỘC. Mô tả chức năng của nút, dùng cho cả tooltip và aria-label.
   * Nhờ prop này là bắt buộc, không thể tạo icon button "trần" mà thiếu tooltip.
   */
  tooltip: React.ReactNode;
  /** Nhãn cho screen reader khi tooltip không phải chuỗi thuần. */
  label?: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  /** Tắt tooltip trong trường hợp đặc biệt (vd. nút đã có nhãn text kề bên). */
  hideTooltip?: boolean;
}

/**
 * Nút chỉ có icon — luôn kèm Tooltip + aria-label.
 *
 * Khi disabled, Radix không nhận được sự kiện chuột (buttonVariants đặt
 * `disabled:pointer-events-none`), nên bọc thêm một <span> làm trigger để
 * tooltip vẫn hiện — hữu ích cho việc giải thích *vì sao* nút đang bị tắt.
 */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      tooltip,
      label,
      side = "top",
      align = "center",
      hideTooltip = false,
      size = "icon-sm",
      variant = "ghost",
      className,
      disabled,
      ...props
    },
    ref,
  ) => {
    const accessibleName = label ?? (typeof tooltip === "string" ? tooltip : undefined);

    const button = (
      <Button
        ref={ref}
        type={props.type ?? "button"}
        variant={variant}
        size={size}
        disabled={disabled}
        aria-label={accessibleName}
        className={cn("cursor-pointer", className)}
        {...props}
      />
    );

    if (hideTooltip) return button;

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {disabled ? (
            // span nhận hover thay cho button đang bị vô hiệu hoá
            <span className="inline-flex cursor-not-allowed">{button}</span>
          ) : (
            button
          )}
        </TooltipTrigger>
        <TooltipContent side={side} align={align}>
          {tooltip}
        </TooltipContent>
      </Tooltip>
    );
  },
);
IconButton.displayName = "IconButton";
