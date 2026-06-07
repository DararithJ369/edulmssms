"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, MessageSquare, LogOut, Settings, User } from "lucide-react";
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
  admin:   "from-[#0038A8] to-violet-600",
  teacher: "from-emerald-500 to-teal-600",
  student: "from-blue-500 to-sky-600",
  parent:  "from-amber-500 to-orange-600",
};

type NavbarProps = {
  onOpenCommandPalette?: () => void;
};

const Navbar = ({ onOpenCommandPalette }: NavbarProps) => {
  const router = useRouter();

  const [role, setRole]             = useState("guest");
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<{
    username: string; email: string; image?: string;
  } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const cachedUsername = localStorage.getItem("user_username");
    const cachedEmail    = localStorage.getItem("user_email");
    const cachedImage    = localStorage.getItem("user_image");
    const cachedRole     = localStorage.getItem("user_role") || "guest";
    setRole(normalizeRole(cachedRole));

    if (cachedUsername) {
      setUserProfile({ username: cachedUsername, email: cachedEmail || "", image: cachedImage || "" });
    } else {
      api.get("/users/me").then(({ data }) => {
        const r = normalizeRole(data.role?.name || "guest");
        setRole(r);
        localStorage.setItem("user_username", data.username || "");
        localStorage.setItem("user_email",    data.email    || "");
        localStorage.setItem("user_image",    data.image    || "");
        localStorage.setItem("user_role",     r);
        setUserProfile({ username: data.username || "", email: data.email || "", image: data.image || "" });
      }).catch(() => setUserProfile({ username: "Academic Member", email: "", image: "" }));
    }

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30_000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const { data } = await api.get("/notifications/unread-count");
      setUnreadCount(data.count ?? 0);
    } catch { /* silent */ }
  };

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get("/notifications?limit=6");
      setNotifications(data.data || []);
    } catch { /* silent */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post("/notifications/read-all");
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch { /* silent */ }
  };

  const handleNotificationClick = async (notif: any) => {
    if (!notif.is_read) {
      try { await api.post(`/notifications/${notif.id}/read`); fetchUnreadCount(); } catch { /* silent */ }
    }
    const routes: Record<string, string> = {
      assignment:   "/list/assignments",
      announcement: "/list/announcements",
      grade:        "/list/results",
    };
    if (routes[notif.type]) router.push(routes[notif.type]);
  };

  const getInitials = (name?: string) => {
    if (!name) return "LM";
    return name.split(/[\s_.-]+/).map((p) => p[0]?.toUpperCase()).slice(0, 2).join("");
  };

  const handleLogout = () => {
    removeToken();
    window.location.href = "/login";
  };

  const isMac = typeof navigator !== "undefined" && /Mac/.test(navigator.platform);

  return (
    <div className="sticky top-0 z-30 flex items-center justify-between gap-4 px-5 py-3 bg-[#F7F8FA]/80 backdrop-blur-md border-b border-border/40">

      {/* ── Left: Cmd+K search trigger ─────────────────────────── */}
      <button
        onClick={onOpenCommandPalette}
        className="hidden md:flex items-center gap-2.5 px-3 py-2 rounded-xl border border-border/80 bg-card/70 hover:bg-card hover:border-border text-muted-foreground/70 hover:text-foreground transition-all duration-200 text-[12px] font-medium select-none group min-w-[200px]"
      >
        <Search className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1 text-left">Search anything…</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-muted border border-border/80 text-[10px] font-mono text-muted-foreground/60 group-hover:text-muted-foreground transition-colors">
          {isMac ? "⌘" : "Ctrl"} K
        </kbd>
      </button>

      {/* Mobile search button */}
      <button
        onClick={onOpenCommandPalette}
        className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl border border-border/80 bg-card/70 hover:bg-card text-muted-foreground hover:text-foreground transition-all"
      >
        <Search className="h-4 w-4" />
      </button>

      {/* ── Right: global actions ──────────────────────────────── */}
      <div className="flex items-center gap-2 ml-auto">

        {/* Notifications */}
        <DropdownMenu onOpenChange={(open) => { if (open) { fetchNotifications(); fetchUnreadCount(); } }}>
          <DropdownMenuTrigger asChild>
            <button
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-card/70 hover:bg-card text-muted-foreground/80 hover:text-foreground transition-all duration-200"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#0038A8] text-white text-[9px] font-bold animate-in zoom-in duration-200">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-2 bg-popover/95 backdrop-blur rounded-2xl shadow-xl border border-border/60 z-[9999]">
            <div className="flex items-center justify-between px-2 py-1.5">
              <p className="text-xs font-bold text-foreground uppercase tracking-wider">Notifications</p>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="text-[10px] text-[#0038A8] hover:underline font-bold">
                  Mark all read
                </button>
              )}
            </div>
            <DropdownMenuSeparator className="bg-border/60" />
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground/60">
                <Bell className="h-6 w-6 mx-auto mb-2 opacity-20" />
                No new notifications
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-0.5 no-scrollbar">
                {notifications.map((notif) => (
                  <DropdownMenuItem
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={cn(
                      "flex flex-col items-start p-2.5 rounded-xl transition-colors cursor-pointer text-xs gap-0.5",
                      !notif.is_read && "bg-[#0038A8]/5 border-l-2 border-[#0038A8]"
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-foreground truncate max-w-[200px]">{notif.title}</span>
                      <span className="text-[9px] text-muted-foreground shrink-0 ml-2">
                        {new Date(notif.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">{notif.message}</p>
                  </DropdownMenuItem>
                ))}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Messages shortcut */}
        <button
          onClick={() => router.push("/list/announcements")}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-card/70 hover:bg-card text-muted-foreground/80 hover:text-foreground transition-all duration-200"
          title="Announcements"
        >
          <MessageSquare className="h-4 w-4" />
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-border/60 mx-1" />

        {/* User account */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-accent/40 transition-all duration-200 select-none group">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-[12px] font-semibold text-foreground leading-tight group-hover:text-[#0038A8] transition-colors">
                  {userProfile?.username || "Guest"}
                </span>
                <span className="text-[10px] text-muted-foreground capitalize leading-none mt-0.5">{role}</span>
              </div>
              <Avatar className="h-8 w-8 border border-border/60 shadow-sm transition-transform duration-200 group-hover:scale-105">
                {userProfile?.image ? (
                  <AvatarImage src={userProfile.image} alt={userProfile.username} />
                ) : null}
                <AvatarFallback className={cn("font-bold text-[11px] bg-gradient-to-tr text-white", roleGradients[role] || "from-[#0038A8] to-violet-600")}>
                  {getInitials(userProfile?.username || role)}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-1.5 bg-popover/90 backdrop-blur rounded-2xl shadow-xl border border-border/60 z-[9999]">
            <div className="px-2 py-1.5 mb-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Account</p>
              <p className="text-sm font-bold text-foreground truncate mt-0.5">{userProfile?.username || "Guest"}</p>
              <p className="text-xs text-muted-foreground truncate">{userProfile?.email || "—"}</p>
            </div>
            <DropdownMenuSeparator className="bg-border/60" />
            <DropdownMenuItem onClick={() => router.push(`/${role}`)}>
              <User className="mr-2 h-4 w-4 text-muted-foreground" /> Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Settings className="mr-2 h-4 w-4 text-muted-foreground" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/60" />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive font-semibold">
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default Navbar;