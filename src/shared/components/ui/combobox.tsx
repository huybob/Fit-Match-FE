"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "./button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { cn } from "@/shared/utils/cn.util";
import { InlineClear } from "@/shared/components/ui/inline-clear";

export interface ComboboxOption {
  value: string;
  label: string;
  /** Từ khoá phụ để tìm kiếm (vd. tên không dấu, mã). */
  keywords?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  description?: string;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value?: string | null;
  onValueChange: (value: string | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  /** Cho phép bỏ chọn bằng nút X. */
  clearable?: boolean;
  className?: string;
  contentClassName?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
  id?: string;
}

/**
 * Select có ô tìm kiếm (single choice). Thay cho <select> khi danh sách dài.
 * Điều hướng bằng bàn phím do cmdk đảm nhiệm; Enter chọn, Escape đóng.
 */
export function Combobox({
  options,
  value,
  onValueChange,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  disabled,
  clearable = false,
  className,
  contentClassName,
  id,
  "aria-label": ariaLabel,
  "aria-invalid": ariaInvalid,
}: ComboboxProps) {
  const t = useTranslations();
  const [open, setOpen] = React.useState(false);

  const selected = React.useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={ariaLabel}
          aria-invalid={ariaInvalid}
          disabled={disabled}
          className={cn(
            "h-11 w-full cursor-pointer justify-between gap-2 rounded-xl border-input bg-card/90 px-3.5 text-sm font-semibold shadow-sm transition hover:border-ring/50 hover:bg-card focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/20 aria-invalid:border-destructive aria-invalid:ring-destructive/20",
            !selected && "font-medium text-muted-foreground",
            className,
          )}
        >
          <span className="flex min-w-0 items-center gap-2 truncate">
            {selected?.icon}
            <span className="truncate">
              {selected?.label ?? placeholder ?? t("common.form.selectPlaceholder")}
            </span>
          </span>

          <span className="flex shrink-0 items-center gap-1">
            {clearable && selected && !disabled ? (
              <InlineClear
                label={t("common.actions.clear")}
                onClear={() => onValueChange(null)}
                size="md"
              />
            ) : null}
            <ChevronsUpDown className="size-4 opacity-50" />
          </span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        // Tailwind v4 không hiểu cú pháp rút gọn `[--var]` của v3 (xem select.tsx).
        className={cn("w-[var(--radix-popover-trigger-width)] min-w-52 p-0", contentClassName)}
      >
        <Command
          filter={(itemValue, search, keywords) => {
            const haystack = `${itemValue} ${keywords?.join(" ") ?? ""}`.toLowerCase();
            return haystack.includes(search.toLowerCase()) ? 1 : 0;
          }}
        >
          <CommandInput placeholder={searchPlaceholder ?? t("common.form.searchPlaceholder")} />
          <CommandList>
            <CommandEmpty>{emptyMessage ?? t("common.states.noResults")}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  keywords={option.keywords ? [option.keywords, option.value] : [option.value]}
                  disabled={option.disabled}
                  onSelect={() => {
                    onValueChange(option.value === value && clearable ? null : option.value);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  {option.icon}
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate">{option.label}</span>
                    {option.description ? (
                      <span className="truncate text-xs font-medium text-muted-foreground">
                        {option.description}
                      </span>
                    ) : null}
                  </span>
                  <Check
                    className={cn(
                      "ml-auto size-4 text-primary",
                      option.value === value ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
