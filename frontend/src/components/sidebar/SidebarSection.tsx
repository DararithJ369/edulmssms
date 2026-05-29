"use client";

import type { LucideIcon } from "lucide-react";
import { SidebarItem } from "@/components/sidebar/SidebarItem";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/ui";

export type MenuItem = {
  label: string;
  href?: string;
  disabled?: boolean;
  visible: string[];
  badge?: string | number;
};

export type MenuSection = {
  title: string;
  icon: LucideIcon;
  items: MenuItem[];
};

type SidebarSectionProps = {
  section: MenuSection;
  isCollapsed?: boolean;
  isActive: (href?: string) => boolean;
  role: string;
};

export const SidebarSection = ({ section, isCollapsed = false, isActive, role }: SidebarSectionProps) => {
  const header = (
    <div
      className={cn(
        "flex items-center gap-2.5 px-3 py-1.5 select-none transition-all duration-300",
        isCollapsed ? "justify-center h-8 w-8 mx-auto hover:bg-accent/40 rounded-xl cursor-pointer" : ""
      )}
    > 
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground shadow-sm transition-colors hover:text-foreground">
        <section.icon className="h-3.5 w-3.5" />
      </div>
      {!isCollapsed && (
        <div className="flex flex-1 items-center justify-between overflow-hidden">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80 whitespace-nowrap">
            {section.title}
          </span>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-1">
      {isCollapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex justify-center">{header}</div>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-popover/95 backdrop-blur-md font-semibold text-[11px] px-2.5 py-1 border border-border/80 rounded-lg shadow-md z-[99999]">
            {section.title}
          </TooltipContent>
        </Tooltip>
      ) : (
        header
      )}
      
      <div className="space-y-1 pl-1">
        {section.items.map((item) => (
          <SidebarItem
            key={item.label}
            label={item.label}
            href={item.href}
            disabled={item.disabled}
            icon={section.icon}
            isCollapsed={isCollapsed}
            isActive={isActive(item.href)}
            role={role}
            badge={item.badge}
          />
        ))}
      </div>
    </div>
  );
};
