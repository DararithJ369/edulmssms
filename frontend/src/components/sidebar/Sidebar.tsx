"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  Menu,
  MoreHorizontal,
  Settings,
  LayoutDashboard,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react";

import { cn } from "@/lib/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarSection } from "@/components/sidebar/SidebarSection";

import { api } from "@/lib/api";
import { removeToken, normalizeRole } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getImageUrl } from "@/lib/image-url";
import { navigationConfig, MenuSectionConfig } from "@/lib/navigation";

// ─── Role config ───────────────────────────────────────────────────────────────
const roleConfig: Record<string, { label: string; dot: string }> = {
  admin:   { label: "Administrator", dot: "bg-indigo-400" },
  teacher: { label: "Lecturer",      dot: "bg-emerald-400" },
  student: { label: "Student",       dot: "bg-sky-400" },
  parent:  { label: "Guardian",      dot: "bg-amber-400" },
};

export type SidebarProps = {
  role: string;
  onOpenCommandPalette?: () => void;
};

const Sidebar = ({ role: rawRole, onOpenCommandPalette }: SidebarProps) => {
  const pathname  = usePathname();
  const role      = useMemo(() => normalizeRole(rawRole), [rawRole]);
  const rc        = roleConfig[role] || roleConfig.admin;

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile]       = useState(false);
  const [userProfile, setUserProfile] = useState<{
    id?: string;
    username: string;
    email: string;
    image?: string;
  } | null>(null);

  // Responsive
  useEffect(() => {
    const media  = window.matchMedia("(max-width: 1024px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  // Persist collapse
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsCollapsed(localStorage.getItem("sidebar-collapsed") === "true");
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebar-collapsed", String(isCollapsed));
      const w = isMobile ? "0px" : isCollapsed ? "64px" : "220px";
      document.documentElement.style.setProperty("--sidebar-width", w);
    }
  }, [isCollapsed, isMobile]);

  // User profile — always fetch fresh so new avatars appear immediately
  useEffect(() => {
    if (typeof window === "undefined") return;
    api.get("/users/me")
      .then(({ data }) => {
        localStorage.setItem("user_id",       data.id       || "");
        localStorage.setItem("user_username", data.username || "");
        localStorage.setItem("user_email",    data.email    || "");
        localStorage.setItem("user_image",    data.profile_image || data.image || "");
        setUserProfile({ id: data.id, username: data.username || "", email: data.email || "", image: data.profile_image || data.image || "" });
      })
      .catch(() => {
        const id = localStorage.getItem("user_id");
        const u = localStorage.getItem("user_username");
        const e = localStorage.getItem("user_email");
        const i = localStorage.getItem("user_image");
        setUserProfile({ id: id || "", username: u || "Academic Member", email: e || "", image: i || "" });
      });
  }, []);

  const isActive = (href?: string) => {
    if (!href) return false;
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  const getInitials = (name?: string) =>
    (name || "LM").split(/[\s_.-]+/).map((p) => p[0]?.toUpperCase()).slice(0, 2).join("");

  const handleLogout = () => { removeToken(); window.location.href = "/login"; };

  const filteredSections = useMemo((): MenuSectionConfig[] =>
    navigationConfig
      .map((section) => ({
        ...section,
        items: section.items.map((item) =>
          item.permission === "view:dashboard" ? { ...item, href: `/${role || "admin"}` } : item
        ),
      }))
      .filter((section) => !(section.roles && !section.roles.includes(role))),
  [role]);

  // ─── Sidebar panel ───────────────────────────────────────────────────────
  const sidebarContent = (
    <TooltipProvider delayDuration={80}>
      <aside
        className={cn(
          "relative flex h-screen flex-col overflow-hidden select-none",
          "bg-[#161c2e] border-r border-white/[0.05]",
          "transition-all duration-300 ease-in-out",
          isCollapsed ? "w-[64px]" : "w-[220px]"
        )}
        aria-label="Primary Navigation"
      >
        {/* ── Logo ─────────────────────────────────────────────── */}
        <div className={cn(
          "flex items-center gap-2.5 shrink-0 px-4 pt-4 pb-3",
          isCollapsed && "justify-center px-0"
        )}>
          <div className="relative h-7 w-7 shrink-0">
            <Image src="/ams.png" alt="EduLMS" fill sizes="28px" className="object-contain" priority />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-200">
              <span className="text-[13px] font-black tracking-wider text-white uppercase leading-none">
                EDU<span style={{ color: "#4361ee" }}>LAMS</span>
              </span>
              <span className="text-[8.5px] font-semibold mt-0.5 uppercase tracking-widest leading-none" style={{ color: "#8892a4" }}>
                Learning Platform
              </span>
            </div>
          )}
        </div>


        {/* ── Nav sections (scrollable) ─────────────────────────── */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-2 pb-2">
          {filteredSections.map((section) => (
            <SidebarSection
              key={section.title}
              section={section}
              isCollapsed={isCollapsed}
              isActive={isActive}
              role={role}
            />
          ))}
        </div>

        {/* ── Collapse toggle ───────────────────────────────────── */}
        {!isMobile && (
          <div className={cn("shrink-0 px-2 pb-2", isCollapsed && "flex justify-center")}>
            <button
              type="button"
              onClick={() => setIsCollapsed((p) => !p)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2.5 py-[7px] w-full",
                "text-[#4a5568] hover:text-[#718096] hover:bg-white/[0.04]",
                "transition-all duration-150 text-[12px] font-medium",
                isCollapsed && "justify-center w-9 h-9 px-0"
              )}
              title={isCollapsed ? "Expand" : "Collapse"}
            >
              {isCollapsed
                ? <ChevronRight className="h-4 w-4" />
                : (<><ChevronLeft className="h-3.5 w-3.5" /><span>Collapse</span></>)
              }
            </button>
          </div>
        )}

        {/* ── User footer ──────────────────────────────────────── */}
        <div className={cn(
          "shrink-0 border-t border-white/[0.06] px-3 py-3",
        )}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className={cn(
                "flex items-center gap-2.5 rounded-lg px-1 py-1.5 cursor-pointer",
                "hover:bg-white/[0.05] transition-colors duration-150",
                isCollapsed && "justify-center px-0"
              )}>
                {/* Avatar circle */}
                <Avatar className="h-8 w-8 shrink-0 border border-white/10">
                  {getImageUrl(userProfile?.image)
                    ? <AvatarImage src={getImageUrl(userProfile!.image)!} alt={userProfile!.username} />
                    : null}
                  <AvatarFallback className="bg-indigo-600 text-white font-bold text-[10px]">
                    {getInitials(userProfile?.username || role)}
                  </AvatarFallback>
                </Avatar>

                {!isCollapsed && (
                  <>
                    <div className="flex-1 min-w-0 animate-in fade-in duration-200">
                      <p className="text-[12px] font-semibold text-white/85 truncate leading-tight">
                        {userProfile?.username || "Guest"}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", rc.dot)} />
                        <p className="text-[10px] text-white/35 leading-none capitalize">{rc.label}</p>
                      </div>
                    </div>
                    <MoreHorizontal className="h-3.5 w-3.5 text-white/20 shrink-0" />
                  </>
                )}
              </div>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              side="top"
              align={isCollapsed ? "center" : "end"}
              className="w-52 p-1.5 bg-[#1a2236] border border-white/10 rounded-2xl shadow-xl z-[9999]"
            >
              <div className="px-2 py-1.5 mb-1">
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Account</p>
                <p className="text-sm font-bold text-white truncate mt-0.5">{userProfile?.username || "Guest"}</p>
                <p className="text-xs text-white/40 truncate">{userProfile?.email || "—"}</p>
              </div>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                onClick={() => (window.location.href = `/${role}`)}
                className="text-white/65 hover:text-white focus:text-white focus:bg-white/5 rounded-lg text-[12px]"
              >
                <LayoutDashboard className="mr-2 h-3.5 w-3.5" /> Dashboard
              </DropdownMenuItem>
              {role !== "admin" && role !== "guest" && (
                <DropdownMenuItem
                  onClick={() => {
                    const target = role === "student" ? `/list/students/${userProfile?.id}` :
                                   role === "teacher" ? `/list/teachers/${userProfile?.id}` :
                                   role === "parent" ? `/list/parents/${userProfile?.id}` : "#";
                    if (target !== "#") window.location.href = target;
                  }}
                  className="text-white/65 hover:text-white focus:text-white focus:bg-white/5 rounded-lg text-[12px]"
                >
                  <User className="mr-2 h-3.5 w-3.5" /> My Profile
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => (window.location.href = "/settings")}
                className="text-white/65 hover:text-white focus:text-white focus:bg-white/5 rounded-lg text-[12px]"
              >
                <Settings className="mr-2 h-3.5 w-3.5" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-red-500/10 rounded-lg font-semibold text-[12px]"
              >
                <LogOut className="mr-2 h-3.5 w-3.5" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </TooltipProvider>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block fixed left-0 top-0 z-40 h-screen transition-all duration-300">
        {sidebarContent}
      </div>

      {/* Mobile drawer */}
      <div className="lg:hidden fixed left-4 top-4 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline"
              className="h-9 w-9 bg-[#131929] border-white/10 text-white shadow-sm rounded-xl">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent className="p-0 w-[220px] bg-transparent border-none shadow-none">
            {sidebarContent}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};

export default Sidebar;
