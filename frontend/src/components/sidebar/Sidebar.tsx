"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  CircleDollarSign,
  GraduationCap,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  PanelLeftClose,
  School2,
  Settings,
  ShieldCheck,
  Users,
  MessageSquare,
} from "lucide-react";

import { cn } from "@/lib/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarSection, type MenuSection } from "@/components/sidebar/SidebarSection";
import { api } from "@/lib/api";
import { removeToken } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
      { label: "Courses", href: "/list/courses", visible: ["admin", "teacher", "student", "parent"] },
    ],
  },
  {
    title: "Learning",
    icon: GraduationCap,
    items: [
      { label: "Lessons", href: "/list/lessons", visible: ["admin", "teacher"] },
      { label: "Assignments", href: "/list/assignments", visible: ["admin", "teacher", "student", "parent"] },
      { label: "Quizzes", href: "/list/quizzes", visible: ["admin", "teacher", "student", "parent"] },
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

const roleGradients: Record<string, string> = {
  admin: "bg-gradient-to-tr from-indigo-500 to-violet-600 text-white",
  teacher: "bg-gradient-to-tr from-emerald-500 to-teal-600 text-white",
  student: "bg-gradient-to-tr from-blue-500 to-sky-600 text-white",
  parent: "bg-gradient-to-tr from-amber-500 to-orange-600 text-white",
};

export type SidebarProps = {
  role: string;
};

const Sidebar = ({ role: rawRole }: SidebarProps) => {
  const pathname = usePathname();
  const role = useMemo(() => normalizeRole(rawRole), [rawRole]);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [userProfile, setUserProfile] = useState<{
    username: string;
    email: string;
    image?: string;
  } | null>(null);

  // Sync mobile breakpoint
  useEffect(() => {
    const media = window.matchMedia("(max-width: 1024px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  // Hydrate collapsed state preference from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebar-collapsed");
      setIsCollapsed(saved === "true");
    }
  }, []);

  // Update layout padding and save preference when collapsed/mobile state toggles
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebar-collapsed", String(isCollapsed));
      const root = document.documentElement;
      const width = isMobile ? "0px" : isCollapsed ? "80px" : "280px";
      root.style.setProperty("--sidebar-width", width);
    }
  }, [isCollapsed, isMobile]);

  // Lazy load and cache user profile to eliminate dynamic fetches on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cachedUsername = localStorage.getItem("user_username");
      const cachedEmail = localStorage.getItem("user_email");
      const cachedImage = localStorage.getItem("user_image");

      if (cachedUsername) {
        setUserProfile({
          username: cachedUsername,
          email: cachedEmail || "",
          image: cachedImage || "",
        });
      } else {
        // Fallback single lazy fetch if missing
        api.get("/users/me").then(({ data }) => {
          localStorage.setItem("user_username", data.username || "");
          localStorage.setItem("user_email", data.email || "");
          localStorage.setItem("user_image", data.image || "");
          setUserProfile({
            username: data.username || "",
            email: data.email || "",
            image: data.image || "",
          });
        }).catch(() => {
          setUserProfile({
            username: "Academic Member",
            email: "",
            image: "",
          });
        });
      }
    }
  }, []);

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
    if (!href) return false;
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  const getInitials = (name?: string) => {
    if (!name) return "JD";
    const parts = name.split(/[\s_.-]+/);
    return parts.map((p) => p[0]?.toUpperCase()).slice(0, 2).join("");
  };

  const handleLogout = () => {
    removeToken();
    window.location.href = "/login";
  };

  const sidebarContent = (
    <TooltipProvider delayDuration={200}>
      <aside
        className={cn(
          "relative flex h-screen flex-col gap-4 overflow-hidden px-4 py-5",
          "rounded-r-[32px] select-none",
          "bg-card/75 border-r border-border/60 shadow-[4px_0_40px_rgba(15,23,42,0.03)] backdrop-blur-2xl transition-all duration-300",
          isCollapsed ? "w-[80px] items-center" : "w-[280px]"
        )}
        aria-label="Primary Navigation"
      >
        {/* Clickable vertical line collapse trigger */}
        {!isMobile && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed((prev) => !prev);
            }}
            className="absolute right-0 top-0 bottom-0 z-50 w-2.5 cursor-col-resize hover:bg-[#0038A8]/5 active:bg-[#0038A8]/10 group/border flex items-center justify-center transition-colors duration-200"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <div className="w-[1.5px] h-14 rounded bg-transparent group-hover/border:bg-[#0038A8]/50 group-active/border:bg-[#0038A8]/80 transition-colors duration-200" />
          </div>
        )}

        <div className={cn("flex w-full items-center gap-2", isCollapsed ? "justify-center" : "justify-between")}>
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="relative h-8 w-8 shrink-0">
              <Image 
                src="/ams.png" 
                alt="AMS Logo" 
                fill
                sizes="32px"
                className="object-contain hover:scale-105 transition-transform duration-300"
                priority
              />
            </div>
            
            {!isCollapsed && (
              <div className="flex flex-col select-none animate-in fade-in slide-in-from-left-2 duration-300">
                <span className="text-[13px] font-black tracking-wider text-foreground uppercase leading-none">
                  AMS <span className="text-[#0038A8]">ACADEMY</span>
                </span>
                <span className="text-[9px] font-medium text-muted-foreground/80 mt-1 uppercase tracking-widest leading-none">
                  System
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 w-full overflow-y-auto pr-1 no-scrollbar space-y-4">
          <div className="space-y-4"> 
            <SidebarSection
              section={{
                title: "Overview",
                icon: LayoutDashboard,
                items: [{ label: "Dashboard", href: `/${role || "admin"}`, visible: ["admin", "teacher", "student", "parent"] }],
              }}
              isCollapsed={isCollapsed}
              isActive={isActive}
              role={role}
            />

            {visibleSections.map((section) => (
              <SidebarSection
                key={section.title}
                section={section}
                isCollapsed={isCollapsed}
                isActive={isActive}
                role={role}
              />
            ))}
          </div>
        </div>

        <div className="mt-3 w-full border-t border-border/60 pt-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div
                className={cn(
                  "flex items-center gap-2.5 rounded-2xl border border-border/80 bg-card/40 hover:bg-accent/40 px-2.5 py-2 shadow-sm transition-all duration-300 cursor-pointer select-none",
                  isCollapsed && "justify-center"
                )}
              >
                <Avatar className="h-9 w-9 border border-border/60 shadow-sm ring-offset-background transition-transform duration-300 hover:scale-105 shrink-0">
                  {userProfile?.image ? (
                    <AvatarImage src={userProfile.image} alt={userProfile.username} />
                  ) : null}
                  <AvatarFallback className={cn("font-bold text-xs select-none", roleGradients[role] || "bg-primary text-primary-foreground")}>
                    {getInitials(userProfile?.username || role)}
                  </AvatarFallback>
                </Avatar>
                
                {!isCollapsed && (
                  <div className="flex-1 min-w-0 text-left animate-in fade-in duration-300">
                    <p className="text-xs font-semibold text-foreground truncate">{userProfile?.username || "Guest User"}</p>
                    <p className="text-[10px] text-muted-foreground truncate capitalize">{role}</p>
                  </div>
                )}
                
                {!isCollapsed && (
                  <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground/60 transition-colors hover:text-foreground shrink-0" />
                )}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align={isCollapsed ? "center" : "end"} className="w-56 p-1.5 bg-popover/90 backdrop-blur rounded-2xl shadow-xl border border-border/60 z-[9999]">
              <div className="px-2 py-1.5 mb-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account</p>
                <p className="text-sm font-bold text-foreground truncate mt-0.5">{userProfile?.username || "Guest User"}</p>
                <p className="text-xs text-muted-foreground truncate">{userProfile?.email || "No email"}</p>
              </div>
              <DropdownMenuSeparator className="bg-border/60" />
              <DropdownMenuItem onClick={() => window.location.href = `/${role}`}>
                <LayoutDashboard className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Dashboard</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = "/admin"}>
                <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/60" />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive font-semibold">
                <PanelLeftClose className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </TooltipProvider>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed Left Layout with collapse transition width) */}
      <div className="hidden lg:block fixed left-0 top-0 z-40 transition-all duration-300">{sidebarContent}</div>
      
      {/* Mobile Drawer Trigger & Drawer */}
      <div className="lg:hidden fixed left-4 top-4 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="bg-white/80 backdrop-blur shadow-sm rounded-xl">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent className="p-0 w-[280px] bg-transparent border-none">
            {sidebarContent}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};

export default Sidebar;
