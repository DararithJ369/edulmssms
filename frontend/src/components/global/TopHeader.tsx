import { Search, Bell, Settings, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/AuthProvider";
import { useNavigate } from "react-router";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useEffect, useState } from "react";

export function TopHeader() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
    setIsDark(!isDark);
  };

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

  const userInitials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <header className="sticky top-0 z-30 bg-gradient-to-r from-white to-slate-50 dark:from-neutral-950 dark:to-neutral-900 border-b border-slate-200 dark:border-neutral-800 shadow-sm h-16 flex items-center">
      <div className="w-full px-8">
        <div className="flex items-center justify-between gap-6 h-full">
          {/* Left - Title */}
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 bg-gradient-to-b from-green-500 to-green-600 rounded-full"></div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
              EduLMS
            </h1>
          </div>

          {/* Right - Search, Notifications & User */}
          <div className="flex items-center gap-3 ml-auto">
            {/* Search - Small */}
            <div className="hidden sm:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500 dark:text-green-400" />
                <Input
                  placeholder="Search..."
                  className="w-40 pl-9 pr-4 h-9 bg-slate-100 dark:bg-neutral-800 border-slate-300 dark:border-neutral-700 rounded-lg text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                />
              </div>
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-slate-200 dark:bg-neutral-700"></div>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/50 rounded-lg transition-all"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/50 rounded-lg transition-all"
              title={isDark ? "Light mode" : "Dark mode"}
              onClick={toggleTheme}
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {/* Settings */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/50 rounded-lg transition-all"
              title="Settings"
              onClick={() => navigate("/settings/general")}
            >
              <Settings className="h-5 w-5" />
            </Button>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-3 gap-2 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-lg transition-all ml-2"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarImage src="" alt={user?.name} />
                    <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-green-400 to-green-600 text-white">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-medium truncate max-w-[100px]">
                    {user?.name}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-lg mt-2">
                <DropdownMenuLabel className="flex flex-col gap-1 py-2">
                  <p className="text-sm font-semibold text-slate-900 dark:text-neutral-100">
                    {user?.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-neutral-400">
                    {user?.email}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => navigate("/settings/general")}
                  className="cursor-pointer text-sm"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-sm text-red-600 dark:text-red-400"
                >
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
