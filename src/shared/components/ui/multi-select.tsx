"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "./badge";
import { Button } from "./button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { cn } from "@/shared/utils/cn.util";
import type { ComboboxOption } from "./combobox";
import { InlineClear } from "@/shared/components/ui/inline-clear";

export interface MultiSelectProps {
  options: ComboboxOption[];
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  /** Số chip hiển thị trước khi gộp thành "+N". */
  maxVisible?: number;
  /** Giới hạn số lựa chọn. */
  maxSelected?: number;
  showSelectAll?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
}

/** Select nhiều giá trị, hiển thị dạng chip, có tìm kiếm và chọn/bỏ tất cả. */
export function MultiSelect({
  options,
  value,
  onValueChange,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  disabled,
  maxVisible = 3,
  maxSelected,
  showSelectAll = true,
  className,
  id,
  "aria-label": ariaLabel,
  "aria-invalid": ariaInvalid,
}: MultiSelectProps) {
  const t = useTranslations();
  const [open, setOpen] = React.useState(false);

  const selectedOptions = React.useMemo(
    () => options.filter((option) => value.includes(option.value)),
    [options, value],
  );

  const selectableCount = options.filter((option) => !option.disabled).length;
  const allSelected = selectableCount > 0 && value.length >= selectableCount;
  const atLimit = maxSelected !== undefined && value.length >= maxSelected;

  function toggle(optionValue: string) {
    if (value.includes(optionValue)) {
      onValueChange(value.filter((v) => v !== optionValue));
      return;
    }
    if (atLimit) return;
    onValueChange([...value, optionValue]);
  }

  const visible = selectedOptions.slice(0, maxVisible);
  const overflow = selectedOptions.length - visible.length;

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
            "h-auto min-h-11 w-full cursor-pointer justify-between gap-2 rounded-xl border-input bg-card/90 px-3 py-2 text-sm font-semibold shadow-sm transition hover:border-ring/50 hover:bg-card focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/20 aria-invalid:border-destructive aria-invalid:ring-destructive/20",
            className,
          )}
        >
          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
            {selectedOptions.length === 0 ? (
              <span className="font-medium text-muted-foreground">
                {placeholder ?? t("common.form.selectPlaceholder")}
              </span>
            ) : (
              <>
                {visible.map((option) => (
                  <Badge
                    key={option.value}
                    variant="secondary"
                    className="max-w-[12rem] gap-1 pr-1 font-semibold"
                  >
                    <span className="truncate">{option.label}</span>
                    {disabled ? null : (
                      <InlineClear
                        label={`${t("common.actions.remove")} ${option.label}`}
                        onClear={() => toggle(option.value)}
                        size="sm" className="hover:bg-foreground/15"
                      />
                    )}
                  </Badge>
                ))}
                {overflow > 0 ? (
                  <Badge variant="outline" className="font-bold">
                    +{overflow}
                  </Badge>
                ) : null}
              </>
            )}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      {/* Tailwind v4 không hiểu cú pháp rút gọn `[--var]` của v3 (xem select.tsx). */}
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] min-w-56 p-0">
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
              {options.map((option) => {
                const checked = value.includes(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    keywords={option.keywords ? [option.keywords, option.value] : [option.value]}
                    // Khi đã đạt giới hạn, chỉ cho bỏ chọn chứ không cho chọn thêm.
                    disabled={option.disabled || (atLimit && !checked)}
                    onSelect={() => toggle(option.value)}
                    className="cursor-pointer"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
                        checked
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input",
                      )}
                    >
                      {checked ? <Check className="size-3" /> : null}
                    </span>
                    <span className="truncate">{option.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>

            {showSelectAll && selectableCount > 0 ? (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    // forceMount giữ hàng này hiển thị kể cả khi đang lọc theo từ khoá.
                    forceMount
                    onSelect={() =>
                      onValueChange(
                        allSelected
                          ? []
                          : options.filter((o) => !o.disabled).map((o) => o.value),
                      )
                    }
                    className="cursor-pointer justify-between text-xs font-bold text-primary"
                  >
                    {allSelected ? t("common.actions.deselectAll") : t("common.actions.selectAll")}
                    <span className="font-semibold text-muted-foreground">
                      {t("common.form.selectedCountOf", {
                        count: value.length,
                        total: selectableCount,
                      })}
                    </span>
                  </CommandItem>
                </CommandGroup>
              </>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
