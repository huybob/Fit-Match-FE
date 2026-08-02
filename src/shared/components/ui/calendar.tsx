"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/shared/utils/cn.util";
import { buttonVariants } from "./button";

type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("relative p-3", className)}
      classNames={{
        // Bug S2-17: react-day-picker v9+ render <nav> là CON của `months`, KHÔNG
        // nằm trong `month_caption`. Hai nút điều hướng lại được đặt `absolute
        // left-1 / right-1` nên chúng neo vào tổ tiên có position gần nhất — tức là
        // khung popover, không phải hàng tiêu đề. Kết quả: mũi tên văng ra rìa
        // popover, đè lên cột giờ/phút của DateTimePicker và nút "sang tháng" bấm
        // không ăn. Nay `months` là mốc position, `nav` trải đúng hàng caption.
        months: "relative flex flex-col gap-2 sm:flex-row",
        month: "flex flex-col gap-4",
        month_caption: "flex h-8 w-full items-center justify-center px-9",
        caption_label: "text-sm font-bold",
        nav: "absolute inset-x-0 top-0 z-10 flex h-8 items-center justify-between px-1",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-60 hover:opacity-100",
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-60 hover:opacity-100",
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "text-muted-foreground rounded-md w-9 font-bold text-[0.8rem] text-center",
        week: "flex w-full mt-2",
        day: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-muted [&:has([aria-selected].outside)]:bg-muted/50 rounded-md",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "size-9 p-0 font-semibold aria-selected:opacity-100",
        ),
        range_start: "aria-selected:bg-primary aria-selected:text-primary-foreground",
        range_end: "aria-selected:bg-primary aria-selected:text-primary-foreground",
        selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        today: "bg-muted text-foreground font-black",
        outside: "outside text-muted-foreground aria-selected:text-muted-foreground",
        disabled: "text-muted-foreground opacity-50",
        range_middle: "aria-selected:bg-muted aria-selected:text-foreground",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, ...p }) =>
          orientation === "left" ? (
            <ChevronLeft className="size-4" {...p} />
          ) : (
            <ChevronRight className="size-4" {...p} />
          ),
      }}
      {...props}
    />
  );
}

export { Calendar };
