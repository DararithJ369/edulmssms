"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Bookmark, CheckCircle2, Flame, GraduationCap, BookOpen, Users } from "lucide-react"
import { Star } from "lucide-react"

export type TeacherBadge = "topTutor" | "certified" | "ielts" | "newTutor" | "highDemand"

interface TeacherCardProps {
  name: string
  avatar: string
  subject: string
  rating: number
  isVerified?: boolean
  badge?: TeacherBadge
  badgeCount?: number
  description: string
  lessonsCount: number
  coursesCount: number
  studentsCount: string
  hourlyRate: number
  originalRate?: number
  isBookmarked?: boolean
  variant?: "light" | "dark"
}

const badgeConfig: Record<TeacherBadge, { label: string; bg: string; text: string }> = {
  topTutor: { label: "TOP Tutor", bg: "bg-emerald-500", text: "text-white" },
  certified: { label: "Certified", bg: "bg-violet-500", text: "text-white" },
  ielts: { label: "IELTS", bg: "bg-slate-700", text: "text-white" },
  newTutor: { label: "New Tutor", bg: "bg-violet-500", text: "text-white" },
  highDemand: { label: "High Demand", bg: "bg-amber-500", text: "text-white" },
}

export function TeacherCard({
  name,
  avatar,
  subject,
  rating,
  isVerified = false,
  badge,
  badgeCount,
  description,
  lessonsCount,
  coursesCount,
  studentsCount,
  hourlyRate,
  originalRate,
  isBookmarked = false,
  variant = "light",
}: TeacherCardProps) {
  const isDark = variant === "dark"

  return (
    <div
      className={`rounded-2xl p-5 ${
        isDark ? "bg-slate-900 text-white" : "bg-card text-card-foreground border border-border"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12">
            <AvatarImage src={avatar} />
            <AvatarFallback>{name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {badge && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${badgeConfig[badge].bg} ${badgeConfig[badge].text}`}
                >
                  {badgeConfig[badge].label}
                </span>
              )}
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="text-xs font-medium">{rating}</span>
              </div>
              {badgeCount && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${isDark ? "bg-slate-700" : "bg-violet-100 text-violet-600"}`}>
                  +{badgeCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-semibold text-sm">{name}</span>
              {isVerified && (
                <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-500" />
              )}
            </div>
            <p className={`text-xs ${isDark ? "text-slate-400" : "text-muted-foreground"}`}>
              {subject}
            </p>
          </div>
        </div>
        <button
          className={`p-2 rounded-lg transition-colors ${
            isBookmarked
              ? "bg-primary text-white"
              : isDark
              ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          <Bookmark className="w-4 h-4" fill={isBookmarked ? "currentColor" : "none"} />
        </button>
      </div>

      {/* Description */}
      <p className={`text-sm mb-4 line-clamp-3 ${isDark ? "text-slate-300" : "text-muted-foreground"}`}>
        {description}
      </p>

      {/* Stats */}
      <div className={`flex items-center gap-4 text-xs mb-4 ${isDark ? "text-slate-400" : "text-muted-foreground"}`}>
        <div className="flex items-center gap-1">
          <GraduationCap className="w-4 h-4" />
          <span>{lessonsCount} lessons conducted</span>
        </div>
      </div>
      <div className={`flex items-center gap-4 text-xs mb-4 ${isDark ? "text-slate-400" : "text-muted-foreground"}`}>
        <div className="flex items-center gap-1">
          <BookOpen className="w-4 h-4" />
          <span>{coursesCount} courses</span>
        </div>
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          <span>{studentsCount} students</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {originalRate && (
            <>
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="text-xl font-bold">${hourlyRate}</span>
              <span className={`text-sm line-through ${isDark ? "text-slate-500" : "text-muted-foreground"}`}>
                ${originalRate}
              </span>
              <span className={`text-sm ${isDark ? "text-slate-400" : "text-muted-foreground"}`}>/hr</span>
            </>
          )}
          {!originalRate && (
            <>
              <span className="text-xl font-bold">${hourlyRate}</span>
              <span className={`text-sm ${isDark ? "text-slate-400" : "text-muted-foreground"}`}>/hr</span>
            </>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className={isDark ? "border-slate-600 text-white hover:bg-slate-700" : ""}
        >
          View More
        </Button>
      </div>
    </div>
  )
}
