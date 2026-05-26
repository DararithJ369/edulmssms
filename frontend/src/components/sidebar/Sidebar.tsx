"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  GraduationCap,
  LayoutDashboard,
  Menu,
  MessageSquare,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  School2,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

import { cn } from "@/lib/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarSection, type MenuSection } from "@/components/sidebar/SidebarSection";

const normalizeRole = (role: string | null | undefined) => {
  if (role === "instructor") {
    return "teacher";
  }

  return role ?? "";
};

const sections: MenuSection[] = [
  {
    title: "Users",
    icon: Users,
    items: [
      { label: "Students", href: "/list/students", visible: ["admin", "teacher"] },
      { label: "Teachers", href: "/list/teachers", visible: ["admin", "teacher"] },
      { label: "Parents", href: "/list/parents", visible: ["admin", "teacher"] },
    ],
  },
  {
    title: "Academics",
    icon: School2,
    items: [
      { label: "Academic Years", disabled: true, visible: ["admin"] },
      { label: "Classes", href: "/list/classes", visible: ["admin", "teacher"] },
      { label: "Subjects", href: "/list/subjects", visible: ["admin"] },
      { label: "Courses", disabled: true, visible: ["admin", "teacher"] },
    ],
  },
  {
    title: "Learning",
    icon: GraduationCap,
    items: [
      { label: "Lessons", href: "/list/lessons", visible: ["admin", "teacher"] },
      { label: "Assignments", href: "/list/assignments", visible: ["admin", "teacher", "student", "parent"] },
      { label: "Quizzes", href: "/list/exams", visible: ["admin", "teacher", "student", "parent"] },
    ],
  },
  {
    title: "Assessments",
    icon: ShieldCheck,
    items: [
      { label: "Exams", href: "/list/exams", visible: ["admin", "teacher", "student", "parent"] },
      { label: "Results", href: "/list/results", visible: ["admin", "teacher", "student", "parent"] },
      { label: "Attendance", href: "/list/attendance", visible: ["admin", "teacher", "student", "parent"] },
    ],
  },
  {
    title: "Communication",
    icon: MessageSquare,
    items: [
      { label: "Messages", disabled: true, visible: ["admin", "teacher", "student", "parent"] },
      { label: "Announcements", href: "/list/announcements", visible: ["admin", "teacher", "student", "parent"] },
      { label: "Events", href: "/list/events", visible: ["admin", "teacher", "student", "parent"] },
    ],
  },
  {
    title: "Finance",
    icon: CircleDollarSign,
    items: [
      { label: "Fees", disabled: true, visible: ["admin"] },
      { label: "Expenses", disabled: true, visible: ["admin"] },
      { label: "Salaries", disabled: true, visible: ["admin"] },
    ],
  },
  {
    title: "System",
    icon: Settings,
    items: [
      { label: "Roles & Permissions", disabled: true, visible: ["admin"] },
      { label: "Settings", href: "/admin", visible: ["admin", "teacher", "student", "parent"] },
    ],
  },
];

export type SidebarProps = {
  role: string;
};

const Sidebar = ({ role: rawRole }: SidebarProps) => {
  const pathname = usePathname();
  const role = useMemo(() => normalizeRole(rawRole), [rawRole]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1024px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setIsHidden(false);
      setIsCollapsed(false);
    }
  }, [isMobile]);

  useEffect(() => {
    const root = document.documentElement;
    const width = isMobile || isHidden ? "0px" : isCollapsed ? "80px" : "280px";
    root.style.setProperty("--sidebar-width", width);
  }, [isCollapsed, isMobile, isHidden]);

  const visibleSections = useMemo(
    () =>
      sections
        .map((section) => ({
          ...section,
          items: section.items.filter((item) => item.visible.includes(role)),
        }))
        .filter((section) => section.items.length > 0),
    [role]
  );

  const isActive = (href?: string) => {
    if (!href) {
      return false;
    }

    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  const sidebarContent = (
    <TooltipProvider delayDuration={200}>
      <motion.aside
        layout
        className={cn(
          "flex h-screen flex-col gap-4 overflow-hidden px-3 py-4",
          "rounded-r-[28px]",
          "bg-card/80 shadow-[0_24px_60px_rgba(15,23,42,0.12)] ring-1 ring-border backdrop-blur-xl",
          isHidden && "pointer-events-none opacity-0",
          isHidden ? "w-0 px-0 py-0" : isCollapsed ? "w-[80px] items-center" : "w-[280px]"
        )}
        animate={{ width: isHidden ? 0 : isCollapsed ? 80 : 280 }}
        transition={{ type: "spring", stiffness: 240, damping: 26 }}
        aria-label="Primary"
        aria-hidden={isHidden}
      >
        <div className={cn("flex w-full items-center", isCollapsed ? "justify-center" : "justify-between")}>
          <div className={cn("flex items-center gap-3", isCollapsed && "hidden")}> 
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
              <LayoutDashboard className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Lets Trip</p>
              <p className="text-sm font-semibold text-foreground">SchoolLama</p>
            </div>
          </div>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "rounded-full border border-border bg-background shadow-sm transition-colors duration-300 hover:bg-accent",
                isCollapsed && "rounded-full"
              )}
              onClick={() => setIsCollapsed((prev) => !prev)}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
        </div>

        <div className="flex-1 w-full overflow-y-auto pr-1 no-scrollbar">
          <div className={cn("space-y-4", isCollapsed && "w-full items-center")}> 
            <SidebarSection
              section={{
                title: "Overview",
                icon: LayoutDashboard,
                items: [{ label: "Dashboard", href: `/${role || "admin"}`, visible: ["admin", "teacher", "student", "parent"] }],
              }}
              isCollapsed={isCollapsed}
              isActive={isActive}
            />

            {visibleSections.map((section) => (
              <SidebarSection key={section.title} section={section} isCollapsed={isCollapsed} isActive={isActive} />
            ))}
          </div>
        </div>

        <div className="mt-3 w-full">
          <div
            className={cn(
              "flex items-center gap-2 rounded-2xl border border-border bg-card/80 px-2.5 py-2 shadow-sm",
              isCollapsed && "justify-center"
            )}
          >
            <Avatar className="h-9 w-9">
              <AvatarImage src="/avatar.png" alt="User" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">John Doe</p>
                <p className="text-[11px] text-muted-foreground capitalize">{role || "admin"}</p>
              </div>
            )}
            <div className={cn("flex items-center gap-1", isCollapsed && "hidden")}>
              <Button variant="ghost" size="icon"> 
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.aside>
    </TooltipProvider>
  );

  return (
    <>
      <div className="hidden lg:block fixed left-0 top-0 z-40">{sidebarContent}</div>
      {!isMobile && isHidden && (
        <div className="fixed left-3 top-5 z-50">
          <Button
            size="icon"
            variant="outline"
            className="bg-white/80 backdrop-blur"
            onClick={() => setIsHidden(false)}
            aria-label="Show sidebar"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </Button>
        </div>
      )}
      <div className="lg:hidden fixed left-4 top-4 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="bg-white/80 backdrop-blur">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent className="p-0">
            {sidebarContent}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};

export default Sidebar;
