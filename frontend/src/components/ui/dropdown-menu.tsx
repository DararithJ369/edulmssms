"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check } from "lucide-react";

import { cn } from "@/lib/ui";

const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuGroup = DropdownMenuPrimitive.Group;
const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
const DropdownMenuItem = DropdownMenuPrimitive.Item;
const DropdownMenuSeparator = DropdownMenuPrimitive.Separator;

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 8, ...props }, ref) => (
  <DropdownMenuPortal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[160px] rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg",
        "transition-colors duration-300",
        className
      )}
      {...props}
    />
  </DropdownMenuPortal>
));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

const DropdownMenuItemStyled = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuItem
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-lg px-2 py-2 text-sm outline-none",
      "focus:bg-accent focus:text-accent-foreground",
      "transition-colors duration-300",
      className
    )}
    {...props}
  >
    {children}
  </DropdownMenuItem>
));
DropdownMenuItemStyled.displayName = DropdownMenuPrimitive.Item.displayName;

const DropdownMenuCheckItem = ({ checked, children }: { checked: boolean; children: React.ReactNode }) => (
  <span className="flex items-center justify-between w-full">
    <span>{children}</span>
    {checked && <Check className="h-4 w-4 text-primary" />}
  </span>
);

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuContent,
  DropdownMenuItemStyled as DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuCheckItem,
};
