"use client"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, type DayPickerProps, type NavProps } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

// Define a custom navigation component with proper typing
const CustomNav = ({ onPreviousClick, onNextClick }: NavProps) => (
  <div className="flex items-center justify-between w-full px-2">
    <button
      type="button"
      onClick={onPreviousClick}
      className={cn(
        buttonVariants({ variant: "outline", size: "icon" }),
        "h-8 w-8 bg-transparent p-0 hover:bg-accent/50 rounded-full",
      )}
    >
      <ChevronLeft className="h-4 w-4" />
      <span className="sr-only">Previous month</span>
    </button>
    <button
      type="button"
      onClick={onNextClick}
      className={cn(
        buttonVariants({ variant: "outline", size: "icon" }),
        "h-8 w-8 bg-transparent p-0 hover:bg-accent/50 rounded-full",
      )}
    >
      <ChevronRight className="h-4 w-4" />
      <span className="sr-only">Next month</span>
    </button>
  </div>
)

export type CalendarProps = DayPickerProps

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 select-none", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-6",
        caption: "flex justify-center pt-1 relative items-center mb-4",
        caption_label: "text-base font-medium grow text-center",
        nav: "flex items-center",
        nav_button_previous: "hidden", // Hide default nav buttons
        nav_button_next: "hidden", // Hide default nav buttons
        table: "w-full border-collapse",
        head_row: "flex w-full",
        head_cell:
          "text-muted-foreground rounded-md w-10 h-10 font-medium text-xs flex-1 flex items-center justify-center",
        row: "flex w-full mt-1",
        cell: "relative flex h-10 w-10 items-center justify-center p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent/50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-10 w-10 p-0 font-normal rounded-full hover:bg-accent hover:text-accent-foreground",
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-full",
        day_today: "bg-accent text-accent-foreground rounded-full border border-primary/50",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Nav: CustomNav,
      }}
      {...props}
    />
  )
}

Calendar.displayName = "Calendar"

export { Calendar }

