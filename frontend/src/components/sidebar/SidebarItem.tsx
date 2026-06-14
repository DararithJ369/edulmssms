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
  const isInteractive = !comingSoon && !!href;

  const content = (
    <div
      className={cn(
        "group/item relative flex w-full items-center rounded-lg transition-all duration-150 cursor-pointer",
        isCollapsed
          ? "justify-center h-9 w-9 mx-auto"
          : "gap-2.5 px-2.5 py-[7px] text-[12.5px]",
        // Idle
        !isActive && "text-[#8b96b0] hover:text-white hover:bg-white/[0.06]",
        // Active
        isActive && "bg-white/[0.08] text-white",
        // Disabled
        comingSoon && "opacity-40 cursor-default pointer-events-none"
      )}
    >
      {/* Icon */}
      <Icon
        className={cn(
          "shrink-0 transition-colors duration-150",
          isCollapsed ? "h-[17px] w-[17px]" : "h-[15px] w-[15px]",
          isActive
            ? "text-white"
            : "text-[#6b7a99] group-hover/item:text-white"
        )}
      />

      {/* Label */}
      {!isCollapsed && (
        <span className={cn(
          "flex-1 font-medium whitespace-nowrap overflow-hidden text-ellipsis leading-none",
          isActive ? "text-white" : "text-[#8b96b0] group-hover/item:text-white"
        )}>
          {label}
        </span>
      )}

      {/* Coming soon */}
      {!isCollapsed && comingSoon && (
        <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-white/5 text-white/30 border border-white/10 uppercase tracking-wider">
          Soon
        </span>
      )}

      {/* Badge (expanded) */}
      {!isCollapsed && badge !== undefined && badge !== null && !comingSoon && (
        <span className={cn(
          "ml-auto min-w-[18px] text-center text-[10px] px-1.5 py-0.5 rounded-full font-bold tabular-nums",
          isActive ? "bg-indigo-500/80 text-white" : "bg-white/10 text-white/50"
        )}>
          {badge}
        </span>
      )}

      {/* Collapsed badge dot */}
      {isCollapsed && badge !== undefined && badge !== null && !comingSoon && (
        <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-indigo-400 ring-1 ring-[#131929]" />
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
        className="bg-[#1e2a3e] text-white/90 border border-white/10 font-semibold text-[11px] px-2.5 py-1 rounded-lg shadow-lg z-[99999]"
      >
        {tooltipLabel}
      </TooltipContent>
    </Tooltip>
  ) : (
    content
  );

  if (!isInteractive) return withTooltip;

  return (
    <Link href={href!} className="block w-full">
      {withTooltip}
    </Link>
  );
};
