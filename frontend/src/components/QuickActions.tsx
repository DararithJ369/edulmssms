"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Zap,
  GraduationCap,
  UserSquare2,
  Users,
  ClipboardList,
  BookOpen,
  Megaphone,
  Layers3,
  X,
} from "lucide-react";
import { cn } from "@/lib/ui";

type QuickAction = {
  label: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
};

const quickActionsByRole: Record<string, QuickAction[]> = {
  admin: [
    {
      label: "New Student",
      description: "Register a student account",
      icon: GraduationCap,
      href: "/list/students?action=create",
      color: "text-sky-600 bg-sky-50 border-sky-200 hover:bg-sky-100",
    },
    {
      label: "New Lecturer",
      description: "Add a faculty member",
      icon: UserSquare2,
      href: "/list/teachers?action=create",
      color: "text-violet-600 bg-violet-50 border-violet-200 hover:bg-violet-100",
    },
    {
      label: "New Class",
      description: "Create a class section",
      icon: Users,
      href: "/list/classes?action=create",
      color: "text-indigo-600 bg-indigo-50 border-indigo-200 hover:bg-indigo-100",
    },
    {
      label: "New Assignment",
      description: "Create an assignment",
      icon: ClipboardList,
      href: "/list/assignments?action=create",
      color: "text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100",
    },
    {
      label: "New Announcement",
      description: "Broadcast to all users",
      icon: Megaphone,
      href: "/list/announcements?action=create",
      color: "text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100",
    },
  ],
  teacher: [
    /* {
      label: "New Lesson",
      description: "Add a lesson to a course",
      icon: Layers3,
      href: "/list/lessons/create",
      color: "text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100",
    }, */
    {
      label: "New Assignment",
      description: "Create an assignment",
      icon: ClipboardList,
      href: "/list/assignments?action=create",
      color: "text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100",
    },
    {
      label: "New Announcement",
      description: "Post to your students",
      icon: Megaphone,
      href: "/list/announcements?action=create",
      color: "text-violet-600 bg-violet-50 border-violet-200 hover:bg-violet-100",
    },
    {
      label: "View Courses",
      description: "Manage your courses",
      icon: BookOpen,
      href: "/list/courses",
      color: "text-sky-600 bg-sky-50 border-sky-200 hover:bg-sky-100",
    },
  ],
  student: [
    {
      label: "My Assignments",
      description: "View pending work",
      icon: ClipboardList,
      href: "/list/assignments",
      color: "text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100",
    },
    {
      label: "Browse Courses",
      description: "Explore your courses",
      icon: BookOpen,
      href: "/list/courses",
      color: "text-sky-600 bg-sky-50 border-sky-200 hover:bg-sky-100",
    },
  ],
  parent: [
    {
      label: "View Grades",
      description: "Check student progress",
      icon: GraduationCap,
      href: "/list/results",
      color: "text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100",
    },
    {
      label: "Announcements",
      description: "School notices",
      icon: Megaphone,
      href: "/list/announcements",
      color: "text-indigo-600 bg-indigo-50 border-indigo-200 hover:bg-indigo-100",
    },
  ],
};

type QuickActionsProps = {
  role: string;
  isCollapsed?: boolean;
};

export function QuickActions({ role, isCollapsed = false }: QuickActionsProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const actions = quickActionsByRole[role] || quickActionsByRole.student;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Esc
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div ref={ref} className="relative w-full">
      {/* Trigger */}
      <button
        onClick={() => setIsOpen((p) => !p)}
        title="Quick Actions"
        className={cn(
          "flex items-center gap-2.5 w-full rounded-xl border transition-all duration-200 select-none",
          "border-border/60 bg-card/60 hover:bg-accent/40 hover:border-border",
          "text-muted-foreground hover:text-foreground",
          isCollapsed
            ? "justify-center p-2.5 h-10 w-10 mx-auto"
            : "px-3 py-2.5",
          isOpen && "bg-accent/40 border-border text-foreground"
        )}
      >
        <Zap
          className={cn(
            "h-4 w-4 shrink-0 transition-colors",
            isOpen && "text-amber-500"
          )}
        />
        {!isCollapsed && (
          <span className="text-[12.5px] font-semibold">Quick Actions</span>
        )}
      </button>

      {/* Popover */}
      {isOpen && (
        <div
          className={cn(
            "absolute z-[9997] w-[260px] rounded-2xl border border-border/80 bg-card shadow-[0_16px_50px_rgba(0,0,0,0.12)] overflow-hidden",
            "animate-in fade-in slide-in-from-bottom-2 duration-200",
            isCollapsed ? "left-12 bottom-0" : "left-0 bottom-full mb-2"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Quick Actions
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-accent/50 text-muted-foreground/60 hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          {/* Actions */}
          <div className="p-2 space-y-1">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => {
                    router.push(action.href);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 px-2.5 py-2 rounded-xl border text-left transition-all duration-150 group",
                    action.color
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold leading-none">{action.label}</p>
                    <p className="text-[10px] opacity-70 mt-0.5 leading-none">{action.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
