"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, X, FileText, Link2, Video } from "lucide-react";
import { api } from "@/lib/api";
import BackButton from "@/components/BackButton";
import { toast } from "react-toastify";

export default function EditLessonPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  // Form State Configurations
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [materialType, setMaterialType] = useState("video"); // "video" | "pdf" | "url"
  const [externalUrl, setExternalUrl] = useState("");
  const [order, setOrder] = useState<number>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 1. Fetch current lesson attributes on view initialization
  useEffect(() => {
    const fetchLesson = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const { data } = await api.get(`/lessons/${id}`);
        if (data) {
          setTitle(data.title || "");
          setDescription(data.description || data.content || "");
          setDuration(data.duration || "45min");
          setMaterialType(data.type || "video");
          setOrder(data.order || 1);
          setExternalUrl(data.external_url || data.file_url || "");
        }
      } catch (err) {
        console.error("Failed loading lesson node attributes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [id]);

  // 2. Process Form Update Submission using FormData pipeline
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("duration", duration);
      formData.append("type", materialType);
      formData.append("order", String(order));
      formData.append("uploaded_by", "admin"); // Meta profile identity tracker

      // Handle raw URL strings or direct files depending on choice selections
      if (materialType === "url") {
        formData.append("external_url", externalUrl);
      } else if (selectedFile) {
        formData.append("file", selectedFile);
      } else {
        // If no new file was specified, preserve old backup resource path URL
        formData.append("external_url", externalUrl);
      }

      const res = await api.put(`/lessons/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.status === 200) {
        toast.success("Lesson updated successfully!");
        router.back(); // Return back to curriculum workspace dashboard view safely
      }
    } catch (err: any) {
      console.error("Failed to execute data modification save layout:", err);
      const message = err?.response?.data?.detail || err?.message || "Error updating record dependencies. Check terminal trace records.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F7F8FA] dark:bg-[#121212]">
        <div className="h-9 w-9 border-4 border-[#0038A8] border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-xs font-bold text-muted-foreground select-none">Syncing Database Workspace...</p>
      </div>
    );
  }

  const inputStyles = "w-full px-3 py-2 bg-slate-50 border border-border/80 rounded-xl outline-none text-xs transition-colors duration-300 focus:border-[#0038A8]/50 focus:ring-1 focus:ring-[#0038A8]/50 text-foreground";
  const labelStyles = "text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider block mb-1.5";

  return (
    <div className="flex-1 p-6 bg-[#F7F8FA] min-h-screen space-y-6 text-left">
      {/* HEADER BAR */}
      <div className="flex items-center justify-between select-none">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <span className="text-xs font-extrabold text-[#0038A8] uppercase tracking-wider font-mono">
              Curriculum Management
            </span>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-gray-900 mt-0.5">
              Modify Lesson Configurations
            </h1>
            <p className="text-xs text-muted-foreground">Editing target database record: Row ID {id}</p>
          </div>
        </div>
      </div>

      {/* COMPACT CONFIGURATION FORM LAYOUT SHEET */}
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-3xl border border-border/60 shadow-sm">
        <form onSubmit={handleUpdate} className="space-y-6">
          
          {/* Title input element */}
          <div className="flex flex-col gap-1.5">
            <label className={labelStyles}>Lesson Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputStyles}
              required
            />
          </div>

          {/* Meta Specifications Grid row elements */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelStyles}>Material Type</label>
              <select
                value={materialType}
                onChange={(e) => setMaterialType(e.target.value)}
                className={inputStyles}
              >
                <option value="video">Video Lecture (Cloudinary File)</option>
                <option value="url">External Link (YouTube Embedding URL)</option>
                <option value="pdf">Document Resource (PDF Handbook File)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelStyles}>Duration</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className={inputStyles}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelStyles}>Order Index</label>
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(parseInt(e.target.value) || 1)}
                className={inputStyles}
              />
            </div>
          </div>

          {/* ── DYNAMICALLY ADAPTIVE COMPONENT CONDITIONAL CONTROLLER FIELDS ── */}
          <div className="p-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            {materialType === "url" ? (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-[#0038A8] flex items-center gap-1 uppercase tracking-wider">
                  <Link2 className="h-3.5 w-3.5" /> External Streaming Link URL Target
                </label>
                <input
                  type="text"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="Paste your YouTube link string here (e.g., https://youtube.com/...)"
                  className={inputStyles}
                />
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-emerald-600 flex items-center gap-1 uppercase tracking-wider">
                  <FileText className="h-3.5 w-3.5" /> Upload Replacement Resource Asset File
                </label>
                <input
                  type="file"
                  accept={materialType === "pdf" ? ".pdf" : "video/*"}
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full border bg-white p-2 rounded-xl text-xs file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700"
                />
                {externalUrl && !selectedFile && (
                  <p className="text-[10px] text-slate-400 font-medium font-mono pl-1 truncate">
                    Current active live link file: {externalUrl}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Lecture content rich text detail field */}
          <div className="flex flex-col gap-1.5">
            <label className={labelStyles}>Lecture Notes & Curriculum</label>
            <textarea
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${inputStyles} h-32 resize-y`}
            />
          </div>

          {/* CONTROL TRIGGER FOOTER ACTION PANEL */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
            >
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-[#0038A8] hover:bg-[#002D86] text-white text-xs font-black rounded-xl disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-1"
            >
              <Save className="h-3.5 w-3.5" /> {saving ? "Saving Changes..." : "Save details"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}