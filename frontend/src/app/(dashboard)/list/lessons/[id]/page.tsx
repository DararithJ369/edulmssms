"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  Video, AlertCircle, Clock, FileText, CheckCircle, Download, ExternalLink, X, Edit, Trash2, Plus,
  Award, BookOpen, FileArchive, Presentation, FileCode, Link2, PlayCircle, File, Eye, ChevronRight
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "react-toastify";

import LessonForm from "@/components/forms/LessonForm";
import BackButton from "@/components/BackButton";
import { CldUploadWidget } from "next-cloudinary";
import PageHeader from "@/components/PageHeader";

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

  const [isEditing, setIsEditing] = useState(false);

  // Add Material form states
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("video");
  const [newUrl, setNewUrl] = useState("");
  const [newFileUrl, setNewFileUrl] = useState("");
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
      if (newFileUrl) formData.append("file_url", newFileUrl);

      await api.post(`/lessons/${lessonId}/materials`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Learning material added successfully!");
      setNewTitle("");
      setNewUrl("");
      setNewFileUrl("");
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

  const getFileIcon = (type: string, title: string, url: string) => {
    const t = type.toLowerCase();
    const u = url.toLowerCase();
    const titleLower = title.toLowerCase();

    if (t === "video" || u.includes("youtube.com") || u.includes("youtu.be")) {
      return PlayCircle;
    }
    if (t === "pdf" || u.endsWith(".pdf")) {
      return FileText;
    }
    if (titleLower.includes("slide") || titleLower.includes("powerpoint") || u.endsWith(".ppt") || u.endsWith(".pptx")) {
      return Presentation;
    }
    if (u.endsWith(".zip") || u.endsWith(".rar") || u.endsWith(".7z") || titleLower.includes("download")) {
      return FileArchive;
    }
    if (u.endsWith(".js") || u.endsWith(".ts") || u.endsWith(".py") || u.endsWith(".json") || u.endsWith(".sql")) {
      return FileCode;
    }
    if (t === "link" || t === "external") {
      return Link2;
    }
    return File;
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
    const Icon = getFileIcon(m.type, m.title, m.file_url || m.external_url || "");
    const targetUrl = m.file_url || m.external_url || "#";

    return (
      <div
        key={m.id}
        className={`flex items-center justify-between p-3 border rounded-xl transition-all duration-200 ${
          isActive
            ? "bg-brand/5 border-brand/35 text-brand shadow-xs"
            : "border-border/40 bg-slate-50/20 hover:bg-slate-50/60"
        }`}
      >
        <button
          onClick={() => setActiveMaterial(m)}
          className="flex items-center gap-3 text-left min-w-0 flex-1 cursor-pointer"
        >
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${isActive ? "bg-brand/10 text-brand" : "bg-slate-100 text-slate-500"}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-700 truncate">{m.title}</p>
            <div className="flex items-center gap-1.5 mt-0.5 select-none">
              <span className="text-[8.5px] text-muted-foreground/60 font-semibold uppercase">{m.type}</span>
              <span className="text-[8.5px] text-muted-foreground/30">•</span>
              <span className="text-[8.5px] text-muted-foreground/60 font-medium">Resource</span>
            </div>
          </div>
        </button>
        
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {targetUrl !== "#" && (
            <>
              <a
                href={targetUrl}
                target="_blank"
                rel="noreferrer"
                title="Open in new tab"
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href={targetUrl}
                download
                title="Download resource"
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
              </a>
            </>
          )}
          {hasAccessToEdit && (
            <button
              onClick={() => handleDeleteMaterial(m.id)}
              className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F7F8FA]">
        <div className="h-9 w-9 border-4 border-[#0038A8] border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-xs font-bold text-muted-foreground select-none">Syncing Database Workspace...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen font-sans text-left transition-all duration-300 animate-fade-in">
      
      {/* PAGE HEADER */}
      <PageHeader
        eyebrow={`MODULE: ${moduleTitle || "Syllabus Track"}`}
        title={currentLesson?.title || "Lesson Overview"}
        breadcrumbs={[
          { label: "Lessons", href: "/list/lessons" },
          { label: currentLesson?.title || "Detail" }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white border border-border/60 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700">
              <Clock className="w-4 h-4 text-brand" />
              <span>{currentLesson?.duration ? `${currentLesson.duration}` : "45min"}</span>
            </div>

            {hasAccessToEdit && (
              isEditing ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="submit"
                    form="lesson-form-element"
                    className="px-4 py-2 bg-brand hover:bg-brand-dark text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 active:scale-[0.98] cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 active:scale-[0.98] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-brand hover:bg-brand-dark text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 active:scale-[0.98] cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Details</span>
                </button>
              )
            )}
          </div>
        }
      />

      {/* DUAL COLUMN CONTAINER GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* LEFT COLUMN: Main viewport and notes */}
        <div className="lg:col-span-7 space-y-6">
          <div className={`relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-900/60 shadow-xs flex items-center justify-center ${
            activeMaterial?.type === "pdf" || activeMaterial?.type === "document" || activeMaterial?.type === "doc" || activeTarget.toLowerCase().split('?')[0].endsWith(".pdf")
              ? "h-[650px]"
              : "aspect-video"
          }`}>
            {activeMaterial?.type === "pdf" || activeMaterial?.type === "document" || activeMaterial?.type === "doc" || activeTarget.toLowerCase().split('?')[0].endsWith(".pdf") ? (
              <iframe
                src={activeTarget}
                className="w-full h-full border-none bg-white"
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
                  className="inline-flex px-4 py-2 bg-brand hover:bg-brand-dark text-white text-xs font-bold rounded-xl shadow-sm transition-all"
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
                <AlertCircle className="h-8 w-8 text-brand-light" />
                <p className="text-xs font-bold">Media Stream Uninitialized</p>
              </div>
            )}
          </div>

          {/* LECTURE NOTES BOX */}
          <div className="bg-card p-6 rounded-2xl border border-border/60 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest select-none">
              Lecture Notes & Curriculum
            </h3>
            <div className="text-xs text-slate-600 leading-relaxed font-semibold whitespace-pre-line">
              {currentLesson?.content || currentLesson?.description || "No description details provided for this lecture track."}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Workspace sidebar controls */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* LESSON MATERIALS ACCORDIONS */}
          <div className="bg-card p-5 rounded-2xl border border-border/60 shadow-xs space-y-4">
            <div className="select-none pb-2 border-b border-border/60">
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Curriculum Materials
              </h3>
            </div>

            <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
              {videos.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Lesson Videos</p>
                  <div className="space-y-1.5">
                    {videos.map(m => renderMaterialRow(m))}
                  </div>
                </div>
              )}
              {documents.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Reading Materials</p>
                  <div className="space-y-1.5">
                    {documents.map(m => renderMaterialRow(m))}
                  </div>
                </div>
              )}
              {slides.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Presentations</p>
                  <div className="space-y-1.5">
                    {slides.map(m => renderMaterialRow(m))}
                  </div>
                </div>
              )}
              {resources.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Additional Resources</p>
                  <div className="space-y-1.5">
                    {resources.map(m => renderMaterialRow(m))}
                  </div>
                </div>
              )}
              {downloads.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Downloads</p>
                  <div className="space-y-1.5">
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
            <div className="bg-card p-5 rounded-2xl border border-border/60 shadow-xs space-y-4">
              <div className="select-none pb-2 border-b border-border/60">
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  + Add Learning Resource
                </h3>
              </div>
              <form onSubmit={handleAddMaterial} className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Slide Deck"
                    className="w-full border p-2 bg-slate-50 border-border/60 rounded-xl focus:outline-none focus:border-brand"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Resource Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full border p-2 rounded-xl bg-slate-50 border-border/60 focus:outline-none cursor-pointer"
                  >
                    <option value="video">Video Lecture</option>
                    <option value="pdf">Document (PDF)</option>
                    <option value="doc">Article notes</option>
                    <option value="link">Web link / GitHub</option>
                    <option value="image">Image / Diagram</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    {newType === "link" ? "URL" : "External URL (optional)"}
                  </label>
                  <input
                    type="url"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder={newType === "video" ? "https://youtube.com/watch?v=..." : newType === "pdf" ? "https://example.com/file.pdf" : "https://..."}
                    className="w-full border p-2 bg-slate-50 border-border/60 rounded-xl focus:outline-none focus:border-brand"
                    required={newType === "link"}
                  />
                </div>
                {newType !== "link" && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Upload File {newUrl ? "(optional if URL provided)" : ""}
                    </label>
                    {newFileUrl ? (
                      <div className="flex items-center gap-2 p-2 bg-slate-50 border border-border rounded-xl">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span className="text-[10px] font-semibold text-slate-600 truncate flex-1">File uploaded</span>
                        <button type="button" onClick={() => setNewFileUrl("")} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <CldUploadWidget
                        options={{
                          cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dlykcgjdh",
                          uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "lms_preset",
                          multiple: false,
                          resourceType: "auto",
                          sources: ["local", "url", "camera"],
                        }}
                        onSuccess={(result: any) => {
                          const url = result?.info?.secure_url;
                          if (url) setNewFileUrl(url);
                        }}
                      >
                        {({ open }) => (
                          <button
                            type="button"
                            onClick={() => open()}
                            className="w-full py-2.5 border border-dashed border-border/80 bg-slate-50 hover:bg-slate-100 hover:border-brand/40 rounded-xl text-[10px] font-semibold text-slate-500 hover:text-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Choose File from Cloudinary
                          </button>
                        )}
                      </CldUploadWidget>
                    )}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full py-2 bg-brand hover:bg-brand-dark text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {uploading ? <span>Uploading...</span> : <span>+ Add Resource</span>}
                </button>
              </form>
            </div>
          )}

          {/* ASSESSMENTS PANEL */}
          {((currentLesson?.quizzes && currentLesson.quizzes.length > 0) || (currentLesson?.assignments && currentLesson.assignments.length > 0)) && (
            <div className="bg-card p-5 rounded-2xl border border-border/60 shadow-xs space-y-4">
              <div className="flex items-center gap-2 select-none pb-2 border-b border-border/60">
                <Award className="h-4 w-4 text-brand" />
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Assessments
                </h3>
              </div>
              <div className="space-y-2">
                {currentLesson.quizzes?.map((q: any) => (
                  <Link
                    key={q.id}
                    href={`/list/quizzes/${q.id}`}
                    className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-slate-50/20 hover:bg-white hover:border-border/60 transition-all text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-700 truncate flex items-center gap-1.5">
                        <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                        {q.title}
                      </p>
                      <span className="text-[8.5px] text-muted-foreground/60 font-semibold uppercase block mt-0.5 tracking-wider font-mono">
                        Interactive Quiz
                      </span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1" />
                  </Link>
                ))}
                {currentLesson.assignments?.map((a: any) => (
                  <Link
                    key={a.id}
                    href={`/list/assignments/${a.id}/submit`}
                    className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-slate-50/20 hover:bg-white hover:border-border/60 transition-all text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-700 truncate flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-brand shrink-0" />
                        {a.title}
                      </p>
                      <span className="text-[8.5px] text-muted-foreground/60 font-semibold uppercase block mt-0.5 tracking-wider font-mono">
                        Assignment Submission
                      </span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1" />
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

    </div>
  );
}