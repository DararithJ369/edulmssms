"use client";

import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { SidebarItem } from "@/components/sidebar/SidebarItem";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/ui";
import { MenuSectionConfig, hasPermission } from "@/lib/navigation";

type SidebarSectionProps = {
  section: MenuSectionConfig;
  isCollapsed?: boolean;
  isActive: (href?: string) => boolean;
  role: string;
};

export const SidebarSection = ({
  section,
  isCollapsed = false,
  isActive,
  role,
}: SidebarSectionProps) => {
  // Persist expand/collapse per section in localStorage
  const storageKey = `sidebar-section-${section.title.replace(/\s+/g, "-").toLowerCase()}`;
  const [isOpen, setIsOpen] = useState(!section.defaultCollapsed);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) setIsOpen(saved === "true");
      else setIsOpen(!section.defaultCollapsed);
    }
  }, [storageKey, section.defaultCollapsed]);

  const toggle = () => {
    setIsOpen((prev) => {
      localStorage.setItem(storageKey, String(!prev));
      return !prev;
    });
  };

  // Filter: check role allowlist first, then permission
  const visibleItems = section.items.filter((item) => {
    // Item-level role restriction
    if (item.roles && !item.roles.includes(role)) return false;
    // Permission check
    if (!hasPermission(role, item.permission)) return false;
    return true;
  });

  if (visibleItems.length === 0) return null;

  // Is any child currently active?
  const sectionHasActive = visibleItems.some((item) => isActive(item.href));

  const SectionIcon = section.icon;

  const header = (
    <button
      onClick={isCollapsed ? undefined : toggle}
      className={cn(
        "group/header flex w-full items-center gap-2 px-2 py-1.5 rounded-lg transition-all duration-200 select-none",
        isCollapsed ? "justify-center pointer-events-none" : "hover:bg-accent/20 cursor-pointer",
        sectionHasActive && "text-foreground"
      )}
    >
      {/* Section icon box */}
      <div
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all duration-200",
          sectionHasActive
            ? "bg-foreground/5 border-foreground/15 text-foreground"
            : "bg-muted/50 border-border/40 text-muted-foreground/60"
        )}
      >
        <SectionIcon className="h-2.5 w-2.5" />
      </div>

      {!isCollapsed && (
        <>
          <span
            className={cn(
              "flex-1 text-left text-[10px] font-bold uppercase tracking-[0.14em]",
              sectionHasActive ? "text-foreground/80" : "text-muted-foreground/50"
            )}
          >
            {section.title}
          </span>
          <ChevronDown
            className={cn(
              "h-3 w-3 text-muted-foreground/40 transition-transform duration-200",
              isOpen ? "rotate-0" : "-rotate-90"
            )}
          />
        </>
      )}
    </button>
  );

  return (
    <div className="space-y-0.5">
      {/* Section header with tooltip in collapsed mode */}
      {isCollapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex justify-center">{header}</div>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            className="bg-popover/95 backdrop-blur-md font-semibold text-[11px] px-2.5 py-1 border border-border/80 rounded-lg shadow-md z-[99999]"
          >
            {section.title}
          </TooltipContent>
        </Tooltip>
      ) : (
        header
      )}

      {/* Items — animated expand/collapse */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen || isCollapsed ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className={cn("space-y-0.5", !isCollapsed && "pl-1")}>
          {visibleItems.map((item) => (
            <SidebarItem
              key={item.label}
              label={item.label}
              href={item.href}
              icon={item.icon}
              isCollapsed={isCollapsed}
              isActive={isActive(item.href)}
              role={role}
              badge={item.badge}
              comingSoon={item.comingSoon}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
