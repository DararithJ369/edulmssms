"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { attendanceSchema, AttendanceSchema } from "@/lib/formValidationSchemas";
import { useFormState } from "react-dom";
import { createAttendance, updateAttendance } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

interface AttendanceFormProps {
  type: "create" | "update";
  data?: any;
  setOpen?: Dispatch<SetStateAction<boolean>>;
  onCancel?: () => void;
  relatedData?: any;
}

const AttendanceForm = ({
  type,
  data,
  setOpen,
  onCancel,
  relatedData = {},
}: AttendanceFormProps) => {
  const handleClose = () => {
    if (setOpen) setOpen(false);
    if (onCancel) onCancel();
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AttendanceSchema>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: data,
  });

  const [state, formAction] = useFormState(
    type === "create" ? createAttendance : updateAttendance,
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
      toast.success(`Attendance record has been ${type === "create" ? "created" : "updated"}!`);
      handleClose();
      router.refresh();
    }
    if (state.error) {
      toast.error("Failed to save attendance record.");
      setSaving(false);
    }
  }, [state, router, type]);

  const { students = [], classes = [] } = relatedData;

  const inputStyles = "w-full px-3 py-2 bg-slate-50 border border-border/80 rounded-xl outline-none text-xs transition-colors duration-300 focus:border-[#0038A8]/50 focus:ring-1 focus:ring-[#0038A8]/50 text-foreground";
  const labelStyles = "text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider block mb-1.5";

  return (
    <div className="space-y-6 text-left font-sans select-none p-2">
      {/* HEADER SECTION */}
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-black text-gray-900 tracking-tight">
          {type === "create" ? "Record Attendance" : "Update Attendance Record"}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {type === "create"
            ? "Log a new attendance check for a specific student in a class."
            : "Update student attendance logs and status."}
        </p>
      </div>

      <form className="space-y-6" onSubmit={onSubmit}>
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-1.5 w-full md:w-1/4">
            <label className={labelStyles}>Student</label>
            <select
              className={inputStyles}
              {...register("studentId")}
              defaultValue={data?.student_id || data?.studentId}
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
            <label className={labelStyles}>Course / Class</label>
            <select
              className={inputStyles}
              {...register("courseId")}
              defaultValue={data?.course_id || data?.courseId}
            >
              {classes.map((cls: { id: number; name: string }) => (
                <option value={String(cls.id)} key={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
            {errors.courseId?.message && (
              <p className="text-[10px] text-red-500 font-semibold mt-0.5">
                {errors.courseId.message.toString()}
              </p>
            )}
          </div>

          <InputField
            label="Date"
            name="date"
            type="date"
            defaultValue={data?.date ? new Date(data.date).toISOString().split("T")[0] : ""}
            register={register}
            error={errors.date}
          />

          <div className="flex flex-col gap-1.5 w-full md:w-1/4">
            <label className={labelStyles}>Status</label>
            <select
              className={inputStyles}
              {...register("status")}
              defaultValue={data?.status || "present"}
            >
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
            </select>
            {errors.status?.message && (
              <p className="text-[10px] text-red-500 font-semibold mt-0.5">
                {errors.status.message.toString()}
              </p>
            )}
          </div>

          <InputField
            label="Time (Optional)"
            name="time"
            inputProps={{ placeholder: "e.g. 09:00 AM" }}
            defaultValue={data?.time}
            register={register}
            error={errors.time}
          />

          {data?.id && (
            <input type="hidden" value={data.id} {...register("id")} />
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelStyles}>Note (Optional)</label>
          <textarea
            className={`${inputStyles} h-32 resize-y`}
            {...register("note")}
            defaultValue={data?.note}
          />
          {errors.note?.message && (
            <p className="text-[10px] text-red-500 font-semibold mt-0.5">
              {errors.note.message.toString()}
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
            {saving ? "Saving..." : type === "create" ? "Record Attendance" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AttendanceForm;
