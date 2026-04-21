"use client"

import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

const days = ["Mo", "Tu", "We", "Th", "Fr", "Sat", "Su"]
const dates = [
  { day: 23, isToday: false },
  { day: 24, isToday: true },
  { day: 25, isToday: false },
  { day: 26, isToday: false },
  { day: 27, isToday: false },
  { day: 28, isToday: false },
  { day: 29, isToday: false },
]

export function CalendarWidget() {
  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center">
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-sm">April 2024</span>
        </div>
        <button className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center">
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {days.map((day) => (
          <div
            key={day}
            className="text-center text-xs text-muted-foreground py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-7 gap-1">
        {dates.map((date) => (
          <button
            key={date.day}
            className={cn(
              "aspect-square rounded-full flex items-center justify-center text-sm font-medium transition-colors",
              date.isToday
                ? "bg-primary text-primary-foreground"
                : "text-card-foreground hover:bg-muted"
            )}
          >
            {date.day}
          </button>
        ))}
      </div>
    </div>
  )
}
