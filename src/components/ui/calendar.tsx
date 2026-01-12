import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, useNavigation, CaptionLabelProps } from "react-day-picker";
import { format, setMonth, setYear } from "date-fns";
import { useState, useRef, useEffect } from "react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function YearPicker({ displayMonth }: CaptionLabelProps) {
  const { goToMonth } = useNavigation();
  const [open, setOpen] = useState(false);
  const currentYear = displayMonth.getFullYear();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Generate years: Current Year - 10 to + 10
  const years = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 10;
    const endYear = currentYear + 10;
    return Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
  }, []);

  useEffect(() => {
    if (open && scrollRef.current) {
      const selectedYearEl = scrollRef.current.querySelector('[data-selected="true"]');
      if (selectedYearEl) {
        // Use timeout to ensure layout is stable in the popover portal
        setTimeout(() => {
          selectedYearEl.scrollIntoView({ block: "center" });
        }, 0);
      }
    }
  }, [open]);

  return (
    <div className="flex items-center gap-1 text-sm font-medium relative group">
      <span>{format(displayMonth, "MMMM")}</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <span
            className="cursor-pointer hover:bg-accent rounded px-1 transition-colors"
          >
            {currentYear}
          </span>
        </PopoverTrigger>
        <PopoverContent className="w-[120px] p-0 h-[240px] z-[60]" align="center">
          <div className="h-full overflow-y-auto overflow-x-hidden py-2" ref={scrollRef}>
            {years.map((year) => (
              <div
                key={year}
                data-selected={year === currentYear}
                onClick={() => {
                  const newMonth = setYear(displayMonth, year);
                  goToMonth && goToMonth(newMonth);
                  setOpen(false);
                }}
                className={cn(
                  "px-4 py-1.5 text-center cursor-pointer text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                  year === currentYear && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground font-semibold"
                )}
              >
                {year}
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      fixedWeeks
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(buttonVariants({ variant: "ghost" }), "h-9 w-9 p-0 font-normal aria-selected:opacity-100"),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
        CaptionLabel: YearPicker,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
