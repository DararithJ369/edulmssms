"use client";

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
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Globe, Plus, X } from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { createPortal } from "react-dom";
import { useToast } from "@/hooks/ToastProvider";
import { FormContainerProps } from "./FormContainer";

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

// USE LAZY LOADING

const TeacherForm = dynamic(() => import("./forms/TeacherForm"), {
  loading: () => <h1>Loading...</h1>,
});
const StudentForm = dynamic(() => import("./forms/StudentForm"), {
  loading: () => <h1>Loading...</h1>,
});
const SubjectForm = dynamic(() => import("./forms/SubjectForm"), {
  loading: () => <h1>Loading...</h1>,
});
const ClassForm = dynamic(() => import("./forms/ClassForm"), {
  loading: () => <h1>Loading...</h1>,
});
const ExamForm = dynamic(() => import("./forms/ExamForm"), {
  loading: () => <h1>Loading...</h1>,
});
const ParentForm = dynamic(() => import("./forms/ParentForm"), {
  loading: () => <h1>Loading...</h1>,
});
const LessonForm = dynamic(() => import("./forms/LessonForm"), {
  loading: () => <h1>Loading...</h1>,
});
const AssignmentForm = dynamic(() => import("./forms/AssignmentForm"), {
  loading: () => <h1>Loading...</h1>,
});
const ResultForm = dynamic(() => import("./forms/ResultForm"), {
  loading: () => <h1>Loading...</h1>,
});
const AnnouncementForm = dynamic(() => import("./forms/AnnouncementForm"), {
  loading: () => <h1>Loading...</h1>,
});
const AttendanceForm = dynamic(() => import("./forms/AttendanceForm"), {
  loading: () => <h1>Loading...</h1>,
});

const forms: {
  [key: string]: (
    setOpen: Dispatch<SetStateAction<boolean>>,
    type: "create" | "update",
    data?: any,
    relatedData?: any
  ) => JSX.Element;
} = {
  subject: (setOpen, type, data, relatedData) => (
    <SubjectForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  class: (setOpen, type, data, relatedData) => (
    <ClassForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  teacher: (setOpen, type, data, relatedData) => (
    <TeacherForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  student: (setOpen, type, data, relatedData) => (
    <StudentForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  exam: (setOpen, type, data, relatedData) => (
    <ExamForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  parent: (setOpen, type, data, relatedData) => (
    <ParentForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  lesson: (setOpen, type, data, relatedData) => (
    <LessonForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  assignment: (setOpen, type, data, relatedData) => (
    <AssignmentForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  result: (setOpen, type, data, relatedData) => (
    <ResultForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  announcement: (setOpen, type, data, relatedData) => (
    <AnnouncementForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  attendance: (setOpen, type, data, relatedData) => (
    <AttendanceForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
};

const FormModal = ({
  table,
  type,
  data,
  id,
  relatedData,
  triggerText,
  open: externalOpen,
  setOpen: externalSetOpen,
  noTrigger = false,
}: FormContainerProps & {
  relatedData?: any;
  open?: boolean;
  setOpen?: Dispatch<SetStateAction<boolean>>;
  noTrigger?: boolean;
}) => {
  const { success: toastSuccess, error: toastError } = useToast();
  const size = type === "create" ? "w-8 h-8" : "w-7 h-7";
  const bgColor =
    type === "create"
      ? "bg-[#0038A8] text-white hover:bg-[#002b80]"
      : type === "update"
      ? "bg-slate-100 hover:bg-slate-200 text-slate-600"
      : "bg-red-50 text-red-600 hover:bg-red-100";

  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalSetOpen !== undefined ? externalSetOpen : setInternalOpen;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const Form = () => {
    const [state, formAction] = useFormState(deleteActionMap[table], {
      success: false,
      error: false,
    });

    const router = useRouter();

    useEffect(() => {
      if (state.success) {
        toastSuccess(`${table.charAt(0).toUpperCase() + table.slice(1)} has been deleted successfully!`);
        setOpen(false);
        router.refresh();
      }
      if (state.error) {
        toastError(`Failed to delete ${table}.`);
      }
    }, [state, router]);

    return type === "delete" && id ? (
      <form action={formAction} className="p-4 flex flex-col gap-4 text-left font-sans select-none">
        <input type="text | number" name="id" value={id} hidden />
        <h2 className="text-lg font-black text-gray-900 tracking-tight">Delete {table.charAt(0).toUpperCase() + table.slice(1)}</h2>
        <span className="text-sm font-medium text-slate-500 leading-relaxed">
          Are you sure you want to delete this record? All associated details will be permanently removed. This action cannot be undone.
        </span>
        <div className="flex justify-end gap-2 pt-2 border-t">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
          >
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 bg-red-650 hover:bg-red-750 text-white text-xs font-black rounded-xl">
            Delete Record
          </button>
        </div>
      </form>
    ) : type === "create" || type === "update" ? (
      forms[table] ? (
        forms[table](setOpen, type, data, relatedData)
      ) : (
        <div className="p-4 text-center text-sm text-gray-500">
          Form not found for {table}!
        </div>
      )
    ) : (
      "Form not found!"
    );
  };

  const isWideForm = ["teacher", "student", "parent", "lesson"].includes(table) && type !== "delete";
  const modalWidth = isWideForm
    ? "w-[95%] md:w-[85%] lg:w-[75%] xl:w-[70%] max-w-4xl"
    : "w-[90%] md:w-[60%] lg:w-[50%] xl:w-[40%] max-w-lg";

  if (noTrigger) {
    if (!open) return null;
    return mounted && typeof document !== "undefined" ? (
      createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className={`bg-white border border-border p-6 rounded-3xl shadow-xl flex flex-col gap-4 relative overflow-hidden max-h-[95vh] ${modalWidth}`}>
            <div className="flex-1 overflow-y-auto pr-1">
              <Form />
            </div>
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>,
        document.body
      )
    ) : null;
  }

  return (
    <>
      {triggerText === "dropdown-edit" ? (
        <button
          type="button"
          className="w-full text-left px-2.5 py-2 hover:bg-slate-50 hover:text-[#0038A8] text-sm font-medium transition-colors outline-none cursor-pointer flex items-center gap-2 rounded-lg text-slate-700"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(true);
          }}
        >
          <Image src="/update.png" alt="" width={14} height={14} className="opacity-75" />
          <span>Edit Details</span>
        </button>
      ) : triggerText === "dropdown-delete" ? (
        <button
          type="button"
          className="w-full text-left px-2.5 py-2 hover:bg-red-50 hover:text-red-650 text-sm font-medium transition-colors outline-none cursor-pointer flex items-center gap-2 text-red-650 rounded-lg"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(true);
          }}
        >
          <Image src="/delete.png" alt="" width={14} height={14} className="opacity-75" />
          <span>Delete Record</span>
        </button>
      ) : triggerText ? (
        <button
          className="px-4 py-2 bg-[#0038A8] text-white hover:bg-[#002D86] font-black text-xs rounded-xl transition-all shadow-md shadow-blue-500/10 flex items-center gap-1.5 active:scale-[0.98] select-none"
          onClick={() => setOpen(true)}
        >
          <Plus className="h-4 w-4" />
          <span>{triggerText}</span>
        </button>
      ) : (
        <button
          className={`${size} flex items-center justify-center rounded-full ${bgColor} transition-colors`}
          onClick={() => setOpen(true)}
        >
          <Image src={`/${type}.png`} alt="" width={14} height={14} />
        </button>
      )}
      {open && (mounted && typeof document !== "undefined" ? (
        createPortal(
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className={`bg-white border border-border p-6 rounded-3xl shadow-xl flex flex-col gap-4 relative overflow-hidden max-h-[95vh] ${modalWidth}`}>
              <div className="flex-1 overflow-y-auto pr-1">
                <Form />
              </div>
              <button
                onClick={() => setOpen(false)}
                className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>,
          document.body
        )
      ) : (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className={`bg-white border border-border p-6 rounded-3xl shadow-xl flex flex-col gap-4 relative overflow-hidden max-h-[95vh] ${modalWidth}`}>
            <div className="flex-1 overflow-y-auto pr-1">
              <Form />
            </div>
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      ))}
    </>
  );
};

export default FormModal;
