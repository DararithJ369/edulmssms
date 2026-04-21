"use client"

import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useRole, UserRole } from "@/contexts/role-context"
import {
  LayoutDashboard,
  BookOpen,
  Users,
  MessageCircle,
  BarChart3,
  CreditCard,
  Box,
  Settings,
  Headphones,
  GraduationCap,
  Calendar,
  FileText,
  Bell,
  ShieldCheck,
  PieChart,
  UserCog,
  FolderOpen,
  Award,
} from "lucide-react"

type NavItem = {
  icon: React.ElementType
  label: string
  href: string
  badge?: number
}

const navConfigs: Record<UserRole, { main: NavItem[]; bottom: NavItem[] }> = {
  student: {
    main: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/student" },
      { icon: BookOpen, label: "Courses", href: "/student/courses" },
      { icon: Users, label: "Teachers", href: "/student/teachers" },
      { icon: MessageCircle, label: "Messages", href: "/student/messages", badge: 8 },
      { icon: BarChart3, label: "Analytics", href: "/student/analytics" },
      { icon: CreditCard, label: "Payments", href: "/student/payments" },
    ],
    bottom: [
      { icon: Headphones, label: "Support", href: "/student/support" },
      { icon: Settings, label: "Settings", href: "/student/settings" },
    ],
  },
  instructor: {
    main: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/instructor" },
      { icon: BookOpen, label: "My Courses", href: "/instructor/courses" },
      { icon: GraduationCap, label: "Students", href: "/instructor/students" },
      { icon: Calendar, label: "Schedule", href: "/instructor/schedule" },
      { icon: MessageCircle, label: "Messages", href: "/instructor/messages", badge: 5 },
      { icon: BarChart3, label: "Analytics", href: "/instructor/analytics" },
      { icon: CreditCard, label: "Earnings", href: "/instructor/earnings" },
    ],
    bottom: [
      { icon: Headphones, label: "Support", href: "/instructor/support" },
      { icon: Settings, label: "Settings", href: "/instructor/settings" },
    ],
  },
  parent: {
    main: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/parent" },
      { icon: Users, label: "My Children", href: "/parent/children" },
      { icon: FileText, label: "Progress Reports", href: "/parent/reports" },
      { icon: Calendar, label: "Schedule", href: "/parent/schedule" },
      { icon: MessageCircle, label: "Messages", href: "/parent/messages", badge: 3 },
      { icon: CreditCard, label: "Payments", href: "/parent/payments" },
    ],
    bottom: [
      { icon: Headphones, label: "Support", href: "/parent/support" },
      { icon: Settings, label: "Settings", href: "/parent/settings" },
    ],
  },
  admin: {
    main: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
      { icon: UserCog, label: "Users", href: "/admin/users" },
      { icon: BookOpen, label: "Courses", href: "/admin/courses" },
      { icon: Award, label: "Instructors", href: "/admin/instructors" },
      { icon: FolderOpen, label: "Content", href: "/admin/content" },
      { icon: PieChart, label: "Reports", href: "/admin/reports" },
      { icon: Bell, label: "Notifications", href: "/admin/notifications" },
      { icon: ShieldCheck, label: "Moderation", href: "/admin/moderation" },
    ],
    bottom: [
      { icon: Settings, label: "Settings", href: "/admin/settings" },
    ],
  },
}

export function Sidebar() {
  const pathname = usePathname()
  const { role } = useRole()
  const config = navConfigs[role]

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground rounded-3xl p-6 flex flex-col min-h-[calc(100vh-3rem)]">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
          <Box className="w-6 h-6 text-white" />
        </div>
        <span className="text-xl font-semibold text-white">skillzone</span>
      </div>

      {/* Main Navigation */}
      <nav className="flex flex-col gap-2">
        {config.main.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== `/${role}` && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all",
                isActive
                  ? "bg-white text-sidebar"
                  : "text-white/80 hover:bg-sidebar-accent"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
              {item.badge && (
                <span className="ml-auto bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1 min-h-8" />

      {/* Bottom Navigation */}
      <nav className="flex flex-col gap-2">
        {config.bottom.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all",
                isActive
                  ? "bg-white text-sidebar"
                  : "text-white/80 hover:bg-sidebar-accent"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
