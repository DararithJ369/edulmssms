"use client"

import Image from "next/image"
import { Bookmark, Users, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface CourseCardProps {
  image: string
  level: "Beginner" | "Intermediate" | "Advanced"
  students: number
  rating: number
  title: string
  instructor: {
    name: string
    avatar: string
  }
  className?: string
}

const levelColors = {
  Beginner: "text-emerald-500",
  Intermediate: "text-orange-500",
  Advanced: "text-purple-500",
}

export function CourseCard({
  image,
  level,
  students,
  rating,
  title,
  instructor,
  className,
}: CourseCardProps) {
  return (
    <div className={cn("bg-card rounded-2xl p-3 shadow-sm", className)}>
      {/* Image Container */}
      <div className="relative mb-3">
        <div className="aspect-[4/3] rounded-xl overflow-hidden relative">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover"
          />
        </div>
        <button className="absolute top-2 right-2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-white transition-colors">
          <Bookmark className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Meta Info */}
      <div className="flex items-center justify-between mb-2">
        <span className={cn("text-sm font-medium", levelColors[level])}>
          {level}
        </span>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{students}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>{rating}</span>
          </div>
        </div>
      </div>

      {/* Title */}
      <h3 className="font-medium text-sm text-card-foreground line-clamp-2 mb-3">
        {title}
      </h3>

      {/* Instructor */}
      <div className="flex items-center gap-2">
        <Avatar className="w-7 h-7">
          <AvatarImage src={instructor.avatar} alt={instructor.name} />
          <AvatarFallback className="text-xs">
            {instructor.name.split(" ").map((n) => n[0]).join("")}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm text-primary font-medium">
          {instructor.name}
        </span>
      </div>
    </div>
  )
}
