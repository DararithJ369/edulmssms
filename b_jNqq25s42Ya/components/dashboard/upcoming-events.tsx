"use client"

import { BookOpen, MessageCircle, Calendar } from "lucide-react"

const events = [
  {
    icon: BookOpen,
    type: "Course",
    title: "Business",
    date: "April 25",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    icon: MessageCircle,
    type: "Tutoring",
    title: "AI & Virtual...",
    date: "April 27",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
  },
]

export function UpcomingEvents() {
  return (
    <div className="space-y-3">
      {events.map((event, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 bg-card rounded-xl shadow-sm"
        >
          <div
            className={`w-10 h-10 rounded-xl ${event.iconBg} flex items-center justify-center`}
          >
            <event.icon className={`w-5 h-5 ${event.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">{event.type}</p>
            <p className="font-medium text-sm text-card-foreground truncate">
              {event.title}
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>{event.date}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
