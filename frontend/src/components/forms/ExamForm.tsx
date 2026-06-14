"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { examSchema, ExamSchema } from "@/lib/formValidationSchemas";
import { createExam, updateExam } from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

// Helper function to safely parse and format dates for datetime-local inputs
const formatDefaultDateTime = (dateString: any): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return !isNaN(date.getTime()) ? date.toISOString().slice(0, 16) : "";
};

interface ExamFormProps {
  type: "create" | "update";
  data?: any;
  setOpen?: Dispatch<SetStateAction<boolean>>;
  onCancel?: () => void;
  relatedData?: any;
}

const ExamForm = ({
  type,
  data,
  setOpen,
  onCancel,
  relatedData,
}: ExamFormProps) => {
  const handleClose = () => {
    if (setOpen) setOpen(false);
    if (onCancel) onCancel();
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExamSchema>({
    resolver: zodResolver(examSchema),
    defaultValues: data,
  });

  const [state, formAction] = useFormState(
    type === "create" ? createExam : updateExam,
    {
      success: false,
      error: false,
    }
  );

  const [saving, setSaving] = useState(false);

  const onSubmit = handleSubmit((formData) => {
    setSaving(true);
    formAction(formData);
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast.success(`Exam has been successfully ${type === "create" ? "created" : "updated"}!`);
      handleClose();
      router.refresh();
    }
    if (state.error) {
      toast.error("Failed to save exam.");
      setSaving(false);
    }
  }, [state, router, type]);

  const { lessons = [] } = relatedData || {};

  const inputStyles = "w-full px-3 py-2 bg-slate-50 border border-border/80 rounded-xl outline-none text-xs transition-colors duration-300 focus:border-[#0038A8]/50 focus:ring-1 focus:ring-[#0038A8]/50 text-foreground";
  const labelStyles = "text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider block mb-1.5";

  return (
    <div className="space-y-6 text-left font-sans select-none p-2">
      {/* HEADER SECTION */}
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-black text-gray-900 tracking-tight">
          {type === "create" ? "Create a New Exam" : "Update Exam Details"}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {type === "create"
            ? "Configure a new examination, assign lessons, and specify test durations."
            : "Modify core exam parameters, schedule configurations, and deadlines."}
        </p>
      </div>

      <form className="space-y-6" onSubmit={onSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Exam title"
            name="title"
            defaultValue={data?.title}
            register={register}
            error={errors?.title}
            className="flex flex-col gap-1.5 w-full"
          />

          <div className="flex flex-col gap-1.5 w-full">
            <label className={labelStyles}>Lesson</label>
            <select
              className={inputStyles}
              {...register("lessonId")}
              defaultValue={data?.lessonId || data?.lesson_id}
            >
              {lessons.map((lesson: { id: number; name: string }) => (
                <option value={lesson.id} key={lesson.id}>
                  {lesson.name}
                </option>
              ))}
            </select>
            {errors.lessonId?.message && (
              <p className="text-[10px] text-red-500 font-semibold mt-0.5">
                {errors.lessonId.message.toString()}
              </p>
            )}
          </div>

          <InputField
            label="Start Date"
            name="startTime"
            defaultValue={formatDefaultDateTime(data?.startTime || data?.start_time)}
            register={register}
            error={errors?.startTime}
            type="datetime-local"
            className="flex flex-col gap-1.5 w-full"
          />

          <InputField
            label="End Date"
            name="endTime"
            defaultValue={formatDefaultDateTime(data?.endTime || data?.end_time)}
            register={register}
            error={errors?.endTime}
            type="datetime-local"
            className="flex flex-col gap-1.5 w-full"
          />

          <div className="flex flex-col gap-1.5 w-full md:col-span-2">
            <label className={labelStyles}>Exam Notes & Focus Areas</label>
            <textarea
              rows={4}
              placeholder="Write core guidelines, topics, or focus notes for students to prepare..."
              {...register("description")}
              defaultValue={data?.description}
              className={`${inputStyles} resize-none h-24`}
            />
            {errors.description?.message && (
              <p className="text-[10px] text-red-500 font-semibold mt-0.5">
                {errors.description.message.toString()}
              </p>
            )}
          </div>

          {data?.id && (
            <input type="hidden" value={data.id} {...register("id")} />
          )}
        </div>

        {state.error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-semibold">
            Something went wrong!
          </div>
        )}

        {/* SINGLE UNIFIED ACTION FOOTER SECTION BAR */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl disabled:opacity-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-[#0038A8] hover:bg-[#002D86] text-white text-xs font-black rounded-xl disabled:opacity-50 transition-colors cursor-pointer"
          >
            {saving ? "Saving..." : type === "create" ? "Create Exam" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExamForm;