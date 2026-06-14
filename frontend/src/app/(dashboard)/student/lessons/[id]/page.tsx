"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, FileText, Play, Download, ExternalLink, X, Edit, Save,
  Image as ImageIcon, BookOpen, ChevronDown, ChevronUp, Check,
  CheckCircle2, ClipboardList, Video, Link2, Clock, Layers,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "@/lib/api";
import { toast } from "react-toastify";
import BackButton from "@/components/BackButton";

/* ─── Types ───────────────────────────────────────────────────── */
type MaterialItem = {
  id: number;
  title: string;
  type: string;
  file_url: string;
  external_url: string | null;
  description?: string;
  is_visible?: boolean;
};

type QuizItem   = { id: number; title: string; total_marks: number };
type AssignmentItem = { id: number; title: string; total_marks?: number };

type LessonData = {
  id: number;
  title: string;
  description?: string;
  content?: string;
  duration?: string;
  order?: number;
  material_type?: string;
  material_url?: string;
  material_file?: string;
  materials?: MaterialItem[];
  quizzes?: QuizItem[];
  assignments?: AssignmentItem[];
  course_name?: string;
};

/* ─── Helpers ─────────────────────────────────────────────────── */
function getYouTubeId(url: string) {
  const m = url.match(/(?:youtu\.be\/|v\/|watch\?v=|&v=)([^#&?]{11})/);
  return m ? m[1] : null;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  video : <Video        className="h-4 w-4 text-indigo-500" />,
  pdf   : <FileText     className="h-4 w-4 text-rose-500" />,
  doc   : <FileText     className="h-4 w-4 text-blue-500" />,
  link  : <Link2        className="h-4 w-4 text-amber-500" />,
  image : <ImageIcon    className="h-4 w-4 text-emerald-500" />,
};

/* ─── Main Component ──────────────────────────────────────────── */
export default function StudentLessonPlayerPage() {
  const params       = useParams();
  const searchParams = useSearchParams();
  const router       = useRouter();

  const lessonId = params.id as string;
  const courseId = searchParams.get("courseId");
  const moduleId = searchParams.get("moduleId");

  const [lesson,          setLesson]          = useState<LessonData | null>(null);
  const [modules,         setModules]         = useState<any[]>([]);
  const [expanded,        setExpanded]        = useState<Record<number, boolean>>({});
  const [loading,         setLoading]         = useState(true);
  const [role,            setRole]            = useState("");
  const [activeMaterial,  setActiveMaterial]  = useState<any | null>(null);
  const [activeTab,       setActiveTab]       = useState("notes");
  const [completed,       setCompleted]       = useState(false);

  // Edit modal states
  const [editing,         setEditing]         = useState(false);
  const [editTitle,       setEditTitle]       = useState("");
  const [editContent,     setEditContent]     = useState("");
  const [editDuration,    setEditDuration]    = useState("");
  const [editType,        setEditType]        = useState("video");
  const [editUrl,         setEditUrl]         = useState("");
  const [editOrder,       setEditOrder]       = useState(1);
  const [editFile,        setEditFile]        = useState<File | null>(null);
  const [saving,          setSaving]          = useState(false);

  /* Load lesson + modules */
  const loadData = async () => {
    try {
      setLoading(true);
      const { data: ld } = await api.get(`/lessons/${lessonId}`);
      if (ld) {
        setLesson(ld);
        setEditTitle(ld.title || "");
        setEditContent(ld.content || ld.description || "");
        setEditDuration(ld.duration || "");
        setEditType(ld.material_type || "video");
        setEditOrder(ld.order || 1);
        setEditUrl(ld.material_url || ld.material_file || "");

        const fallback = {
          id: 0,
          title: ld.title,
          type: ld.material_type || "video",
          file_url: ld.material_file || "",
          external_url: ld.material_url || null,
        };
        setActiveMaterial(ld.materials?.length ? ld.materials[0] : fallback);
      }

      if (courseId) {
        const { data: mods } = await api.get(`/courses/${courseId}/modules`);
        if (Array.isArray(mods)) {
          setModules(mods);
          setExpanded(prev => ({ ...prev, [Number(moduleId)]: true }));
        }
      }
    } catch (err) {
      console.error("Failed to load lesson:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setRole((localStorage.getItem("user_role") || "student").toLowerCase());
    }
    if (lessonId) loadData();
  }, [lessonId, courseId, moduleId]);

  const canEdit = ["admin", "administrator", "teacher", "instructor"].includes(role);

  /* Save edits */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("title",         editTitle);
      fd.append("content",       editContent);
      fd.append("description",   editContent);
      fd.append("duration",      editDuration);
      fd.append("material_type", editType);
      fd.append("order",         String(editOrder));
      if (editType === "url" || editType === "link") {
        fd.append("material_url", editUrl);
      } else if (editFile) {
        fd.append("file", editFile);
      } else {
        fd.append("material_url", editUrl);
      }
      const res = await api.put(`/lessons/${lessonId}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.status === 200) {
        toast.success("Lesson saved!");
        setEditing(false);
        setEditFile(null);
        await loadData();
      }
    } catch {
      toast.error("Failed to save lesson.");
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    if (lesson) {
      setEditTitle(lesson.title || "");
      setEditContent(lesson.content || lesson.description || "");
      setEditDuration(lesson.duration || "");
      setEditType(lesson.material_type || "video");
      setEditOrder(lesson.order || 1);
      setEditUrl(lesson.material_url || lesson.material_file || "");
    }
    setEditing(false);
    setEditFile(null);
  };

  /* ── Media renderer ─────────────────────────────────────────── */
  const extractUrl = (text: string) => {
    if (!text) return "";
    const match = text.match(/https?:\/\/[^\s]+/);
    return match ? match[0] : "";
  };

  const rawTarget = activeMaterial?.file_url || activeMaterial?.external_url || "";
  const target = rawTarget || extractUrl(lesson?.content || lesson?.description || "");
  const isYoutube  = target.includes("youtube.com") || target.includes("youtu.be");

  const materials = lesson?.materials || [];

  const videos = materials.filter(m => m.type === "video" || m.file_url?.includes("youtube.com") || m.file_url?.includes("youtu.be") || m.external_url?.includes("youtube.com") || m.external_url?.includes("youtu.be"));
  
  const slides = materials.filter(m => {
    const titleLower = m.title.toLowerCase();
    const urlLower = (m.file_url || m.external_url || "").toLowerCase();
    return titleLower.includes("slide") || titleLower.includes("powerpoint") || titleLower.includes("presentation") || urlLower.endsWith(".ppt") || urlLower.endsWith(".pptx") || urlLower.endsWith(".odp");
  });
  
  const downloads = materials.filter(m => {
    const titleLower = m.title.toLowerCase();
    const urlLower = (m.file_url || m.external_url || "").toLowerCase();
    return titleLower.includes("zip") || titleLower.includes("download") || titleLower.includes("cheat sheet") || urlLower.endsWith(".zip") || urlLower.endsWith(".rar") || urlLower.endsWith(".7z") || urlLower.endsWith(".sql");
  });
  
  const documents = materials.filter(m => {
    if (slides.some(s => s.id === m.id) || downloads.some(d => d.id === m.id)) return false;
    return m.type === "pdf" || m.type === "doc" || m.type === "document" || m.file_url?.endsWith(".pdf") || m.file_url?.endsWith(".docx") || m.file_url?.endsWith(".doc") || m.external_url?.endsWith(".pdf");
  });
  
  const resources = materials.filter(m => {
    if (videos.some(v => v.id === m.id) || slides.some(s => s.id === m.id) || downloads.some(d => d.id === m.id) || documents.some(doc => doc.id === m.id)) return false;
    return m.type === "image" || m.type === "link" || m.type === "external";
  });

  const renderMaterialCard = (m: MaterialItem) => {
    const isActive = activeMaterial?.id === m.id;
    return (
      <button
        key={m.id}
        onClick={() => setActiveMaterial(m)}
        className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${
          isActive
            ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-bold"
            : "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-700"
        }`}
      >
        <div className="shrink-0">
          {m.type === "video" ? (
            <Video className="h-3.5 w-3.5 text-indigo-500" />
          ) : m.type === "pdf" || m.type === "doc" || m.type === "document" ? (
            <FileText className="h-3.5 w-3.5 text-rose-500" />
          ) : m.type === "image" ? (
            <ImageIcon className="h-3.5 w-3.5 text-emerald-500" />
          ) : m.type === "link" ? (
            <Link2 className="h-3.5 w-3.5 text-amber-500" />
          ) : (
            <Layers className="h-3.5 w-3.5 text-slate-400" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold truncate leading-tight">{m.title}</p>
          <span className="text-[8px] text-slate-400 font-semibold uppercase tracking-wider">{m.type}</span>
        </div>
        {isActive && <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />}
      </button>
    );
  };


  const renderMedia = () => {
    const type = activeMaterial?.type;
    if (!target && type !== "pdf") {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
          <Video className="h-10 w-10 text-slate-300" />
          <p className="text-sm font-semibold">No media attached to this lesson yet.</p>
        </div>
      );
    }
    const isPdfFile = target.toLowerCase().split('?')[0].endsWith(".pdf");
    if (type === "pdf" || type === "doc" || type === "document" || isPdfFile) {
      return (
        <iframe
          src={target}
          className="w-full h-full rounded-xl border-none bg-white"
          title={activeMaterial.title}
        />
      );
    }
    if (isYoutube) {
      return (
        <iframe
          className="w-full h-full rounded-xl border-none"
          src={`https://www.youtube.com/embed/${getYouTubeId(target)}?autoplay=1`}
          title="Lesson Video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }
    if (type === "video" || type === "mp4") {
      return (
        <video src={target} controls autoPlay
          className="w-full h-full object-contain rounded-xl bg-black"
          poster="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200"
        />
      );
    }
    if (type === "link") {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <div className="h-16 w-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-3xl">🔗</div>
          <p className="text-sm font-bold text-slate-700">{activeMaterial.title}</p>
          <a href={target} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow transition-all active:scale-95">
            <ExternalLink className="h-4 w-4" /> Visit External Link
          </a>
        </div>
      );
    }
    if (type === "image") {
      return (
        <img src={target} alt={activeMaterial.title}
          className="max-w-full max-h-full object-contain rounded-xl" />
      );
    }
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
        <Video className="h-10 w-10 text-slate-300" />
        <p className="text-sm font-semibold">Media not available.</p>
      </div>
    );
  };

  /* ── Loading ─────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F4F6FA]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-400">Loading lesson…</p>
        </div>
      </div>
    );
  }

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#F4F6FA] font-sans text-left">

      {/* ── LEFT: Course Syllabus Panel ────────────────────────── */}
      <aside className="w-full lg:w-72 shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-slate-100 flex flex-col">

        {/* Back button + course name */}
        <div className="px-5 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5 mb-4 select-none">
            <BackButton href={courseId ? `/list/courses/${courseId}` : (canEdit ? "/teacher" : "/student")} />
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider leading-none">Return</p>
              <Link
                href={courseId ? `/list/courses/${courseId}` : (canEdit ? "/teacher" : "/student")}
                className="text-[11px] font-extrabold text-slate-600 hover:text-indigo-600 transition-colors mt-0.5 inline-block"
              >
                Back to course
              </Link>
            </div>
          </div>
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Course Syllabus</p>
          <h2 className="text-sm font-black text-slate-800 mt-0.5 leading-snug">
            {lesson?.course_name || "Course Content"}
          </h2>
        </div>

        {/* Module accordion */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {modules.length === 0 && (
            <p className="text-xs text-slate-400 font-semibold text-center py-8">
              No modules found for this course.
            </p>
          )}
          {modules.map((mod, idx) => {
            const isOpen = !!expanded[mod.id];
            const lessons = mod.lessons || [];
            return (
              <div key={mod.id} className="rounded-xl border border-slate-100 overflow-hidden">
                <button
                  onClick={() => setExpanded(p => ({ ...p, [mod.id]: !p[mod.id] }))}
                  className="w-full flex items-center justify-between px-3.5 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                      Module {idx + 1}
                    </span>
                    <p className="text-xs font-bold text-slate-700 truncate leading-tight mt-0.5">
                      {mod.title}
                    </p>
                    <span className="text-[9px] text-slate-400 font-semibold">
                      {lessons.length} lesson{lessons.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {isOpen
                    ? <ChevronUp   className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    : <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
                </button>

                {isOpen && (
                  <div className="bg-white border-t border-slate-100 divide-y divide-slate-50">
                    {lessons.map((les: any) => {
                      const isCurrent = String(les.id) === String(lessonId);
                      const isDoc = les.material_type === "document" || les.material_type === "pdf";
                      const content = (
                        <>
                          <div className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 border ${
                            isCurrent
                              ? "bg-indigo-500 border-indigo-400 text-white"
                              : "bg-white border-slate-200 text-slate-300 group-hover:border-slate-300"
                          }`}>
                            {isCurrent
                              ? <Play className="h-2.5 w-2.5 fill-white text-white" />
                              : <div className="h-1 w-1 rounded-full bg-slate-300" />}
                          </div>
                          <p className={`text-xs truncate flex-1 ${
                            isCurrent ? "font-bold text-indigo-700" : "font-medium text-slate-600 group-hover:text-slate-800"
                          }`}>
                            {les.title} {isDoc && "📄"}
                          </p>
                        </>
                      );
                      const linkClassName = `flex items-center gap-2.5 px-4 py-2.5 transition-colors group ${
                        isCurrent
                          ? "bg-indigo-50 border-l-2 border-indigo-500"
                          : "hover:bg-slate-50 border-l-2 border-transparent"
                      }`;

                      return (
                        <Link
                          key={les.id}
                          href={
                            canEdit
                              ? `/list/lessons/${les.id}?courseId=${courseId}&moduleId=${mod.id}`
                              : `/student/lessons/${les.id}?courseId=${courseId}&moduleId=${mod.id}`
                          }
                          className={linkClassName}
                          replace={true}
                        >
                          {content}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* ── MAIN: Player + Info ───────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-y-auto">

        {/* Top bar */}
        <div className="bg-white border-b border-slate-100 px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-7 w-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
              <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                {lesson?.course_name || "Learning"}
              </p>
              <h1 className="text-sm font-black text-slate-800 truncate leading-tight">
                {lesson?.title}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {lesson?.duration && (
              <span className="hidden sm:flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
                <Clock className="h-3 w-3" /> {lesson.duration}
              </span>
            )}
            {canEdit && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-colors"
              >
                <Edit className="h-3.5 w-3.5" /> Edit
              </button>
            )}
            <button
              onClick={() => {
                setCompleted(p => !p);
                toast.success(completed ? "Marked as incomplete" : "Lesson completed! 🎉");
              }}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black rounded-xl border transition-all ${
                completed
                  ? "bg-emerald-500 border-emerald-400 text-white"
                  : "bg-[#0038A8] border-[#0038A8] text-white hover:bg-[#002D86]"
              }`}
            >
              {completed ? <Check className="h-3.5 w-3.5" /> : <div className="h-3.5 w-3.5 rounded-full border-2 border-white" />}
              {completed ? "Completed" : "Mark as Complete"}
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 p-5 grid grid-cols-1 xl:grid-cols-3 gap-5">

          {/* ── Video / Media player (col-span-2) ─────────────── */}
          <div className="xl:col-span-2 flex flex-col gap-4">

            {/* Material tabs (if multiple) */}
            {lesson?.materials && lesson.materials.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {lesson.materials.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setActiveMaterial(m)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      activeMaterial?.id === m.id
                        ? "bg-indigo-600 border-indigo-500 text-white"
                        : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300"
                    }`}
                  >
                    {TYPE_ICON[m.type] || <Layers className="h-4 w-4" />}
                    {m.title}
                  </button>
                ))}
              </div>
            )}

            {/* Player card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className={`relative w-full bg-slate-50 flex items-center justify-center ${
                activeMaterial?.type === "pdf" || activeMaterial?.type === "doc" || activeMaterial?.type === "document" || target?.toLowerCase().split('?')[0].endsWith(".pdf")
                  ? "h-[650px]"
                  : "aspect-video"
              }`}>
                {renderMedia()}
              </div>
            </div>

            {/* Lesson title + description */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-black text-slate-800 leading-tight">{lesson?.title}</h2>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    {lesson?.description || "No description provided for this lesson."}
                  </p>
                </div>
                {lesson?.order && (
                  <span className="shrink-0 text-[10px] font-black text-indigo-400 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-lg uppercase tracking-wider">
                    Lesson {lesson.order}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── Right Panel: Notes / Resources / Assessments ──── */}
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">

              {/* Tabs */}
              <div className="flex border-b border-slate-100 px-4 pt-1">
                {[
                  { key: "notes",       label: "Lesson Notes",  icon: <BookOpen className="h-3 w-3" /> },
                  ...(lesson?.materials?.length ? [{ key: "materials", label: `Resources (${lesson.materials.length})`, icon: <Layers className="h-3 w-3" /> }] : []),
                  ...((lesson?.quizzes?.length || lesson?.assignments?.length) ? [{ key: "assessments", label: "Assessments", icon: <ClipboardList className="h-3 w-3" /> }] : []),
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1 pb-2.5 pt-2 px-2 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-colors mr-2 ${
                      activeTab === tab.key
                        ? "border-indigo-500 text-indigo-600"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab body */}
              <div className="p-4 overflow-y-auto max-h-[400px] xl:max-h-none xl:flex-1">

                {/* Notes */}
                {activeTab === "notes" && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Syllabus Overview</p>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                      {lesson?.content || lesson?.description || "No notes available for this lesson."}
                    </p>
                  </div>
                )}

                {/* Materials */}
                {activeTab === "materials" && (
                  <div className="space-y-4">
                    {videos.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[9px] font-black text-indigo-500 uppercase tracking-wider">Video Section</p>
                        <div className="space-y-1.5">
                          {videos.map(m => renderMaterialCard(m))}
                        </div>
                      </div>
                    )}
                    {documents.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[9px] font-black text-rose-500 uppercase tracking-wider">Documents Section</p>
                        <div className="space-y-1.5">
                          {documents.map(m => renderMaterialCard(m))}
                        </div>
                      </div>
                    )}
                    {slides.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[9px] font-black text-blue-500 uppercase tracking-wider">Slides Section</p>
                        <div className="space-y-1.5">
                          {slides.map(m => renderMaterialCard(m))}
                        </div>
                      </div>
                    )}
                    {resources.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[9px] font-black text-amber-500 uppercase tracking-wider">Resources Section</p>
                        <div className="space-y-1.5">
                          {resources.map(m => renderMaterialCard(m))}
                        </div>
                      </div>
                    )}
                    {downloads.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-wider">Downloads Section</p>
                        <div className="space-y-1.5">
                          {downloads.map(m => renderMaterialCard(m))}
                        </div>
                      </div>
                    )}
                    {materials.length === 0 && (
                      <p className="text-xs text-slate-400 font-semibold text-center py-6">No materials for this lesson.</p>
                    )}
                  </div>
                )}

                {/* Assessments */}
                {activeTab === "assessments" && (
                  <div className="space-y-2">
                    {lesson?.quizzes?.map(q => (
                      <Link
                        key={q.id}
                        href={`/list/quizzes/${q.id}`}
                        className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white hover:border-emerald-200 hover:bg-emerald-50 transition-all group"
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-700 truncate group-hover:text-emerald-700">{q.title}</p>
                          <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Quiz · {q.total_marks} marks</span>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-slate-300 group-hover:text-emerald-400" />
                      </Link>
                    ))}
                    {lesson?.assignments?.map(a => (
                      <Link
                        key={a.id}
                        href={`/list/assignments/${a.id}/submit`}
                        className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white hover:border-indigo-200 hover:bg-indigo-50 transition-all group"
                      >
                        <ClipboardList className="h-4 w-4 text-indigo-500 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-700 truncate group-hover:text-indigo-700">{a.title}</p>
                          <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Assignment</span>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-slate-300 group-hover:text-indigo-400" />
                      </Link>
                    ))}
                    {!lesson?.quizzes?.length && !lesson?.assignments?.length && (
                      <p className="text-xs text-slate-400 font-semibold text-center py-6">No assessments for this lesson.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Edit Modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {editing && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={cancelEdit}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.97 }}
              className="fixed inset-x-4 bottom-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[560px] max-h-[85vh] overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-2xl z-[60] p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-black text-slate-800">Edit Lesson</h2>
                <button onClick={cancelEdit} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Title</label>
                  <input
                    type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Type</label>
                    <select value={editType} onChange={e => setEditType(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none">
                      <option value="video">Video</option>
                      <option value="url">YouTube URL</option>
                      <option value="pdf">PDF</option>
                      <option value="link">Link</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Duration</label>
                    <input type="text" value={editDuration} onChange={e => setEditDuration(e.target.value)}
                      placeholder="e.g. 45min"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Order</label>
                    <input type="number" value={editOrder} onChange={e => setEditOrder(parseInt(e.target.value) || 1)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none" />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                  {editType === "url" || editType === "link" ? (
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">URL</label>
                      <input type="text" value={editUrl} onChange={e => setEditUrl(e.target.value)}
                        placeholder="https://youtube.com/..."
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none" />
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Upload File</label>
                      <input type="file" accept={editType === "pdf" ? ".pdf" : "video/*"}
                        onChange={e => setEditFile(e.target.files?.[0] || null)}
                        className="w-full text-xs text-slate-600" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Notes / Content</label>
                  <textarea rows={4} value={editContent} onChange={e => setEditContent(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                  <button type="button" onClick={cancelEdit}
                    className="px-4 py-2 border border-slate-200 text-xs font-bold rounded-xl text-slate-500 hover:bg-slate-50 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#0038A8] hover:bg-[#002D86] text-white font-black text-xs rounded-xl shadow transition-all disabled:opacity-60">
                    <Save className="h-3.5 w-3.5" />
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}