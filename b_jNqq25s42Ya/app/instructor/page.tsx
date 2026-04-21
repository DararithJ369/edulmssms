"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Star,
  Clock,
  ChevronRight,
  PlayCircle,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"

const stats = [
  {
    title: "Total Students",
    value: "1,248",
    change: "+12%",
    positive: true,
    icon: Users,
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
  },
  {
    title: "Active Courses",
    value: "24",
    change: "+3",
    positive: true,
    icon: BookOpen,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  {
    title: "Total Earnings",
    value: "$12,450",
    change: "+18%",
    positive: true,
    icon: DollarSign,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    title: "Avg. Rating",
    value: "4.9",
    change: "-0.1",
    positive: false,
    icon: Star,
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
  },
]

const recentStudents = [
  { name: "Emma Thompson", course: "Python Basics", avatar: "emma", enrolled: "2 hours ago" },
  { name: "James Wilson", course: "Machine Learning", avatar: "james", enrolled: "5 hours ago" },
  { name: "Sofia Garcia", course: "Data Science", avatar: "sofia", enrolled: "1 day ago" },
  { name: "Liam Johnson", course: "Python Basics", avatar: "liam", enrolled: "2 days ago" },
]

const upcomingSessions = [
  { title: "Python Advanced Workshop", students: 24, time: "10:00 AM", duration: "2h" },
  { title: "Q&A Session - ML Fundamentals", students: 18, time: "2:00 PM", duration: "1h" },
  { title: "Data Science Office Hours", students: 12, time: "4:30 PM", duration: "1.5h" },
]

const earningsData = [
  { month: "Jan", amount: 2400 },
  { month: "Feb", amount: 3200 },
  { month: "Mar", amount: 2800 },
  { month: "Apr", amount: 4100 },
  { month: "May", amount: 3600 },
  { month: "Jun", amount: 4800 },
]

const engagementData = [
  { day: "Mon", views: 120, completions: 45 },
  { day: "Tue", views: 180, completions: 62 },
  { day: "Wed", views: 150, completions: 55 },
  { day: "Thu", views: 220, completions: 78 },
  { day: "Fri", views: 190, completions: 70 },
  { day: "Sat", views: 280, completions: 95 },
  { day: "Sun", views: 240, completions: 88 },
]

export default function InstructorDashboard() {
  return (
    <DashboardLayout>
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary to-violet-600 rounded-2xl p-6 mb-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome back, Dr. Sarah!</h1>
        <p className="text-white/80 mb-4">
          You have 3 upcoming sessions today and 5 new student enrollments.
        </p>
        <Button variant="secondary" className="bg-white text-primary hover:bg-white/90">
          View Schedule
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-bold">{stat.value}</span>
                    <span
                      className={`text-xs flex items-center ${
                        stat.positive ? "text-emerald-500" : "text-red-500"
                      }`}
                    >
                      {stat.positive ? (
                        <TrendingUp className="w-3 h-3 mr-0.5" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-0.5" />
                      )}
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Earnings Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Earnings Overview</CardTitle>
            <button className="text-sm text-primary hover:underline flex items-center gap-1">
              View details
              <ChevronRight className="w-4 h-4" />
            </button>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={earningsData}>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                  <Bar dataKey="amount" fill="oklch(0.55 0.18 280)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Engagement Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Student Engagement</CardTitle>
            <button className="text-sm text-primary hover:underline flex items-center gap-1">
              View details
              <ChevronRight className="w-4 h-4" />
            </button>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={engagementData}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                  <Line type="monotone" dataKey="views" stroke="oklch(0.55 0.18 280)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="completions" stroke="oklch(0.7 0.15 160)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-xs text-muted-foreground">Views</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs text-muted-foreground">Completions</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Students */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Recent Enrollments</CardTitle>
            <button className="text-sm text-primary hover:underline flex items-center gap-1">
              View all
              <ChevronRight className="w-4 h-4" />
            </button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentStudents.map((student, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.avatar}`} />
                      <AvatarFallback>{student.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{student.name}</p>
                      <p className="text-xs text-muted-foreground">{student.course}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{student.enrolled}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Sessions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Upcoming Sessions</CardTitle>
            <button className="text-sm text-primary hover:underline flex items-center gap-1">
              View all
              <ChevronRight className="w-4 h-4" />
            </button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingSessions.map((session, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <PlayCircle className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{session.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="w-3 h-3" />
                        <span>{session.students} students</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{session.time}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {session.duration}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
