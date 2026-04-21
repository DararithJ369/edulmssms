"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  BookOpen,
  Clock,
  TrendingUp,
  Award,
  ChevronRight,
  Calendar,
  MessageCircle,
  Star,
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts"

const children = [
  {
    name: "Emma Smith",
    avatar: "emma-child",
    grade: "8th Grade",
    overallProgress: 78,
    activeCourses: 4,
    hoursThisWeek: 12,
    streak: 7,
    nextClass: "Mathematics",
    nextClassTime: "10:00 AM",
  },
  {
    name: "Lucas Smith",
    avatar: "lucas-child",
    grade: "5th Grade",
    overallProgress: 65,
    activeCourses: 3,
    hoursThisWeek: 8,
    streak: 5,
    nextClass: "Science",
    nextClassTime: "11:30 AM",
  },
]

const recentActivities = [
  { child: "Emma", activity: "Completed Python Basics Quiz", score: "92%", time: "2 hours ago", type: "quiz" },
  { child: "Lucas", activity: "Watched Science Video", time: "3 hours ago", type: "video" },
  { child: "Emma", activity: "Started new course: Data Science", time: "1 day ago", type: "course" },
  { child: "Lucas", activity: "Completed Math Assignment", score: "85%", time: "1 day ago", type: "assignment" },
]

const weeklyProgress = [
  { day: "Mon", emma: 2.5, lucas: 1.5 },
  { day: "Tue", emma: 3, lucas: 2 },
  { day: "Wed", emma: 2, lucas: 1 },
  { day: "Thu", emma: 3.5, lucas: 2.5 },
  { day: "Fri", emma: 2, lucas: 1.5 },
  { day: "Sat", emma: 1, lucas: 0.5 },
  { day: "Sun", emma: 0, lucas: 0 },
]

const upcomingPayments = [
  { course: "Advanced Mathematics", child: "Emma", amount: 49, dueDate: "Apr 15" },
  { course: "Science Fundamentals", child: "Lucas", amount: 39, dueDate: "Apr 20" },
]

export default function ParentDashboard() {
  return (
    <DashboardLayout>
      {/* Welcome Section */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">
          Good morning, Michael!
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s how your children are doing this week.
        </p>
      </div>

      {/* Children Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {children.map((child, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${child.avatar}`} />
                    <AvatarFallback>{child.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{child.name}</h3>
                    <p className="text-sm text-muted-foreground">{child.grade}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    View Profile
                  </Button>
                </div>
              </div>
              <div className="p-4">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Overall Progress</span>
                    <span className="text-sm font-medium">{child.overallProgress}%</span>
                  </div>
                  <Progress value={child.overallProgress} className="h-2" />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <BookOpen className="w-4 h-4 mx-auto text-primary mb-1" />
                    <p className="text-lg font-semibold">{child.activeCourses}</p>
                    <p className="text-xs text-muted-foreground">Courses</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <Clock className="w-4 h-4 mx-auto text-emerald-500 mb-1" />
                    <p className="text-lg font-semibold">{child.hoursThisWeek}h</p>
                    <p className="text-xs text-muted-foreground">This Week</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <TrendingUp className="w-4 h-4 mx-auto text-amber-500 mb-1" />
                    <p className="text-lg font-semibold">{child.streak}</p>
                    <p className="text-xs text-muted-foreground">Day Streak</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <Award className="w-4 h-4 mx-auto text-rose-500 mb-1" />
                    <p className="text-lg font-semibold">A</p>
                    <p className="text-xs text-muted-foreground">Avg Grade</p>
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-xs text-muted-foreground mb-1">Next Class</p>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{child.nextClass}</span>
                    <span className="text-sm text-primary">{child.nextClassTime}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Weekly Study Hours */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Weekly Study Hours</CardTitle>
            <button className="text-sm text-primary hover:underline flex items-center gap-1">
              View details
              <ChevronRight className="w-4 h-4" />
            </button>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyProgress}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} tickFormatter={(v) => `${v}h`} />
                  <Area type="monotone" dataKey="emma" stackId="1" stroke="oklch(0.55 0.18 280)" fill="oklch(0.55 0.18 280 / 0.3)" />
                  <Area type="monotone" dataKey="lucas" stackId="2" stroke="oklch(0.7 0.15 160)" fill="oklch(0.7 0.15 160 / 0.3)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-xs text-muted-foreground">Emma</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs text-muted-foreground">Lucas</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Payments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Upcoming Payments</CardTitle>
            <button className="text-sm text-primary hover:underline flex items-center gap-1">
              View all
              <ChevronRight className="w-4 h-4" />
            </button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingPayments.map((payment, i) => (
                <div key={i} className="p-3 rounded-xl bg-muted/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{payment.course}</span>
                    <span className="font-bold">${payment.amount}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>For {payment.child}</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Due {payment.dueDate}
                    </span>
                  </div>
                </div>
              ))}
              <Button className="w-full" variant="outline">
                View Payment History
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
          <button className="text-sm text-primary hover:underline flex items-center gap-1">
            View all
            <ChevronRight className="w-4 h-4" />
          </button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((activity, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    activity.type === "quiz" ? "bg-violet-100" :
                    activity.type === "video" ? "bg-emerald-100" :
                    activity.type === "course" ? "bg-amber-100" : "bg-rose-100"
                  }`}>
                    {activity.type === "quiz" && <Star className="w-5 h-5 text-violet-600" />}
                    {activity.type === "video" && <BookOpen className="w-5 h-5 text-emerald-600" />}
                    {activity.type === "course" && <TrendingUp className="w-5 h-5 text-amber-600" />}
                    {activity.type === "assignment" && <Award className="w-5 h-5 text-rose-600" />}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{activity.activity}</p>
                    <p className="text-xs text-muted-foreground">{activity.child}</p>
                  </div>
                </div>
                <div className="text-right">
                  {activity.score && (
                    <p className="font-medium text-sm text-emerald-500">{activity.score}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
          <MessageCircle className="w-5 h-5" />
          <span>Message Teachers</span>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
          <Calendar className="w-5 h-5" />
          <span>View Schedule</span>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
          <BookOpen className="w-5 h-5" />
          <span>Browse Courses</span>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
          <Award className="w-5 h-5" />
          <span>View Reports</span>
        </Button>
      </div>
    </DashboardLayout>
  )
}
