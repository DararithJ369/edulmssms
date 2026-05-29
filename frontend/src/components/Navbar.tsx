"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { MessageSquare, Bell, Search, LogOut, User, Settings } from "lucide-react";
import { cn } from "@/lib/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { api } from "@/lib/api";
import { removeToken, normalizeRole } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const roleGradients: Record<string, string> = {
  admin: "bg-gradient-to-tr from-[#0038A8] to-violet-600 text-white",
  teacher: "bg-gradient-to-tr from-emerald-500 to-teal-600 text-white",
  student: "bg-gradient-to-tr from-blue-500 to-sky-600 text-white",
  parent: "bg-gradient-to-tr from-amber-500 to-orange-600 text-white",
};

const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();

  const [searchQuery, setSearchQuery] = useState("");
  const [role, setRole] = useState("guest");
  const [userProfile, setUserProfile] = useState<{
    username: string;
    email: string;
    image?: string;
  } | null>(null);

  // Load user profile and role from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cachedUsername = localStorage.getItem("user_username");
      const cachedEmail = localStorage.getItem("user_email");
      const cachedImage = localStorage.getItem("user_image");
      const cachedRole = localStorage.getItem("user_role") || "guest";
      
      setRole(normalizeRole(cachedRole));

      if (cachedUsername) {
        setUserProfile({
          username: cachedUsername,
          email: cachedEmail || "",
          image: cachedImage || "",
        });
      } else {
        // Fallback lazy fetch
        api.get("/users/me").then(({ data }) => {
          const roleName = normalizeRole(data.role?.name || "guest");
          setRole(roleName);
          localStorage.setItem("user_username", data.username || "");
          localStorage.setItem("user_email", data.email || "");
          localStorage.setItem("user_image", data.image || "");
          localStorage.setItem("user_role", roleName);
          
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

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    const params = new URLSearchParams(window.location.search);
    params.set("search", searchQuery);
    
    // Redirect search to the list page if on list page, otherwise default search or general list
    if (pathname.includes("/list/")) {
      router.push(`${pathname}?${params.toString()}`);
    } else {
      router.push(`/list/courses?${params.toString()}`);
    }
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

  return (
    <div className="flex items-center justify-between p-4 transition-all duration-300">
      {/* SEARCH BAR */}
      <form
        onSubmit={handleSearchSubmit}
        className="hidden md:flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-border bg-background px-2.5 transition-all duration-300 focus-within:ring-[#0038A8]/60"
      >
        <Search className="h-3.5 w-3.5 text-muted-foreground/75" />
        <input
          type="text"
          placeholder="Search curriculum, modules..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-[200px] p-2 bg-transparent outline-none text-foreground placeholder:text-muted-foreground/60 text-[11px]"
        />
      </form>

      {/* ICONS AND USER */}
      <div className="flex items-center gap-5 justify-end w-full">
        {/* Announcements Shortcut */}
        <div 
          onClick={() => router.push("/list/announcements")}
          className="bg-card hover:bg-accent/40 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer border border-border/80 text-muted-foreground/80 hover:text-[#0038A8] transition-all"
          title="Announcements"
        >
          <Bell className="h-4.5 w-4.5" />
        </div>

        {/* Message Indicator */}
        <div 
          onClick={() => router.push("/list/events")}
          className="bg-card hover:bg-accent/40 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer relative border border-border/80 text-muted-foreground/80 hover:text-[#0038A8] transition-all"
          title="Events"
        >
          <MessageSquare className="h-4.5 w-4.5" />
          <div className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-[#0038A8] text-white rounded-full text-[9px] font-black animate-pulse">
            1
          </div>
        </div>

        {/* Profile Details Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-3 cursor-pointer select-none group">
              <div className="flex flex-col text-right hidden sm:flex">
                <span className="text-xs font-semibold text-foreground leading-3 group-hover:text-[#0038A8] transition-colors">
                  {userProfile?.username || "Guest User"}
                </span>
                <span className="text-[9px] text-muted-foreground capitalize mt-1 leading-none">{role}</span>
              </div>
              <Avatar className="h-9 w-9 border border-border/60 shadow-sm ring-offset-background transition-transform duration-300 hover:scale-105 group-hover:border-[#0038A8]/60">
                {userProfile?.image ? (
                  <AvatarImage src={userProfile.image} alt={userProfile.username} />
                ) : null}
                <AvatarFallback className={cn("font-bold text-xs select-none", roleGradients[role] || "bg-[#0038A8] text-white")}>
                  {getInitials(userProfile?.username || role)}
                </AvatarFallback>
              </Avatar>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-1.5 bg-popover/90 backdrop-blur rounded-2xl shadow-xl border border-border/60 z-[9999]">
            <div className="px-2 py-1.5 mb-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account</p>
              <p className="text-sm font-bold text-foreground truncate mt-0.5">{userProfile?.username || "Guest User"}</p>
              <p className="text-xs text-muted-foreground truncate">{userProfile?.email || "No email"}</p>
            </div>
            <DropdownMenuSeparator className="bg-border/60" />
            <DropdownMenuItem onClick={() => router.push(`/${role}`)}>
              <User className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Dashboard</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/admin")}>
              <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/60" />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive font-semibold">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default Navbar;
