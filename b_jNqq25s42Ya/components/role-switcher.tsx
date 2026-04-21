"use client"

import { useRole, UserRole } from "@/contexts/role-context"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { GraduationCap, BookOpen, Users, Shield } from "lucide-react"

const roles: { value: UserRole; label: string; icon: React.ElementType }[] = [
  { value: "student", label: "Student", icon: GraduationCap },
  { value: "instructor", label: "Instructor", icon: BookOpen },
  { value: "parent", label: "Parent", icon: Users },
  { value: "admin", label: "Admin", icon: Shield },
]

const roleLabels: Record<UserRole, { label: string; icon: React.ElementType }> = {
  student: { label: "Student", icon: GraduationCap },
  instructor: { label: "Instructor", icon: BookOpen },
  parent: { label: "Parent", icon: Users },
  admin: { label: "Admin", icon: Shield },
}

export function RoleSwitcher() {
  const { role, setRole, isAdmin } = useRole()

  // Only admin users can switch between roles
  if (!isAdmin) {
    const currentRole = roleLabels[role]
    const Icon = currentRole.icon
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-md text-sm">
        <Icon className="w-4 h-4" />
        <span>{currentRole.label}</span>
      </div>
    )
  }

  return (
    <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
      <SelectTrigger className="w-[160px] bg-card border-border">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {roles.map((r) => (
          <SelectItem key={r.value} value={r.value}>
            <div className="flex items-center gap-2">
              <r.icon className="w-4 h-4" />
              <span>{r.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
