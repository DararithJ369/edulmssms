"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { X, UploadCloud } from "lucide-react";
import { toast } from "react-toastify";

const lessonFormSchema = z.object({
  title: z.string().min(1, { message: "Lesson Name is required" }),
  content: z.string().nullable().optional(),
  duration: z.coerce.number().int().nonnegative().nullable().optional(),
  material_type: z.string().default("video"),
  material_url: z.string().url().or(z.literal("")).nullable().optional(),
  material_file: z.string().nullable().optional(),
  order: z.coerce.number().int().positive().default(1),
  module_id: z.coerce.number().int().positive({ message: "Required" }),
});

type LessonFormValues = z.infer<typeof lessonFormSchema>;

interface LessonFormProps {
  type: "create" | "update";
  data?: any;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  onCancel?: () => void;
  relatedData?: any;
}

const LessonForm = ({
  type,
  data,
  setOpen,
  onCancel, 
  relatedData,
}: LessonFormProps) => {

  const handleClose = () => {
    if (setOpen) setOpen(false);
    if (onCancel) onCancel();
  };

  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const initialValues: Partial<LessonFormValues> = {
    title: data?.title || "",
    content: data?.content || data?.description || "",
    duration: data?.duration ? parseInt(String(data.duration).replace(/[^0-9]/g, "")) : 45,
    material_type: data?.material_type?.toLowerCase() || "video",
    material_url: data?.material_url || "",
    material_file: data?.material_file || "",
    order: data?.order ? parseInt(data.order) : 1,
    module_id: data?.module_id || data?.module?.id || relatedData?.moduleId || "",
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LessonFormValues>({
    resolver: zodResolver(lessonFormSchema),
    defaultValues: initialValues,
  });

  const currentMaterialFile = watch("material_file");
  const selectedMaterialType = watch("material_type");

  const openCloudinaryWidget = () => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "lms_preset";
    
    if (!cloudName) {
      setErrorMessage("Configuration Error: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is missing from your env file.");
      return;
    }

    if (typeof window !== "undefined" && (window as any).cloudinary) {
      const isDocument = selectedMaterialType === "document" || selectedMaterialType === "pdf";
      const calculatedResourceType = isDocument ? "raw" : "auto";

      const myWidget = (window as any).cloudinary.createUploadWidget(
        {
          cloudName: cloudName,
          uploadPreset: uploadPreset,
          resourceType: calculatedResourceType,
          clientAllowedFormats: ["pdf", "mp4", "mov", "png", "jpg"],
          sources: ["local", "url", "camera", "google_drive", "dropbox"],
          multiple: false,
          theme: "minimal",
        },
        (error: any, result: any) => {
          if (!error && result && result.event === "success") {
            const secureUrl = result.info.secure_url;
            let fileName = result.info.original_filename;
            if (result.info.format) {
              fileName = fileName + "." + result.info.format;
            } else if (secureUrl) {
              const ext = secureUrl.split(".").pop()?.split("?")[0];
              if (ext && ext.length <= 4 && !ext.includes("/")) {
                fileName = fileName + "." + ext;
              }
            }
            
            setValue("material_url", secureUrl);
            setValue("material_file", fileName);
          }
        }
      );
      myWidget.open();
    } else {
      setErrorMessage("Cloudinary script hasn't loaded. Please wait and try again.");
    }
  };

  const onSubmit = async (values: LessonFormValues) => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      if (relatedData?.inlineHandler) {
        relatedData.inlineHandler(values);
        return;
      }

      const payload = {
        title: values.title,
        content: values.content || null,
        description: values.content || null,
        duration: values.duration ? String(values.duration) : "45min",
        material_type: values.material_type,
        material_url: values.material_url || null,
        material_file: values.material_file || null,
        order: Number(values.order) || 1,
        module_id: Number(values.module_id) || Number(data?.module_id)
      };

      let res;
      if (type === "create") {
        res = await api.post("/lessons", payload);
      } else {
        const recordId = data?.id;
        if (!recordId) throw new Error("Missing Lesson record ID.");
        res = await api.put(`/lessons/${recordId}`, payload);
      }

      if (res.status === 200 || res.status === 201) {
        toast.success(type === "create" ? "Lesson created successfully!" : "Lesson updated successfully!");
        handleClose();
        router.refresh();
      }
    } catch (err: any) {
      console.error("Form transmission rejected:", err);
      const backendRawError = err.response?.data?.detail;
      const errMsg = typeof backendRawError === "object" 
        ? "Validation Error: Please check that Module ID and required fields match database specs." 
        : backendRawError || err.message || "An error occurred while updating the lesson metrics.";
      setErrorMessage(errMsg);
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyles = "w-full px-3 py-2 bg-slate-50 border border-border/80 rounded-xl outline-none text-xs transition-colors duration-300 focus:border-[#0038A8]/50 focus:ring-1 focus:ring-[#0038A8]/50 text-foreground";
  const labelStyles = "text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider block mb-1.5";

  return (
    <div className="space-y-6 text-left font-sans select-none p-2">
      {/* HEADER SECTION */}
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-black text-gray-900 tracking-tight">
          {type === "create" ? "Create a New Lesson" : "Edit Lesson Metrics"}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {type === "create"
            ? "Add a new lesson node to your course syllabus structure."
            : "Modify core lecture metrics and upload streaming media formats."}
        </p>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
          {errorMessage}
        </div>
      )}

      <form id="lesson-form-element" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* ROW 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-5 gap-y-4">
          <div>
            <label className={labelStyles}>Lesson Name</label>
            <input
              type="text"
              placeholder="e.g. Introduction to HTML"
              {...register("title")}
              className={inputStyles}
            />
            {errors.title && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className={labelStyles}>Syllabus Order</label>
            <input
              type="number"
              placeholder="1"
              {...register("order")}
              className={inputStyles}
            />
          </div>

          <div>
            <label className={labelStyles}>Duration (Minutes)</label>
            <input
              type="number"
              placeholder="45"
              {...register("duration")}
              className={inputStyles}
            />
          </div>
        </div>

        {/* ROW 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-5 gap-y-4">
          <div>
            <label className={labelStyles}>Parent Module ID</label>
            <input
              type="number"
              placeholder="Module reference ID"
              {...register("module_id")}
              className={inputStyles}
            />
            {errors.module_id && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.module_id.message}</p>}
          </div>

          <div>
            <label className={labelStyles}>Media Material Type</label>
            <div className="relative">
              <select
                {...register("material_type")}
                className="w-full px-3 py-2 bg-slate-50 border border-border/80 rounded-xl outline-none text-xs transition-colors duration-300 focus:border-[#0038A8]/50 focus:ring-1 focus:ring-[#0038A8]/50 text-foreground cursor-pointer appearance-none"
              >
                <option value="video">Video Player (.mp4)</option>
                <option value="url">External Link (YouTube)</option>
                <option value="document">Document (.pdf)</option>
                <option value="article">Text Content</option>
                <option value="quiz">Interactive Quiz</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                <svg className="fill-current h-4 w-4" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>

          <div>
            <label className={labelStyles}>Uploaded File Name</label>
            <input
              type="text"
              disabled
              placeholder="No file attached"
              {...register("material_file")}
              className="w-full px-3 py-2 bg-gray-100 border border-border/50 rounded-xl outline-none text-xs text-slate-500 cursor-not-allowed truncate"
            />
          </div>
        </div>

        {/* ROW 3 */}
        <div>
          <label className={labelStyles}>Remote Material URL</label>
          <input
            type="text"
            placeholder="Automatically populated on widget upload or enter custom streaming link..."
            {...register("material_url")}
            className={inputStyles}
          />
        </div>

        <div>
          <label className={labelStyles}>Lecture Notes & Curriculum Content</label>
          <textarea
            rows={4}
            placeholder="Write core lesson notes or descriptions here..."
            {...register("content")}
            className="w-full px-3 py-2 bg-slate-50 border border-border/80 rounded-xl outline-none text-xs transition-colors duration-300 focus:border-[#0038A8]/50 focus:ring-1 focus:ring-[#0038A8]/50 text-foreground placeholder:text-muted-foreground/40 resize-none"
          />
        </div>

        {/* FILE UPLOAD ZONE */}
        <div>
          <label className={labelStyles}>Lesson Materials Upload</label>
          <div 
            onClick={openCloudinaryWidget}
            className="w-full border-2 border-dashed border-[#cbd5e1] rounded-xl p-5 flex flex-col items-center justify-center bg-white hover:bg-gray-50/50 transition-colors cursor-pointer group"
          >
            <UploadCloud className="w-5 h-5 text-[#0038A8] mb-0.5" />
            <p className="text-xs font-bold text-slate-700 mt-2.5">
              {currentMaterialFile ? `Attached: ${currentMaterialFile}` : "Upload Lesson material (PDF, slides, DOCX, video, etc.)"}
            </p>
          </div>
        </div>

        {data?.id && <input type="hidden" name="id" value={data.id} />}

        {/* SINGLE UNIFIED ACTION FOOTER SECTION BAR */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl disabled:opacity-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-[#0038A8] hover:bg-[#002D86] text-white text-xs font-black rounded-xl disabled:opacity-50 transition-colors cursor-pointer"
          >
            {isSubmitting ? "Processing..." : type === "create" ? "Create Lesson" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LessonForm;