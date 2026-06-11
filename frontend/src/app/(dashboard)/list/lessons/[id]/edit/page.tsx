"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, X, FileText, Link2, Video } from "lucide-react";
import { api } from "@/lib/api";
import BackButton from "@/components/BackButton";

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
        router.back(); // Return back to curriculum workspace dashboard view safely
      }
    } catch (err) {
      console.error("Failed to execute data modification save layout:", err);
      alert("Error updating record dependencies. Check terminal trace records.");
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

  return (
    <div className="flex-1 p-6 bg-[#F7F8FA] dark:bg-[#121212] min-h-screen space-y-6 text-left">
      {/* HEADER BAR */}
      <div className="flex items-center justify-between select-none">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-xl font-black tracking-tight text-gray-900 dark:text-white">
              Modify Lesson Configurations
            </h1>
            <p className="text-xs text-muted-foreground">Editing target database record: Row ID {id}</p>
          </div>
        </div>
      </div>

      {/* COMPACT CONFIGURATION FORM LAYOUT SHEET */}
      <div className="max-w-3xl mx-auto bg-white dark:bg-[#1c1c1c] p-6 rounded-3xl border border-border/60 shadow-sm">
        <form onSubmit={handleUpdate} className="space-y-5">
          
          {/* Title input element */}
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">Lesson Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border p-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0038A8]/40"
              required
            />
          </div>

          {/* Meta Specifications Grid row elements */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Material Type</label>
              <select
                value={materialType}
                onChange={(e) => setMaterialType(e.target.value)}
                className="w-full border p-2.5 rounded-xl text-xs font-bold bg-slate-50 dark:bg-zinc-800"
              >
                <option value="video">Video Lecture (Cloudinary File)</option>
                <option value="url">External Link (YouTube Embedding URL)</option>
                <option value="pdf">Document Resource (PDF Handbook File)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Duration</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full border p-2.5 rounded-xl text-xs font-semibold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Order Index</label>
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(parseInt(e.target.value) || 1)}
                className="w-full border p-2.5 rounded-xl text-xs font-semibold"
              />
            </div>
          </div>

          {/* ── 🍏 DYNAMICALLY ADAPTIVE COMPONENT CONDITIONAL CONTROLLER FIELDS ── */}
          <div className="p-4 bg-slate-50/50 dark:bg-zinc-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800">
            {materialType === "url" ? (
              <div className="space-y-1">
                <label className="text-xs font-black text-[#0038A8] dark:text-sky-400 flex items-center gap-1">
                  <Link2 className="h-3.5 w-3.5" /> External Streaming Link URL Target
                </label>
                <input
                  type="text"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="Paste your YouTube link string here (e.g., https://youtube.com/...)"
                  className="w-full border bg-white dark:bg-[#1c1c1c] p-2.5 rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-black text-emerald-600 flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" /> Upload Replacement Resource Asset File
                </label>
                <input
                  type="file"
                  accept={materialType === "pdf" ? ".pdf" : "video/*"}
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full border bg-white dark:bg-[#1c1c1c] p-2 rounded-xl text-xs file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700"
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
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">Lecture Notes & Curriculum</label>
            <textarea
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border p-3 rounded-2xl text-xs leading-relaxed font-medium focus:outline-none"
            />
          </div>

          {/* CONTROL TRIGGER FOOTER ACTION PANEL */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
            >
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-[#0038A8] hover:bg-[#002D86] text-white disabled:opacity-40 text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-1"
            >
              <Save className="h-3.5 w-3.5" /> {saving ? "Saving Changes..." : "Save details"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}