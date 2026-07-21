"use client";

import dynamic from "next/dynamic";
import { JSX, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useFormState } from "react-dom";
import { X, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import {
  deleteSubject,
  deleteClass,
  deleteTeacher,
  deleteStudent,
  deleteExam,
  deleteParent,
  deleteLesson,
  deleteAssignment,
  deleteResult,
  deleteAttendance,
  deleteEvent,
  deleteCourse,
  deleteAnnouncement,
  deleteUser,
} from "@/lib/actions";

// ─── Delete action registry ────────────────────────────────────────────────
const deleteActionMap: Record<string, any> = {
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

// ─── Skeleton fallback for lazy-loaded forms ────────────────────────────────
const FormSkeleton = () => (
  <div className="space-y-4 p-2 animate-pulse">
    <div className="h-5 bg-slate-100 rounded-lg w-48" />
    <div className="h-3 bg-slate-100 rounded w-64" />
    <div className="grid grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-3 bg-slate-100 rounded w-20" />
          <div className="h-9 bg-slate-100 rounded-xl" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-3 bg-slate-100 rounded w-20" />
          <div className="h-9 bg-slate-100 rounded-xl" />
        </div>
      ))}
    </div>
  </div>
);

// ─── Lazy-loaded form components ───────────────────────────────────────────
const TeacherForm = dynamic(() => import("./forms/TeacherForm"), {
  loading: () => <FormSkeleton />,
});
const StudentForm = dynamic(() => import("./forms/StudentForm"), {
  loading: () => <FormSkeleton />,
});
const SubjectForm = dynamic(() => import("./forms/SubjectForm"), {
  loading: () => <FormSkeleton />,
});
const ClassForm = dynamic(() => import("./forms/ClassForm"), {
  loading: () => <FormSkeleton />,
});
const ExamForm = dynamic(() => import("./forms/ExamForm"), {
  loading: () => <FormSkeleton />,
});
const ParentForm = dynamic(() => import("./forms/ParentForm"), {
  loading: () => <FormSkeleton />,
});
const LessonForm = dynamic(() => import("./forms/LessonForm"), {
  loading: () => <FormSkeleton />,
});
const AssignmentForm = dynamic(() => import("./forms/AssignmentForm"), {
  loading: () => <FormSkeleton />,
});
const ResultForm = dynamic(() => import("./forms/ResultForm"), {
  loading: () => <FormSkeleton />,
});
const AnnouncementForm = dynamic(() => import("./forms/AnnouncementForm"), {
  loading: () => <FormSkeleton />,
});
const AttendanceForm = dynamic(() => import("./forms/AttendanceForm"), {
  loading: () => <FormSkeleton />,
});

// ─── Form component registry ───────────────────────────────────────────────
type FormRenderer = (
  setOpen: any,
  type: "create" | "update",
  data?: any,
  relatedData?: any
) => JSX.Element;

const forms: Record<string, FormRenderer> = {
  teacher: (setOpen, type, data, relatedData) => (
    <TeacherForm setOpen={setOpen} type={type} data={data} relatedData={relatedData} />
  ),
  student: (setOpen, type, data, relatedData) => (
    <StudentForm setOpen={setOpen} type={type} data={data} relatedData={relatedData} />
  ),
  subject: (setOpen, type, data, relatedData) => (
    <SubjectForm setOpen={setOpen} type={type} data={data} relatedData={relatedData} />
  ),
  class: (setOpen, type, data, relatedData) => (
    <ClassForm setOpen={setOpen} type={type} data={data} relatedData={relatedData} />
  ),
  exam: (setOpen, type, data, relatedData) => (
    <ExamForm setOpen={setOpen} type={type} data={data} relatedData={relatedData} />
  ),
  parent: (setOpen, type, data, relatedData) => (
    <ParentForm setOpen={setOpen} type={type} data={data} relatedData={relatedData} />
  ),
  lesson: (setOpen, type, data, relatedData) => (
    <LessonForm setOpen={setOpen} type={type} data={data} relatedData={relatedData} />
  ),
  assignment: (setOpen, type, data, relatedData) => (
    <AssignmentForm setOpen={setOpen} type={type} data={data} relatedData={relatedData} />
  ),
  result: (setOpen, type, data, relatedData) => (
    <ResultForm setOpen={setOpen} type={type} data={data} relatedData={relatedData} />
  ),
  announcement: (setOpen, type, data, relatedData) => (
    <AnnouncementForm setOpen={setOpen} type={type} data={data} relatedData={relatedData} />
  ),
  attendance: (setOpen, type, data, relatedData) => (
    <AttendanceForm setOpen={setOpen} type={type} data={data} relatedData={relatedData} />
  ),
};

// ─── Modal width config ────────────────────────────────────────────────────
const wideFormTables = ["teacher", "student", "parent", "lesson"];

// ─── Delete confirmation form (module-level, not inner component) ──────────
function DeleteForm({
  table,
  id,
  setOpen,
}: {
  table: string;
  id: string | number;
  setOpen: (v: boolean) => void;
}) {
  const router = useRouter();
  const deleteAction = deleteActionMap[table];
  const [state, formAction] = useFormState(deleteAction, {
    success: false,
    error: false,
  });

  // Handle result
  if (state.success) {
    toast.success(`Record deleted successfully.`);
    setOpen(false);
    router.refresh();
  }
  if (state.error) {
    toast.error(`Failed to delete record. Please try again.`);
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <div className="text-center space-y-4">
        <div className="h-14 w-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto">
          <Trash2 className="h-6 w-6 text-red-500" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">Delete Record</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Are you sure you want to delete this {table}? This action cannot be undone.
          </p>
        </div>
        <div className="flex items-center gap-2 justify-center pt-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </form>
  );
}

// ─── Modal overlay ─────────────────────────────────────────────────────────
function ModalOverlay({
  table,
  type,
  data,
  id,
  relatedData,
  open,
  setOpen,
}: {
  table: string;
  type: "create" | "update" | "delete";
  data?: any;
  id?: string | number;
  relatedData?: any;
  open: boolean;
  setOpen: any;
}) {
  if (!open) return null;

  const isWide = wideFormTables.includes(table);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      <div
        className={`relative bg-white rounded-3xl shadow-xl border border-border/60 w-full ${
          isWide ? "max-w-2xl" : "max-w-md"
        } max-h-[90vh] flex flex-col overflow-hidden animate-scale-in`}
        role="dialog"
        aria-modal="true"
      >
        {/* Close button */}
        <button
          onClick={() => setOpen(false)}
          aria-label="Close modal"
          className="absolute top-4 right-4 z-10 h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-slate-100 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-6 pr-5">
          {type === "delete" ? (
            <DeleteForm
              table={table}
              id={id!}
              setOpen={setOpen}
            />
          ) : (
            forms[table]?.(setOpen, type, data, relatedData)
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Main FormModal export ─────────────────────────────────────────────────
interface FormModalProps {
  table: string;
  type: "create" | "update" | "delete";
  data?: any;
  id?: string | number;
  relatedData?: any;
  triggerText?: string;
  open?: boolean;
  setOpen?: any;
  noTrigger?: boolean;
}

export default function FormModal({
  table,
  type,
  data,
  id,
  relatedData,
  triggerText,
  open: externalOpen,
  setOpen: externalSetOpen,
  noTrigger = false,
}: FormModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const open = externalOpen ?? internalOpen;
  const setOpen = externalSetOpen ?? setInternalOpen;

  // Render trigger button
  const renderTrigger = () => {
    if (noTrigger) return null;

    if (triggerText === "dropdown-edit") {
      return (
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-foreground hover:bg-accent rounded-md cursor-pointer transition-colors text-left"
        >
          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          Edit Details
        </button>
      );
    }

    if (triggerText === "dropdown-delete") {
      return (
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md cursor-pointer transition-colors text-left"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete Record
        </button>
      );
    }

    if (triggerText) {
      return (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand hover:bg-brand-dark text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          {triggerText}
        </button>
      );
    }

    // Icon-only round button
    const isDelete = type === "delete";
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label={`${type} ${table}`}
        className={`h-7 w-7 flex items-center justify-center rounded-lg border transition-colors cursor-pointer ${
          isDelete
            ? "border-red-100 bg-red-50 hover:bg-red-100 text-red-600"
            : "border-border/80 bg-background hover:bg-accent text-muted-foreground"
        }`}
      >
        {isDelete ? <Trash2 className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
      </button>
    );
  };

  return (
    <>
      {renderTrigger()}
      {open && (
        <ModalOverlay
          table={table}
          type={type}
          data={data}
          id={id}
          relatedData={relatedData}
          open={open}
          setOpen={setOpen}
        />
      )}
    </>
  );
}
