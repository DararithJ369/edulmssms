"use client"

import { Bookmark, Star, CheckCircle, Users, BookOpen, GraduationCap, Flame } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

interface TutorCardProps {
  name: string
  avatar: string
  role: string
  rating: number
  isTopTutor?: boolean
  isVerified?: boolean
  description: string
  tags: string[]
  additionalTagsCount?: number
  lessonsCount: number
  coursesCount: number
  studentsCount: string
  hourlyRate: number
}

export function TutorCard({
  name,
  avatar,
  role,
  rating,
  isTopTutor = false,
  isVerified = false,
  description,
  tags,
  additionalTagsCount = 0,
  lessonsCount,
  coursesCount,
  studentsCount,
  hourlyRate,
}: TutorCardProps) {
  return (
    <div className="bg-card rounded-2xl p-5 shadow-lg border border-border w-80">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-14 h-14">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback>
              {name.split(" ").map((n) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              {isTopTutor && (
                <span className="bg-emerald-100 text-emerald-600 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" /> Top Tutor
                </span>
              )}
              <span className="bg-amber-100 text-amber-600 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                <Star className="w-3 h-3 fill-current" /> {rating}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-card-foreground">{name}</span>
              {isVerified && (
                <CheckCircle className="w-4 h-4 text-blue-500 fill-blue-500" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">{role}</p>
          </div>
        </div>
        <button className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors">
          <Bookmark className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
        {description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {tags.map((tag) => (
          <span
            key={tag}
            className="px-3 py-1.5 bg-muted rounded-full text-sm text-card-foreground"
          >
            {tag}
          </span>
        ))}
        {additionalTagsCount > 0 && (
          <span className="px-3 py-1.5 bg-muted rounded-full text-sm text-muted-foreground">
            +{additionalTagsCount}
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
        <div className="flex items-center gap-1.5">
          <GraduationCap className="w-4 h-4" />
          <span>{lessonsCount} lessons conducted</span>
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-5">
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-4 h-4" />
          <span>{coursesCount} courses</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="w-4 h-4" />
          <span>{studentsCount} students</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center gap-1">
          <Flame className="w-5 h-5 text-orange-500" />
          <span className="text-2xl font-bold text-card-foreground">
            ${hourlyRate}
          </span>
          <span className="text-muted-foreground">/hr</span>
        </div>
        <Button variant="outline" className="rounded-full">
          View More
        </Button>
      </div>
    </div>
  )
}
