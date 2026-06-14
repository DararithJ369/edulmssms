"use client";

import { useState, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
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

  const visibleItems = section.items.filter((item) => {
    if (item.comingSoon) return false;
    if (item.roles && !item.roles.includes(role)) return false;
    if (!hasPermission(role, item.permission)) return false;
    return true;
  });

  if (visibleItems.length === 0) return null;

  // ── COLLAPSED: just icons, no labels, with a faint separator ──────────
  if (isCollapsed) {
    return (
      <div className="space-y-0.5 pt-2">
        <div className="mx-auto w-5 h-px bg-white/[0.07] mb-1" />
        {visibleItems.map((item) => (
          <SidebarItem
            key={item.label}
            label={item.label}
            href={item.href}
            icon={item.icon}
            isCollapsed={true}
            isActive={isActive(item.href)}
            role={role}
            badge={item.badge}
            comingSoon={item.comingSoon}
          />
        ))}
      </div>
    );
  }

  // ── EXPANDED: section label + collapsible list ─────────────────────────
  return (
    <div className="pt-3">
      {/* Section header label — e.g. "TEACHING", "ACADEMIC MANAGEMENT" */}
      <button
        onClick={toggle}
        className="group/hdr flex w-full items-center justify-between px-2.5 mb-1 py-0.5 cursor-pointer"
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#4a5568] group-hover/hdr:text-[#718096] transition-colors">
          {section.title}
        </span>
        <ChevronLeft
          className={cn(
            "h-3 w-3 text-[#4a5568] group-hover/hdr:text-[#718096] transition-all duration-200",
            isOpen ? "-rotate-90" : "rotate-0"
          )}
        />
      </button>

      {/* Animated items */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-250 ease-in-out",
          isOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        )}
      >
        <div className="space-y-0.5">
          {visibleItems.map((item) => (
            <SidebarItem
              key={item.label}
              label={item.label}
              href={item.href}
              icon={item.icon}
              isCollapsed={false}
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
