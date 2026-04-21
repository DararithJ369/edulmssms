"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { TeacherCard, TeacherBadge } from "@/components/dashboard/teacher-card"
import { Search, SlidersHorizontal, Bookmark, ChevronRight, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

interface Teacher {
  name: string
  avatar: string
  subject: string
  rating: number
  isVerified: boolean
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

const economicsTeachers: Teacher[] = [
  {
    name: "Carole Towne",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=carole",
    subject: "Economics teacher",
    rating: 4.9,
    isVerified: true,
    badge: "topTutor",
    description: "Ready to unravel the complexities of supply, demand, and market forces? Dive into my Economics course now!",
    lessonsCount: 132,
    coursesCount: 24,
    studentsCount: "250+",
    hourlyRate: 32,
    originalRate: 46,
    isBookmarked: true,
    variant: "dark",
  },
  {
    name: "Ralph Legros",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ralph",
    subject: "Economics teacher",
    rating: 4.9,
    isVerified: true,
    badge: "certified",
    badgeCount: 2,
    description: "From micro to macroeconomics, discover the keys to understanding economic phenomena in my comprehensive courses.",
    lessonsCount: 174,
    coursesCount: 32,
    studentsCount: "250+",
    hourlyRate: 23,
    originalRate: 32,
    isBookmarked: true,
    variant: "dark",
  },
  {
    name: "Jenny Wilson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=jenny",
    subject: "Economics teacher",
    rating: 4.9,
    isVerified: true,
    badge: "topTutor",
    description: "Economics isn't just a subject - it's the lens through which we view society. I will help you explore its profound implications.",
    lessonsCount: 116,
    coursesCount: 17,
    studentsCount: "150+",
    hourlyRate: 17,
  },
]

const englishTeachers: Teacher[] = [
  {
    name: "Jeff Blanda-Bartoletti",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=jeff",
    subject: "English teacher",
    rating: 4.9,
    isVerified: true,
    badge: "ielts",
    description: "Ready to sharpen your language skills and literary analysis? My courses offer the tools to excel in English studies.",
    lessonsCount: 185,
    coursesCount: 16,
    studentsCount: "100+",
    hourlyRate: 20,
  },
  {
    name: "Darla Fritsch",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=darla",
    subject: "English teacher",
    rating: 4.9,
    isVerified: true,
    badge: "newTutor",
    isBookmarked: true,
    description: "Transform your relationship with words and stories. Explore my English courses to unleash your creative potential.",
    lessonsCount: 157,
    coursesCount: 12,
    studentsCount: "50+",
    hourlyRate: 12,
  },
  {
    name: "Juliet Heidenreich",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=juliet",
    subject: "English teacher",
    rating: 4.9,
    isVerified: true,
    badge: "highDemand",
    isBookmarked: true,
    description: "Hello Student! Let's talk results: My students reach B2 in 9 months; no fear of speaking in 3 months. Ready? Join!",
    lessonsCount: 292,
    coursesCount: 36,
    studentsCount: "300+",
    hourlyRate: 32,
    originalRate: 42,
    variant: "dark",
  },
]

export default function TeachersPage() {
  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Teachers</h1>
          <p className="text-muted-foreground">
            Search for specific subjects and find the teachers you&apos;re ready to take a course with.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-full">
          <Switch id="teacher-mode" />
          <label htmlFor="teacher-mode" className="text-sm font-medium cursor-pointer">
            Activate teacher account
          </label>
          <HelpCircle className="w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search teachers"
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-muted-foreground">Sort:</span>
          <Select defaultValue="popular">
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Most popular</SelectItem>
              <SelectItem value="rating">Highest rated</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <SlidersHorizontal className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Bookmark className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Economics Teachers */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Economics teachers</h2>
          <button className="text-sm text-primary hover:underline flex items-center gap-1">
            View all
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {economicsTeachers.map((teacher, i) => (
            <TeacherCard key={i} {...teacher} />
          ))}
        </div>
      </div>

      {/* English Teachers */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">English teachers</h2>
          <button className="text-sm text-primary hover:underline flex items-center gap-1">
            View all
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {englishTeachers.map((teacher, i) => (
            <TeacherCard key={i} {...teacher} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
