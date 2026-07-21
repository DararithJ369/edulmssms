"use client";

import { MoreVertical, Eye, Settings, Archive, Trash2, Pencil } from "lucide-react";
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
import StudentEditModal from "./StudentEditModal";
import TeacherEditModal from "./TeacherEditModal";
import ParentEditModal from "./ParentEditModal";
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
  deleteQuiz,
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
  quiz: deleteQuiz,
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

  // Construct StudentEditData object
  const studentEditData = table === "student" && editData ? {
    userId: editData.id || id,
    username: editData.username || "",
    email: editData.email || "",
    full_name: editData.student_profile?.full_name || editData.full_name || "",
    phone: editData.student_profile?.phone || editData.phone || "",
    address: editData.student_profile?.address || editData.address || "",
    bio: editData.student_profile?.bio || editData.bio || "",
    date_of_birth: editData.student_profile?.date_of_birth || editData.date_of_birth || "",
    gender: editData.student_profile?.gender || editData.gender || "",
    nationality: editData.student_profile?.nationality || editData.nationality || "",
    pfp: editData.student_profile?.pfp || editData.pfp || "",
    blood_type: editData.student_profile?.blood_type || editData.blood_type || "",
    medical_conditions: editData.student_profile?.medical_conditions || editData.medical_conditions || "",
    emergency_contact_name: editData.student_profile?.emergency_contact_name || editData.emergency_contact_name || "",
    emergency_contact_phone: editData.student_profile?.emergency_contact_phone || editData.emergency_contact_phone || "",
    emergency_contact_relationship: editData.student_profile?.emergency_contact_relationship || editData.emergency_contact_relationship || "",
    student_id: editData.student_metadata?.student_id || editData.student_id || "",
    department: editData.student_metadata?.department || editData.department || "",
    enrolment_date: editData.student_metadata?.enrolment_date ? String(editData.student_metadata.enrolment_date) : (editData.enrolment_date || ""),
    previous_school: editData.student_metadata?.previous_school || editData.previous_school || "",
    scholarship_status: editData.student_metadata?.scholarship_status || editData.scholarship_status || "",
    special_needs: editData.student_metadata?.special_needs || editData.special_needs || "",
    cloudinaryCloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dlykcgjdh",
    cloudinaryUploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "lms_preset"
  } : null;

  // Construct TeacherEditData object
  const teacherEditData = table === "teacher" && editData ? {
    userId: editData.id || id,
    username: editData.username || "",
    email: editData.email || "",
    full_name: editData.teacher_profile?.full_name || editData.full_name || "",
    phone: editData.teacher_profile?.phone || editData.phone || "",
    address: editData.teacher_profile?.address || editData.address || "",
    bio: editData.teacher_profile?.bio || editData.bio || "",
    date_of_birth: editData.teacher_profile?.date_of_birth || editData.date_of_birth || "",
    gender: editData.teacher_profile?.gender || editData.gender || "",
    nationality: editData.teacher_profile?.nationality || editData.nationality || "",
    pfp: editData.teacher_profile?.pfp || editData.pfp || "",
    blood_type: editData.teacher_profile?.blood_type || editData.blood_type || "",
    medical_conditions: editData.teacher_profile?.medical_conditions || editData.medical_conditions || "",
    emergency_contact_name: editData.teacher_profile?.emergency_contact_name || editData.emergency_contact_name || "",
    emergency_contact_phone: editData.teacher_profile?.emergency_contact_phone || editData.emergency_contact_phone || "",
    emergency_contact_relationship: editData.teacher_profile?.emergency_contact_relationship || editData.emergency_contact_relationship || "",
    department: editData.teacher_metadata?.department || editData.department || "",
    position: editData.teacher_metadata?.position || editData.position || "",
    office: editData.teacher_metadata?.office || editData.office || "",
    hire_date: editData.teacher_metadata?.hire_date ? String(editData.teacher_metadata.hire_date) : (editData.hire_date || ""),
    cloudinaryCloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dlykcgjdh",
    cloudinaryUploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "lms_preset"
  } : null;

  // Construct ParentEditData object
  const parentEditData = table === "parent" && editData ? {
    userId: editData.id || id,
    username: editData.username || "",
    email: editData.email || "",
    full_name: editData.parent_profile?.full_name || editData.full_name || "",
    phone: editData.parent_profile?.phone || editData.phone || "",
    address: editData.parent_profile?.address || editData.address || "",
    bio: editData.parent_profile?.bio || editData.bio || "",
    date_of_birth: editData.parent_profile?.date_of_birth || editData.date_of_birth || "",
    gender: editData.parent_profile?.gender || editData.gender || "",
    nationality: editData.parent_profile?.nationality || editData.nationality || "",
    pfp: editData.parent_profile?.pfp || editData.pfp || "",
    blood_type: editData.parent_profile?.blood_type || editData.blood_type || "",
    medical_conditions: editData.parent_profile?.medical_conditions || editData.medical_conditions || "",
    emergency_contact_name: editData.parent_profile?.emergency_contact_name || editData.emergency_contact_name || "",
    emergency_contact_phone: editData.parent_profile?.emergency_contact_phone || editData.emergency_contact_phone || "",
    emergency_contact_relationship: editData.parent_profile?.emergency_contact_relationship || editData.emergency_contact_relationship || "",
    occupation: editData.parent_metadata?.occupation || editData.occupation || "",
    relationship: editData.parent_metadata?.relationship || editData.relationship || "",
    emergency_phone: editData.parent_metadata?.emergency_phone || editData.emergency_phone || "",
    website: editData.parent_metadata?.website || editData.website || "",
    linkedin: editData.parent_metadata?.linkedin || editData.linkedin || "",
    cloudinaryCloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dlykcgjdh",
    cloudinaryUploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "lms_preset"
  } : null;

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
          
          {(role === "admin" || (role === "teacher" && ["lesson", "assignment", "exam", "result", "quiz"].includes(table))) && editData && (
            table === "student" ? (
              <DropdownMenuItem onSelect={(e) => e.preventDefault()} asChild>
                <StudentEditModal
                  data={studentEditData!}
                  trigger={
                    <div className="flex items-center gap-2 w-full text-left cursor-pointer px-2 py-1.5 hover:bg-slate-50 text-sm rounded-lg font-medium select-none outline-none">
                      <Pencil className="h-4 w-4 text-slate-400" />
                      <span>Edit Details</span>
                    </div>
                  }
                />
              </DropdownMenuItem>
            ) : table === "teacher" ? (
              <DropdownMenuItem onSelect={(e) => e.preventDefault()} asChild>
                <TeacherEditModal
                  data={teacherEditData!}
                  trigger={
                    <div className="flex items-center gap-2 w-full text-left cursor-pointer px-2 py-1.5 hover:bg-slate-50 text-sm rounded-lg font-medium select-none outline-none">
                      <Pencil className="h-4 w-4 text-slate-400" />
                      <span>Edit Details</span>
                    </div>
                  }
                />
              </DropdownMenuItem>
            ) : table === "parent" ? (
              <DropdownMenuItem onSelect={(e) => e.preventDefault()} asChild>
                <ParentEditModal
                  data={parentEditData!}
                  trigger={
                    <div className="flex items-center gap-2 w-full text-left cursor-pointer px-2 py-1.5 hover:bg-slate-50 text-sm rounded-lg font-medium select-none outline-none">
                      <Pencil className="h-4 w-4 text-slate-400" />
                      <span>Edit Details</span>
                    </div>
                  }
                />
              </DropdownMenuItem>
            ) : table === "quiz" ? (
              <DropdownMenuItem asChild>
                <Link href={`/list/quizzes/${id}/edit`} className="flex items-center gap-2">
                  <Pencil className="h-4 w-4 text-slate-400" />
                  <span>Edit Details</span>
                </Link>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                <div className="flex items-center gap-2 w-full text-left cursor-pointer">
                  <Pencil className="h-4 w-4 text-slate-400" />
                  <span>Edit Details</span>
                </div>
              </DropdownMenuItem>
            )
          )}

          {role === "admin" && (table === "course" || table === "class") && (
            <DropdownMenuItem asChild>
              <Link href={table === "course" ? `/list/courses/${id}/edit` : `/list/classes/${id}`} className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-slate-400" />
                <span>Manage settings</span>
              </Link>
            </DropdownMenuItem>
          )}

          {(role === "admin" || (role === "teacher" && ["lesson", "assignment", "exam", "result", "quiz"].includes(table))) && (
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

          {(role === "admin" || (role === "teacher" && ["lesson", "assignment", "exam", "result", "quiz"].includes(table))) && (
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
