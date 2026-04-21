"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  TrendingDown,
  GraduationCap,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MoreHorizontal,
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

const stats = [
  {
    title: "Total Users",
    value: "24,589",
    change: "+12.5%",
    positive: true,
    icon: Users,
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    breakdown: "18.2k students, 4.1k instructors, 2.3k parents",
  },
  {
    title: "Active Courses",
    value: "1,284",
    change: "+8.2%",
    positive: true,
    icon: BookOpen,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    breakdown: "324 new this month",
  },
  {
    title: "Monthly Revenue",
    value: "$284,500",
    change: "+23.1%",
    positive: true,
    icon: DollarSign,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    breakdown: "vs $231,200 last month",
  },
  {
    title: "Completion Rate",
    value: "67.8%",
    change: "-2.4%",
    positive: false,
    icon: GraduationCap,
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    breakdown: "Avg course completion",
  },
]

const revenueData = [
  { month: "Jan", revenue: 180000, users: 18500 },
  { month: "Feb", revenue: 195000, users: 19200 },
  { month: "Mar", revenue: 210000, users: 20100 },
  { month: "Apr", revenue: 225000, users: 21500 },
  { month: "May", revenue: 248000, users: 22800 },
  { month: "Jun", revenue: 284500, users: 24589 },
]

const userDistribution = [
  { name: "Students", value: 18200, color: "oklch(0.55 0.18 280)" },
  { name: "Instructors", value: 4100, color: "oklch(0.7 0.15 160)" },
  { name: "Parents", value: 2289, color: "oklch(0.75 0.15 75)" },
]

const pendingApprovals = [
  { id: 1, type: "Instructor", name: "Dr. Michael Chen", submitted: "2 hours ago", subject: "Computer Science" },
  { id: 2, type: "Course", name: "Advanced React Patterns", submitted: "5 hours ago", instructor: "Jane Smith" },
  { id: 3, type: "Instructor", name: "Sarah Johnson", submitted: "1 day ago", subject: "Mathematics" },
  { id: 4, type: "Course", name: "Data Visualization Mastery", submitted: "1 day ago", instructor: "Alex Wong" },
]

const recentReports = [
  { id: 1, type: "Content", description: "Inappropriate language in course comments", status: "pending", reporter: "John D." },
  { id: 2, type: "User", description: "Spam behavior detected", status: "resolved", reporter: "System" },
  { id: 3, type: "Payment", description: "Refund request dispute", status: "in-review", reporter: "Maria S." },
]

const topInstructors = [
  { name: "Dr. Sarah Wilson", avatar: "sarah-admin", students: 2450, rating: 4.9, revenue: "$45,200" },
  { name: "Prof. James Lee", avatar: "james-admin", students: 1890, rating: 4.8, revenue: "$38,500" },
  { name: "Dr. Emily Brown", avatar: "emily-admin", students: 1654, rating: 4.9, revenue: "$32,100" },
]

export default function AdminDashboard() {
  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Platform overview and management
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">Export Report</Button>
          <Button>Generate Analytics</Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
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
              <p className="text-2xl font-bold mb-1">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.breakdown}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Revenue & User Growth</CardTitle>
            <button className="text-sm text-primary hover:underline flex items-center gap-1">
              View details
              <ChevronRight className="w-4 h-4" />
            </button>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} tickFormatter={(v) => `$${v/1000}k`} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} tickFormatter={(v) => `${v/1000}k`} />
                  <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="oklch(0.55 0.18 280)" fill="oklch(0.55 0.18 280 / 0.2)" strokeWidth={2} />
                  <Area yAxisId="right" type="monotone" dataKey="users" stroke="oklch(0.7 0.15 160)" fill="oklch(0.7 0.15 160 / 0.2)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-xs text-muted-foreground">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs text-muted-foreground">Users</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">User Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={userDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {userDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {userDistribution.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium">{item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Pending Approvals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-semibold">Pending Approvals</CardTitle>
              <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                {pendingApprovals.length}
              </Badge>
            </div>
            <button className="text-sm text-primary hover:underline flex items-center gap-1">
              View all
              <ChevronRight className="w-4 h-4" />
            </button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingApprovals.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      item.type === "Instructor" ? "bg-violet-100" : "bg-emerald-100"
                    }`}>
                      {item.type === "Instructor" ? (
                        <Users className="w-5 h-5 text-violet-600" />
                      ) : (
                        <BookOpen className="w-5 h-5 text-emerald-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.type === "Instructor" ? item.subject : `by ${item.instructor}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{item.submitted}</span>
                    <Button size="sm" variant="ghost">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Reports */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-semibold">Recent Reports</CardTitle>
              <Badge variant="secondary" className="bg-red-100 text-red-700">
                {recentReports.filter(r => r.status === "pending").length} new
              </Badge>
            </div>
            <button className="text-sm text-primary hover:underline flex items-center gap-1">
              View all
              <ChevronRight className="w-4 h-4" />
            </button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      report.status === "pending" ? "bg-amber-100" :
                      report.status === "resolved" ? "bg-emerald-100" : "bg-violet-100"
                    }`}>
                      {report.status === "pending" && <AlertTriangle className="w-5 h-5 text-amber-600" />}
                      {report.status === "resolved" && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                      {report.status === "in-review" && <Clock className="w-5 h-5 text-violet-600" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{report.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {report.type} issue - Reported by {report.reporter}
                      </p>
                    </div>
                  </div>
                  <Badge variant={
                    report.status === "pending" ? "secondary" :
                    report.status === "resolved" ? "default" : "outline"
                  } className={
                    report.status === "pending" ? "bg-amber-100 text-amber-700" :
                    report.status === "resolved" ? "bg-emerald-100 text-emerald-700" : ""
                  }>
                    {report.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Instructors */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold">Top Performing Instructors</CardTitle>
          <button className="text-sm text-primary hover:underline flex items-center gap-1">
            View all
            <ChevronRight className="w-4 h-4" />
          </button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topInstructors.map((instructor, i) => (
              <div key={i} className="p-4 rounded-xl bg-muted/50 text-center">
                <Avatar className="w-16 h-16 mx-auto mb-3">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${instructor.avatar}`} />
                  <AvatarFallback>{instructor.name[0]}</AvatarFallback>
                </Avatar>
                <h4 className="font-semibold">{instructor.name}</h4>
                <div className="flex items-center justify-center gap-1 text-amber-500 my-2">
                  {[...Array(5)].map((_, j) => (
                    <svg key={j} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                  <span className="text-sm text-foreground ml-1">{instructor.rating}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                  <div className="p-2 rounded-lg bg-background">
                    <p className="font-semibold">{instructor.students.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Students</p>
                  </div>
                  <div className="p-2 rounded-lg bg-background">
                    <p className="font-semibold">{instructor.revenue}</p>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
