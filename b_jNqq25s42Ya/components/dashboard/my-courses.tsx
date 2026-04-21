"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const courses = [
  {
    icon: "🎮",
    title: "AI & Virtual Reality",
    emoji: "🎬",
    sessions: { completed: 9, total: 12 },
    participants: [
      "https://api.dicebear.com/7.x/avataaars/svg?seed=user1",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=user2",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=user3",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=user4",
    ],
    additionalCount: 17,
  },
  {
    icon: "📷",
    title: "Photography",
    emoji: "📸",
    sessions: { completed: 16, total: 24 },
    participants: [
      "https://api.dicebear.com/7.x/avataaars/svg?seed=user5",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=user6",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=user7",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=user8",
    ],
    additionalCount: 9,
  },
  {
    icon: "🌱",
    title: "Business Ecosystem: Introduction",
    emoji: "🌿",
    sessions: { completed: 11, total: 18 },
    participants: [
      "https://api.dicebear.com/7.x/avataaars/svg?seed=user9",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=user10",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=user11",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=user12",
    ],
    additionalCount: 11,
  },
]

export function MyCourses() {
  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-card-foreground">My Courses</h3>
        <button className="text-sm text-primary hover:underline">
          View all
        </button>
      </div>

      <div className="space-y-3">
        {courses.map((course, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center text-lg">
              {course.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-card-foreground flex items-center gap-1.5 truncate">
                {course.title} <span>{course.emoji}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Sessions completed: {course.sessions.completed}/
                {course.sessions.total}
              </p>
            </div>
            <div className="flex items-center">
              <div className="flex -space-x-2">
                {course.participants.slice(0, 3).map((avatar, j) => (
                  <Avatar key={j} className="w-7 h-7 border-2 border-card">
                    <AvatarImage src={avatar} />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <span className="ml-2 text-xs text-orange-500 font-medium">
                +{course.additionalCount}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
