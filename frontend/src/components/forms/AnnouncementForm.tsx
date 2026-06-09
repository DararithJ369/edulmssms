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

const AnnouncementForm = ({
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
  } = useForm<AnnouncementSchema>({
    resolver: zodResolver(announcementSchema),
  });

  const [state, formAction] = useFormState(
    type === "create" ? createAnnouncement : updateAnnouncement,
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
      toast.success(`Announcement has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
    if (state.error) {
      toast.error("Failed to save announcement.");
    }
    setSaving(false);
  }, [state, router, type, setOpen]);

  const { classes = [] } = relatedData;

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new announcement" : "Update the announcement"}
      </h1>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Announcement Title"
          name="title"
          defaultValue={data?.title}
          register={register}
          error={errors.title as FieldError}
        />
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Announcement Type</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("type")}
            defaultValue={data?.type || "general"}
          >
            <option value="general">General Bulletin</option>
            <option value="class-specific">Class-Specific</option>
            <option value="important">Important Alert</option>
          </select>
          {errors.type?.message && (
            <p className="text-xs text-red-400">
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
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Target Class (Optional)</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
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
            <p className="text-xs text-red-400">
              {errors.courseId.message.toString()}
            </p>
          )}
        </div>
        {data && (
          <InputField
            label="Id"
            name="id"
            defaultValue={data?.id}
            register={register}
            error={errors?.id as FieldError}
            hidden
          />
        )}
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-500 font-medium">Message Body</label>
        <textarea
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full h-32"
          {...register("message")}
          defaultValue={data?.message || data?.description || data?.content}
        />
        {errors.message?.message && (
          <p className="text-xs text-red-400">
            {errors.message.message.toString()}
          </p>
        )}
      </div>
      {state.error && (
        <span className="text-red-500">Something went wrong!</span>
      )}
      <button type="submit" disabled={saving} className="bg-blue-400 text-white p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed">
        {saving ? "Saving..." : type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default AnnouncementForm;