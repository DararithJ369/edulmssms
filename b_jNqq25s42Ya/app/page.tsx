"use client"

import { useRouter } from "next/navigation"
import { useRole, UserRole } from "@/contexts/role-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap, BookOpen, Users, Shield, Box } from "lucide-react"

const roleOptions: { 
  value: UserRole
  label: string
  description: string
  icon: React.ElementType
  color: string
}[] = [
  { 
    value: "student", 
    label: "Student", 
    description: "Access courses, find teachers, and track your learning progress",
    icon: GraduationCap,
    color: "bg-blue-500"
  },
  { 
    value: "instructor", 
    label: "Instructor", 
    description: "Manage your courses, students, and view your earnings",
    icon: BookOpen,
    color: "bg-emerald-500"
  },
  { 
    value: "parent", 
    label: "Parent", 
    description: "Monitor your children's progress and manage payments",
    icon: Users,
    color: "bg-amber-500"
  },
  { 
    value: "admin", 
    label: "Admin", 
    description: "Full platform access - manage users, content, and view all dashboards",
    icon: Shield,
    color: "bg-primary"
  },
]

export default function LoginPage() {
  const router = useRouter()
  const { setRole, setIsAdmin } = useRole()

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole)
    // Only admin users can switch between roles after login
    setIsAdmin(selectedRole === "admin")
    router.push(`/${selectedRole}`)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
            <Box className="w-7 h-7 text-white" />
          </div>
          <span className="text-3xl font-bold text-foreground">skillzone</span>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl">Welcome to Skillzone</CardTitle>
            <CardDescription className="text-base">
              Select your role to continue to the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {roleOptions.map((option) => {
                const Icon = option.icon
                return (
                  <Button
                    key={option.value}
                    variant="outline"
                    className="h-auto p-6 flex flex-col items-start gap-3 hover:border-primary hover:bg-primary/5 transition-all"
                    onClick={() => handleRoleSelect(option.value)}
                  >
                    <div className={`w-12 h-12 ${option.color} rounded-xl flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-lg text-foreground">{option.label}</p>
                      <p className="text-sm text-muted-foreground font-normal">
                        {option.description}
                      </p>
                    </div>
                    {option.value === "admin" && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        Can view all roles
                      </span>
                    )}
                  </Button>
                )
              })}
            </div>
            
            <p className="text-center text-sm text-muted-foreground mt-6">
              This is a demo. In production, authentication would determine your role.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
