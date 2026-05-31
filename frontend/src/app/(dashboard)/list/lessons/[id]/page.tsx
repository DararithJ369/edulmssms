"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  FileText,
  Video,
  Download,
  ExternalLink,
  Edit,
  CheckCircle,
  Save,
  X,
  FileCode,
  Globe
} from "lucide-react";
import { api } from "@/lib/api";

type LessonDetail = {
  id: number;
  module_id: number;
  title: string;
  content: string | null;
  description: string | null;
  duration: string | null;
  material_type: string | null;
  material_url: string | null;
  material_file: string | null;
  order: number;
  module_name?: string | null;
  course_name?: string | null;
};

export default function SingleLessonPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;

  const courseId = searchParams.get("courseId") || "";
  const moduleId = searchParams.get("moduleId") || "";

  // Role State
  const [role, setRole] = useState<string>("");

  // Primary Lesson States
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Mode states
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [editMaterialType, setEditMaterialType] = useState("article");
  const [editMaterialUrl, setEditMaterialUrl] = useState("");
  const [editMaterialFile, setEditMaterialFile] = useState("");
  const [editOrder, setEditOrder] = useState<number>(1);

  // mutation states
  const [saving, setSaving] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    // Retrieve role safely on client mount
    if (typeof window !== "undefined") {
      const userRole = localStorage.getItem("user_role") || "student";
      setRole(userRole === "instructor" ? "teacher" : userRole);
    }

    const fetchLessonDetail = async () => {
      try {
        setLoading(true);
        const { data } = await api.get<LessonDetail>(`/lessons/${id}`);
        if (data) {
          setLesson(data);
          // Seed edit forms
          setEditTitle(data.title || "");
          setEditContent(data.content || data.description || "");
          setEditDuration(data.duration || "90min");
          setEditMaterialType(data.material_type?.toLowerCase() || "article");
          setEditMaterialUrl(data.material_url || "");
          setEditMaterialFile(data.material_file || "");
          setEditOrder(data.order || 1);
        }
      } catch (err: any) {
        console.error("FAILED to fetch lesson detail:", err);
        setError(err.response?.data?.detail || err.message || String(err));
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchLessonDetail();
    }
  }, [id]);

  const handleSaveLesson = async () => {
    if (!lesson) return;
    try {
      setSaving(true);
      const payload = {
        title: editTitle,
        content: editContent,
        duration: editDuration,
        material_type: editMaterialType,
        material_url: editMaterialUrl || null,
        material_file: editMaterialFile || null,
        order: editOrder,
        module_id: lesson.module_id
      };

      const { data } = await api.put<LessonDetail>(`/lessons/${lesson.id}`, payload);
      if (data) {
        setLesson(data);
        setIsEditing(false);
        setShowSuccessToast(true);
        setTimeout(() => {
          setShowSuccessToast(false);
        }, 3000);
      }
    } catch (err: any) {
      console.error("Failed to update lesson:", err);
      alert("Error updating lesson details. Please make sure the backend server is running and you have sufficient permissions.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (lesson) {
      setEditTitle(lesson.title || "");
      setEditContent(lesson.content || lesson.description || "");
      setEditDuration(lesson.duration || "90min");
      setEditMaterialType(lesson.material_type?.toLowerCase() || "article");
      setEditMaterialUrl(lesson.material_url || "");
      setEditMaterialFile(lesson.material_file || "");
      setEditOrder(lesson.order || 1);
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F7F8FA] text-foreground">
        <div className="h-10 w-10 border-4 border-[#0038A8] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold select-none">Loading Lesson Workspace...</p>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-800 dark:text-red-400 rounded-3xl m-6 max-w-2xl mx-auto text-left space-y-4 shadow-sm select-none">
        <h1 className="text-xl font-black tracking-tight">Lesson Not Found</h1>
        <p className="text-xs font-semibold leading-relaxed">
          We couldn&apos;t retrieve the lesson with ID: <code className="px-1.5 py-0.5 bg-red-100 dark:bg-red-950/60 rounded font-mono font-bold">{id}</code>
        </p>
        {error && <p className="text-[10px] font-mono mt-2 bg-white/60 dark:bg-black/20 p-3 border border-red-100 dark:border-red-950/40 rounded-xl leading-relaxed">{error}</p>}
        <Link
          href={courseId ? `/list/courses/${courseId}${moduleId ? `?expandedModuleId=${moduleId}` : ""}` : "/list/lessons"}
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-700 underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{courseId ? "Back to Course Syllabus" : "Back to Lessons List"}</span>
        </Link>
      </div>
    );
  }

  // Construct URLs correctly
  const backendBase = "http://localhost:8000";

  const getResourceUrl = (urlOrFile: string | null | undefined) => {
    if (!urlOrFile) return "";
    if (urlOrFile.startsWith("http://") || urlOrFile.startsWith("https://")) {
      return urlOrFile;
    }
    return `${backendBase}/uploads/${urlOrFile}`;
  };

  const fileUrl = getResourceUrl(isEditing ? editMaterialFile : lesson.material_file);
  const linkUrl = getResourceUrl(isEditing ? editMaterialUrl : lesson.material_url);
  const currentMaterialType = isEditing ? editMaterialType : (lesson.material_type?.toLowerCase() || "article");

  const isVideo = currentMaterialType === "video" || fileUrl.endsWith(".mp4") || fileUrl.includes("youtube.com") || fileUrl.includes("youtu.be");
  const isPdf = currentMaterialType === "pdf" || fileUrl.endsWith(".pdf") || linkUrl.endsWith(".pdf");

  return (
    <div className="flex-1 p-6 bg-[#F7F8FA] dark:bg-[#121212] min-h-screen flex flex-col gap-6 font-sans">
      {/* Toast Notification */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2.5 px-6 py-4 bg-white dark:bg-[#1c1c1c] border border-emerald-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-2xl select-none"
          >
            <CheckCircle className="h-5 w-5 text-emerald-500" />
            <div className="text-left">
              <p className="text-sm font-black text-foreground">Lesson Saved Successfully</p>
              <p className="text-xs text-muted-foreground">The academic resource material has been updated.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#1c1c1c] p-5 rounded-3xl border border-border/60 shadow-[0_8px_30px_rgb(0,0,0,0.01)] text-left select-none">
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={() => {
              if (isEditing) {
                handleCancelEdit();
              } else {
                router.push(courseId ? `/list/courses/${courseId}${moduleId ? `?expandedModuleId=${moduleId}` : ""}` : "/list/lessons");
              }
            }}
            className="w-10 h-10 flex items-center justify-center rounded-full border border-border/80 hover:bg-muted text-muted-foreground transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-black text-[#0038A8] uppercase tracking-wider flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              Lesson {isEditing ? editOrder : lesson.order || 1}
            </span>
            
            {isEditing ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Enter lesson title..."
                className="mt-1 w-full max-w-xl px-3 py-1.5 bg-muted/40 border border-border/80 focus:border-[#0038A8]/40 rounded-xl text-lg font-bold focus:outline-none focus:ring-2 focus:ring-[#0038A8]/10 transition-all"
              />
            ) : (
              <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white mt-0.5 tracking-tight truncate">
                {lesson.title}
              </h1>
            )}
          </div>
        </div>

        {/* Administration Actions & badges */}
        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto">
          {!isEditing && (
            <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800/60 border border-border/40 px-3.5 py-2 rounded-full text-xs font-bold text-gray-700 dark:text-gray-300">
              <Clock className="w-4 h-4 text-[#0038A8]" />
              <span>{lesson.duration || "90min"}</span>
            </div>
          )}

          {/* TURN EDITING ON CONTROLS */}
          {(role === "admin" || role === "teacher") && (
            isEditing ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 border border-border/80 hover:bg-muted text-foreground font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 active:scale-[0.98]"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleSaveLesson}
                  disabled={saving}
                  className="px-4 py-2 bg-[#0038A8] text-white hover:bg-[#002D86] disabled:opacity-50 font-extrabold text-xs rounded-xl transition-all shadow-md shadow-[#0038A8]/15 flex items-center gap-1.5 active:scale-[0.98]"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? "Saving..." : "Save details"}</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-violet-500/10 flex items-center gap-1.5 active:scale-[0.98]"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Lesson</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* CONTENT BODY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        
        {/* LEFT / CENTER - MEDIA WORKSPACE (2 Columns) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* VISUAL WORKSPACE */}
          <div className="bg-black rounded-3xl overflow-hidden aspect-video relative shadow-lg flex items-center justify-center text-white border border-border/20">
            {isVideo && (fileUrl || linkUrl) ? (
              <video
                src={fileUrl || linkUrl}
                controls
                className="w-full h-full object-contain"
                poster="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200"
              />
            ) : isPdf && (fileUrl || linkUrl) ? (
              <iframe
                src={fileUrl || linkUrl}
                className="w-full h-full border-none rounded-3xl"
                title={isEditing ? editTitle : lesson.title}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-tr from-gray-950 via-gray-900 to-gray-800 flex flex-col items-center justify-center p-8 text-center select-none">
                <div className="w-16 h-16 rounded-full bg-[#0038A8]/10 border border-[#0038A8]/20 flex items-center justify-center text-[#0038A8] mb-4">
                  {currentMaterialType === "quiz" ? <FileText className="w-8 h-8" /> : <BookOpen className="w-8 h-8" />}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Academic Lecture Content Workspace
                </h3>
                <p className="text-sm text-gray-400 max-w-md">
                  This lesson covers essential curriculum material. See the description panel for course content and links to study slides.
                </p>
                {(fileUrl || linkUrl) && (
                  <a
                    href={fileUrl || linkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-6 flex items-center gap-2 bg-[#0038A8] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#002D86] transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Material in New Tab
                  </a>
                )}
              </div>
            )}
          </div>

          {/* DESCRIPTION PANEL */}
          <div className="bg-white dark:bg-[#1c1c1c] p-6 rounded-3xl border border-border/60 shadow-sm space-y-4">
            <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider border-b border-border/50 pb-3 select-none">
              Lecture Notes & Curriculum
            </h2>
            
            {isEditing ? (
              <textarea
                rows={8}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Enter lecture content or curriculum description details..."
                className="w-full p-4 bg-muted/30 border border-border/80 focus:border-[#0038A8]/40 focus:ring-2 focus:ring-[#0038A8]/10 rounded-2xl text-xs leading-relaxed text-foreground font-medium focus:outline-none transition-all"
              />
            ) : (
              <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-line font-medium">
                {lesson.content || lesson.description || "No description provided for this lesson module. Please consult with the supervisor or reference the course handbook."}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN - LESSON RESOURCES AND FORM CONFIGS */}
        <div className="flex flex-col gap-6">
          <div className="bg-white dark:bg-[#1c1c1c] p-6 rounded-3xl border border-border/60 shadow-sm space-y-6">
            <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider border-b border-border/50 pb-3 select-none">
              Lesson Resources
            </h2>

            {/* RESOURCE DETAILS */}
            <div className="space-y-4 text-left">
              {/* Material Type Dropdown */}
              <div className="flex flex-col md:flex-row md:items-center justify-between p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900/40 border border-border/40 gap-2">
                <span className="text-xs font-bold text-gray-500 select-none">Material Type</span>
                {isEditing ? (
                  <select
                    value={editMaterialType}
                    onChange={(e) => setEditMaterialType(e.target.value)}
                    className="px-2.5 py-1 bg-white dark:bg-muted border border-border/80 focus:border-[#0038A8]/40 rounded-lg text-xs font-bold focus:outline-none transition-all shadow-sm"
                  >
                    <option value="video">Video Lecture</option>
                    <option value="pdf">PDF Handbook</option>
                    <option value="article">Article Text</option>
                    <option value="quiz">Interactive Quiz</option>
                  </select>
                ) : (
                  <span className="text-[10px] font-black uppercase bg-[#0038A8]/5 border border-[#0038A8]/10 px-2 py-0.5 rounded text-[#0038A8] select-none">
                    {lesson.material_type || "Article"}
                  </span>
                )}
              </div>

              {/* Duration Input */}
              <div className="flex flex-col md:flex-row md:items-center justify-between p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900/40 border border-border/40 gap-2">
                <span className="text-xs font-bold text-gray-500 select-none">Duration</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editDuration}
                    onChange={(e) => setEditDuration(e.target.value)}
                    placeholder="e.g. 60min"
                    className="w-full md:w-1/2 px-2.5 py-1.5 bg-white dark:bg-muted border border-border/80 focus:border-[#0038A8]/40 rounded-lg text-xs font-bold focus:outline-none text-right shadow-sm"
                  />
                ) : (
                  <span className="text-xs font-bold text-gray-900 dark:text-white">
                    {lesson.duration || "90min"}
                  </span>
                )}
              </div>

              {/* Order Input */}
              <div className="flex flex-col md:flex-row md:items-center justify-between p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900/40 border border-border/40 gap-2">
                <span className="text-xs font-bold text-gray-500 select-none">Order</span>
                {isEditing ? (
                  <input
                    type="number"
                    value={editOrder}
                    onChange={(e) => setEditOrder(parseInt(e.target.value) || 1)}
                    className="w-full md:w-1/3 px-2.5 py-1.5 bg-white dark:bg-muted border border-border/80 focus:border-[#0038A8]/40 rounded-lg text-xs font-bold focus:outline-none text-right shadow-sm"
                  />
                ) : (
                  <span className="text-xs font-bold text-gray-900 dark:text-white">
                    {lesson.order || 1}
                  </span>
                )}
              </div>

              {/* Conditional Edit Links inputs */}
              {isEditing && (
                <div className="space-y-3 pt-3 border-t border-dashed border-border/80">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-wide">
                      External Study Link URL
                    </label>
                    <input
                      type="text"
                      value={editMaterialUrl}
                      onChange={(e) => setEditMaterialUrl(e.target.value)}
                      placeholder="e.g. https://example.com/slides"
                      className="w-full px-3 py-2 bg-muted/40 border border-border/80 focus:border-[#0038A8]/40 rounded-xl text-xs font-medium focus:outline-none transition-all shadow-inner"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-wide">
                      Local Material File path / name
                    </label>
                    <input
                      type="text"
                      value={editMaterialFile}
                      onChange={(e) => setEditMaterialFile(e.target.value)}
                      placeholder="e.g. handbook.pdf"
                      className="w-full px-3 py-2 bg-muted/40 border border-border/80 focus:border-[#0038A8]/40 rounded-xl text-xs font-medium focus:outline-none transition-all shadow-inner"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* DOWNLOAD OR LINK ACTIONS */}
            {!isEditing && (
              <div className="space-y-3 pt-2 select-none">
                {fileUrl && (
                  <a
                    href={fileUrl}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-[#fcd34d] hover:bg-[#fbbf24] text-black py-3.5 rounded-2xl font-black hover:scale-[1.01] active:scale-[0.99] transition-all shadow-sm text-xs text-center"
                  >
                    <Download className="w-4.5 h-4.5" />
                    Download Local File Resource
                  </a>
                )}
                
                {linkUrl && (
                  <a
                    href={linkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full border border-border/80 text-gray-900 dark:text-white py-3.5 rounded-2xl font-bold hover:bg-muted hover:scale-[1.01] active:scale-[0.99] transition-all text-xs text-center"
                  >
                    <ExternalLink className="w-4.5 h-4.5 text-[#0038A8]" />
                    Open External Study Link
                  </a>
                )}

                {!fileUrl && !linkUrl && (
                  <p className="text-[10px] text-center text-gray-500 italic py-5 bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-dashed border-border/60 font-semibold select-none">
                    No attachments or download links are registered for this lesson.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
