"use client";

import { MoreVertical, Eye, Settings, Archive } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import FormModal from "./FormModal";
import { toast } from "react-toastify";

interface TableRowActionsProps {
  id: string | number;
  table: any;
  viewUrl?: string;
  editData?: any;
  relatedData?: any;
  role?: string;
}

export default function TableRowActions({
  id,
  table,
  viewUrl,
  editData,
  relatedData,
  role,
}: TableRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="h-8 w-8 flex items-center justify-center rounded-xl bg-background border border-border/80 hover:bg-accent text-muted-foreground/80 transition-all select-none cursor-pointer outline-none">
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 p-1">
        {viewUrl && (
          <DropdownMenuItem asChild>
            <Link href={viewUrl} className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-slate-400" />
              <span>View details</span>
            </Link>
          </DropdownMenuItem>
        )}
        
        {(role === "admin" || (role === "teacher" && ["lesson", "assignment", "exam", "result"].includes(table))) && editData && (
          <DropdownMenuItem onSelect={(e) => e.preventDefault()} asChild>
            <FormModal
              table={table}
              type="update"
              data={editData}
              relatedData={relatedData}
              triggerText="dropdown-edit"
            />
          </DropdownMenuItem>
        )}

        {role === "admin" && (table === "course" || table === "class") && (
          <DropdownMenuItem asChild>
            <Link href={`/list/${table}s/${id}`} className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-slate-400" />
              <span>Manage settings</span>
            </Link>
          </DropdownMenuItem>
        )}

        {(role === "admin" || (role === "teacher" && ["lesson", "assignment", "exam", "result"].includes(table))) && (
          <DropdownMenuItem asChild>
            <button
              onClick={() => toast.info(`${table.charAt(0).toUpperCase() + table.slice(1)} archived successfully!`)}
              className="flex items-center gap-2 w-full text-left"
            >
              <Archive className="h-4 w-4 text-slate-400" />
              <span>Archive record</span>
            </button>
          </DropdownMenuItem>
        )}

        {(role === "admin" || (role === "teacher" && ["lesson", "assignment", "exam", "result"].includes(table))) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={(e) => e.preventDefault()} asChild>
              <FormModal
                table={table}
                type="delete"
                id={id}
                triggerText="dropdown-delete"
              />
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
