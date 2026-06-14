"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FieldError } from "react-hook-form";
import InputField from "../InputField";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { announcementSchema, AnnouncementSchema } from "@/lib/formValidationSchemas";
import { useFormState } from "react-dom";
import { createAnnouncement, updateAnnouncement } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

interface AnnouncementFormProps {
  type: "create" | "update";
  data?: any;
  setOpen?: Dispatch<SetStateAction<boolean>>;
  onCancel?: () => void;
  relatedData?: any;
}

const AnnouncementForm = ({
  type,
  data,
  setOpen,
  onCancel,
  relatedData = {},
}: AnnouncementFormProps) => {
  const handleClose = () => {
    if (setOpen) setOpen(false);
    if (onCancel) onCancel();
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AnnouncementSchema>({
    resolver: zodResolver(announcementSchema),
    defaultValues: data,
  });

  const [state, formAction] = useFormState(
    type === "create" ? createAnnouncement : updateAnnouncement,
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
      toast.success(`Announcement has been ${type === "create" ? "created" : "updated"}!`);
      handleClose();
      router.refresh();
    }
    if (state.error) {
      toast.error("Failed to save announcement.");
      setSaving(false);
    }
  }, [state, router, type]);

  const { classes = [] } = relatedData;

  const inputStyles = "w-full px-3 py-2 bg-slate-50 border border-border/80 rounded-xl outline-none text-xs transition-colors duration-300 focus:border-[#0038A8]/50 focus:ring-1 focus:ring-[#0038A8]/50 text-foreground";
  const labelStyles = "text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider block mb-1.5";

  return (
    <div className="space-y-6 text-left font-sans select-none p-2">
      {/* HEADER SECTION */}
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-black text-gray-900 tracking-tight">
          {type === "create" ? "Create a New Announcement" : "Update Announcement Details"}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {type === "create"
            ? "Publish a new announcement for students, faculty, or specific classes."
            : "Modify core announcement content and settings."}
        </p>
      </div>

      <form className="space-y-6" onSubmit={onSubmit}>
        <div className="flex flex-wrap gap-4">
          <InputField
            label="Announcement Title"
            name="title"
            defaultValue={data?.title}
            register={register}
            error={errors.title as FieldError}
          />
          
          <div className="flex flex-col gap-1.5 w-full md:w-1/4">
            <label className={labelStyles}>Announcement Type</label>
            <select
              className={inputStyles}
              {...register("type")}
              defaultValue={data?.type || "general"}
            >
              <option value="general">General Bulletin</option>
              <option value="class-specific">Class-Specific</option>
              <option value="important">Important Alert</option>
            </select>
            {errors.type?.message && (
              <p className="text-[10px] text-red-500 font-semibold mt-0.5">
                {errors.type.message.toString()}
              </p>
            )}
          </div>

          <InputField
            label="Recipient ID/Role (Optional)"
            name="recipientId"
            defaultValue={data?.recipientId || data?.recipient_id}
            register={register}
            error={errors.recipientId as FieldError}
          />

          <div className="flex flex-col gap-1.5 w-full md:w-1/4">
            <label className={labelStyles}>Target Class (Optional)</label>
            <select
              className={inputStyles}
              {...register("courseId")}
              defaultValue={data?.courseId || data?.course_id}
            >
              <option value="">None</option>
              {classes.map((cls: { id: number; name: string }) => (
                <option value={cls.id} key={cls.id}>
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

          {data?.id && (
            <input type="hidden" value={data.id} {...register("id")} />
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelStyles}>Message Body</label>
          <textarea
            className={`${inputStyles} h-32 resize-y`}
            {...register("message")}
            defaultValue={data?.message || data?.description || data?.content}
          />
          {errors.message?.message && (
            <p className="text-[10px] text-red-500 font-semibold mt-0.5">
              {errors.message.message.toString()}
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
            {saving ? "Saving..." : type === "create" ? "Create Announcement" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AnnouncementForm;