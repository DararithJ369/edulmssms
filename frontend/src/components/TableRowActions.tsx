"use client";

import { MoreVertical, Eye, Settings, Archive, Trash2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import FormModal from "./FormModal";
import { useToast } from "@/hooks/ToastProvider";
import { useDialog } from "@/hooks/DialogProvider";
import {
  deleteClass,
  deleteExam,
  deleteStudent,
  deleteSubject,
  deleteTeacher,
  deleteParent,
  deleteLesson,
  deleteAssignment,
  deleteResult,
  deleteAnnouncement,
  deleteAttendance,
  deleteCourse,
  deleteEvent,
  deleteUser,
} from "@/lib/actions";

const deleteActionMap = {
  subject: deleteSubject,
  class: deleteClass,
  teacher: deleteTeacher,
  student: deleteStudent,
  exam: deleteExam,
  parent: deleteParent,
  lesson: deleteLesson,
  assignment: deleteAssignment,
  result: deleteResult,
  attendance: deleteAttendance,
  event: deleteEvent,
  course: deleteCourse,
  announcement: deleteAnnouncement,
  user: deleteUser,
};

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
  const router = useRouter();
  const { confirm } = useDialog();
  const { success, error } = useToast();

  const [editOpen, setEditOpen] = useState(false);

  const handleArchive = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const confirmed = await confirm({
      title: `Archive ${table.charAt(0).toUpperCase() + table.slice(1)}`,
      description: `Are you sure you want to archive this ${table} record?`,
      confirmText: "Archive",
      cancelText: "Cancel",
      variant: "warning",
    });

    if (confirmed) {
      success(`${table.charAt(0).toUpperCase() + table.slice(1)} archived successfully!`);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const deleteAction = deleteActionMap[table as keyof typeof deleteActionMap];
    if (!deleteAction) {
      error("Delete action not configured for this table.");
      return;
    }

    const confirmed = await confirm({
      title: `Delete ${table.charAt(0).toUpperCase() + table.slice(1)}`,
      description: `Are you sure you want to delete this ${table} record? All associated details will be permanently removed. This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
    });

    if (confirmed) {
      try {
        const formData = new FormData();
        formData.append("id", String(id));
        const res = await deleteAction({ success: false, error: false }, formData);
        if (res.success) {
          success(`${table.charAt(0).toUpperCase() + table.slice(1)} has been deleted successfully!`);
          router.refresh();
        } else {
          error(`Failed to delete ${table}.`);
        }
      } catch (err) {
        console.error(err);
        error(`Failed to delete ${table}.`);
      }
    }
  };

  return (
    <>
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
            <DropdownMenuItem onSelect={() => setEditOpen(true)}>
              <div className="flex items-center gap-2 w-full text-left cursor-pointer">
                <Image src="/update.png" alt="" width={14} height={14} className="opacity-75" />
                <span>Edit Details</span>
              </div>
            </DropdownMenuItem>
          )}

          {role === "admin" && (table === "course" || table === "class") && (
            <DropdownMenuItem asChild>
              <Link href={table === "course" ? `/list/courses/${id}/edit` : `/list/classes/${id}`} className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-slate-400" />
                <span>Manage settings</span>
              </Link>
            </DropdownMenuItem>
          )}

          {(role === "admin" || (role === "teacher" && ["lesson", "assignment", "exam", "result"].includes(table))) && (
            <DropdownMenuItem asChild>
              <button
                onClick={handleArchive}
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
                <button
                  onClick={handleDelete}
                  className="w-full text-left px-2.5 py-2 hover:bg-red-50 hover:text-red-650 text-sm font-medium transition-colors outline-none cursor-pointer flex items-center gap-2 text-red-650 rounded-lg"
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                  <span>Delete Record</span>
                </button>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {editOpen && (
        <FormModal
          table={table}
          type="update"
          data={editData}
          relatedData={relatedData}
          open={editOpen}
          setOpen={setEditOpen}
          noTrigger={true}
        />
      )}
    </>
  );
}
