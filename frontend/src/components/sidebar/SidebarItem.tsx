"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/ui";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type SidebarItemProps = {
  label: string;
  href?: string;
  icon: LucideIcon;
  isCollapsed?: boolean;
  isActive: boolean;
  role?: string;
  badge?: string | number;
  comingSoon?: boolean;
};

const roleAccent: Record<string, { bar: string; bg: string; text: string; badge: string }> = {
  admin: {
    bar:   "bg-indigo-600",
    bg:    "from-indigo-50/70 to-indigo-50/10 border-indigo-100/60",
    text:  "text-indigo-600",
    badge: "bg-indigo-100 text-indigo-700",
  },
  teacher: {
    bar:   "bg-emerald-600",
    bg:    "from-emerald-50/70 to-emerald-50/10 border-emerald-100/60",
    text:  "text-emerald-600",
    badge: "bg-emerald-100 text-emerald-700",
  },
  student: {
    bar:   "bg-sky-600",
    bg:    "from-sky-50/70 to-sky-50/10 border-sky-100/60",
    text:  "text-sky-600",
    badge: "bg-sky-100 text-sky-700",
  },
  parent: {
    bar:   "bg-amber-600",
    bg:    "from-amber-50/70 to-amber-50/10 border-amber-100/60",
    text:  "text-amber-600",
    badge: "bg-amber-100 text-amber-700",
  },
};

export const SidebarItem = ({
  label,
  href,
  icon: Icon,
  isCollapsed = false,
  isActive,
  role = "admin",
  badge,
  comingSoon = false,
}: SidebarItemProps) => {
  const accent = roleAccent[role] || roleAccent.admin;
  const isInteractive = !comingSoon && !!href;

  const content = (
    <div
      className={cn(
        "group/item relative flex w-full items-center rounded-xl transition-all duration-200 select-none cursor-pointer",
        isCollapsed ? "justify-center p-2.5 h-10 w-10 mx-auto" : "gap-2.5 px-3 py-2 text-[13px]",
        // idle state
        "text-muted-foreground/80 hover:text-foreground",
        !isActive && !comingSoon && "hover:bg-accent/30",
        // active state
        isActive && `bg-gradient-to-r ${accent.bg} border text-foreground`,
        // coming soon
        comingSoon && "opacity-50 cursor-default pointer-events-none"
      )}
    >
      {/* Left accent bar */}
      {isActive && !isCollapsed && (
        <span
          className={cn(
            "absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-r-full",
            accent.bar
          )}
        />
      )}

      {/* Icon */}
      <Icon
        className={cn(
          "relative z-10 h-[17px] w-[17px] shrink-0 transition-all duration-200",
          isActive ? accent.text : "text-muted-foreground/70 group-hover/item:text-foreground",
          !isCollapsed && "group-hover/item:scale-105"
        )}
      />

      {/* Label */}
      {!isCollapsed && (
        <span className="relative z-10 flex-1 font-medium whitespace-nowrap overflow-hidden text-ellipsis leading-none">
          {label}
        </span>
      )}

      {/* Badge or Coming Soon pill */}
      {!isCollapsed && comingSoon && (
        <span className="relative z-10 ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-muted text-muted-foreground border border-border/60 uppercase tracking-wider">
          Soon
        </span>
      )}
      {!isCollapsed && badge !== undefined && badge !== null && !comingSoon && (
        <span
          className={cn(
            "relative z-10 ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-bold tabular-nums",
            isActive ? accent.badge : "bg-muted/70 text-muted-foreground"
          )}
        >
          {badge}
        </span>
      )}

      {/* Collapsed badge dot */}
      {isCollapsed && badge !== undefined && badge !== null && !comingSoon && (
        <span
          className={cn(
            "absolute right-1 top-1 h-2 w-2 rounded-full",
            role === "admin" && "bg-indigo-500",
            role === "teacher" && "bg-emerald-500",
            role === "student" && "bg-sky-500",
            role === "parent" && "bg-amber-500"
          )}
        />
      )}
    </div>
  );

  const tooltipLabel = comingSoon
    ? `${label} — Coming Soon`
    : badge !== undefined && badge !== null
    ? `${label} (${badge})`
    : label;

  const withTooltip = isCollapsed ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex w-full justify-center">{content}</div>
      </TooltipTrigger>
      <TooltipContent
        side="right"
        className="bg-popover/95 backdrop-blur-md font-semibold text-[11px] px-2.5 py-1 border border-border/80 rounded-lg shadow-md z-[99999]"
      >
        {tooltipLabel}
      </TooltipContent>
    </Tooltip>
  ) : (
    content
  );

  if (!isInteractive) {
    return withTooltip;
  }

  return (
    <Link href={href!} className="block w-full">
      {withTooltip}
    </Link>
  );
};
