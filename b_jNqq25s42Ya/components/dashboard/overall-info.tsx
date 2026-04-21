"use client"

import { BarChart3, Users, Clock, BookOpen, TrendingUp, TrendingDown } from "lucide-react"

const stats = [
  {
    icon: BarChart3,
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    label: "Score",
    value: "210",
    change: "+13%",
    positive: true,
  },
  {
    icon: BookOpen,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    label: "Completed Course",
    value: "34h",
    change: "+15%",
    positive: true,
  },
  {
    icon: Users,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    label: "Total Student",
    value: "17",
    change: "-2%",
    positive: false,
  },
  {
    icon: Clock,
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    label: "Total Hours",
    value: "11",
    change: "-9%",
    positive: false,
  },
]

export function OverallInfo() {
  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm">
      <h3 className="font-semibold text-card-foreground mb-4">
        Overall Information
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center shrink-0`}
            >
              <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <div className="flex items-center gap-1">
                <span className="font-bold text-lg text-card-foreground">
                  {stat.value}
                </span>
                <span
                  className={`text-xs flex items-center gap-0.5 ${
                    stat.positive ? "text-emerald-500" : "text-red-500"
                  }`}
                >
                  {stat.positive ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {stat.change}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
