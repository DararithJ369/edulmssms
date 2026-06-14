"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Video, AlertCircle, Globe, Clock, FileText, 
  CheckCircle, Play, Download, ExternalLink, Sparkles, X, Edit, Trash2, Plus, Loader,
  Image as ImageIcon, Award, BookOpen
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "react-toastify";

// Import your standardized modal form component
import LessonForm from "@/components/forms/LessonForm";
import BackButton from "@/components/BackButton";

type MaterialItem = {
  id: number;
  title: string;
  type: string; // pdf, video, doc, link, image
  file_url: string;
  external_url: string | null;
  description?: string;
  is_visible?: boolean;
};

type QuizItem = {
  id: number;
  title: string;
  total_marks: number;
};

type AssignmentItem = {
  id: number;
  title: string;
  total_marks?: number;
};

type LessonData = {
  id: number;
  module_id: number;
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
};

export default function LessonDetailsWorkspacePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const lessonId = params.id as string;
  const courseId = searchParams.get("courseId") || "";
  const moduleId = searchParams.get("moduleId") || "";
  
  const [currentLesson, setCurrentLesson] = useState<LessonData | null>(null);
  const [siblingLessons, setSiblingLessons] = useState<LessonData[]>([]);
  const [moduleTitle, setModuleTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string>("");
  const [activeMaterial, setActiveMaterial] = useState<any | null>(null);

  // Modal visibility control state
  const [isEditing, setIsEditing] = useState(false);

  // Add Material form states
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("video");
  const [newUrl, setNewUrl] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const loadWorkspaceData = async () => {
    try {
      const { data: lessonData } = await api.get(`/lessons/${lessonId}`);
      if (lessonData) {
        setCurrentLesson(lessonData);
        
        // Set default active material
        if (lessonData.materials && lessonData.materials.length > 0) {
          setActiveMaterial(lessonData.materials[0]);
        } else {
          setActiveMaterial({
            id: 0,
            title: lessonData.title,
            type: lessonData.material_type || "video",
            file_url: lessonData.material_file || "",
            external_url: lessonData.material_url || null,
          });
        }
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
    } catch (err) {
      console.error("Failed to load layout workspace:", err);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userRole = localStorage.getItem("user_role") || "student";
      setRole(userRole.toLowerCase());
    }

    const initPage = async () => {
      setLoading(true);
      await loadWorkspaceData();
      setLoading(false);
    };

    if (lessonId) initPage();
  }, [lessonId, courseId, moduleId]);

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error("Please enter a resource title.");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("title", newTitle);
      formData.append("type", newType);
      formData.append("uploaded_by", localStorage.getItem("user_id") || "admin");
      if (newUrl) formData.append("external_url", newUrl);
      if (newFile) formData.append("file", newFile);

      await api.post(`/lessons/${lessonId}/materials`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Learning material added successfully!");
      setNewTitle("");
      setNewUrl("");
      setNewFile(null);
      await loadWorkspaceData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload material resource.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMaterial = async (materialId: number) => {
    if (!confirm("Are you sure you want to delete this resource material?")) return;
    try {
      await api.delete(`/lessons/materials/${materialId}`);
      toast.success("Material deleted successfully!");
      await loadWorkspaceData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete material.");
    }
  };

  const getYouTubeEmbedId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const extractUrl = (text: string) => {
    if (!text) return "";
    const match = text.match(/https?:\/\/[^\s]+/);
    return match ? match[0] : "";
  };

  const rawTarget = activeMaterial?.file_url || activeMaterial?.external_url || "";
  const activeTarget = rawTarget || extractUrl(currentLesson?.content || currentLesson?.description || "");
  const isYouTubeMedia = activeTarget.includes("youtube.com") || activeTarget.includes("youtu.be");
  const hasAccessToEdit = role === "admin" || role === "administrator" || role === "teacher" || role === "instructor";

  const materials = currentLesson?.materials || [];

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

  const renderMaterialRow = (m: MaterialItem) => {
    const isActive = activeMaterial?.id === m.id;
    return (
      <div
        key={m.id}
        className={`flex items-center justify-between p-2.5 border rounded-2xl transition-all duration-200 ${
          isActive
            ? "bg-blue-50/50 dark:bg-zinc-800 border-[#0038A8]/30 dark:border-zinc-700 shadow-sm"
            : "border-slate-100 dark:border-zinc-800 bg-slate-50/20 dark:bg-zinc-900/30"
        }`}
      >
        <button
          onClick={() => setActiveMaterial(m)}
          className="flex items-start gap-2 text-left min-w-0 flex-1"
        >
          <div className="mt-0.5 shrink-0">
            {m.type === "video" ? (
              <Video className="h-4 w-4 text-[#0038A8]" />
            ) : m.type === "pdf" || m.type === "doc" || m.type === "document" ? (
              <FileText className="h-4 w-4 text-emerald-600" />
            ) : m.type === "image" ? (
              <ImageIcon className="h-4 w-4 text-amber-500" />
            ) : (
              <ExternalLink className="h-4 w-4 text-[#8b5cf6]" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{m.title}</p>
            <span className="text-[8px] text-slate-400 font-bold uppercase">{m.type}</span>
          </div>
        </button>
        <button
          onClick={() => handleDeleteMaterial(m.id)}
          className="p-1 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-500 transition-colors shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    );
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
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] dark:bg-[#121212] min-h-screen font-sans text-left">
      
      {/* BREADCRUMB */}
      <div className="flex items-center gap-1 text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider select-none">
        <Link href={hasAccessToEdit ? "/teacher" : "/student"} className="hover:text-foreground flex items-center gap-1">
          <Globe className="h-3 w-3" /> Home
        </Link>
        <span>/</span>
        <span className="text-foreground">Course Playback Hub</span>
      </div>

      {/* HEADER SECTION PANEL */}
      <div className="bg-white dark:bg-[#1c1c1c] p-5 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-sm flex items-center justify-between select-none">
        <div className="flex items-center gap-3">
          <BackButton href={courseId ? `/list/courses/${courseId}` : (hasAccessToEdit ? "/teacher" : "/student")} />
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
            <span>{currentLesson?.duration ? `${currentLesson.duration}` : "45min"}</span>
          </div>

          {hasAccessToEdit && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-[#0038A8] hover:bg-[#002D86] text-white font-black text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 active:scale-[0.98]"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>
          )}
        </div>
      </div>

      {/* DUAL COLUMN CONTAINER GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <div className={`relative w-full rounded-3xl overflow-hidden bg-slate-950 border border-slate-900 shadow-md flex items-center justify-center ${
            activeMaterial?.type === "pdf" || activeMaterial?.type === "document" || activeMaterial?.type === "doc" || activeTarget.toLowerCase().split('?')[0].endsWith(".pdf")
              ? "h-[650px]"
              : "aspect-video"
          }`}>
            {activeMaterial?.type === "pdf" || activeMaterial?.type === "document" || activeMaterial?.type === "doc" || activeTarget.toLowerCase().split('?')[0].endsWith(".pdf") ? (
              <iframe
                src={activeTarget}
                className="w-full h-full border-none bg-white rounded-3xl"
                title={activeMaterial.title}
              />
            ) : isYouTubeMedia ? (
              <iframe
                className="w-full h-full border-none"
                src={`https://www.youtube.com/embed/${getYouTubeEmbedId(activeTarget)}?autoplay=1`}
                title="YouTube Video Core Streaming View"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : activeTarget && (activeMaterial?.type === "video" || activeMaterial?.type === "mp4") ? (
              <video 
                src={activeTarget}
                controls
                autoPlay
                className="w-full h-full object-contain"
                poster="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200"
              />
            ) : activeMaterial?.type === "link" ? (
              <div className="text-center text-white p-8 space-y-4 select-none">
                <div className="h-16 w-16 bg-white/10 border border-white/20 text-[#8b5cf6] rounded-2xl flex items-center justify-center mx-auto text-2xl">
                  🔗
                </div>
                <div>
                  <h4 className="text-sm font-black tracking-wide">{activeMaterial.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-1">External web link or repository resource.</p>
                </div>
                <a 
                  href={activeTarget} 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex px-4 py-2 bg-[#0038A8] hover:bg-[#002D86] text-white text-xs font-black rounded-xl shadow-md transition-all"
                >
                  <ExternalLink className="w-4 h-4 mr-1.5" /> Visit External Link
                </a>
              </div>
            ) : activeMaterial?.type === "image" ? (
              <div className="w-full h-full flex items-center justify-center bg-black/40">
                <img 
                  src={activeMaterial.file_url || activeMaterial.external_url} 
                  alt={activeMaterial.title}
                  className="max-w-full max-h-full object-contain p-4" 
                />
              </div>
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

        {/* RIGHT COLUMN: Workspace controls */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* LESSON MATERIALS MANAGER & LIST */}
          <div className="bg-white dark:bg-[#1c1c1c] p-5 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 select-none pb-2 border-b border-slate-100 dark:border-zinc-800">
              <BookOpen className="h-4 w-4 text-[#0038A8]" />
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Lesson Materials List
              </h3>
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {videos.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-indigo-500 uppercase tracking-wider">Video Section</p>
                  <div className="space-y-1">
                    {videos.map(m => renderMaterialRow(m))}
                  </div>
                </div>
              )}
              {documents.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-rose-500 uppercase tracking-wider">Documents Section</p>
                  <div className="space-y-1">
                    {documents.map(m => renderMaterialRow(m))}
                  </div>
                </div>
              )}
              {slides.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-blue-500 uppercase tracking-wider">Slides Section</p>
                  <div className="space-y-1">
                    {slides.map(m => renderMaterialRow(m))}
                  </div>
                </div>
              )}
              {resources.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-amber-500 uppercase tracking-wider">Resources Section</p>
                  <div className="space-y-1">
                    {resources.map(m => renderMaterialRow(m))}
                  </div>
                </div>
              )}
              {downloads.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-emerald-500 uppercase tracking-wider">Downloads Section</p>
                  <div className="space-y-1">
                    {downloads.map(m => renderMaterialRow(m))}
                  </div>
                </div>
              )}
              {materials.length === 0 && (
                <p className="text-[10px] text-slate-400 italic text-center py-4">No materials uploaded yet.</p>
              )}
            </div>
          </div>

          {/* ADD MATERIAL PANEL */}
          {hasAccessToEdit && (
            <div className="bg-white dark:bg-[#1c1c1c] p-5 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2 select-none pb-2 border-b border-slate-100 dark:border-zinc-800">
                <Plus className="h-4 w-4 text-emerald-600" />
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Add Learning Resource
                </h3>
              </div>
              <form onSubmit={handleAddMaterial} className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Slide Deck"
                    className="w-full border p-2 rounded-xl focus:outline-none focus:border-[#0038A8]"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Resource Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full border p-2 rounded-xl bg-slate-50 focus:outline-none"
                  >
                    <option value="video">Video Lecture</option>
                    <option value="pdf">Document (PDF)</option>
                    <option value="doc">Article notes</option>
                    <option value="link">Web link / GitHub</option>
                    <option value="image">Image / Diagram</option>
                  </select>
                </div>
                {newType === "link" ? (
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">URL</label>
                    <input
                      type="url"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full border p-2 rounded-xl focus:outline-none"
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Upload File</label>
                    <input
                      type="file"
                      onChange={(e) => setNewFile(e.target.files?.[0] || null)}
                      className="w-full border p-1 rounded-xl bg-slate-50 text-[10px]"
                      required
                    />
                  </div>
                )}
                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Loader className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Resource</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ASSESSMENTS PANEL */}
          {((currentLesson?.quizzes && currentLesson.quizzes.length > 0) || (currentLesson?.assignments && currentLesson.assignments.length > 0)) && (
            <div className="bg-white dark:bg-[#1c1c1c] p-5 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2 select-none pb-2 border-b border-slate-100 dark:border-zinc-800">
                <Award className="h-4 w-4 text-amber-600" />
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Assessments
                </h3>
              </div>
              <div className="space-y-2">
                {currentLesson.quizzes?.map((q: any) => (
                  <Link
                    key={q.id}
                    href={`/list/quizzes/${q.id}`}
                    className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 dark:border-zinc-800 bg-slate-50/20 dark:bg-zinc-900/30 hover:bg-white dark:hover:bg-zinc-800 hover:border-slate-200 transition-all text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate flex items-center gap-1.5">
                        <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                        {q.title}
                      </p>
                      <span className="text-[9px] text-slate-400 font-bold uppercase block mt-0.5 tracking-wider font-mono">
                        Interactive Quiz
                      </span>
                    </div>
                  </Link>
                ))}
                {currentLesson.assignments?.map((a: any) => (
                  <Link
                    key={a.id}
                    href={`/list/assignments/${a.id}/submit`}
                    className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 dark:border-zinc-800 bg-slate-50/20 dark:bg-zinc-900/30 hover:bg-white dark:hover:bg-zinc-800 hover:border-slate-200 transition-all text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                        {a.title}
                      </p>
                      <span className="text-[9px] text-slate-400 font-bold uppercase block mt-0.5 tracking-wider font-mono">
                        Assignment Submission
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL OVERLAY EDIT */}
      {isEditing && (
        <LessonForm 
          type="update"
          data={currentLesson}
          setOpen={setIsEditing}
          onCancel={async () => {
            setIsEditing(false);
            await loadWorkspaceData(); 
          }}
        />
      )}

      {/* FLOATING ACTION ASSISTANT HOOK BUTTONS */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => toast.info("AI Coach feature is coming soon!")}
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