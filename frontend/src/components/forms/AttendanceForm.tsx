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

const AttendanceForm = ({
  type,
  data,
  setOpen,
  relatedData = {},
}: {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: any;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AttendanceSchema>({
    resolver: zodResolver(attendanceSchema),
  });

  const [state, formAction] = useFormState(
    type === "create" ? createAttendance : updateAttendance,
    {
      success: false,
      error: false,
    }
  );

  const [saving, setSaving] = useState(false);

  const onSubmit = handleSubmit((data) => {
    setSaving(true);
    formAction(data);
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast.success(`Attendance record has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
    if (state.error) {
      toast.error("Failed to save attendance record.");
    }
    setSaving(false);
  }, [state, router, type, setOpen]);

  const { students = [], classes = [] } = relatedData;

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Record Attendance" : "Update Attendance Record"}
      </h1>
      <div className="flex justify-between flex-wrap gap-4">
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Student</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
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
            <p className="text-xs text-red-400">
              {errors.studentId.message.toString()}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Course / Class</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
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
            <p className="text-xs text-red-400">
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
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Status</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("status")}
            defaultValue={data?.status || "present"}
          >
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
          </select>
          {errors.status?.message && (
            <p className="text-xs text-red-400">
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
        {data && (
          <InputField
            label="Id"
            name="id"
            defaultValue={data?.id}
            register={register}
            error={errors?.id}
            hidden
          />
        )}
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-500 font-medium">Note (Optional)</label>
        <textarea
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full h-32"
          {...register("note")}
          defaultValue={data?.note}
        />
        {errors.note?.message && (
          <p className="text-xs text-red-400">
            {errors.note.message.toString()}
          </p>
        )}
      </div>
      {state.error && (
        <span className="text-red-500">Something went wrong!</span>
      )}
      <button type="submit" disabled={saving} className="bg-blue-400 text-white p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed">
        {saving ? "Saving..." : type === "create" ? "Record" : "Update"}
      </button>
    </form>
  );
};

export default AttendanceForm;
