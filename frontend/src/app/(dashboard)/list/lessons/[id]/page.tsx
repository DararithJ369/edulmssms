"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useDialog } from "@/hooks/DialogProvider";
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
  Circle,
  Save,
  X,
  FileCode,
  Globe,
  MessageSquare,
  Send,
  Trash2,
  Sparkles,
  Zap,
  Loader
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

const renderMarkdown = (text: string) => {
  if (!text) return "";
  
  // Escape HTML first to prevent XSS
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  
  const lines = html.split("\n");
  
  // Inline formatting helper
  function parseInlineMarkdown(str: string): string {
    // Bold: **text**
    str = str.replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-slate-900 dark:text-white">$1</strong>');
    
    // Italic: *text* (avoiding empty matches or lists)
    str = str.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
    
    // Inline code: `code`
    str = str.replace(/`(.*?)`/g, '<code class="bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded font-mono font-bold text-[#0038A8] dark:text-sky-400">$1</code>');
    
    return str;
  }

  const parsedLines = lines.map(line => {
    let trimmed = line.trim();
    
    // Blockquote
    if (trimmed.startsWith("&gt;")) {
      const quoteContent = parseInlineMarkdown(trimmed.slice(4).trim());
      return `<blockquote class="border-l-4 border-[#0038A8]/30 dark:border-sky-500/20 pl-3 my-2 italic text-slate-500 dark:text-slate-400 bg-[#0038A8]/5 dark:bg-sky-500/5 py-1 pr-2 rounded-r-lg">${quoteContent}</blockquote>`;
    }
    
    // Headings (H1 to H6)
    if (trimmed.startsWith("######")) {
      return `<h6 class="text-xs font-black text-slate-800 dark:text-slate-200 mt-3 mb-1">${parseInlineMarkdown(trimmed.slice(6).trim())}</h6>`;
    }
    if (trimmed.startsWith("#####")) {
      return `<h5 class="text-xs font-black text-slate-800 dark:text-slate-200 mt-3 mb-1">${parseInlineMarkdown(trimmed.slice(5).trim())}</h5>`;
    }
    if (trimmed.startsWith("####")) {
      return `<h4 class="text-sm font-black text-slate-800 dark:text-slate-200 mt-3 mb-1">${parseInlineMarkdown(trimmed.slice(4).trim())}</h4>`;
    }
    if (trimmed.startsWith("###")) {
      return `<h3 class="text-sm font-black text-slate-900 dark:text-white mt-3.5 mb-1">${parseInlineMarkdown(trimmed.slice(3).trim())}</h3>`;
    }
    if (trimmed.startsWith("##")) {
      return `<h2 class="text-base font-black text-slate-900 dark:text-white mt-4 mb-1.5">${parseInlineMarkdown(trimmed.slice(2).trim())}</h2>`;
    }
    if (trimmed.startsWith("#")) {
      return `<h1 class="text-lg font-black text-slate-900 dark:text-white mt-4 mb-2">${parseInlineMarkdown(trimmed.slice(1).trim())}</h1>`;
    }
    
    // Bullet list items
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const content = parseInlineMarkdown(trimmed.slice(2).trim());
      return `<li class="ml-4 list-disc pl-1 my-1">${content}</li>`;
    }
    
    // Numbered list items
    const numListMatch = trimmed.match(/^(\d+)\.\s(.*)/);
    if (numListMatch) {
      const num = numListMatch[1];
      const content = parseInlineMarkdown(numListMatch[2].trim());
      return `<li class="ml-4 list-decimal pl-1 my-1" value="${num}">${content}</li>`;
    }
    
    // Normal line
    return parseInlineMarkdown(line);
  });
  
  // Combine lines back and handle paragraphs or clean lists
  let output = "";
  let inList = false;
  let inNumList = false;
  
  for (let i = 0; i < parsedLines.length; i++) {
    const line = parsedLines[i];
    const isList = line.startsWith("<li class=\"ml-4 list-disc");
    const isNumList = line.startsWith("<li class=\"ml-4 list-decimal");
    
    if (isList && !inList) {
      output += `<ul class="my-2 space-y-1 list-inside">`;
      inList = true;
    } else if (!isList && inList) {
      output += `</ul>`;
      inList = false;
    }
    
    if (isNumList && !inNumList) {
      output += `<ol class="my-2 space-y-1 list-inside">`;
      inNumList = true;
    } else if (!isNumList && inNumList) {
      output += `</ol>`;
      inNumList = false;
    }
    
    if (line.trim() === "" && !inList && !inNumList) {
      output += `<div class="h-2"></div>`;
    } else {
      output += line;
      if (!isList && !isNumList && line.trim() !== "") {
        output += "<br />";
      }
    }
  }
  
  if (inList) output += "</ul>";
  if (inNumList) output += "</ol>";
  
  return output;
};


export default function SingleLessonPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const { confirm, alert } = useDialog();

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

  // AI Tutor States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [tutorQuota, setTutorQuota] = useState<{ quota_remaining: number; quota_limit: number } | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);

  // Lesson Progress States
  const [progress, setProgress] = useState<any | null>(null);
  const [mutating, setMutating] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUserId = localStorage.getItem("user_id");
      setUserId(storedUserId);
    }
  }, []);

  useEffect(() => {
    if (!userId || !id) return;

    const fetchUserProfileAndTutorDetails = async () => {
      try {
        const profileRes = await api.get(`/profiles/${userId}`);
        setUserProfile(profileRes.data);

        const historyRes = await api.get(`/lessons/${id}/tutor/history`);
        setChatMessages(historyRes.data || []);

        const quotaRes = await api.get(`/lessons/${id}/tutor/quota`);
        setTutorQuota(quotaRes.data);

        if (courseId) {
          const progRes = await api.get(`/progress/course/${courseId}`);
          setProgress(progRes.data);
        }
      } catch (err) {
        console.error("Error fetching tutor details:", err);
      }
    };

    fetchUserProfileAndTutorDetails();
  }, [userId, id, courseId]);

  const handleToggleLesson = async () => {
    if (!id || !courseId) return;
    try {
      setMutating(true);
      const currentlyCompleted = progress?.completed_lesson_ids?.includes(parseInt(id)) ?? false;
      const payload = { completed: !currentlyCompleted };

      const progRes = await api.post(`/progress/lesson/${id}`, payload);
      setProgress(progRes.data);
    } catch (err) {
      console.error("Failed to toggle completion status:", err);
    } finally {
      setMutating(false);
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, chatLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || !id) return;

    if (!textToSend) setInputText("");

    const tempUserMsg = {
      id: Date.now(),
      sender: "user",
      content: text,
      created_at: new Date().toISOString()
    };
    
    const tempAssistantMsgId = Date.now() + 1;

    setChatMessages(prev => [
      ...prev,
      tempUserMsg,
      {
        id: tempAssistantMsgId,
        sender: "assistant",
        content: "",
        created_at: new Date().toISOString()
      }
    ]);
    setChatLoading(true);

    try {
      const token = localStorage.getItem("access_token");
      const headers: HeadersInit = {
        "Content-Type": "application/json"
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const response = await fetch(`${API_URL}/lessons/${id}/tutor/chat/stream`, {
        method: "POST",
        headers,
        body: JSON.stringify({ prompt: text })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Failed to generate tutor response");
      }

      if (!response.body) {
        throw new Error("No response body stream available");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;

          const jsonStr = trimmed.replace(/^data:\s*/, "");
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.type === "content") {
              setChatLoading(false);
              setChatMessages(prev =>
                prev.map(m =>
                  m.id === tempAssistantMsgId
                    ? { ...m, content: m.content + parsed.delta }
                    : m
                )
              );
            } else if (parsed.type === "done") {
              setTutorQuota({
                quota_remaining: parsed.quota_remaining,
                quota_limit: parsed.quota_limit
              });
            }
          } catch (e) {
            console.error("Error parsing stream chunk:", e, jsonStr);
          }
        }
      }
    } catch (err: any) {
      console.error("Failed to chat with AI Tutor:", err);
      setChatMessages(prev =>
        prev.map(m =>
          m.id === tempAssistantMsgId
            ? { ...m, content: `❌ Error: ${err.message || "Could not connect to AI Tutor. Please try again."}` }
            : m
        )
      );
    } finally {
      setChatLoading(false);
    }
  };

  const handleClearHistory = async () => {
    const isConfirmed = await confirm({
      title: "Clear History",
      description: "Are you sure you want to clear your AI Tutor chat history for this lesson?",
      confirmText: "Clear",
      cancelText: "Cancel",
      variant: "destructive"
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/lessons/${id}/tutor/clear`);
      setChatMessages([]);
      const quotaRes = await api.get(`/lessons/${id}/tutor/quota`);
      setTutorQuota(quotaRes.data);
    } catch (err) {
      console.error("Failed to clear chat history:", err);
    }
  };

  const handleUpgradeToPremium = async () => {
    if (!userId) return;
    try {
      setUpgrading(true);
      const formData = new FormData();
      formData.append("tier", "premium");
      
      await api.put(`/profiles/${userId}`, formData);
      
      const profileRes = await api.get(`/profiles/${userId}`);
      setUserProfile(profileRes.data);
 
      const quotaRes = await api.get(`/lessons/${id}/tutor/quota`);
      setTutorQuota(quotaRes.data);
 
      await alert({
        title: "Upgrade Successful",
        description: "🎉 Congratulations! You have successfully upgraded to Premium. Enjoy unlimited AI Tutor access, mock quizzes, and lesson summaries!",
        okText: "Great!",
        variant: "success"
      });
    } catch (err) {
      console.error("Failed to upgrade student tier:", err);
      await alert({
        title: "Upgrade Failed",
        description: "Error upgrading subscription. Please check if backend is running.",
        okText: "OK",
        variant: "error"
      });
    } finally {
      setUpgrading(false);
    }
  };

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
      await alert({
        title: "Save Failed",
        description: "Error updating lesson details. Please make sure the backend server is running and you have sufficient permissions.",
        okText: "OK",
        variant: "error"
      });
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

          {!isEditing && role === "student" && courseId && (
            <button
              onClick={handleToggleLesson}
              disabled={mutating}
              className={`px-4 py-2 rounded-full text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-sm active:scale-[0.98] ${
                progress?.completed_lesson_ids?.includes(parseInt(id))
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30"
                  : "bg-[#0038A8] text-white hover:bg-[#002d80]"
              }`}
            >
              {progress?.completed_lesson_ids?.includes(parseInt(id)) ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Completed!</span>
                </>
              ) : (
                <>
                  <Circle className="h-4 w-4" />
                  <span>Mark Complete</span>
                </>
              )}
            </button>
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
                  <div className="mt-6 flex flex-wrap gap-3 justify-center">
                    <a
                      href={fileUrl || linkUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 bg-[#0038A8] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#002D86] transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open Material in New Tab
                    </a>

                    {role === "student" && courseId && (
                      <button
                        onClick={handleToggleLesson}
                        disabled={mutating}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-[0.98] ${
                          progress?.completed_lesson_ids?.includes(parseInt(id))
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/10"
                            : "bg-white border border-border text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                        }`}
                      >
                        {progress?.completed_lesson_ids?.includes(parseInt(id)) ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            <span>Completed!</span>
                          </>
                        ) : (
                          <>
                            <Circle className="w-4 h-4" />
                            <span>Mark as Completed</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
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

                {role === "student" && courseId && (
                  <button
                    onClick={handleToggleLesson}
                    disabled={mutating}
                    className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold hover:scale-[1.01] active:scale-[0.99] transition-all text-xs text-center shadow-sm ${
                      progress?.completed_lesson_ids?.includes(parseInt(id))
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/10"
                        : "bg-[#0038A8] hover:bg-[#002D86] text-white shadow-blue-500/10"
                    }`}
                  >
                    {progress?.completed_lesson_ids?.includes(parseInt(id)) ? (
                      <>
                        <CheckCircle className="w-4.5 h-4.5" />
                        <span>Completed!</span>
                      </>
                    ) : (
                      <>
                        <Circle className="w-4.5 h-4.5" />
                        <span>Mark as Completed</span>
                      </>
                    )}
                  </button>
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

    {/* FLOATING ACTION BUTTON */}

      <div className="fixed bottom-6 right-6 z-40">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsChatOpen(true)}
          className="w-14 h-14 bg-gradient-to-tr from-[#0038A8] to-[#1e40af] text-white rounded-full shadow-2xl flex items-center justify-center relative hover:shadow-[0_8px_30px_rgba(30,64,175,0.4)] transition-shadow group border border-[#0038A8]/20"
        >
          <Sparkles className="w-6 h-6 animate-pulse group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full border border-white">
            AI COACH
          </span>
        </motion.button>
      </div>

      {/* CHAT DRAWER PANEL */}
      <AnimatePresence>
        {isChatOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChatOpen(false)}
              className="fixed inset-0 bg-black/35 backdrop-blur-[2px] z-50"
            />

            {/* Panel drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full sm:w-[450px] bg-white dark:bg-[#1c1c1c] shadow-[0_0_50px_rgba(0,0,0,0.15)] z-[60] flex flex-col border-l border-border/60 text-foreground"
            >
              {/* Header */}
              <div className="p-4 border-b border-border/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#0038A8]/10 border border-[#0038A8]/20 flex items-center justify-center text-[#0038A8]">
                    <Sparkles className="w-4.5 h-4.5" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-1.5">
                      AI Learning Coach
                    </h3>
                    <span className="text-[10px] text-slate-400 font-bold block">
                      {userProfile?.tier === "premium" ? "Premium Unlimited" : "Standard Free Trial"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {chatMessages.length > 0 && (
                    <button
                      onClick={handleClearHistory}
                      title="Clear History"
                      className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setIsChatOpen(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages Workspace */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/20 dark:bg-[#121212]/20">
                {chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-6">
                    <div className="w-14 h-14 rounded-2xl bg-[#0038A8]/5 border border-[#0038A8]/10 flex items-center justify-center text-[#0038A8] shadow-inner">
                      <Sparkles className="w-7 h-7" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">
                        Ask your AI Coach anything
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed max-w-[260px] mx-auto">
                        Get instant summaries, core concepts, or practice mock exams based directly on this lesson content.
                      </p>
                    </div>

                    {/* Quick actions list */}
                    <div className="w-full space-y-2.5 pt-2">
                      <button
                        onClick={() => handleSendMessage("Summarize this lesson for me, highlighting the key concepts and bullet points.")}
                        className="w-full flex items-center gap-2 p-3 bg-white dark:bg-[#252525] border border-border/80 hover:border-[#0038A8]/40 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-2xl text-xs font-bold text-left transition-all shadow-sm"
                      >
                        📋 Summarize this Lesson
                      </button>
                      <button
                        onClick={() => handleSendMessage("Please explain the main concepts of this lesson in simple terms.")}
                        className="w-full flex items-center gap-2 p-3 bg-white dark:bg-[#252525] border border-border/80 hover:border-[#0038A8]/40 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-2xl text-xs font-bold text-left transition-all shadow-sm"
                      >
                        🧠 Explain Difficult Concepts
                      </button>
                      <button
                        onClick={() => handleSendMessage("Generate a short practice quiz with multiple choice questions based on this lesson.")}
                        className="w-full flex items-center gap-2 p-3 bg-white dark:bg-[#252525] border border-border/80 hover:border-[#0038A8]/40 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-2xl text-xs font-bold text-left transition-all shadow-sm"
                      >
                        📝 Generate Practice Quiz
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {chatMessages.map((msg, index) => {
                      if (msg.sender === "assistant" && !msg.content) return null;
                      return (
                        <div
                          key={msg.id || index}
                          className={`flex flex-col ${
                            msg.sender === "user" ? "items-end" : "items-start"
                          }`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-sm font-medium leading-relaxed ${
                              msg.sender === "user"
                                ? "bg-[#0038A8] text-white rounded-tr-none text-left"
                                : "bg-white dark:bg-[#252525] border border-border/60 text-slate-800 dark:text-slate-200 rounded-tl-none text-left"
                            }`}
                            {...(msg.sender === "assistant"
                              ? { dangerouslySetInnerHTML: { __html: renderMarkdown(msg.content) } }
                              : { children: msg.content })}
                          />

                          <span className="text-[9px] text-slate-400 font-semibold mt-1 px-1">
                            {msg.sender === "user" ? "You" : "AI Coach"}
                          </span>
                        </div>
                      );
                    })}
                    {chatLoading && (
                      <div className="flex flex-col items-start">
                        <div className="bg-white dark:bg-[#252525] border border-border/60 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-2">
                          <Loader className="w-3.5 h-3.5 animate-spin text-[#0038A8]" />
                          <span className="text-xs text-slate-400 font-bold select-none">Coach is thinking...</span>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input Area / Gating */}
              <div className="p-4 border-t border-border/50 bg-slate-50/50 dark:bg-slate-900/10">
                {tutorQuota && tutorQuota.quota_remaining <= 0 && userProfile?.tier !== "premium" ? (
                  /* GATING OVERLAY CARD */
                  <div className="bg-gradient-to-tr from-amber-50 to-amber-100/50 dark:from-[#2e2315] dark:to-[#1c1c1c] p-4 rounded-2xl border border-amber-200/50 dark:border-amber-900/30 text-left space-y-3.5 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                        <Zap className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-amber-900 dark:text-amber-400 uppercase tracking-wider">
                          Daily AI Quota Reached
                        </h4>
                        <p className="text-[10px] text-amber-800/80 dark:text-amber-500 font-bold">
                          Standard quota limited to 5 daily queries.
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                      Unlock your AI Learning Coach. Upgrade to Premium for unlimited queries, instant summaries, and practice quizzes based on your course syllabus.
                    </p>
                    <button
                      onClick={handleUpgradeToPremium}
                      disabled={upgrading}
                      className="w-full bg-[#0038A8] hover:bg-[#002D86] text-white text-xs font-black py-3 rounded-xl transition-all shadow-md active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5 fill-white text-white" />
                      {upgrading ? "Upgrading..." : "Upgrade to Premium ($5/mo)"}
                    </button>
                  </div>
                ) : (
                  /* NORMAL INPUT */
                  <div className="space-y-3">
                    {/* Quick actions inside history if there is any */}
                    {chatMessages.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                        <button
                          onClick={() => handleSendMessage("Summarize this lesson.")}
                          className="shrink-0 px-3 py-1.5 bg-white dark:bg-[#252525] border border-border/80 hover:border-[#0038A8]/30 rounded-full text-[10px] font-bold transition-all"
                        >
                          📋 Summary
                        </button>
                        <button
                          onClick={() => handleSendMessage("Explain main concepts.")}
                          className="shrink-0 px-3 py-1.5 bg-white dark:bg-[#252525] border border-border/80 hover:border-[#0038A8]/30 rounded-full text-[10px] font-bold transition-all"
                        >
                          🧠 Explain Concepts
                        </button>
                        <button
                          onClick={() => handleSendMessage("Generate quiz.")}
                          className="shrink-0 px-3 py-1.5 bg-white dark:bg-[#252525] border border-border/80 hover:border-[#0038A8]/30 rounded-full text-[10px] font-bold transition-all"
                        >
                          📝 Practice Quiz
                        </button>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !chatLoading) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder="Ask a question about this lesson..."
                        disabled={chatLoading}
                        className="flex-1 px-3.5 py-2.5 bg-white dark:bg-[#252525] border border-border/80 focus:border-[#0038A8]/40 focus:ring-2 focus:ring-[#0038A8]/10 rounded-xl text-xs font-semibold focus:outline-none transition-all placeholder:text-slate-400 shadow-inner"
                      />
                      <button
                        onClick={() => handleSendMessage()}
                        disabled={chatLoading || !inputText.trim()}
                        className="w-10 h-10 bg-[#0038A8] hover:bg-[#002D86] text-white rounded-xl flex items-center justify-center shrink-0 disabled:opacity-40 transition-all shadow-md"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Quota label */}
                    <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold px-1 select-none">
                      <span>
                        {tutorQuota?.quota_limit === 9999
                          ? "✨ Premium Unlimited AI Access"
                          : `${tutorQuota?.quota_remaining ?? 5} of ${tutorQuota?.quota_limit ?? 5} daily messages remaining`}
                      </span>
                      {userProfile?.tier !== "premium" && (
                        <button
                          onClick={handleUpgradeToPremium}
                          className="text-[#0038A8] hover:underline flex items-center gap-0.5"
                        >
                          <Zap className="w-2.5 h-2.5 fill-[#0038A8]" />
                          Upgrade for unlimited
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}