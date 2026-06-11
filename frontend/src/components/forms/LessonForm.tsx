"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { X, UploadCloud } from "lucide-react";

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
    module_id: data?.module_id || data?.module?.id || "",
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
      // 🍏 FIX: Dynamically specify the resource type block to prevent file corruption
      const isDocument = selectedMaterialType === "document" || selectedMaterialType === "pdf";
      const calculatedResourceType = isDocument ? "raw" : "auto";

      const myWidget = (window as any).cloudinary.createUploadWidget(
        {
          cloudName: cloudName,
          uploadPreset: uploadPreset,
          resourceType: calculatedResourceType, // 👈 Forces 'raw' for PDFs, keeping formatting intact
          clientAllowedFormats: ["pdf", "mp4", "mov", "png", "jpg"],
          sources: ["local", "url", "camera", "google_drive", "dropbox"],
          multiple: false,
          theme: "minimal",
        },
        (error: any, result: any) => {
          if (!error && result && result.event === "success") {
            const secureUrl = result.info.secure_url;
            const fileName = result.info.original_filename + "." + result.info.format;
            
            setValue("material_url", secureUrl);
            setValue("material_file", fileName);
          }
        }
      );
      myWidget.open();
    } else {
      setErrorMessage("Cloudinary widget script hasn't loaded yet. Please wait a second and try again.");
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
        if (res.data && !res.data.detail && !res.data.loc) {
          handleClose();
          router.refresh();
          if (typeof window !== "undefined") window.location.reload();
        } else {
          throw new Error("Invalid format received from database validation rules.");
        }
      }
    } catch (err: any) {
      console.error("Form transmission rejected:", err);
      const backendRawError = err.response?.data?.detail;
      setErrorMessage(
        typeof backendRawError === "object" 
          ? "Validation Error: Please check that Module ID and required fields match database specs." 
          : backendRawError || "An error occurred while updating the lesson metrics."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-[1000px] rounded-[4px] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-200/80 text-left font-sans select-none">
        
        {/* HEADER BAR */}
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            {type === "create" ? "Create a new lesson" : "Edit lesson metrics"}
          </h2>
          <button 
            type="button"
            onClick={(e) => { e.preventDefault(); handleClose(); }}
            className="text-slate-400 hover:text-slate-600 transition-colors h-7 w-7 rounded-full hover:bg-slate-50 flex items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* CONTENT FORM WORKSPACE */}
        <div className="p-8 overflow-y-auto space-y-6 flex-1 bg-white">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl mb-4 font-medium">
              {errorMessage}
            </div>
          )}

          <form id="lesson-form-element" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            {/* ROW 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-5 gap-y-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-[#475569]">Lesson Name</label>
                <input
                  type="text"
                  placeholder="e.g. Introduction to HTML"
                  {...register("title")}
                  className="w-full px-3 py-2.5 bg-white border border-[#e2e8f0] focus:border-[#3b82f6] rounded-xl text-sm font-medium text-[#334155] focus:outline-none transition-all placeholder:text-[#cbd5e1]"
                />
                {errors.title && <p className="text-xs text-red-500 font-medium">{errors.title.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-[#475569]">Syllabus Order</label>
                <input
                  type="number"
                  placeholder="1"
                  {...register("order")}
                  className="w-full px-3 py-2.5 bg-white border border-[#e2e8f0] focus:border-[#3b82f6] rounded-xl text-sm font-medium text-[#334155] focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-[#475569]">Duration (Minutes)</label>
                <input
                  type="number"
                  placeholder="45"
                  {...register("duration")}
                  className="w-full px-3 py-2.5 bg-white border border-[#e2e8f0] focus:border-[#3b82f6] rounded-xl text-sm font-medium text-[#334155] focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* ROW 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-5 gap-y-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-[#475569]">Parent Module ID</label>
                <input
                  type="number"
                  placeholder="Module reference ID"
                  {...register("module_id")}
                  className="w-full px-3 py-2.5 bg-white border border-[#e2e8f0] focus:border-[#3b82f6] rounded-xl text-sm font-medium text-[#334155] focus:outline-none transition-all"
                />
                {errors.module_id && <p className="text-xs text-red-500 font-medium">{errors.module_id.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-[#475569]">Media Material Type</label>
                <div className="relative">
                  <select
                    {...register("material_type")}
                    className="w-full px-3 py-2.5 bg-white border border-[#e2e8f0] focus:border-[#3b82f6] rounded-xl text-sm font-medium text-[#334155] focus:outline-none transition-all appearance-none cursor-pointer"
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

              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-[#475569]">Uploaded File Name</label>
                <input
                  type="text"
                  disabled
                  placeholder="No file attached"
                  {...register("material_file")}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-[#e2e8f0] rounded-xl text-sm font-medium text-[#64748b] outline-none cursor-not-allowed truncate"
                />
              </div>
            </div>

            {/* ROW 3 */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-[#475569]">Remote Material URL</label>
              <input
                type="text"
                placeholder="Automatically populated on widget upload or enter custom streaming link..."
                {...register("material_url")}
                className="w-full px-3 py-2.5 bg-white border border-[#e2e8f0] focus:border-[#3b82f6] rounded-xl text-sm font-medium text-[#334155] focus:outline-none transition-all placeholder:text-[#cbd5e1] truncate"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-[#475569]">Lecture Notes & Curriculum Content</label>
              <textarea
                rows={4}
                placeholder="Write core lesson notes or descriptions here..."
                {...register("content")}
                className="w-full px-3 py-2.5 bg-white border border-[#e2e8f0] focus:border-[#3b82f6] rounded-xl text-sm font-medium text-[#334155] focus:outline-none transition-all placeholder:text-[#cbd5e1] resize-none"
              />
            </div>

            {/* FILE UPLOAD ZONE */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-[#475569]">Lesson Materials Upload</label>
              <div 
                onClick={openCloudinaryWidget}
                className="w-full border border-dashed border-slate-200 rounded-[8px] p-6 flex flex-col items-center justify-center bg-white hover:bg-slate-50/50 hover:border-[#0038A8]/30 transition-all cursor-pointer group"
              >
                <UploadCloud className="w-5 h-5 text-[#0038A8] mb-1" />
                <p className="text-xs font-bold text-slate-700 mt-2.5">
                  {currentMaterialFile ? `Attached: ${currentMaterialFile}` : "Upload Lesson material (PDF, slides, DOCX, video, etc.)"}
                </p>
              </div>
            </div>
          </form>
        </div>

        {/* FOOTER BAR */}
        <div className="px-8 py-4 border-t border-slate-100 flex items-center justify-end gap-2.5 bg-slate-50/30 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-[8px] border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 active:scale-[0.98] text-xs font-bold transition-all shadow-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="lesson-form-element"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-[8px] bg-[#0038A8] text-white hover:bg-[#002b80] active:scale-[0.98] text-xs font-bold transition-all disabled:opacity-50 shadow-sm"
          >
            {isSubmitting ? "Processing..." : type === "create" ? "Create Lesson" : "Save Changes"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default LessonForm;