"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/ui";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type SidebarItemProps = {
  label: string;
  href?: string;
  disabled?: boolean;
  icon: LucideIcon;
  isCollapsed?: boolean;
  isActive: boolean;
  role?: string;
  badge?: string | number;
};

const roleStyles: Record<string, { active: string; icon: string; badge: string }> = {
  admin: {
    active: "bg-indigo-50/60 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-950/30 font-semibold shadow-sm",
    icon: "text-indigo-600 dark:text-indigo-400",
    badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300",
  },
  teacher: {
    active: "bg-emerald-50/60 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-950/30 font-semibold shadow-sm",
    icon: "text-emerald-600 dark:text-emerald-400",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300",
  },
  student: {
    active: "bg-sky-50/60 text-sky-600 dark:bg-sky-950/20 dark:text-sky-400 border border-sky-100/50 dark:border-sky-950/30 font-semibold shadow-sm",
    icon: "text-sky-600 dark:text-sky-400",
    badge: "bg-sky-100 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300",
  },
  parent: {
    active: "bg-amber-50/60 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100/50 dark:border-amber-950/30 font-semibold shadow-sm",
    icon: "text-amber-600 dark:text-amber-400",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300",
  },
};

export const SidebarItem = ({
  label,
  href,
  disabled,
  icon: Icon,
  isCollapsed = false,
  isActive,
  role = "admin",
  badge,
}: SidebarItemProps) => {
  const styles = roleStyles[role] || roleStyles.admin;

  const content = (
    <div
      className={cn(
        "group/item relative flex w-full items-center rounded-2xl transition-all duration-300 cursor-pointer select-none",
        "text-muted-foreground/90 hover:text-foreground",
        "hover:bg-accent/25 backdrop-blur-sm",
        isCollapsed ? "justify-center p-2.5 h-10 w-10 mx-auto" : "gap-2.5 px-3.5 py-2.5 text-[13.5px]",
        isActive && "text-foreground font-semibold",
        !isActive && "border border-transparent",
        disabled && "pointer-events-none opacity-50"
      )}
    >
      {isActive && (
        <span
          className={cn(
            "absolute inset-0 rounded-2xl border pointer-events-none z-0 transition-all duration-300",
            role === "admin" && "bg-gradient-to-r from-indigo-50/60 to-indigo-50/15 dark:from-indigo-950/20 dark:to-transparent border-indigo-100/50 dark:border-indigo-950/30 shadow-[0_2px_8px_rgba(99,102,241,0.02)]",
            role === "teacher" && "bg-gradient-to-r from-emerald-50/60 to-emerald-50/15 dark:from-emerald-950/20 dark:to-transparent border-emerald-100/50 dark:border-emerald-950/30 shadow-[0_2px_8px_rgba(16,185,129,0.02)]",
            role === "student" && "bg-gradient-to-r from-sky-50/60 to-sky-50/15 dark:from-sky-950/20 dark:to-transparent border-sky-100/50 dark:border-sky-950/30 shadow-[0_2px_8px_rgba(14,165,233,0.02)]",
            role === "parent" && "bg-gradient-to-r from-amber-50/60 to-amber-50/15 dark:from-amber-950/20 dark:to-transparent border-amber-100/50 dark:border-amber-950/30 shadow-[0_2px_8px_rgba(245,158,11,0.02)]"
          )}
        />
      )}
      {isActive && (
        <span
          className={cn(
            "absolute left-0 top-3 bottom-3 w-[2.5px] rounded-r-full z-10 transition-all duration-300",
            role === "admin" && "bg-indigo-600 dark:bg-indigo-400",
            role === "teacher" && "bg-emerald-600 dark:bg-emerald-400",
            role === "student" && "bg-sky-600 dark:bg-sky-400",
            role === "parent" && "bg-amber-600 dark:bg-amber-400"
          )}
        />
      )}
      
      <Icon className={cn("relative z-10 h-4.5 w-4.5 shrink-0 transition-all duration-300 group-hover/item:scale-105 group-hover/item:translate-x-0.5", isActive && styles.icon)} />
      
      {!isCollapsed && (
        <span className="relative z-10 font-semibold whitespace-nowrap overflow-hidden text-ellipsis transition-all duration-300 group-hover/item:translate-x-0.5">
          {label}
        </span>
      )}

      {!isCollapsed && badge !== undefined && badge !== null && (
        <span className={cn(
          "relative z-10 ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-bold tabular-nums transition-all duration-300",
          isActive ? styles.badge : "bg-muted/70 text-muted-foreground"
        )}>
          {badge}
        </span>
      )}

      {isCollapsed && badge !== undefined && badge !== null && (
        <span className={cn(
          "absolute right-1.5 top-1.5 h-2 w-2 rounded-full animate-pulse z-20",
          role === "admin" && "bg-indigo-500",
          role === "teacher" && "bg-emerald-500",
          role === "student" && "bg-sky-500",
          role === "parent" && "bg-amber-500"
        )} />
      )}
    </div>
  );

  const tooltipLabel = badge !== undefined && badge !== null ? `${label} (${badge})` : label;

  const wrappedContent = isCollapsed ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex w-full justify-center">{content}</div>
      </TooltipTrigger>
      <TooltipContent side="right" className="bg-popover/95 backdrop-blur-md font-semibold text-[11px] px-2.5 py-1 border border-border/80 rounded-lg shadow-md z-[99999]">
        {tooltipLabel}
      </TooltipContent>
    </Tooltip>
  ) : (
    content
  );

  if (disabled || !href) {
    return wrappedContent;
  }

  return (
    <Link href={href} className="block w-full">
      {wrappedContent}
    </Link>
  );
};
