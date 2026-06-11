"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Video, AlertCircle, Globe, Clock, FileText, 
  CheckCircle, Play, Download, ExternalLink, Sparkles, Loader, Send, X, Trash2, Zap, Edit
} from "lucide-react";
import { api } from "@/lib/api";

// Import your standardized modal form component
import LessonForm from "@/components/forms/LessonForm";

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

  // Modal visibility control state
  const [isEditing, setIsEditing] = useState(false);

  // AI Tutor States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [tutorQuota, setTutorQuota] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadWorkspaceData = async () => {
    try {
      const { data: lessonData } = await api.get(`/lessons/${lessonId}`);
      if (lessonData) setCurrentLesson(lessonData);

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
      
      try {
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
        console.error("AI context loading skipped:", err);
      } finally {
        setLoading(false);
      }
    };

    if (lessonId) initPage();
  }, [lessonId, courseId, moduleId]);

  const getYouTubeEmbedId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoStreamTarget = currentLesson?.material_url || "";
  const currentType = currentLesson?.material_type?.toLowerCase() || "video";
  const isYouTubeMedia = videoStreamTarget.includes("youtube.com") || videoStreamTarget.includes("youtu.be");
  
  const hasAccessToEdit = role === "admin" || role === "administrator" || role === "teacher" || role === "instructor";

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
            <span>{currentLesson?.duration ? `${currentLesson.duration}min` : "45min"}</span>
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

      {/* DUAL COLUMN CONTAINER GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <div className="relative aspect-video w-full rounded-3xl overflow-hidden bg-slate-950 border border-slate-900 shadow-md flex items-center justify-center">
            {currentLesson?.material_type === "document" || currentLesson?.material_type === "pdf" ? (
              <div className="text-center p-12 bg-blue-100 rounded-3xl border border-slate-200 shadow-lg w-[85%] max-w-lg">
                <div className="mb-6 flex justify-center">
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Study Material</h3>
                <p className="text-sm text-slate-500 mb-8 px-4">
                  Access the lecture document in a secure reader or download it to your device.
                </p>
                
                <a 
                  href={videoStreamTarget} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full py-4 bg-slate-900 hover:bg-black text-white font-semibold rounded-xl transition-all"
                >
                  View or Download Document
                </a>
              </div>
            ) : isYouTubeMedia || currentType === "url" ? (
              getYouTubeEmbedId(videoStreamTarget) ? (
                <iframe
                  className="w-full h-full border-none"
                  src={`https://www.youtube.com/embed/${getYouTubeEmbedId(videoStreamTarget)}?autoplay=1`}
                  title="YouTube Video Core Streaming View"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="p-6 text-center text-white flex flex-col items-center gap-2">
                  <AlertCircle className="h-8 w-8 text-amber-400" />
                  <p className="text-xs font-bold">Invalid YouTube Stream link layout</p>
                  <p className="text-[10px] text-slate-400 font-mono max-w-xs truncate">{videoStreamTarget}</p>
                </div>
              )
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
                        {item.material_type || "video"}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* THE MODAL OVERLAY INJECTOR */}
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