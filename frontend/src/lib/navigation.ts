import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  GraduationCap,
  BarChart2,
  CalendarDays,
  Award,
  BrainCircuit,
  SearchCode,
  CalendarCheck,
  TrendingUp,
  Users,
  UserSquare2,
  Users2,
  School2,
  Layers3,
  CalendarRange,
  Building2,
  ListTree,
  BookMarked,
  Megaphone,
  CalendarDays as EventsIcon,
  MessageSquare,
  PieChart,
  LineChart,
  Sparkles,
  ShieldCheck,
  Key,
  FileSearch,
  Settings2,
  LucideIcon,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PermissionKey =
  | "view:dashboard"
  | "view:courses"
  | "view:lessons"
  | "view:assignments"
  | "view:quizzes"
  | "view:exams"
  | "view:grades"
  | "view:attendance"
  | "view:events"
  | "view:announcements"
  | "view:messages"
  | "view:certificates"
  | "view:ai-tutor"
  | "view:ai-search"
  | "view:ai-planner"
  | "view:ai-analytics"
  | "view:course-builder"
  | "view:lesson-mgmt"
  | "view:assignment-mgmt"
  | "view:gradebook-mgmt"
  | "view:student-mgmt"
  | "view:students"
  | "view:lecturers"
  | "view:parents"
  | "view:classes"
  | "view:subjects"
  | "view:faculties"
  | "view:departments"
  | "view:programs"
  | "view:enrollments"
  | "view:timetables"
  | "view:rooms"
  | "view:analytics-students"
  | "view:analytics-courses"
  | "view:analytics-ai"
  | "view:analytics-reports"
  | "view:users"
  | "view:roles"
  | "view:permissions"
  | "view:audit-logs"
  | "view:system-settings";

export interface MenuItemConfig {
  label: string;
  href?: string;
  icon: LucideIcon;
  /** Roles that can see this item. If omitted → visible to all with the permission. */
  roles?: string[];
  permission: PermissionKey;
  badge?: string | number;
  exact?: boolean;
  /** Shows a "Soon" pill instead of hiding entirely */
  comingSoon?: boolean;
}

export interface MenuSectionConfig {
  title: string;
  icon: LucideIcon;
  /** Which roles see this entire section. If omitted → permission-driven per item. */
  roles?: string[];
  /** Section starts collapsed. Defaults false. */
  defaultCollapsed?: boolean;
  items: MenuItemConfig[];
}

// ─── Role Permissions ─────────────────────────────────────────────────────────

export const rolePermissions: Record<string, PermissionKey[]> = {
  admin: [
    "view:dashboard",
    "view:courses",
    "view:lessons",
    "view:assignments",
    "view:quizzes",
    "view:exams",
    "view:grades",
    "view:attendance",
    "view:events",
    "view:announcements",
    "view:messages",
    "view:certificates",
    "view:ai-tutor",
    "view:ai-search",
    "view:ai-planner",
    "view:ai-analytics",
    "view:course-builder",
    "view:lesson-mgmt",
    "view:assignment-mgmt",
    "view:gradebook-mgmt",
    "view:student-mgmt",
    "view:students",
    "view:lecturers",
    "view:parents",
    "view:classes",
    "view:subjects",
    "view:faculties",
    "view:departments",
    "view:programs",
    "view:enrollments",
    "view:timetables",
    "view:rooms",
    "view:analytics-students",
    "view:analytics-courses",
    "view:analytics-ai",
    "view:analytics-reports",
    "view:users",
    "view:roles",
    "view:permissions",
    "view:audit-logs",
    "view:system-settings",
  ],
  teacher: [
    "view:dashboard",
    "view:courses",
    "view:lessons",
    "view:assignments",
    "view:quizzes",
    "view:exams",
    "view:grades",
    "view:attendance",
    "view:events",
    "view:announcements",
    "view:messages",
    "view:course-builder",
    "view:lesson-mgmt",
    "view:assignment-mgmt",
    "view:gradebook-mgmt",
    "view:student-mgmt",
    "view:students",
    "view:classes",
  ],
  student: [
    "view:dashboard",
    "view:courses",
    "view:lessons",
    "view:assignments",
    "view:quizzes",
    "view:exams",
    "view:grades",
    "view:attendance",
    "view:events",
    "view:announcements",
    "view:messages",
    "view:ai-tutor",
    "view:ai-search",
    "view:ai-planner",
    "view:ai-analytics",
  ],
  parent: [
    "view:dashboard",
    "view:courses",
    "view:assignments",
    "view:grades",
    "view:attendance",
    "view:events",
    "view:announcements",
    "view:messages",
  ],
};

export const hasPermission = (
  role: string | null | undefined,
  permission: PermissionKey
): boolean => {
  if (!role) return false;
  const normalized =
    role.toLowerCase() === "instructor" ? "teacher" : role.toLowerCase();
  const permissions = rolePermissions[normalized];
  return permissions ? permissions.includes(permission) : false;
};

// ─── Navigation Configuration ─────────────────────────────────────────────────

export const navigationConfig: MenuSectionConfig[] = [
  // ── Dashboard (all roles) ─────────────────────────────────────────────────
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    items: [
      {
        label: "Overview",
        href: "", // resolved dynamically to /{role}
        icon: LayoutDashboard,
        permission: "view:dashboard",
      },
    ],
  },

  // ── Learning (Student + Parent only) ─────────────────────────────────────
  {
    title: "Learning",
    icon: GraduationCap,
    roles: ["student", "parent"],
    items: [
      {
        label: "My Courses",
        href: "/list/courses",
        icon: BookOpen,
        permission: "view:courses",
      },
      {
        label: "Assignments",
        href: "/list/assignments",
        icon: ClipboardList,
        permission: "view:assignments",
      },
      {
        label: "Quizzes",
        href: "/list/quizzes",
        icon: BrainCircuit,
        permission: "view:quizzes",
        roles: ["student"],
      },
      {
        label: "Exams",
        href: "/list/exams",
        icon: BookMarked,
        permission: "view:exams",
        roles: ["student"],
      },
      {
        label: "My Grades",
        href: "/list/results",
        icon: Award,
        permission: "view:grades",
      },
      {
        label: "Attendance",
        href: "/list/attendance",
        icon: CalendarCheck,
        permission: "view:attendance",
      },
    ],
  },

  // ── Teaching (Teacher + Admin) ─────────────────────────────────────────
  {
    title: "Teaching",
    icon: BookOpen,
    roles: ["teacher", "admin"],
    items: [
      {
        label: "Courses",
        href: "/list/courses",
        icon: BookOpen,
        permission: "view:courses",
      },
      {
        label: "Lessons",
        href: "/list/lessons",
        icon: Layers3,
        permission: "view:lesson-mgmt",
      },
      {
        label: "Assignments",
        href: "/list/assignments",
        icon: ClipboardList,
        permission: "view:assignment-mgmt",
      },
      {
        label: "Quizzes",
        href: "/list/quizzes",
        icon: BrainCircuit,
        permission: "view:quizzes",
      },
      {
        label: "Exams",
        href: "/list/exams",
        icon: BookMarked,
        permission: "view:exams",
      },
      {
        label: "Gradebook",
        href: "/list/results",
        icon: BarChart2,
        permission: "view:gradebook-mgmt",
      },
      {
        label: "Attendance",
        href: "/list/attendance",
        icon: CalendarCheck,
        permission: "view:attendance",
      },
    ],
  },

  // ── Academic Management (Admin only) ─────────────────────────────────────
  {
    title: "Academic Management",
    icon: School2,
    roles: ["admin"],
    items: [
      {
        label: "Students",
        href: "/list/students",
        icon: GraduationCap,
        permission: "view:students",
        exact: true,
      },
      {
        label: "Lecturers",
        href: "/list/teachers",
        icon: UserSquare2,
        permission: "view:lecturers",
        exact: true,
      },
      {
        label: "Parents",
        href: "/list/parents",
        icon: Users2,
        permission: "view:parents",
        exact: true,
      },
      {
        label: "Classes",
        href: "/list/classes",
        icon: Users,
        permission: "view:classes",
        exact: true,
      },
      {
        label: "Subjects",
        href: "/list/subjects",
        icon: ListTree,
        permission: "view:subjects",
        exact: true,
      },
      {
        label: "Timetables",
        href: "/admin/schedules",
        icon: CalendarRange,
        permission: "view:timetables",
      },
      {
        label: "Faculties",
        icon: Building2,
        permission: "view:faculties",
        comingSoon: true,
      },
      {
        label: "Programs",
        icon: ListTree,
        permission: "view:programs",
        comingSoon: true,
      },
    ],
  },

  // ── Communication (all roles) ─────────────────────────────────────────────
  {
    title: "Communication",
    icon: MessageSquare,
    items: [
      {
        label: "Announcements",
        href: "/list/announcements",
        icon: Megaphone,
        permission: "view:announcements",
      },
      {
        label: "Events",
        href: "/list/events",
        icon: CalendarDays,
        permission: "view:events",
      },
      {
        label: "Messages",
        icon: MessageSquare,
        permission: "view:messages",
        comingSoon: true,
      },
    ],
  },

  // ── Analytics (Admin only — all coming soon) ───────────────────────────────
  {
    title: "Analytics",
    icon: TrendingUp,
    roles: ["admin"],
    defaultCollapsed: true,
    items: [
      {
        label: "Student Analytics",
        icon: Users,
        permission: "view:analytics-students",
        comingSoon: true,
      },
      {
        label: "Course Analytics",
        icon: PieChart,
        permission: "view:analytics-courses",
        comingSoon: true,
      },
      {
        label: "AI Usage",
        icon: Sparkles,
        permission: "view:analytics-ai",
        comingSoon: true,
      },
      {
        label: "Reports",
        icon: LineChart,
        permission: "view:analytics-reports",
        comingSoon: true,
      },
    ],
  },

  // ── Administration (Admin only) ───────────────────────────────────────────
  {
    title: "Administration",
    icon: Settings2,
    roles: ["admin"],
    defaultCollapsed: false,
    items: [
      {
        label: "Users",
        href: "/list/users",
        icon: Users,
        permission: "view:users",
        exact: true,
      },
      {
        label: "Roles",
        href: "/list/roles",
        icon: ShieldCheck,
        permission: "view:roles",
        exact: true,
      },
      {
        label: "Permissions",
        href: "/list/permissions",
        icon: Key,
        permission: "view:permissions",
        exact: true,
      },
      {
        label: "Audit Logs",
        href: "/list/audit-logs",
        icon: FileSearch,
        permission: "view:audit-logs",
        exact: true,
      },
    ],
  },
];

// ─── Route Access Map (for middleware) ───────────────────────────────────────

export const getRouteAccessMap = (): Record<string, string[]> => {
  const map: Record<string, string[]> = {
    "/admin(.*)": ["admin"],
    "/student(.*)": ["student"],
    "/teacher(.*)": ["teacher"],
    "/parent(.*)": ["parent"],
    "/settings(.*)": ["admin", "teacher", "student", "parent"],
  };

  const traverse = (item: MenuItemConfig) => {
    if (item.href && !item.comingSoon) {
      const roles: string[] = [];
      Object.keys(rolePermissions).forEach((role) => {
        if (rolePermissions[role].includes(item.permission)) {
          roles.push(role);
        }
      });
      if (roles.length > 0) {
        const path = item.href;
        const key = item.exact ? path : `${path}(.*)`;
        const existing = map[key] || [];
        map[key] = [...new Set([...existing, ...roles])];
      }
    }
  };

  navigationConfig.forEach((section) => {
    section.items.forEach(traverse);
  });

  return map;
};
