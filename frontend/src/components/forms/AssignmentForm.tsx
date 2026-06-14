"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { assignmentSchema, AssignmentSchema } from "@/lib/formValidationSchemas";
import { useFormState } from "react-dom";
import { createAssignment, updateAssignment } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { CldUploadWidget } from "next-cloudinary";
import { UploadCloud } from "lucide-react";

interface AssignmentFormProps {
  type: "create" | "update";
  data?: any;
  setOpen?: Dispatch<SetStateAction<boolean>>;
  onCancel?: () => void;
  relatedData?: any;
}

const AssignmentForm = ({
  type,
  data,
  setOpen,
  onCancel,
  relatedData = {},
}: AssignmentFormProps) => {
  const handleClose = () => {
    if (setOpen) setOpen(false);
    if (onCancel) onCancel();
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AssignmentSchema>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: data,
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

  const onSubmit = handleSubmit((formData) => {
    setSaving(true);
    formAction({ ...formData, attachmentFile: uploadedFile?.secure_url || uploadedFile });
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast.success(`Assignment has been ${type === "create" ? "created" : "updated"}!`);
      handleClose();
      router.refresh();
    }
    if (state.error) {
      toast.error("Failed to save assignment.");
      setSaving(false);
    }
  }, [state, router, type]);

  const { lessons = [] } = relatedData;

  const inputStyles = "w-full px-3 py-2 bg-slate-50 border border-border/80 rounded-xl outline-none text-xs transition-colors duration-300 focus:border-[#0038A8]/50 focus:ring-1 focus:ring-[#0038A8]/50 text-foreground";
  const labelStyles = "text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider block mb-1.5";

  return (
    <div className="space-y-6 text-left font-sans select-none p-2">
      {/* HEADER SECTION */}
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-black text-gray-900 tracking-tight">
          {type === "create" ? "Create a New Assignment" : "Update Assignment Details"}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {type === "create"
            ? "Publish a new coursework assignment with instructions and deadlines."
            : "Modify core assignment parameters, attachment logs, and due dates."}
        </p>
      </div>

      <form className="space-y-6" onSubmit={onSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Assignment Title"
            name="title"
            defaultValue={data?.title}
            register={register}
            error={errors.title}
            className="flex flex-col gap-1.5 w-full"
          />

          <div className="flex flex-col gap-1.5 w-full">
            <label className={labelStyles}>Lesson</label>
            <select
              className={inputStyles}
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
              <p className="text-[10px] text-red-500 font-semibold mt-0.5">
                {errors.lessonId.message.toString()}
              </p>
            )}
          </div>

          <InputField
            label="Start Date"
            name="startDate"
            type="datetime-local"
            defaultValue={data?.startDate ? new Date(data.startDate).toISOString().slice(0, 16) : (data?.created_at ? new Date(data.created_at).toISOString().slice(0, 16) : "")}
            register={register}
            error={errors.startDate}
            className="flex flex-col gap-1.5 w-full"
          />
          <InputField
            label="Due Date"
            name="dueDate"
            type="datetime-local"
            defaultValue={data?.dueDate ? new Date(data.dueDate).toISOString().slice(0, 16) : (data?.due_date ? new Date(data.due_date).toISOString().slice(0, 16) : "")}
            register={register}
            error={errors.dueDate}
            className="flex flex-col gap-1.5 w-full"
          />
        </div>

        <div className="flex flex-col gap-1.5 w-full">
          <label className={labelStyles}>Assignment Instructions / Content</label>
          <textarea
            rows={5}
            className={inputStyles + " resize-none"}
            placeholder="Provide detailed instructions, content, or questions for this assignment..."
            {...register("description")}
            defaultValue={data?.description}
          />
          {errors.description?.message && (
            <p className="text-[10px] text-red-500 font-semibold mt-0.5">
              {errors.description.message.toString()}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelStyles}>Attachment File</label>
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
                  className="w-full border-2 border-dashed border-[#cbd5e1] rounded-xl p-5 flex flex-col items-center justify-center bg-white hover:bg-gray-50/50 transition-colors cursor-pointer"
                  onClick={() => open()}
                >
                  <UploadCloud className="w-5 h-5 text-[#94a3b8] mb-0.5" />
                  <p className="text-xs font-semibold text-[#0038A8]">
                    {uploadedFile?.original_filename || uploadedFile
                      ? `Uploaded: ${uploadedFile.original_filename || (typeof uploadedFile === 'string' ? uploadedFile.split('/').pop() : 'Attached File')}`
                      : "Upload a file / attachment (PDF, DOCX, ZIP, etc.)"}
                  </p>
                  <p className="text-[10px] text-slate-400">Supported documents up to 10MB</p>
                </div>
              );
            }}
          </CldUploadWidget>
        </div>

        {data?.id && (
          <input type="hidden" value={data.id} {...register("id")} />
        )}

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
            {saving ? "Saving..." : type === "create" ? "Create Assignment" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AssignmentForm;
