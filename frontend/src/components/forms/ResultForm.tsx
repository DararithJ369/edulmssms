"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { resultSchema, ResultSchema } from "@/lib/formValidationSchemas";
import { useFormState } from "react-dom";
import { createResult, updateResult } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

interface ResultFormProps {
  type: "create" | "update";
  data?: any;
  setOpen?: Dispatch<SetStateAction<boolean>>;
  onCancel?: () => void;
  relatedData?: any;
}

const ResultForm = ({
  type,
  data,
  setOpen,
  onCancel,
  relatedData = {},
}: ResultFormProps) => {
  const handleClose = () => {
    if (setOpen) setOpen(false);
    if (onCancel) onCancel();
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResultSchema>({
    resolver: zodResolver(resultSchema),
    defaultValues: data,
  });

  const [state, formAction] = useFormState(
    type === "create" ? createResult : updateResult,
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
      toast.success(`Result has been successfully ${type === "create" ? "created" : "updated"}!`);
      handleClose();
      router.refresh();
    }
    if (state.error) {
      toast.error("Failed to save result.");
      setSaving(false);
    }
  }, [state, router, type]);

  const { students = [], exams = [], assignments = [], teachers = [] } = relatedData;

  const inputStyles = "w-full px-3 py-2 bg-slate-50 border border-border/80 rounded-xl outline-none text-xs transition-colors duration-300 focus:border-[#0038A8]/50 focus:ring-1 focus:ring-[#0038A8]/50 text-foreground";
  const labelStyles = "text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider block mb-1.5";

  return (
    <div className="space-y-6 text-left font-sans select-none p-2">
      {/* HEADER SECTION */}
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-black text-gray-900 tracking-tight">
          {type === "create" ? "Grade a Student" : "Update Student Grade"}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {type === "create"
            ? "Log a new grade and academic results for exams or assignments."
            : "Modify core grade parameters, scoring, and academic reviews."}
        </p>
      </div>

      <form className="space-y-6" onSubmit={onSubmit}>
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-1.5 w-full md:w-1/4">
            <label className={labelStyles}>Student</label>
            <select
              className={inputStyles}
              {...register("studentId")}
              defaultValue={data?.studentId || data?.student_id}
            >
              {students.map((s: { id: string; name: string; surname: string }) => (
                <option value={s.id} key={s.id}>
                  {s.name + " " + s.surname}
                </option>
              ))}
            </select>
            {errors.studentId?.message && (
              <p className="text-[10px] text-red-500 font-semibold mt-0.5">
                {errors.studentId.message.toString()}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5 w-full md:w-1/4">
            <label className={labelStyles}>Exam (Optional)</label>
            <select
              className={inputStyles}
              {...register("examId")}
              defaultValue={data?.examId || data?.exam_id || ""}
            >
              <option value="">None</option>
              {exams.map((e: { id: number; title: string }) => (
                <option value={e.id} key={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
            {errors.examId?.message && (
              <p className="text-[10px] text-red-500 font-semibold mt-0.5">
                {errors.examId.message.toString()}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5 w-full md:w-1/4">
            <label className={labelStyles}>Assignment (Optional)</label>
            <select
              className={inputStyles}
              {...register("assignmentId")}
              defaultValue={data?.assignmentId || data?.assignment_id || ""}
            >
              <option value="">None</option>
              {assignments.map((a: { id: number; title: string }) => (
                <option value={a.id} key={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
            {errors.assignmentId?.message && (
              <p className="text-[10px] text-red-500 font-semibold mt-0.5">
                {errors.assignmentId.message.toString()}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5 w-full md:w-1/4">
            <label className={labelStyles}>Graded By</label>
            <select
              className={inputStyles}
              {...register("gradedBy")}
              defaultValue={data?.gradedBy || data?.graded_by}
            >
              {teachers.map((t: { id: string; name: string; surname: string }) => (
                <option value={t.id} key={t.id}>
                  {t.name + " " + t.surname}
                </option>
              ))}
            </select>
            {errors.gradedBy?.message && (
              <p className="text-[10px] text-red-500 font-semibold mt-0.5">
                {errors.gradedBy.message.toString()}
              </p>
            )}
          </div>

          <InputField
            label="Score Obtained"
            name="score"
            type="number"
            defaultValue={data?.score}
            register={register}
            error={errors.score}
          />
          <InputField
            label="Total Marks"
            name="totalMarks"
            type="number"
            defaultValue={data?.totalMarks || data?.total_marks}
            register={register}
            error={errors.totalMarks}
          />
          <InputField
            label="Grade Letter"
            name="grade"
            defaultValue={data?.grade}
            register={register}
            error={errors.grade}
          />

          <div className="flex items-center gap-2 w-full md:w-1/4 pt-5">
            <input
              type="checkbox"
              id="isPassed"
              className="w-4 h-4 rounded border-border text-[#0038A8] focus:ring-[#0038A8]/50"
              {...register("isPassed")}
              defaultChecked={data?.isPassed ?? data?.is_passed}
            />
            <label htmlFor="isPassed" className="text-xs font-semibold text-slate-700 select-none">
              Is Student Passed?
            </label>
          </div>

          {data?.id && (
            <input type="hidden" value={data.id} {...register("id")} />
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelStyles}>Feedback</label>
          <textarea
            className={`${inputStyles} h-32 resize-y`}
            {...register("feedback")}
            defaultValue={data?.feedback}
          />
          {errors.feedback?.message && (
            <p className="text-[10px] text-red-500 font-semibold mt-0.5">
              {errors.feedback.message.toString()}
            </p>
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
            {saving ? "Saving..." : type === "create" ? "Submit Grade" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResultForm;
