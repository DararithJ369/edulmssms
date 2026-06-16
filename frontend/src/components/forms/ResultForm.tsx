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

  const inputStyles = "w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg outline-none text-xs font-medium transition-colors focus:border-slate-400 focus:ring-1 focus:ring-slate-300 text-slate-800 placeholder:text-slate-400";
  const selectStyles = "w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg outline-none text-xs font-medium transition-colors focus:border-slate-400 focus:ring-1 focus:ring-slate-300 text-slate-800 appearance-none";
  const labelStyles = "text-[11px] font-semibold text-slate-500 block mb-1";
  const errorStyles = "text-[10px] text-red-500 font-medium mt-0.5";

  return (
    <div className="space-y-5 text-left font-sans select-none">
      {/* HEADER */}
      <div className="pb-4 border-b border-slate-100">
        <h2 className="text-base font-bold text-slate-900">
          {type === "create" ? "Grade a Student" : "Update Grade"}
        </h2>
        <p className="text-[11px] text-slate-400 mt-0.5">
          {type === "create"
            ? "Record a new grade for an exam or assignment."
            : "Update existing grade details."}
        </p>
      </div>

      <form className="space-y-5" onSubmit={onSubmit}>
        {/* ROW 1: Student + Assessment */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelStyles}>Student</label>
            <select className={selectStyles} {...register("studentId")} defaultValue={data?.studentId || data?.student_id}>
              {students.map((s: { id: string; name: string; surname: string }) => (
                <option value={s.id} key={s.id}>{s.name} {s.surname}</option>
              ))}
            </select>
            {errors.studentId?.message && <p className={errorStyles}>{errors.studentId.message.toString()}</p>}
          </div>
          <div>
            <label className={labelStyles}>Exam (Optional)</label>
            <select className={selectStyles} {...register("examId")} defaultValue={data?.examId || data?.exam_id || ""}>
              <option value="">None</option>
              {exams.map((e: { id: number; title: string }) => (
                <option value={e.id} key={e.id}>{e.title}</option>
              ))}
            </select>
            {errors.examId?.message && <p className={errorStyles}>{errors.examId.message.toString()}</p>}
          </div>
          <div>
            <label className={labelStyles}>Assignment (Optional)</label>
            <select className={selectStyles} {...register("assignmentId")} defaultValue={data?.assignmentId || data?.assignment_id || ""}>
              <option value="">None</option>
              {assignments.map((a: { id: number; title: string }) => (
                <option value={a.id} key={a.id}>{a.title}</option>
              ))}
            </select>
            {errors.assignmentId?.message && <p className={errorStyles}>{errors.assignmentId.message.toString()}</p>}
          </div>
        </div>

        {/* ROW 2: Grading Details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className={labelStyles}>Graded By</label>
            <select className={selectStyles} {...register("gradedBy")} defaultValue={data?.gradedBy || data?.graded_by}>
              {teachers.map((t: { id: string; name: string; surname: string }) => (
                <option value={t.id} key={t.id}>{t.name} {t.surname}</option>
              ))}
            </select>
            {errors.gradedBy?.message && <p className={errorStyles}>{errors.gradedBy.message.toString()}</p>}
          </div>
          <div>
            <label className={labelStyles}>Score</label>
            <input type="number" className={inputStyles} {...register("score")} defaultValue={data?.score} placeholder="0" />
            {errors.score?.message && <p className={errorStyles}>{errors.score.message.toString()}</p>}
          </div>
          <div>
            <label className={labelStyles}>Total Marks</label>
            <input type="number" className={inputStyles} {...register("totalMarks")} defaultValue={data?.totalMarks || data?.total_marks} placeholder="100" />
            {errors.totalMarks?.message && <p className={errorStyles}>{errors.totalMarks.message.toString()}</p>}
          </div>
          <div>
            <label className={labelStyles}>Grade Letter</label>
            <input type="text" className={inputStyles} {...register("grade")} defaultValue={data?.grade} placeholder="A" />
            {errors.grade?.message && <p className={errorStyles}>{errors.grade.message.toString()}</p>}
          </div>
        </div>

        {/* ROW 3: Pass checkbox */}
        <div className="flex items-center gap-2.5 py-1">
          <input
            type="checkbox"
            id="isPassed"
            className="w-4 h-4 rounded border-slate-300 text-slate-700 focus:ring-slate-400"
            {...register("isPassed")}
            defaultChecked={data?.isPassed ?? data?.is_passed}
          />
          <label htmlFor="isPassed" className="text-xs font-medium text-slate-600 select-none">
            Student Passed
          </label>
        </div>

        {data?.id && <input type="hidden" value={data.id} {...register("id")} />}

        {/* Feedback */}
        <div>
          <label className={labelStyles}>Feedback</label>
          <textarea
            className={`${inputStyles} h-24 resize-y`}
            {...register("feedback")}
            defaultValue={data?.feedback}
            placeholder="Optional feedback for the student..."
          />
          {errors.feedback?.message && <p className={errorStyles}>{errors.feedback.message.toString()}</p>}
        </div>

        {state.error && (
          <div className="p-3 bg-slate-100 text-slate-700 text-xs rounded-lg font-medium border border-slate-200">
            Something went wrong. Please try again.
          </div>
        )}

        {/* ACTION FOOTER */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium rounded-lg disabled:opacity-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors cursor-pointer"
          >
            {saving ? "Saving..." : type === "create" ? "Submit Grade" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResultForm;
