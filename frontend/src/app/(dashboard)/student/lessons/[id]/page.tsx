"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Video, AlertCircle, Globe, Clock, FileText, 
  CheckCircle, Play, Download, ExternalLink, Sparkles, Loader, Send, X, Trash2, Zap, Edit, Save, Circle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";

type LessonData = {
  id: number;
  title: string;
  description?: string;
  content?: string;
  duration?: string;
  order?: number;
  type?: string;          
  file_url?: string;      
  external_url?: string;  
};

export default function StudentLessonPlayerPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const lessonId = params.id as string;
  const courseId = searchParams.get("courseId");
  const moduleId = searchParams.get("moduleId");
  
  const [currentLesson, setCurrentLesson] = useState<LessonData | null>(null);
  const [siblingLessons, setSiblingLessons] = useState<LessonData[]>([]);
  const [moduleTitle, setModuleTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string>("");

  // AI Tutor States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [tutorQuota, setTutorQuota] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Edit Mode states (Kept in state inputs, but player layout stays still)
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [editMaterialType, setEditMaterialType] = useState("video");
  const [editExternalUrl, setEditExternalUrl] = useState("");
  const [editOrder, setEditOrder] = useState<number>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userRole = localStorage.getItem("user_role") || "student";
      setRole(userRole.toLowerCase());
    }

    const loadWorkspaceData = async () => {
      try {
        setLoading(true);
        const { data: lessonData } = await api.get(`/lessons/${lessonId}`);
        if (lessonData) {
          setCurrentLesson(lessonData);
          setEditTitle(lessonData.title || "");
          setEditContent(lessonData.content || lessonData.description || "");
          setEditDuration(lessonData.duration || "45min");
          setEditMaterialType(lessonData.type || "video");
          setEditOrder(lessonData.order || 1);
          setEditExternalUrl(lessonData.external_url || lessonData.file_url || "");
        }

        if (courseId) {
          const { data: modulesTree } = await api.get(`/courses/${courseId}/modules`);
          if (modulesTree && Array.isArray(modulesTree)) {
            const activeModule = modulesTree.find(m => String(m.id) === String(moduleId)) || modulesTree[0];
            if (activeModule) {
              setModuleTitle(activeModule.title);
              setSiblingLessons(activeModule.lessons || []);
            }
          }
        }

        const userId = localStorage.getItem("user_id");
        if (userId) {
          const profileRes = await api.get(`/profiles/${userId}`);
          setUserProfile(profileRes.data);
          const quotaRes = await api.get(`/lessons/${lessonId}/tutor/quota`);
          setTutorQuota(quotaRes.data);
          const historyRes = await api.get(`/lessons/${lessonId}/tutor/history`);
          setChatMessages(historyRes.data || []);
        }
      } catch (err) {
        console.error("Failed to load layout space context mapping records:", err);
      } finally {
        setLoading(false);
      }
    };

    if (lessonId) loadWorkspaceData();
  }, [lessonId, courseId, moduleId]);

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("title", editTitle);
      formData.append("content", editContent);
      formData.append("description", editContent);
      formData.append("duration", editDuration);
      formData.append("type", editMaterialType);
      formData.append("order", String(editOrder));
      formData.append("uploaded_by", "admin");

      if (editMaterialType === "url") {
        formData.append("external_url", editExternalUrl);
      } else if (selectedFile) {
        formData.append("file", selectedFile);
      } else {
        formData.append("external_url", editExternalUrl);
      }

      const res = await api.put(`/lessons/${lessonId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.status === 200 && res.data) {
        setCurrentLesson(res.data);
        setIsEditing(false);
        setSelectedFile(null);
      }
    } catch (err) {
      console.error("Failed to execute data modification save layout:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (currentLesson) {
      setEditTitle(currentLesson.title || "");
      setEditContent(currentLesson.content || currentLesson.description || "");
      setEditDuration(currentLesson.duration || "45min");
      setEditMaterialType(currentLesson.type || "video");
      setEditOrder(currentLesson.order || 1);
      setEditExternalUrl(currentLesson.external_url || currentLesson.file_url || "");
    }
    setIsEditing(false);
    setSelectedFile(null);
  };

  const getYouTubeEmbedId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoStreamTarget = currentLesson?.file_url || currentLesson?.external_url || "";
  const isYouTubeMedia = videoStreamTarget.includes("youtube.com") || videoStreamTarget.includes("youtu.be");
  const hasAccessToEdit = role === "admin" || role === "administrator" || role === "teacher" || role === "instructor";

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] dark:bg-[#121212] min-h-screen font-sans text-left">
      
      {/* BREADCRUMB */}
      <div className="flex items-center gap-1 text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider select-none">
        <Link href="/student" className="hover:text-foreground flex items-center gap-1">
          <Globe className="h-3 w-3" /> Home
        </Link>
        <span>/</span>
        <span className="text-foreground">Course Playback Hub</span>
      </div>

      {/* HEADER SECTION PANEL */}
      <div className="bg-white dark:bg-[#1c1c1c] p-5 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-sm flex items-center justify-between select-none">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push(courseId ? `/list/courses/${courseId}` : "/student")}
            className="p-2 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl transition-colors text-slate-600 dark:text-slate-300"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <span className="text-[10px] font-black text-[#0038A8] dark:text-sky-400 uppercase tracking-widest font-mono">
              MODULE: {moduleTitle || "Syllabus Track"}
            </span>
            <h1 className="text-lg font-black text-slate-800 dark:text-white tracking-tight leading-tight mt-0.5">
              {currentLesson?.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800/60 border border-slate-200/40 px-3.5 py-2 rounded-full text-xs font-bold text-gray-700 dark:text-gray-300">
            <Clock className="w-4 h-4 text-[#0038A8]" />
            <span>{currentLesson?.duration || "45min"}</span>
          </div>

          {hasAccessToEdit && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 active:scale-[0.98]"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Lesson</span>
            </button>
          )}
        </div>
      </div>

      {/* DUAL COLUMN CONTAINER GRID (STAYS STILL - NEVER MODIFIES LAYOUT FOR FORM) */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        
        {/* LEFT COMPONENT VIEWPORT PANEL */}
        <div className="lg:col-span-7 space-y-6">
          <div className="relative aspect-video w-full rounded-3xl overflow-hidden bg-slate-950 border border-slate-900 shadow-md flex items-center justify-center">
            {currentLesson?.type === "pdf" ? (
              <div className="text-center text-white p-8 space-y-4 select-none">
                <div className="h-16 w-16 bg-white/10 border border-white/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto text-2xl">
                  📄
                </div>
                <div>
                  <h4 className="text-sm font-black tracking-wide">Lesson Material Document Attached</h4>
                  <p className="text-[11px] text-slate-400 mt-1">Review the documentation resource file inside the sidebar dashboard panel blocks.</p>
                </div>
                <a 
                  href={currentLesson.file_url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md transition-all"
                >
                  <Download className="w-4 h-4 mr-1.5" /> Open Lesson PDF Document
                </a>
              </div>
            ) : isYouTubeMedia ? (
              <iframe
                className="w-full h-full border-none"
                src={`https://www.youtube.com/embed/${getYouTubeEmbedId(videoStreamTarget)}?autoplay=1`}
                title="YouTube Video Core Streaming View"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : videoStreamTarget ? (
              <video 
                src={videoStreamTarget}
                controls
                autoPlay
                className="w-full h-full object-contain"
                poster="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200"
              />
            ) : (
              <div className="p-6 text-center text-white flex flex-col items-center gap-2">
                <AlertCircle className="h-8 w-8 text-amber-500" />
                <p className="text-xs font-bold">Media Stream Uninitialized</p>
              </div>
            )}
          </div>

          {/* LECTURE NOTES BOX */}
          <div className="bg-white p-6 dark:bg-[#1c1c1c] rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-sm space-y-3">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest select-none">
              Lecture Notes & Curriculum
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-semibold whitespace-pre-line">
              {currentLesson?.content || currentLesson?.description || "No description details provided for this lecture track."}
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Sidebar Navigation Tracker */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-[#1c1c1c] p-5 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 select-none pb-2 border-b border-slate-100 dark:border-zinc-800">
              <FileText className="h-4 w-4 text-[#0038A8]" />
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Module Syllabus Activities
              </h3>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {siblingLessons.map((item, idx) => {
                const isCurrent = String(item.id) === String(lessonId);
                return (
                  <Link
                    key={item.id}
                    href={
                      hasAccessToEdit
                        ? `/list/lessons/${item.id}?courseId=${courseId}&moduleId=${moduleId}`
                        : `/student/lessons/${item.id}?courseId=${courseId}&moduleId=${moduleId}`
                    }
                    className={`flex items-start gap-2.5 p-3 rounded-2xl border text-left transition-all duration-200 group ${
                      isCurrent
                        ? "bg-blue-50/50 dark:bg-zinc-800 border-[#0038A8]/30 dark:border-zinc-700 shadow-sm"
                        : "border-slate-100 dark:border-zinc-800 bg-slate-50/20 dark:bg-zinc-900/30 hover:bg-white dark:hover:bg-zinc-800 hover:border-slate-200"
                    }`}
                  >
                    <div className={`mt-0.5 h-5 w-5 rounded-lg flex items-center justify-center shrink-0 border ${
                      isCurrent ? "bg-[#0038A8] text-white border-[#0038A8]" : "bg-white dark:bg-zinc-800 text-slate-400 border-slate-200 dark:border-zinc-700"
                    }`}>
                      {isCurrent ? <Play className="h-2.5 w-2.5 fill-white" /> : <span className="text-[10px] font-black font-mono">{idx + 1}</span>}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs font-black truncate group-hover:text-[#0038A8] transition-colors leading-tight ${
                        isCurrent ? "text-[#0038A8] dark:text-sky-400" : "text-slate-700 dark:text-slate-200"
                      }`}>
                        {item.title}
                      </p>
                      <span className="text-[9px] text-slate-400 font-bold uppercase block mt-0.5 tracking-wider font-mono">
                        {item.type || "video"}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* 🍏 CLEAN MODAL OVERLAY SHEET FOR EDIT MODE (PREVENTS WORKSPACE SHIFTING) */}
      <AnimatePresence>
        {isEditing && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={handleCancelEdit}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="fixed inset-x-4 bottom-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[600px] max-h-[85vh] overflow-y-auto bg-white dark:bg-[#1c1c1c] p-6 rounded-3xl border shadow-2xl z-[60] text-left space-y-4"
            >
              <div className="flex items-center justify-between border-b pb-2">
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white">Modify Lesson Configurations</h2>
                <button onClick={handleCancelEdit} className="p-1 text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
              </div>

              <form onSubmit={handleSaveLesson} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Lesson Title</label>
                  <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full border p-2.5 rounded-xl text-xs font-semibold focus:outline-none" required />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Material Type</label>
                    <select value={editMaterialType} onChange={(e) => setEditMaterialType(e.target.value)} className="w-full border p-2.5 rounded-xl text-xs font-bold bg-slate-50 dark:bg-zinc-800">
                      <option value="video">Video (Cloudinary)</option>
                      <option value="url">External Link (YouTube)</option>
                      <option value="pdf">Document (PDF)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Duration</label>
                    <input type="text" value={editDuration} onChange={(e) => setEditDuration(e.target.value)} className="w-full border p-2.5 rounded-xl text-xs font-semibold" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Order Index</label>
                    <input type="number" value={editOrder} onChange={(e) => setEditOrder(parseInt(e.target.value) || 1)} className="w-full border p-2.5 rounded-xl text-xs font-semibold" />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-zinc-900 border border-dashed rounded-xl">
                  {editMaterialType === "url" ? (
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">External Study Link URL</label>
                      <input type="text" value={editExternalUrl} onChange={(e) => setEditExternalUrl(e.target.value)} placeholder="https://youtube.com/..." className="w-full border p-2.5 rounded-xl text-xs font-medium" />
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Upload Replacement File</label>
                      <input type="file" accept={editMaterialType === "pdf" ? ".pdf" : "video/*"} onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="w-full border p-1.5 rounded-xl text-xs" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Lecture Notes & Curriculum</label>
                  <textarea rows={4} value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full border p-2.5 rounded-xl text-xs font-medium" />
                </div>

                <div className="flex items-center justify-end gap-2 border-t pt-3">
                  <button type="button" onClick={handleCancelEdit} className="px-4 py-2 border text-xs font-bold rounded-xl hover:bg-slate-50">Cancel</button>
                  <button type="submit" disabled={saving} className="px-4 py-2 bg-[#0038A8] text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1">
                    <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save details"}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* FLOATING ACTION ASSISTANT HOOK BUTTONS */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsChatOpen(true)}
          className="w-14 h-14 bg-gradient-to-tr from-[#0038A8] to-[#1e40af] text-white rounded-full shadow-2xl flex items-center justify-center relative hover:scale-105 active:scale-95 transition-transform group border border-[#0038A8]/20"
        >
          <Sparkles className="w-6 h-6 animate-pulse" />
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full border border-white">
            AI COACH
          </span>
        </button>
      </div>
    </div>
  );
}