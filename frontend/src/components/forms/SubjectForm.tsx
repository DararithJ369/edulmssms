"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { subjectSchema, SubjectSchema } from "@/lib/formValidationSchemas";
import { createSubject, updateSubject } from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

interface SubjectFormProps {
  type: "create" | "update";
  data?: any;
  setOpen?: Dispatch<SetStateAction<boolean>>;
  onCancel?: () => void;
  relatedData?: any;
}

const SubjectForm = ({
  type,
  data,
  setOpen,
  onCancel,
  relatedData,
}: SubjectFormProps) => {
  const handleClose = () => {
    if (setOpen) setOpen(false);
    if (onCancel) onCancel();
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SubjectSchema>({
    resolver: zodResolver(subjectSchema),
    defaultValues: data ? {
      id: data.id,
      name: data.name,
      code: data.code,
      credits: data.credits,
      gradeId: data.gradeId || data.grade_id,
      teachers: data.teachers || (data.instructor_id ? [data.instructor_id] : []),
    } : undefined,
  });

  const [state, formAction] = useFormState(
    type === "create" ? createSubject : updateSubject,
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
      toast.success(`Subject has been successfully ${type === "create" ? "created" : "updated"}!`);
      handleClose();
      router.refresh();
    }
    if (state.error) {
      toast.error("Failed to save subject.");
      setSaving(false);
    }
  }, [state, router, type]);

  const { teachers = [], grades = [] } = relatedData || {};

  const inputStyles = "w-full px-3 py-2 bg-slate-50 border border-border/80 rounded-xl outline-none text-xs transition-colors duration-300 focus:border-[#0038A8]/50 focus:ring-1 focus:ring-[#0038A8]/50 text-foreground";
  const labelStyles = "text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider block mb-1.5";

  return (
    <div className="space-y-6 text-left font-sans select-none p-2">
      {/* HEADER SECTION */}
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-black text-gray-900 tracking-tight">
          {type === "create" ? "Create a New Subject" : "Update Subject Details"}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {type === "create"
            ? "Configure a new curriculum subject and assign teacher logs."
            : "Modify core subject configurations and credentials."}
        </p>
      </div>

      <form className="space-y-6" onSubmit={onSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Subject name"
            name="name"
            defaultValue={data?.name}
            register={register}
            error={errors?.name}
            className="flex flex-col gap-1.5 w-full"
          />

          <InputField
            label="Subject code"
            name="code"
            defaultValue={data?.code}
            register={register}
            error={errors?.code}
            inputProps={{ placeholder: "e.g. SE301" }}
            className="flex flex-col gap-1.5 w-full"
          />

          <InputField
            label="Credits"
            name="credits"
            type="number"
            defaultValue={data?.credits}
            register={register}
            error={errors?.credits}
            inputProps={{ placeholder: "e.g. 3" }}
            className="flex flex-col gap-1.5 w-full"
          />

          <div className="flex flex-col gap-1.5 w-full">
            <label className={labelStyles}>Year Level</label>
            <select
              className={inputStyles}
              {...register("gradeId")}
              defaultValue={data?.gradeId || data?.grade_id || ""}
            >
              <option value="">Select Year Level...</option>
              {grades.map(
                (grade: { id: number; level: number }) => (
                  <option value={grade.id} key={grade.id}>
                    Year Level {grade.level}
                  </option>
                )
              )}
            </select>
            {errors.gradeId?.message && (
              <p className="text-[10px] text-red-500 font-semibold mt-0.5">
                {errors.gradeId.message.toString()}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5 w-full md:col-span-2">
            <label className={labelStyles}>Teachers</label>
            <select
              multiple
              className={`${inputStyles} min-h-[96px]`}
              {...register("teachers")}
              defaultValue={data?.teachers || (data?.instructor_id ? [data.instructor_id] : [])}
            >
              {teachers.map(
                (teacher: { id: string; name: string; surname: string }) => (
                  <option value={teacher.id} key={teacher.id}>
                    {teacher.name + " " + teacher.surname}
                  </option>
                )
              )}
            </select>
            {errors.teachers?.message && (
              <p className="text-[10px] text-red-500 font-semibold mt-0.5">
                {errors.teachers.message.toString()}
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
            {saving ? "Saving..." : type === "create" ? "Create Subject" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubjectForm;
