"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  Menu,
  MoreHorizontal,
  PanelLeftClose,
  Settings,
  LayoutDashboard,
} from "lucide-react";

import { cn } from "@/lib/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SidebarSection } from "@/components/sidebar/SidebarSection";
import { QuickActions } from "@/components/QuickActions";
import { api } from "@/lib/api";
import { removeToken, normalizeRole } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { navigationConfig, MenuSectionConfig } from "@/lib/navigation";

// ─── Role styling ─────────────────────────────────────────────────────────────
const roleConfig: Record<string, { gradient: string; label: string; badge: string }> = {
  admin:   { gradient: "from-indigo-500 to-violet-600",   label: "Administrator",  badge: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  teacher: { gradient: "from-emerald-500 to-teal-600",    label: "Lecturer",       badge: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  student: { gradient: "from-sky-500 to-blue-600",        label: "Student",        badge: "bg-sky-100 text-sky-700 border-sky-200" },
  parent:  { gradient: "from-amber-500 to-orange-600",    label: "Guardian",       badge: "bg-amber-100 text-amber-700 border-amber-200" },
};

export type SidebarProps = {
  role: string;
  onOpenCommandPalette?: () => void;
};

const Sidebar = ({ role: rawRole, onOpenCommandPalette }: SidebarProps) => {
  const pathname = usePathname();
  const role = useMemo(() => normalizeRole(rawRole), [rawRole]);
  const rc = roleConfig[role] || roleConfig.admin;

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [userProfile, setUserProfile] = useState<{
    username: string;
    email: string;
    image?: string;
  } | null>(null);

  // Responsive breakpoint
  useEffect(() => {
    const media = window.matchMedia("(max-width: 1024px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  // Persist collapse state
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebar-collapsed");
      setIsCollapsed(saved === "true");
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebar-collapsed", String(isCollapsed));
      const width = isMobile ? "0px" : isCollapsed ? "72px" : "268px";
      document.documentElement.style.setProperty("--sidebar-width", width);
    }
  }, [isCollapsed, isMobile]);

  // User profile from cache or API
  useEffect(() => {
    if (typeof window === "undefined") return;
    const cachedUsername = localStorage.getItem("user_username");
    const cachedEmail = localStorage.getItem("user_email");
    const cachedImage = localStorage.getItem("user_image");

    if (cachedUsername) {
      setUserProfile({ username: cachedUsername, email: cachedEmail || "", image: cachedImage || "" });
    } else {
      api.get("/users/me")
        .then(({ data }) => {
          localStorage.setItem("user_username", data.username || "");
          localStorage.setItem("user_email", data.email || "");
          localStorage.setItem("user_image", data.image || "");
          setUserProfile({ username: data.username || "", email: data.email || "", image: data.image || "" });
        })
        .catch(() => setUserProfile({ username: "Academic Member", email: "", image: "" }));
    }
  }, []);

  const isActive = (href?: string) => {
    if (!href) return false;
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  const getInitials = (name?: string) => {
    if (!name) return "LM";
    return name.split(/[\s_.-]+/).map((p) => p[0]?.toUpperCase()).slice(0, 2).join("");
  };

  const handleLogout = () => {
    removeToken();
    window.location.href = "/login";
  };

  // Build filtered sections for this role
  const filteredSections = useMemo((): MenuSectionConfig[] => {
    return navigationConfig
      .map((section) => {
        // Resolve dashboard href to role-specific route
        const items = section.items.map((item) =>
          item.permission === "view:dashboard" ? { ...item, href: `/${role || "admin"}` } : item
        );
        return { ...section, items };
      })
      .filter((section) => {
        // Section-level role filter
        if (section.roles && !section.roles.includes(role)) return false;
        return true;
      });
  }, [role]);

  const sidebarContent = (
    <TooltipProvider delayDuration={150}>
      <aside
        className={cn(
          "relative flex h-screen flex-col overflow-hidden",
          "bg-card/80 border-r border-border/50 shadow-[2px_0_24px_rgba(15,23,42,0.04)] backdrop-blur-2xl",
          "transition-all duration-300 ease-in-out",
          isCollapsed ? "w-[72px] px-2 py-4" : "w-[268px] px-3 py-4"
        )}
        aria-label="Primary Navigation"
      >
        {/* Collapse drag handle */}
        {!isMobile && (
          <div
            onClick={() => setIsCollapsed((p) => !p)}
            className="absolute right-0 top-0 bottom-0 z-50 w-2 cursor-col-resize group/edge"
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            <div className="h-full w-[1px] mx-auto bg-border/40 group-hover/edge:bg-[#0038A8]/40 group-hover/edge:w-[2px] transition-all duration-200" />
          </div>
        )}

        {/* ── Logo ──────────────────────────────────────────────── */}
        <div className={cn("flex items-center gap-2.5 mb-4 px-1", isCollapsed && "justify-center mb-3")}>
          <div className="relative h-8 w-8 shrink-0">
            <Image src="/ams.png" alt="EduLMS" fill sizes="32px" className="object-contain" priority />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-200">
              <span className="text-[13px] font-black tracking-wider text-foreground uppercase leading-none">
                EDU<span className="text-[#0038A8]">LAMS</span>
              </span>
              <span className="text-[9px] font-medium text-muted-foreground/70 mt-0.5 uppercase tracking-widest leading-none">
                Learning Platform
              </span>
            </div>
          )}
        </div>

        {/* ── Role badge ───────────────────────────────────────── */}
        {!isCollapsed && (
          <div className={cn("mb-3 px-1 animate-in fade-in duration-200")}>
            <span className={cn(
              "inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider",
              rc.badge
            )}>
              <span className={cn("h-1.5 w-1.5 rounded-full bg-current opacity-60")} />
              {rc.label}
            </span>
          </div>
        )}

        {/* ── Quick Actions ─────────────────────────────────────── */}
        <div className={cn("mb-3", isCollapsed && "flex justify-center")}>
          <QuickActions role={role} isCollapsed={isCollapsed} />
        </div>

        {/* ── Navigation sections ───────────────────────────────── */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-1 pr-0.5">
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

        {/* ── User profile footer ───────────────────────────────── */}
        <div className="mt-3 pt-3 border-t border-border/50">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border border-border/60 bg-card/40 hover:bg-accent/40",
                  "px-2.5 py-2 cursor-pointer select-none transition-all duration-200",
                  isCollapsed && "justify-center px-2"
                )}
              >
                <Avatar className="h-8 w-8 shrink-0 border border-border/60 shadow-sm">
                  {userProfile?.image ? (
                    <AvatarImage src={userProfile.image} alt={userProfile.username} />
                  ) : null}
                  <AvatarFallback className={cn("font-bold text-[11px] bg-gradient-to-tr text-white", rc.gradient)}>
                    {getInitials(userProfile?.username || role)}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <>
                    <div className="flex-1 min-w-0 animate-in fade-in duration-200">
                      <p className="text-[12px] font-semibold text-foreground truncate leading-tight">
                        {userProfile?.username || "Guest User"}
                      </p>
                      <p className="text-[10px] text-muted-foreground capitalize leading-none mt-0.5">
                        {rc.label}
                      </p>
                    </div>
                    <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                  </>
                )}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align={isCollapsed ? "center" : "end"}
              className="w-56 p-1.5 bg-popover/95 backdrop-blur rounded-2xl shadow-xl border border-border/60 z-[9999]"
            >
              <div className="px-2 py-1.5 mb-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Account</p>
                <p className="text-sm font-bold text-foreground truncate mt-0.5">{userProfile?.username || "Guest"}</p>
                <p className="text-xs text-muted-foreground truncate">{userProfile?.email || "—"}</p>
              </div>
              <DropdownMenuSeparator className="bg-border/60" />
              <DropdownMenuItem onClick={() => (window.location.href = `/${role}`)}>
                <LayoutDashboard className="mr-2 h-4 w-4 text-muted-foreground" />
                Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => (window.location.href = "/settings")}>
                <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/60" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive font-semibold"
              >
                <PanelLeftClose className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </TooltipProvider>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 z-40 h-screen transition-all duration-300">
        {sidebarContent}
      </div>

      {/* Mobile drawer */}
      <div className="lg:hidden fixed left-4 top-4 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="h-9 w-9 bg-card/90 backdrop-blur shadow-sm rounded-xl border-border/60">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent className="p-0 w-[268px] bg-transparent border-none shadow-none">
            {sidebarContent}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};

export default Sidebar;
