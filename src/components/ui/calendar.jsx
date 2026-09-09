import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";

function Calendar({ className, classNames, showOutsideDays = true, ...props }) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm text-white font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn("h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100 text-white"),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-zinc-500 w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-white/5 [&:has([aria-selected])]:bg-[#D8CA82]/10 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
        day: cn("h-9 w-9 p-0 font-normal aria-selected:opacity-100 text-zinc-300 hover:bg-white/10"),
        day_range_end: "day-range-end",
        day_selected: "bg-[#D8CA82] text-[#111111] hover:bg-[#D8CA82] hover:text-[#111111] focus:bg-[#D8CA82] focus:text-[#111111]",
        day_today: "text-[#D8CA82]",
        day_outside: "day-outside text-zinc-600 aria-selected:bg-white/5",
        day_disabled: "text-zinc-600 opacity-50",
        ...classNames,
      }}
      components={{ IconLeft: () => <ChevronLeft className="h-4 w-4" />, IconRight: () => <ChevronRight className="h-4 w-4" /> }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";
export { Calendar };
