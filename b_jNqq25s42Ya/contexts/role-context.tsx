"use client"

import { createContext, useContext, useState, ReactNode } from "react"

export type UserRole = "student" | "instructor" | "parent" | "admin"

interface RoleContextType {
  role: UserRole
  setRole: (role: UserRole) => void
  isAdmin: boolean // True if the actual user is an admin (can switch roles)
  setIsAdmin: (isAdmin: boolean) => void
  user: {
    name: string
    email: string
    avatar: string
  }
}

const RoleContext = createContext<RoleContextType | undefined>(undefined)

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>("student")
  const [isAdmin, setIsAdmin] = useState(false) // Set to true to enable role switching

  const user = {
    name: role === "student" ? "John Doe" : 
          role === "instructor" ? "Dr. Sarah Wilson" :
          role === "parent" ? "Michael Smith" : "Admin User",
    email: role === "student" ? "john@student.edu" :
           role === "instructor" ? "sarah@instructor.edu" :
           role === "parent" ? "michael@parent.edu" : "admin@skillzone.com",
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${role}`,
  }

  return (
    <RoleContext.Provider value={{ role, setRole, isAdmin, setIsAdmin, user }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const context = useContext(RoleContext)
  if (context === undefined) {
    throw new Error("useRole must be used within a RoleProvider")
  }
  return context
}
