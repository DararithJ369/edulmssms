"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/ui";
import { SidebarItem } from "@/components/sidebar/SidebarItem";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type MenuItem = {
  label: string;
  href?: string;
  disabled?: boolean;
  visible: string[];
};

export type MenuSection = {
  title: string;
  icon: LucideIcon;
  items: MenuItem[];
};

type SidebarSectionProps = {
  section: MenuSection;
  isCollapsed: boolean;
  isActive: (href?: string) => boolean;
};

export const SidebarSection = ({ section, isCollapsed, isActive }: SidebarSectionProps) => {
  const header = (
    <div className={cn("flex items-center gap-2.5 px-3 py-1.5", isCollapsed && "justify-center")}> 
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <section.icon className="h-3 w-3" />
      </div>
      <div className={cn("flex items-center gap-2", isCollapsed && "hidden")}>
        <span className="h-1.5 w-1.5 rounded-full bg-border" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {section.title}
        </span>
      </div>
    </div>
  );

  return (
    <div className="space-y-1">
      {isCollapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex justify-center">{header}</div>
          </TooltipTrigger>
          <TooltipContent side="right">{section.title}</TooltipContent>
        </Tooltip>
      ) : (
        header
      )}
      <AnimatePresence initial={false}>
        {section.items.map((item) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
          >
            <SidebarItem
              label={item.label}
              href={item.href}
              disabled={item.disabled}
              icon={section.icon}
              isCollapsed={isCollapsed}
              isActive={isActive(item.href)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
