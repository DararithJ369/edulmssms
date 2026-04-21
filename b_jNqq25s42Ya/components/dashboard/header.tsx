"use client"

import { Bell } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface HeaderProps {
  date: string
  day: string
}

export function Header({ date, day }: HeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{day}</h2>
        <p className="text-sm text-muted-foreground">{date}</p>
      </div>
      <div className="flex items-center gap-3">
        <button className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-muted transition-colors shadow-sm">
          <Bell className="w-5 h-5 text-muted-foreground" />
        </button>
        <Avatar className="w-10 h-10 cursor-pointer">
          <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=admin" />
          <AvatarFallback>AD</AvatarFallback>
        </Avatar>
      </div>
    </div>
  )
}
