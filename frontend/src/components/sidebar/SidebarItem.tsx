"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/ui";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type SidebarItemProps = {
  label: string;
  href?: string;
  disabled?: boolean;
  icon: LucideIcon;
  isCollapsed: boolean;
  isActive: boolean;
};

const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0 },
};

export const SidebarItem = ({
  label,
  href,
  disabled,
  icon: Icon,
  isCollapsed,
  isActive,
}: SidebarItemProps) => {
  const content = (
    <motion.div
      whileHover={{ x: isCollapsed ? 0 : 2 }}
      className={cn(
        "relative flex w-full items-center gap-2.5 rounded-2xl px-3 py-1.5 text-[13px] transition-colors duration-300",
        "text-foreground/80 hover:text-foreground",
        "hover:bg-accent",
        isCollapsed && "justify-center",
        isActive && "bg-accent text-foreground ring-1 ring-border shadow-sm",
        disabled && "pointer-events-none opacity-50"
      )}
    >
      {isActive && (
        <motion.span
          layoutId="active-indicator"
          className="absolute inset-0 rounded-2xl border border-border shadow-[0_0_20px_rgba(15,23,42,0.12)]"
        />
      )}
      <Icon className="relative z-10 h-4.5 w-4.5 shrink-0" />
      <AnimatePresence initial={false} mode="wait">
        {!isCollapsed && (
          <motion.span
            key="label"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="relative z-10 font-medium"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );

  if (disabled || !href) {
    return isCollapsed ? (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    ) : (
      content
    );
  }

  return isCollapsed ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link href={href} className="block">
          {content}
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  ) : (
    <Link href={href} className="block">
      {content}
    </Link>
  );
};
