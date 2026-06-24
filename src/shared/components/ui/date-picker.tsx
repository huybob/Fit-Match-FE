"use client";

import { format, isValid, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { cn } from "@/shared/utils/cn.util";

interface DatePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Chọn ngày",
  className,
  disabled,
}: DatePickerProps) {
  const date = value ? parseISO(value) : undefined;
  const valid = date !== undefined && isValid(date);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-11 w-full justify-start rounded-xl border border-input bg-card/90 px-3.5 text-sm font-semibold shadow-sm hover:border-[#b9bda8] hover:bg-card focus-visible:border-[#88d900] focus-visible:ring-4 focus-visible:ring-ring/20",
            !valid && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 size-4 shrink-0" />
          {valid ? format(date!, "dd/MM/yyyy") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={valid ? date : undefined}
          onSelect={(d) => {
            if (d) onChange?.(format(d, "yyyy-MM-dd"));
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
