"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns"

interface CalendarProps {
  value?: Date
  onChange?: (date: Date) => void
  highlightedDates?: Date[]
  className?: string
}

export function CustomCalendar({ value, onChange, highlightedDates = [], className }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(value || new Date())
  const [selectedDate, setSelectedDate] = useState(value)

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    if (onChange) {
      onChange(date)
    }
  }

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  // Generate days for the current month view
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Get day names
  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

  // Check if a date is highlighted
  const isHighlighted = (date: Date) => {
    return highlightedDates.some((highlightDate) => isSameDay(new Date(highlightDate), date))
  }

  return (
    <div className={cn("p-4 bg-white rounded-lg border", className)}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">{format(currentMonth, "MMMM yyyy")}</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" className="h-8 w-8 p-0 rounded-full" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous month</span>
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 p-0 rounded-full" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next month</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {daysInMonth.map((day, i) => {
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false
          const isHighlightedDate = isHighlighted(day)
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isTodayDate = isToday(day)

          return (
            <Button
              key={i}
              variant="ghost"
              size="sm"
              className={cn(
                "h-9 w-full p-0 font-normal rounded-md",
                !isCurrentMonth && "opacity-30",
                isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                isHighlightedDate && !isSelected && "bg-red-50 text-red-600 hover:bg-red-100",
                isTodayDate && !isSelected && !isHighlightedDate && "border border-primary",
              )}
              onClick={() => handleDateSelect(day)}
            >
              {format(day, "d")}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

