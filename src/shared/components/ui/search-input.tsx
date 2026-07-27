"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "./input";
import { IconButton } from "./icon-button";
import { cn } from "@/shared/utils/cn.util";

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  value: string;
  /** Gọi ngay mỗi lần gõ (dùng cho controlled input). */
  onValueChange: (value: string) => void;
  /**
   * Gọi sau khi người dùng ngừng gõ `debounceMs`. Dùng cho việc gọi API
   * để không bắn request mỗi ký tự.
   */
  onDebouncedChange?: (value: string) => void;
  debounceMs?: number;
  /** Ẩn nút xoá nhanh. */
  hideClear?: boolean;
}

/**
 * Ô tìm kiếm: icon kính lúp, nút xoá nhanh (có tooltip), debounce,
 * Escape để xoá nội dung.
 */
export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value,
      onValueChange,
      onDebouncedChange,
      debounceMs = 350,
      hideClear = false,
      className,
      placeholder,
      disabled,
      ...props
    },
    ref,
  ) => {
    const t = useTranslations();

    // Giữ callback trong ref để việc đổi identity của hàm không reset timer.
    const debouncedRef = React.useRef(onDebouncedChange);
    React.useEffect(() => {
      debouncedRef.current = onDebouncedChange;
    }, [onDebouncedChange]);

    // Bỏ qua lần chạy đầu để không bắn request rỗng khi mount.
    const mounted = React.useRef(false);
    React.useEffect(() => {
      if (!debouncedRef.current) return;
      if (!mounted.current) {
        mounted.current = true;
        return;
      }
      const id = setTimeout(() => debouncedRef.current?.(value), debounceMs);
      return () => clearTimeout(id);
    }, [value, debounceMs]);

    const showClear = !hideClear && value.length > 0 && !disabled;

    return (
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={ref}
          type="search"
          role="searchbox"
          value={value}
          disabled={disabled}
          placeholder={placeholder ?? t("common.form.searchPlaceholder")}
          onChange={(event) => onValueChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape" && value) {
              event.preventDefault();
              onValueChange("");
            }
            props.onKeyDown?.(event);
          }}
          className={cn(
            "pl-10",
            showClear && "pr-11",
            // Ẩn nút clear mặc định của trình duyệt cho input[type=search]
            "[&::-webkit-search-cancel-button]:appearance-none",
            className,
          )}
          {...props}
        />
        {showClear ? (
          <IconButton
            tooltip={t("common.actions.clear")}
            tabIndex={-1}
            onClick={() => onValueChange("")}
            className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            <X className="size-4" />
          </IconButton>
        ) : null}
      </div>
    );
  },
);
SearchInput.displayName = "SearchInput";
