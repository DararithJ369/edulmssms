"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { classSchema, ClassSchema } from "@/lib/formValidationSchemas";
import { createClass, updateClass } from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

interface ClassFormProps {
  type: "create" | "update";
  data?: any;
  setOpen?: Dispatch<SetStateAction<boolean>>;
  onCancel?: () => void;
  relatedData?: any;
}

const ClassForm = ({
  type,
  data,
  setOpen,
  onCancel,
  relatedData,
}: ClassFormProps) => {
  const handleClose = () => {
    if (setOpen) setOpen(false);
    if (onCancel) onCancel();
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClassSchema>({
    resolver: zodResolver(classSchema),
    defaultValues: data ? {
      id: data.id,
      name: data.name,
      capacity: data.capacity,
      gradeId: data.gradeId || data.grade_id,
      supervisorId: data.supervisorId || data.supervisor_id,
    } : undefined,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const router = useRouter();

  const onSubmit = handleSubmit(async (formData) => {
    setSaving(true);
    setError(false);
    try {
      const action = type === "create" ? createClass : updateClass;
      const res = await action({ success: false, error: false }, formData);
      if (res.success) {
        toast.success(`Class has been successfully ${type === "create" ? "created" : "updated"}!`);
        handleClose();
        router.refresh();
      } else {
        setError(true);
        setSaving(false);
      }
    } catch (err) {
      console.error(err);
      setError(true);
      setSaving(false);
    }
  });

  const { teachers = [], grades = [] } = relatedData || {};

  const inputStyles = "w-full px-3 py-2 bg-slate-50 border border-border/80 rounded-xl outline-none text-xs transition-colors duration-300 focus:border-[#0038A8]/50 focus:ring-1 focus:ring-[#0038A8]/50 text-foreground";
  const labelStyles = "text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider block mb-1.5";

  return (
    <div className="space-y-6 text-left font-sans select-none p-2">
      {/* HEADER SECTION */}
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-black text-gray-900 tracking-tight">
          {type === "create" ? "Create a New Class" : "Update Class Details"}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {type === "create"
            ? "Establish a new classroom group, select supervisors, and configure levels."
            : "Modify core class configurations and registration credentials."}
        </p>
      </div>

      <form className="space-y-6" onSubmit={onSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Class name"
            name="name"
            defaultValue={data?.name}
            register={register}
            error={errors?.name}
            className="flex flex-col gap-1.5 w-full"
          />

          <div className="flex flex-col gap-1.5 w-full">
            <label className={labelStyles}>Year Level</label>
            <select
              className={inputStyles}
              {...register("gradeId")}
              defaultValue={data?.gradeId || data?.grade_id}
            >
              {grades.map((grade: { id: number; level: number }) => (
                <option
                  value={grade.id}
                  key={grade.id}
                >
                  {grade.level}
                </option>
              ))}
            </select>
            {errors.gradeId?.message && (
              <p className="text-[10px] text-red-500 font-semibold mt-0.5">
                {errors.gradeId.message.toString()}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5 w-full">
            <label className={labelStyles}>Supervisor</label>
            <select
              className={inputStyles}
              {...register("supervisorId")}
              defaultValue={data?.supervisorId || data?.supervisor_id}
            >
              {teachers.map(
                (teacher: { id: string; name: string; surname: string }) => (
                  <option
                    value={teacher.id}
                    key={teacher.id}
                  >
                    {teacher.name + " " + teacher.surname}
                  </option>
                )
              )}
            </select>
            {errors.supervisorId?.message && (
              <p className="text-[10px] text-red-500 font-semibold mt-0.5">
                {errors.supervisorId.message.toString()}
              </p>
            )}
          </div>

          <InputField
            label="Capacity"
            name="capacity"
            defaultValue={data?.capacity}
            register={register}
            error={errors?.capacity}
            className="flex flex-col gap-1.5 w-full"
          />

          {data?.id && (
            <input type="hidden" value={data.id} {...register("id")} />
          )}
        </div>

        {error && (
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
            {saving ? "Saving..." : type === "create" ? "Create Class" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClassForm;
