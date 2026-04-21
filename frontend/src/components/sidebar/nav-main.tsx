"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Link } from "react-router";
import { cn } from "@/lib/utils";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
      isActive: boolean;
    }[];
  }[];
}) {
  return (
    <SidebarGroup className="py-0">
      <SidebarGroupLabel className="text-xs font-bold text-slate-600 dark:text-slate-400 px-0 mb-3 ml-2 uppercase tracking-wider">Menu</SidebarGroupLabel>
      <SidebarMenu className="gap-1">
        {items.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={item.isActive}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton 
                  tooltip={item.title}
                  className={cn(
                    "px-2 py-2.5 text-sm font-medium rounded-lg transition-all hover:bg-green-50 dark:hover:bg-green-950/40 group-data-[state=open]/collapsible:bg-green-50 dark:group-data-[state=open]/collapsible:bg-green-950/40",
                    item.isActive ? "text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/40 border-l-2 border-l-green-600" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 border-l-2 border-l-transparent"
                  )}
                >
                  {item.icon && <item.icon className={cn("h-5 w-5 flex-shrink-0", item.isActive ? "text-green-600 dark:text-green-400" : "text-slate-500 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300")} />}
                  <span>{item.title}</span>
                  <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              {item.items && item.items.length > 0 && (
                <CollapsibleContent>
                  <SidebarMenuSub className="ml-0 border-l-2 border-l-green-200 dark:border-l-green-900 pl-0 mt-1">
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title} className="ml-0">
                        <SidebarMenuSubButton
                          asChild
                          className={cn(
                            "px-2 py-2 text-xs ml-4 rounded-lg transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-green-50 dark:hover:bg-green-950/40",
                            subItem.isActive && "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/40 font-semibold"
                          )}
                        >
                          <Link to={subItem.url}>
                            <span>{subItem.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              )}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
