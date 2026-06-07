"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import Image from "next/image";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { assignmentSchema, AssignmentSchema } from "@/lib/formValidationSchemas";
import { useFormState } from "react-dom";
import { createAssignment, updateAssignment } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { CldUploadWidget } from "next-cloudinary";

const AssignmentForm = ({
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
  } = useForm<AssignmentSchema>({
    resolver: zodResolver(assignmentSchema),
  });

  const [uploadedFile, setUploadedFile] = useState<any>(data?.attachmentFile || data?.attachment_file || null);

  const [state, formAction] = useFormState(
    type === "create" ? createAssignment : updateAssignment,
    {
      success: false,
      error: false,
    }
  );

  const [saving, setSaving] = useState(false);

  const onSubmit = handleSubmit((data) => {
    setSaving(true);
    formAction({ ...data, attachmentFile: uploadedFile?.secure_url });
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast.success(`Assignment has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
    if (state.error) {
      toast.error("Failed to save assignment.");
    }
    setSaving(false);
  }, [state, router, type, setOpen]);

  const { lessons = [] } = relatedData;

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new assignment" : "Update the assignment"}
      </h1>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Assignment Title"
          name="title"
          defaultValue={data?.title}
          register={register}
          error={errors.title}
        />
        <InputField
          label="Start Date"
          name="startDate"
          type="datetime-local"
          defaultValue={data?.startDate ? new Date(data.startDate).toISOString().slice(0, 16) : (data?.created_at ? new Date(data.created_at).toISOString().slice(0, 16) : "")}
          register={register}
          error={errors.startDate}
        />
        <InputField
          label="Due Date"
          name="dueDate"
          type="datetime-local"
          defaultValue={data?.dueDate ? new Date(data.dueDate).toISOString().slice(0, 16) : (data?.due_date ? new Date(data.due_date).toISOString().slice(0, 16) : "")}
          register={register}
          error={errors.dueDate}
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
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Lesson</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("lessonId")}
            defaultValue={data?.lessonId || data?.course_id || data?.lesson_id}
          >
            {lessons.map((l: { id: number; name: string }) => (
              <option value={l.id} key={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          {errors.lessonId?.message && (
            <p className="text-xs text-red-400">
              {errors.lessonId.message.toString()}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-500 font-medium">Attachment File</label>
        <CldUploadWidget
          uploadPreset="school"
          onSuccess={(result, { widget }) => {
            setUploadedFile(result.info);
            toast.success("Attachment file uploaded successfully!");
            widget.close();
          }}
        >
          {({ open }) => {
            return (
              <div
                className="text-xs text-gray-500 flex items-center gap-2 cursor-pointer border border-dashed border-gray-300 p-4 rounded-md hover:bg-gray-50 transition"
                onClick={() => open()}
              >
                <Image src="/upload.png" alt="" width={28} height={28} />
                <span>
                  {uploadedFile?.original_filename
                    ? `Uploaded: ${uploadedFile.original_filename}`
                    : "Upload a file/attachment (PDF, DOCX, ZIP, Image, etc.)"}
                </span>
              </div>
            );
          }}
        </CldUploadWidget>
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

export default AssignmentForm;
