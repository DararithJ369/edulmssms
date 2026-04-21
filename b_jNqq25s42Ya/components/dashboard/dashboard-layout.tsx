"use client"

import { ReactNode } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { RoleSwitcher } from "@/components/role-switcher"
import { useRole } from "@/contexts/role-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell, Search } from "lucide-react"

interface DashboardLayoutProps {
  children: ReactNode
  rightSidebar?: ReactNode
}

export function DashboardLayout({ children, rightSidebar }: DashboardLayoutProps) {
  const { user } = useRole()

  return (
    <div className="min-h-screen bg-background p-4 lg:p-6">
      <div className="max-w-[1600px] mx-auto flex gap-6">
        {/* Left Sidebar */}
        <div className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-6">
            <Sidebar />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-6 gap-4">
            {/* Search Bar */}
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search"
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Right section */}
            <div className="flex items-center gap-4">
              <RoleSwitcher />
              <button className="relative p-2 rounded-xl hover:bg-card transition-colors">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <Avatar className="w-10 h-10 border-2 border-border">
                <AvatarImage src={user.avatar} />
                <AvatarFallback>{user.name[0]}</AvatarFallback>
              </Avatar>
            </div>
          </div>

          {/* Page Content */}
          {children}
        </div>

        {/* Right Sidebar */}
        {rightSidebar && (
          <div className="hidden xl:flex flex-col gap-4 w-80 shrink-0">
            {rightSidebar}
          </div>
        )}
      </div>
    </div>
  )
}
