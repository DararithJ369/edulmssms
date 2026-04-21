"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { CourseCard } from "@/components/dashboard/course-card"
import { CalendarWidget } from "@/components/dashboard/calendar-widget"
import { UpcomingEvents } from "@/components/dashboard/upcoming-events"
import { MyCourses } from "@/components/dashboard/my-courses"
import { OverallInfo } from "@/components/dashboard/overall-info"
import { ProductivityChart } from "@/components/dashboard/productivity-chart"

const topCourses = [
  {
    image: "https://images.unsplash.com/photo-1526379879527-8559ecfcaec0?w=400&h=300&fit=crop",
    level: "Beginner" as const,
    students: 118,
    rating: 5.0,
    title: "Three-month Course to Learn the Basics of Python and Start Coding.",
    instructor: {
      name: "Alison Walsh",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alison",
    },
  },
  {
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
    level: "Beginner" as const,
    students: 234,
    rating: 4.8,
    title: "Beginner's Guide to Successful Company Management: Business An...",
    instructor: {
      name: "Patty Kutch",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=patty",
    },
  },
  {
    image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop",
    level: "Intermediate" as const,
    students: 57,
    rating: 4.9,
    title: "A Fascinating Theory of Probability. Practice. Application. How to Outpla...",
    instructor: {
      name: "Alonzo Murray",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alonzo",
    },
  },
  {
    image: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=300&fit=crop",
    level: "Advanced" as const,
    students: 19,
    rating: 5.0,
    title: "Introduction: Machine Learning and LLM. Implementation in Modern Soft...",
    instructor: {
      name: "Gregory Harris",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=gregory",
    },
  },
]

export default function StudentDashboard() {
  return (
    <DashboardLayout
      rightSidebar={
        <>
          <CalendarWidget />
          <UpcomingEvents />
          <OverallInfo />
          <ProductivityChart />
        </>
      }
    >
      {/* Top Courses Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Top courses you may like
          </h2>
          <button className="text-sm text-primary hover:underline">
            View all
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {topCourses.map((course, i) => (
            <CourseCard key={i} {...course} />
          ))}
        </div>
      </div>

      {/* My Courses Section */}
      <MyCourses />
    </DashboardLayout>
  )
}
