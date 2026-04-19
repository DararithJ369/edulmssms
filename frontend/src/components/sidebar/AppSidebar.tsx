"use client";

import {
  Settings2,
  School,
  GraduationCap,
  Users,
  LayoutDashboard,
  type LucideIcon,
  LogOut,
  HelpCircle,
} from "lucide-react";

import { NavMain } from "@/components/sidebar/nav-main";
// import { NavUser } from "@/components/sidebar/nav-user";
import { TeamSwitcher } from "@/components/sidebar/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import type { UserRole } from "@/types";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "@/hooks/AuthProvider";
import { useMemo } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

export interface NavItem {
  title: string;
  url: string; // Used for linking and active state matching
  icon?: LucideIcon;
  isActive?: boolean; // Default open state for collapsibles
  roles?: UserRole[]; // Who can see this section? (undefined = everyone)
  items?: {
    title: string;
    url: string;
    roles?: UserRole[]; // Who can see this specific link?
  }[];
}

// This is sample data.
export const sidebardata = {
  teams: [
    {
      name: "Springfield High",
      logo: School,
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: false,
      roles: ["admin", "instructor", "student", "parent"],
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          roles: ["admin", "instructor", "student", "parent"],
        },
        {
          title: "Activities Log",
          url: "/activies-log",
          roles: ["admin"], // Restricted to Admin
        },
      ],
    },
    {
      title: "Academics",
      url: "#", // Parent item, no link
      icon: School,
      roles: ["admin", "instructor", "student", "parent"],
      items: [
        {
          title: "Classes",
          url: "/classes",
          roles: ["admin"],
        },
        {
          title: "Subjects",
          url: "/subjects",
          roles: ["admin"],
        },
        {
          title: "Timetable",
          url: "/timetable",
          roles: ["admin"],
        },
        {
          title: "Grades",
          url: "/academics/grades",
          roles: ["admin", "instructor", "student"],
        },
        {
          title: "Assignments",
          url: "/academics/assignments",
          roles: ["admin", "instructor", "student"],
        },
        {
          title: "Quizzes",
          url: "/academics/quizzes",
          roles: ["admin", "instructor", "student"],
        },
        {
          title: "Results",
          url: "/academics/results",
          roles: ["admin", "instructor", "student"],
        },
        {
          title: "Attendance",
          url: "/academics/attendance",
          // Parents want to see if their kid was present
        },
        {
          title: "Enrollments",
          url: "/academics/enrollments",
          roles: ["admin", "instructor"],
        },
      ],
    },
    {
      title: "Learning (LMS)",
      url: "#",
      icon: GraduationCap,
      roles: ["instructor", "student", "admin"], // Parents usually don't need deep LMS access
      items: [
        { title: "Courses", url: "/lms/courses" },
        { title: "Submissions", url: "/lms/submissions", roles: ["admin", "instructor"] },
        { title: "Exams", url: "/lms/exams" },
      ],
    },
    {
      title: "People",
      url: "#",
      icon: Users,
      roles: ["admin", "instructor"],
      items: [
        { title: "Students", url: "/users/students" },
        {
          title: "Instructors",
          url: "/users/instructors",
          roles: ["admin"], // Only Admin can see other Admins
        },
        {
          title: "Parents",
          url: "/users/parents",
          roles: ["admin"], // Only Admin can see other Admins
        },
        {
          title: "Admins",
          url: "/users/admins",
          roles: ["admin"], // Only Admin can see other Admins
        },
      ],
    },
    {
      title: "System",
      url: "#",
      icon: Settings2,
      roles: ["admin"],
      items: [
        { title: "School Settings", url: "/settings/general" },
        { title: "Academic Years", url: "/settings/academic-years" },
        { title: "Grade Levels", url: "/settings/grade-levels" },
        { title: "Roles & Permissions", url: "/settings/roles" },
      ],
    },
  ] as NavItem[],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, year, setUser } = useAuth();
  const location = useLocation(); // <--- Get current URL
  const pathname = location.pathname; // e.g., "/dashboard/analytics"
  const navigate = useNavigate();

  // const userData = {
  //   name: user?.name || "User",
  //   email: user?.email || "",
  //   avatar: "",
  // };

  const userRole = (
    typeof user?.role === "string" 
      ? user.role 
      : (user?.role as any)?.name || "student"
  ) as UserRole;

  const filteredNav = useMemo(() => {
    // First, filter by role
    let nav = sidebardata.navMain
      .filter((item) => !item.roles || item.roles.includes(userRole))
      .map((item) => {
        const isChildActive = item.items?.some((sub) => pathname === sub.url || pathname.startsWith(sub.url + "/"));
        const isMainActive = item.url === pathname || pathname.startsWith(item.url + "/");
        return {
          ...item,
          isActive: isMainActive || isChildActive,
          items: item.items
            ?.filter(
              (subItem) => !subItem.roles || subItem.roles.includes(userRole),
            )
            .map((subItem) => ({
              ...subItem,
              isActive: pathname === subItem.url || pathname.startsWith(subItem.url + "/"),
            })),
        };
      });

    // Admins see everything - no context-aware filtering
    if (userRole === "admin") {
      return nav;
    }

    // Now apply context-aware filtering for non-admins
    // If user is in a specific section, only show relevant items
    const inLMS = pathname.includes("/lms");
    const inAcademics = pathname.includes("/academics");
    const inUsers = pathname.includes("/users");
    const inFinance = pathname.includes("/finance");
    const inSettings = pathname.includes("/settings");

    nav = nav.map((item) => {
      // Always show dashboard
      if (item.title === "Dashboard") {
        return item;
      }

      // If in LMS section, only show LMS items
      if (inLMS && item.title === "Learning (LMS)") {
        return item;
      }
      // If in Academics section, only show Academics items
      if (inAcademics && item.title === "Academics") {
        return item;
      }
      // If in Users/People section, only show People items
      if (inUsers && item.title === "People") {
        return item;
      }
      // If in Finance section, only show Finance items
      if (inFinance && item.title === "Finance") {
        return item;
      }
      // If in Settings/System section, only show System items
      if (inSettings && item.title === "System") {
        return item;
      }

      // Hide other sections when in a specific context
      if (item.items && item.items.length > 0 && (inLMS || inAcademics || inUsers || inFinance || inSettings)) {
        return { ...item, items: [] };
      }

      return item;
    });

    // Filter out sections with no items (except Dashboard)
    nav = nav.filter((item) => {
      if (item.title === "Dashboard") return true;
      if (!item.items || item.items.length === 0) return false;
      return true;
    });

    return nav;
  }, [pathname, userRole]);

  const logout = async () => {
    try {
      await api.post("/users/logout").finally(() => {
        setUser(null);
        localStorage.removeItem("token");
        navigate("/");
        toast.success("Logged out successfully");
      });
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Logout failed. Please try again.");
    }
  };
  return (
    <Sidebar collapsible="icon" className="border-0 bg-white dark:bg-neutral-950" {...props}>
      <SidebarHeader className="border-0 px-3 py-4">
        <TeamSwitcher teams={sidebardata.teams} yearName={year?.name!} />
      </SidebarHeader>
      <SidebarContent className="px-0 flex-1">
        <NavMain items={filteredNav} />
      </SidebarContent>
      <SidebarFooter className="border-t border-slate-200 dark:border-slate-800 px-3 py-3 gap-3 bg-gradient-to-t from-slate-50 to-transparent dark:from-slate-900/50 dark:to-transparent">
        {/* <NavUser user={userData} /> */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => navigate("/help")}
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-green-700 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/50 rounded-lg transition-all px-3 py-2"
          >
            <HelpCircle className="h-4 w-4 mr-2 flex-shrink-0" />
            Get Help
          </Button>
          <Button
            onClick={logout}
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-all px-3 py-2"
          >
            <LogOut className="h-4 w-4 mr-2 flex-shrink-0" />
            Logout
          </Button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
