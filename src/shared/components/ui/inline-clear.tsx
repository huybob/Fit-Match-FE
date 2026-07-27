"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/shared/utils/cn.util";

/**
 * Dấu "×" nằm BÊN TRONG một nút khác (trigger của Combobox / DatePicker /
 * TimePicker / Badge của MultiSelect...).
 *
 * Vì sao là `<span>` chứ không phải `<button>`: button lồng trong button là HTML
 * không hợp lệ. Đổi lại phải tự lo phần bàn phím — `role="button"` mà không xử lý
 * Enter/Space thì screen reader thông báo một nút không bấm được. `tabIndex={-1}`
 * để Tab vẫn đi thẳng vào trigger, không dừng ở dấu ×.
 *
 * Trước đây 6 component copy lại đúng khối span này, không nơi nào có onKeyDown.
 */
export interface InlineClearProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "onClick" | "children"> {
  /** Nhãn cho screen reader và tooltip gốc — bắt buộc để không có nút vô danh. */
  label: string;
  onClear: () => void;
  /** Cỡ icon; mặc định vừa với trigger cao 44px. */
  size?: "sm" | "md";
}

export const InlineClear = React.forwardRef<HTMLSpanElement, InlineClearProps>(
  ({ label, onClear, size = "md", className, ...props }, ref) => {
    const activate = (event: React.SyntheticEvent) => {
      event.preventDefault();
      event.stopPropagation();
      onClear();
    };

    return (
      <span
        ref={ref}
        role="button"
        tabIndex={-1}
        aria-label={label}
        title={label}
        onClick={activate}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") activate(event);
        }}
        className={cn(
          "inline-flex shrink-0 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
          size === "md" ? "size-5 rounded-md" : "size-4 rounded",
          className,
        )}
        {...props}
      >
        <X className={size === "md" ? "size-3.5" : "size-3"} />
      </span>
    );
  },
);
InlineClear.displayName = "InlineClear";
