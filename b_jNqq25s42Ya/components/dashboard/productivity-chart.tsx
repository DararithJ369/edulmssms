"use client"

import { ChevronRight } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts"

const data = [
  { name: "Mon", mentoring: 20, selfImprove: 15, student: 10 },
  { name: "Tue", mentoring: 10, selfImprove: 5, student: 5 },
  { name: "Wed", mentoring: 35, selfImprove: 25, student: 15 },
  { name: "Thu", mentoring: 40, selfImprove: 30, student: 20 },
  { name: "Fri", mentoring: 25, selfImprove: 20, student: 10 },
  { name: "Sat", mentoring: 60, selfImprove: 50, student: 30 },
  { name: "Sun", mentoring: 70, selfImprove: 55, student: 40 },
]

const legendItems = [
  { label: "Mentoring", color: "#1e293b" },
  { label: "Self Improve", color: "#6366f1" },
  { label: "Student", color: "#67e8f9" },
]

export function ProductivityChart() {
  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-card-foreground">Productivity</h3>
        <button className="text-sm text-primary hover:underline flex items-center gap-1">
          View details
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={8} barGap={2}>
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              tickFormatter={(value) => `${value}%`}
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 90]}
            />
            <Bar dataKey="mentoring" fill="#1e293b" radius={[4, 4, 4, 4]} />
            <Bar dataKey="selfImprove" fill="#6366f1" radius={[4, 4, 4, 4]} />
            <Bar dataKey="student" fill="#67e8f9" radius={[4, 4, 4, 4]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4">
        {legendItems.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
