"use client";
 
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { cn } from "@/lib/ui";
import { 
  Globe, BookOpen, Video, FileText, CheckCircle, Circle, 
  ChevronDown, ChevronUp, Download, Play, GraduationCap, Clock, Award, CheckSquare
} from "lucide-react";

type Lesson = {
  id: number;
  title: string;
  content?: string;
  duration?: string;
  material_type?: string;
  material_url?: string;
  material_file?: string;
  order: number;
};

type Module = {
  id: number;
  title: string;
  lessons: Lesson[];
};

type Course = {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  credits: number;
  specialisation: string;
  modules: Module[];
};

type Progress = {
  progress_percentage: number;
  completed_lessons_count: number;
  total_lessons_count: number;
  completed_modules_count: number;
  total_modules_count: number;
  completed_lesson_ids: number[];
  completed_module_ids: number[];
};

export default function CourseLearnHub({ params }: { params: { id: string } }) {
  const courseId = parseInt(params.id);
  const searchParams = useSearchParams();
  const lessonIdParam = searchParams.get("lessonId");
  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [streak, setStreak] = useState<any | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutating, setMutating] = useState<number | null>(null);

  // Video and watch notes states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [activeTab, setActiveTab] = useState<"content" | "notes">("content");

  // Quiz-taking states
  const [activeQuiz, setActiveQuiz] = useState<any | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizResult, setQuizResult] = useState<any | null>(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizMessage, setQuizMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Helper to obtain cookies dynamically
  const getAccessToken = () => {
    if (typeof window === "undefined") return "";
    const match = document.cookie.match(new RegExp('(^| )access_token=([^;]+)'));
    if (match) return match[2];
    const tokenMatch = document.cookie.match(new RegExp('(^| )token=([^;]+)'));
    return tokenMatch ? tokenMatch[2] : "";
  };

  const getHeaders = () => {
    const token = getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

  const loadData = async () => {
    try {
      setLoading(true);

      // Fetch course details
      const courseRes = await api.get(`/courses/${courseId}`);
      setCourse(courseRes.data);

      // Fetch modules outlines
      const modulesRes = await api.get(`/courses/${courseId}/modules`);
      const modulesData = modulesRes.data || [];

      // Fetch dynamic progress
      const progRes = await api.get(`/progress/course/${courseId}`);
      setProgress(progRes.data);

      try {
        const streakRes = await api.get("/progress/streak");
        setStreak(streakRes.data);
      } catch (err) {
        console.error("Failed to load streak details:", err);
      }

      if (courseRes.data) {
        if (lessonIdParam) {
          const targetLessonId = parseInt(lessonIdParam);
          let found = false;
          
          for (const mod of modulesData) {
            const matchingLesson = mod.lessons?.find((l: any) => l.id === targetLessonId);
            if (matchingLesson) {
              setExpandedModules({ [mod.id]: true });
              setActiveLesson(matchingLesson);
              found = true;
              break;
            }
          }
          
          if (!found && modulesData.length > 0) {
            setExpandedModules({ [modulesData[0].id]: true });
            if (modulesData[0].lessons?.length > 0) {
              setActiveLesson(modulesData[0].lessons[0]);
            }
          }
        } else {
          // Expand the first module by default
          if (modulesData.length > 0) {
            setExpandedModules({ [modulesData[0].id]: true });
            if (modulesData[0].lessons?.length > 0) {
              setActiveLesson(modulesData[0].lessons[0]);
            }
          }
        }
      }
      setLoading(false);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load learning data. Please make sure you are signed in and the API is running.");
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [courseId]);

  useEffect(() => {
    if (!activeLesson) return;
    
    // Clear quiz states
    setActiveQuiz(null);
    setQuizAnswers({});
    setQuizResult(null);
    setQuizMessage(null);

    const checkQuiz = async () => {
      try {
        const quizzesRes = await api.get(`/quizzes?limit=100`);
        const list = quizzesRes.data?.data || [];
        const foundQuiz = list.find((q: any) => q.lesson_id === activeLesson.id);
        
        if (foundQuiz) {
          const detailedRes = await api.get(`/quizzes/${foundQuiz.id}`);
          setActiveQuiz(detailedRes.data);
          
          // Check if there is already a result
          const resultsRes = await api.get(`/results?limit=1000`);
          const userResult = (resultsRes.data || []).find((r: any) => r.quiz_id === foundQuiz.id);
          if (userResult) {
            setQuizResult(userResult);
          }
        }
      } catch (err) {
        console.error("Failed to check quiz for lesson:", err);
      }
    };
    
    checkQuiz();
  }, [activeLesson]);

  // Video progress, watch notes, and view-recording helper effects
  useEffect(() => {
    if (!activeLesson) return;
    
    const isVideo = activeLesson.material_type?.toLowerCase() === "video";
    if (isVideo) {
      // Fetch progress
      api.get(`/lessons/${activeLesson.id}/video/progress`)
        .then(({ data }) => {
          if (data && videoRef.current) {
            if (data.current_time > 0) {
              videoRef.current.currentTime = data.current_time;
            }
          }
        })
        .catch(console.error);

      // Fetch watch notes
      api.get(`/lessons/${activeLesson.id}/video/notes`)
        .then(({ data }) => {
          setNotes(data || []);
        })
        .catch(console.error);

      // Record lesson view
      api.post(`/lessons/${activeLesson.id}/view`).catch(console.error);
    }
  }, [activeLesson]);

  const handleTimeUpdate = async () => {
    if (!videoRef.current || !activeLesson) return;
    const currentTime = videoRef.current.currentTime;
    const duration = videoRef.current.duration || 0;

    const lastSaved = (videoRef.current as any).lastSavedTime || 0;
    if (Math.abs(currentTime - lastSaved) >= 5) {
      (videoRef.current as any).lastSavedTime = currentTime;
      try {
        await api.post(`/lessons/${activeLesson.id}/video/progress`, {
          current_time: currentTime,
          duration: duration
        });
      } catch (err) {
        console.error("Failed to sync video progress:", err);
      }
    }
  };

  const handleVideoPause = async () => {
    if (!videoRef.current || !activeLesson) return;
    const currentTime = videoRef.current.currentTime;
    const duration = videoRef.current.duration || 0;
    try {
      await api.post(`/lessons/${activeLesson.id}/video/progress`, {
        current_time: currentTime,
        duration: duration
      });
      // Refresh course progress aggregate
      const progRes = await api.get(`/progress/course/${courseId}`);
      setProgress(progRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim() || !activeLesson) return;
    
    const timestamp = videoRef.current ? videoRef.current.currentTime : 0;
    
    try {
      const { data } = await api.post(`/lessons/${activeLesson.id}/video/notes`, {
        timestamp: timestamp,
        content: newNoteContent
      });
      
      setNotes(prev => [...prev, data.data].sort((a, b) => a.timestamp - b.timestamp));
      setNewNoteContent("");
    } catch (err) {
      console.error("Failed to add watch note", err);
    }
  };

  const handleSeekTo = (timestamp: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
      videoRef.current.play().catch(() => {});
    }
  };

  const changeSpeed = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
    }
  };

  const togglePip = async () => {
    if (videoRef.current) {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await videoRef.current.requestPictureInPicture();
        }
      } catch (e) {
        console.error("PiP not supported or failed:", e);
      }
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleSubmitQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuiz) return;
    
    const unansweredCount = activeQuiz.questions.length - Object.keys(quizAnswers).length;
    if (unansweredCount > 0) {
      setQuizMessage({ type: "error", text: `Please answer all questions before submitting. (${unansweredCount} remaining)` });
      return;
    }
    
    try {
      setSubmittingQuiz(true);
      setQuizMessage(null);
      const payload = { answers: quizAnswers };
      
      const res = await api.post(`/quizzes/${activeQuiz.id}/submit`, payload);
      setQuizResult(res.data);
      setQuizMessage({ type: "success", text: `Quiz submitted successfully! You scored ${res.data.score}% (${res.data.grade}).` });
      
      // Refresh progress to reflect new completions
      const progRes = await api.get(`/progress/course/${courseId}`);
      setProgress(progRes.data);
      try {
        const streakRes = await api.get("/progress/streak");
        setStreak(streakRes.data);
      } catch (err) {
        console.warn("Failed to refresh streak data:", err);
      }
      setSubmittingQuiz(false);
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.detail || "Failed to submit quiz attempt.";
      setQuizMessage({ type: "error", text: errMsg });
      setSubmittingQuiz(false);
    }
  };

  const toggleModuleAccordion = (modId: number) => {
    setExpandedModules(prev => ({
      ...prev,
      [modId]: !prev[modId]
    }));
  };

  const handleToggleLesson = async (lessonId: number, currentlyCompleted: boolean) => {
    try {
      setMutating(lessonId);
      const payload = { completed: !currentlyCompleted };

      const progRes = await api.post(`/progress/lesson/${lessonId}`, payload);
      setProgress(progRes.data);
      try {
        const streakRes = await api.get("/progress/streak");
        setStreak(streakRes.data);
      } catch (err) {
        console.warn("Failed to refresh streak data:", err);
      }
      setMutating(null);
    } catch (err) {
      console.error("Failed to toggle completion status:", err);
      setMutating(null);
    }
  };

  const handleToggleModule = async (moduleId: number, currentlyCompleted: boolean) => {
    try {
      setMutating(moduleId);
      const payload = { completed: !currentlyCompleted };

      const progRes = await api.post(`/progress/module/${moduleId}`, payload);
      setProgress(progRes.data);
      try {
        const streakRes = await api.get("/progress/streak");
        setStreak(streakRes.data);
      } catch (err) {
        console.warn("Failed to refresh streak data:", err);
      }
      setMutating(null);
    } catch (err) {
      console.error("Failed to toggle completion status:", err);
      setMutating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F7F8FA] flex-col gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0038A8]"></div>
        <p className="text-sm font-semibold text-muted-foreground">Loading interactive learning workspace...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 text-red-800 rounded-xl m-6 flex flex-col gap-3 max-w-xl mx-auto">
        <GraduationCap className="h-10 w-10 text-red-600" />
        <h1 className="text-xl font-bold">Unable to Load Learn Hub</h1>
        <p className="text-sm">{error || "The requested course could not be found."}</p>
        <Link href="/list/courses" className="mt-2 text-sm font-bold text-blue-600 underline hover:text-blue-800">
          Return to Course Catalog
        </Link>
      </div>
    );
  }

  // Get active modules list from course or custom map
  const modules = course.modules || [];
  const progressPercentage = progress?.progress_percentage ?? 0;

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen relative font-sans text-left">
      {/* MOODLE BREADCRUMB */}
      <div className="flex items-center gap-1 text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider mb-2 select-none">
        <Link href="/" className="hover:text-foreground flex items-center gap-1">
          <Globe className="h-3 w-3" />
          Home
        </Link>
        <span>/</span>
        <Link href="/list/courses" className="hover:text-foreground">
          My Courses
        </Link>
        <span>/</span>
        <Link href={`/list/courses/${courseId}`} className="hover:text-foreground">
          {course.title}
        </Link>
        <span>/</span>
        <span className="text-foreground">Learn Hub</span>
      </div>

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none mb-6">
        <div>
          <span className="text-xs font-extrabold text-[#0038A8] uppercase tracking-wider font-mono">
            {course.specialisation || "ACADEMIC DEPARTMENT"} • {course.difficulty || "INTRODUCTORY"}
          </span>
          <h1 className="text-xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-tight mt-0.5">
            {course.title} Learn Workspace
          </h1>
        </div>

        <Link href={`/list/courses/${courseId}`}>
          <button className="px-4 py-2 bg-white border border-border text-foreground hover:bg-muted font-extrabold text-xs rounded-xl shadow-sm transition-all active:scale-[0.98]">
            View Course Home
          </button>
        </Link>
      </div>

      {/* WORKSPACE CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: ACTIVE LECTURE & LESSON PLAYER */}
        <div className="lg:col-span-2 space-y-6">
          {activeLesson ? (
            <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
              {/* VIDEO FRAME OR MEDIA BANNER */}
              {activeLesson.material_type?.toLowerCase() === "video" ? (
                <div className="relative w-full aspect-video bg-black flex flex-col justify-center items-center group">
                  {activeLesson.material_file ? (
                    <video
                      ref={videoRef}
                      src={`${API_URL}/lessons/${activeLesson.id}/video/stream?token=${getAccessToken()}`}
                      controls
                      onTimeUpdate={handleTimeUpdate}
                      onPause={handleVideoPause}
                      onEnded={handleVideoPause}
                      className="w-full h-full object-contain"
                    />
                  ) : activeLesson.material_url ? (
                    activeLesson.material_url.includes("youtube.com") || activeLesson.material_url.includes("youtu.be") ? (
                      <iframe
                        src={activeLesson.material_url.replace("watch?v=", "embed/")}
                        className="absolute inset-0 w-full h-full border-0"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        ref={videoRef}
                        src={activeLesson.material_url}
                        controls
                        onTimeUpdate={handleTimeUpdate}
                        onPause={handleVideoPause}
                        onEnded={handleVideoPause}
                        className="w-full h-full object-contain"
                      />
                    )
                  ) : (
                    <div className="text-white text-xs">No video source found</div>
                  )}
                  
                  {/* Custom Speed & PiP control panel */}
                  {(activeLesson.material_file || (activeLesson.material_url && !activeLesson.material_url.includes("youtube.com") && !activeLesson.material_url.includes("youtu.be"))) && (
                    <div className="flex items-center justify-between w-full p-3 bg-slate-900 text-white text-xs select-none">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-400">Speed:</span>
                        <div className="flex gap-1">
                          {[0.5, 1.0, 1.25, 1.5, 2.0].map((speed) => (
                            <button
                              key={speed}
                              onClick={() => changeSpeed(speed)}
                              className={cn(
                                "px-2 py-0.5 rounded transition-all font-mono",
                                playbackSpeed === speed ? "bg-[#0038A8] text-white font-bold" : "hover:bg-slate-800 text-slate-300"
                              )}
                            >
                              {speed}x
                            </button>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={togglePip}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 font-bold rounded-lg transition-all"
                      >
                        Picture-in-Picture
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-40 bg-gradient-to-r from-indigo-550 to-indigo-650 p-6 flex flex-col justify-end text-white select-none">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white/80">
                    <BookOpen className="h-4 w-4" />
                    Lecture Workspace
                  </div>
                  <h2 className="text-2xl font-black mt-1 leading-tight">{activeLesson.title}</h2>
                </div>
              )}

              {/* TABS SELECTOR */}
              <div className="border-b border-border flex bg-muted/20 select-none">
                <button
                  onClick={() => setActiveTab("content")}
                  className={cn(
                    "px-6 py-3 text-xs font-bold transition-all border-b-2",
                    activeTab === "content" ? "border-[#0038A8] text-[#0038A8]" : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  Lecture Content
                </button>
                <button
                  onClick={() => setActiveTab("notes")}
                  className={cn(
                    "px-6 py-3 text-xs font-bold transition-all border-b-2",
                    activeTab === "notes" ? "border-[#0038A8] text-[#0038A8]" : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  Watch Notes ({notes.length})
                </button>
              </div>

              {/* LECTURE DESCRIPTION, QUIZZES, OR NOTES */}
              <div className="p-6 space-y-6 text-left">
                {/* Header details */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{activeLesson.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 select-none">
                      <Clock className="h-3.5 w-3.5" />
                      Duration: {activeLesson.duration || "45min"}
                    </p>
                  </div>

                  <button
                    onClick={() => handleToggleLesson(activeLesson.id, progress?.completed_lesson_ids.includes(activeLesson.id) ?? false)}
                    disabled={mutating !== null}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-sm active:scale-[0.98] ${
                      progress?.completed_lesson_ids.includes(activeLesson.id)
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                        : "bg-[#0038A8] text-white hover:bg-[#002e8c]"
                    }`}
                  >
                    {progress?.completed_lesson_ids.includes(activeLesson.id) ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span>Completed!</span>
                      </>
                    ) : (
                      <>
                        <Circle className="h-4 w-4" />
                        <span>Mark as Completed</span>
                      </>
                    )}
                  </button>
                </div>

                {activeTab === "content" ? (
                  <div className="space-y-6">
                    {/* Quiz or standard body notes */}
                    {activeQuiz ? (
                      <div className="space-y-6">
                        {quizMessage && (
                          <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${
                            quizMessage.type === "success" 
                              ? "bg-emerald-50 border border-emerald-200 text-emerald-800" 
                              : "bg-red-50 border border-red-200 text-red-800"
                          }`}>
                            <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                            <span>{quizMessage.text}</span>
                          </div>
                        )}

                        {quizResult ? (
                          /* ALREADY SUBMITTED VIEW */
                          <div className="p-6 bg-gradient-to-br from-indigo-550/5 to-indigo-650/5 border border-indigo-250/20 dark:border-indigo-950/50 rounded-2xl space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-[10px] font-black text-[#0038A8] dark:text-blue-400 uppercase tracking-widest block">
                                  Evaluation Report
                                </span>
                                <h4 className="text-lg font-black text-gray-900 dark:text-white mt-1">Quiz Attempt Completed</h4>
                              </div>
                              <span className="text-3xl font-black text-[#0038A8] dark:text-blue-400">
                                {quizResult.score}%
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-2 text-[10px] font-extrabold select-none">
                              <span className={`px-2.5 py-0.5 rounded-full ${
                                quizResult.is_passed
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                  : "bg-red-50 text-red-700 border border-red-100"
                              }`}>
                                Grade: {quizResult.grade} • {quizResult.is_passed ? "PASSED" : "FAILED"}
                              </span>
                              <span className="bg-white dark:bg-[#1a1a20] text-muted-foreground border border-border px-2.5 py-0.5 rounded-full font-mono">
                                Submitted: {new Date(quizResult.graded_at).toLocaleDateString("en-GB")}
                              </span>
                            </div>

                            {quizResult.feedback && (
                              <div className="space-y-1.5 border-t border-indigo-200/45 pt-3">
                                <h5 className="text-xs font-black text-foreground">Instructor Remarks</h5>
                                <p className="text-xs text-muted-foreground leading-relaxed font-sans bg-white/70 dark:bg-card p-3 rounded-lg border border-indigo-200/30">
                                  {quizResult.feedback}
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* ACTIVE QUIZ FORM */
                          <form onSubmit={handleSubmitQuiz} className="space-y-6">
                            <div className="p-4 bg-[#0038A8]/5 border border-[#0038A8]/10 rounded-xl">
                              <span className="text-[10px] font-black text-[#0038A8] dark:text-blue-400 uppercase tracking-widest block mb-1">
                                Quiz Overview
                              </span>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {activeQuiz.description || "Answer all multiple-choice questions below. Tapping submit instantly records your score in the student gradebook."}
                              </p>
                            </div>

                            <div className="space-y-6">
                              {activeQuiz.questions?.map((q: any, qIdx: number) => (
                                <div key={q.id} className="p-5 border border-border/80 bg-white dark:bg-[#15151b] rounded-2xl space-y-3 shadow-sm text-left">
                                  <h4 className="text-sm font-extrabold text-foreground leading-snug">
                                    <span className="text-[#0038A8] dark:text-blue-400 font-black mr-1 font-mono">Q{qIdx + 1}.</span>
                                    {q.question_text}
                                  </h4>

                                  <div className="flex flex-col gap-2.5">
                                    {q.options?.map((opt: any) => {
                                      const isSelected = quizAnswers[q.id] === opt.id;
                                      return (
                                        <div
                                          key={opt.id}
                                          onClick={() => setQuizAnswers(prev => ({ ...prev, [q.id]: opt.id }))}
                                          className={`flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer select-none ${
                                            isSelected
                                              ? "bg-indigo-50/50 dark:bg-blue-500/10 border-indigo-500 text-indigo-755 dark:text-blue-300 shadow-sm"
                                              : "hover:bg-muted/40 border-border/60 text-foreground"
                                          }`}
                                        >
                                          <span>{opt.option_text}</span>
                                          <div className={`h-4.5 w-4.5 rounded-full border shrink-0 transition-all flex items-center justify-center ${
                                            isSelected
                                              ? "border-indigo-650 bg-[#0038A8] text-white"
                                              : "border-muted-foreground/30 bg-background"
                                          }`}>
                                            {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>

                            <button
                              type="submit"
                              disabled={submittingQuiz}
                              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-muted text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-[0.98]"
                            >
                              {submittingQuiz ? "Evaluating Answers..." : "Submit Quiz Attempt"}
                            </button>
                          </form>
                        )}
                      </div>
                    ) : (
                      /* Standard lecture description body notes */
                      <>
                        <div className="text-sm leading-relaxed text-muted-foreground font-sans whitespace-pre-wrap">
                          {activeLesson.content || "No detailed curriculum notes added for this lecture. Please download handbooks or reference attachments below."}
                        </div>

                        {/* Handbooks / Lecture Materials Download Area */}
                        {(activeLesson.material_file || activeLesson.material_url) && (
                          <div className="bg-muted/40 border border-border/60 rounded-xl p-4 space-y-3">
                            <h4 className="text-xs font-black text-foreground uppercase tracking-wider select-none">
                              Lecture Attachments & Handbooks
                            </h4>
                            <div className="flex flex-col gap-2">
                              {activeLesson.material_file && (
                                <a
                                  href={activeLesson.material_file}
                                  download
                                  className="flex items-center justify-between p-2.5 bg-white dark:bg-card border border-border hover:bg-accent rounded-lg text-xs font-semibold text-foreground transition-all"
                                >
                                  <span className="flex items-center gap-2 truncate">
                                    <FileText className="h-4 w-4 text-rose-600 shrink-0" />
                                    <span className="truncate">Official Syllabus Material & PDFs</span>
                                  </span>
                                  <Download className="h-4 w-4 text-muted-foreground shrink-0" />
                                </a>
                              )}
                              {activeLesson.material_url && (
                                <a
                                  href={activeLesson.material_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center justify-between p-2.5 bg-white dark:bg-card border border-border hover:bg-accent rounded-lg text-xs font-semibold text-foreground transition-all"
                                >
                                  <span className="flex items-center gap-2 truncate">
                                    {activeLesson.material_type?.toLowerCase() === "video" ? (
                                      <Video className="h-4 w-4 text-blue-650 shrink-0" />
                                    ) : (
                                      <Globe className="h-4 w-4 text-[#0038A8] shrink-0" />
                                    )}
                                    <span className="truncate">External Video/Handbook Resource</span>
                                  </span>
                                  <Play className="h-4 w-4 text-muted-foreground shrink-0" />
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  /* Watch Notes Sidebar Panel */
                  <div className="space-y-6">
                    <form onSubmit={handleAddNote} className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Type your watch note here..."
                          value={newNoteContent}
                          onChange={(e) => setNewNoteContent(e.target.value)}
                          className="flex-1 px-4 py-2 border border-border/80 bg-background text-foreground rounded-xl text-xs outline-none focus:ring-1 focus:ring-[#0038A8]"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-[#0038A8] hover:bg-[#002e8c] text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-[0.98]"
                        >
                          Add Note
                        </button>
                      </div>
                      <span className="text-[10px] text-muted-foreground block font-mono">
                        Current Timestamp: {videoRef.current ? formatTime(videoRef.current.currentTime) : "00:00"}
                      </span>
                    </form>

                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                      {notes.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-4 text-center">No watch notes added yet. Take notes as you watch the lecture!</p>
                      ) : (
                        notes.map((note) => (
                          <div 
                            key={note.id}
                            className="flex items-start gap-3 p-3 border border-border/60 bg-card dark:bg-[#15151b] rounded-xl select-none"
                          >
                            <button
                              onClick={() => handleSeekTo(note.timestamp)}
                              className="px-2.5 py-1 bg-[#0038A8]/10 hover:bg-[#0038A8]/20 text-[#0038A8] dark:text-blue-400 font-mono text-[10px] font-bold rounded-lg shrink-0"
                              title="Click to seek video"
                            >
                              {formatTime(note.timestamp)}
                            </button>
                            <p className="text-xs text-foreground mt-0.5 leading-relaxed font-sans">{note.content}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-card text-card-foreground border border-border rounded-2xl p-12 text-center text-muted-foreground shadow-sm">
              <BookOpen className="h-12 w-12 text-muted-foreground/60 mx-auto mb-3" />
              <h3 className="font-bold text-lg">No Lecture Selected</h3>
              <p className="text-sm mt-1">Please select an outline topic and click a lesson from the outline sidebar.</p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: MODULES OUTLINE & PROGRESS GAUGES */}
        <div className="space-y-6">
          {/* COMPLETION GAUGE CARD */}
          <div className="bg-white border border-border p-6 rounded-2xl shadow-sm text-left select-none relative overflow-hidden">
            <div className="absolute right-[-20px] top-[-20px] opacity-[0.03]">
              <Award className="h-32 w-32 text-indigo-950" />
            </div>

            <span className="text-[10px] font-black text-indigo-650 uppercase tracking-widest block mb-1">
              Course Statistics
            </span>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-gray-900 leading-none">Learning Progress</h3>
              {streak && streak.current_streak > 0 && (
                <div 
                  className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 text-orange-600 rounded-full text-[10px] font-black tracking-tight hover:scale-105 transition-all duration-200 cursor-help"
                  title={`Longest streak: ${streak.longest_streak} days`}
                >
                  <span>🔥</span>
                  <span>{streak.current_streak} Day Streak!</span>
                </div>
              )}
            </div>

            {/* Circular Gauge or Progress Bar */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black text-[#0038A8]">{progressPercentage}%</span>
                <span className="text-xs font-bold text-muted-foreground">
                  {progress?.completed_lessons_count} / {progress?.total_lessons_count} Lessons
                </span>
              </div>
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden border border-border/40">
                <div
                  className="h-full bg-gradient-to-r from-[#0038A8] to-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground leading-normal">
                Complete modules and watch video lectures to raise your overall gradebook syllabus marks.
              </p>
            </div>
          </div>

          {/* COURSE MODULES ACCORDION OUTLINE */}
          <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col text-left">
            <div className="p-4 border-b border-border bg-muted/40 select-none">
              <h3 className="font-bold text-sm text-foreground">Course Topic Outlines</h3>
            </div>

            <div className="divide-y divide-border/60">
              {modules.map((mod: Module) => {
                const isExpanded = !!expandedModules[mod.id];
                const isModuleCompleted = progress?.completed_module_ids.includes(mod.id) ?? false;

                return (
                  <div key={mod.id} className="flex flex-col">
                    {/* Module Accordion Header */}
                    <div className="flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/40 transition-all select-none cursor-pointer">
                      <div 
                        className="flex items-center gap-2 font-bold text-xs text-foreground shrink truncate pr-2"
                        onClick={() => toggleModuleAccordion(mod.id)}
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        <span className="truncate">{mod.title}</span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleModule(mod.id, isModuleCompleted);
                        }}
                        disabled={mutating !== null}
                        className={`p-1 rounded-md shrink-0 transition-all ${
                          isModuleCompleted 
                            ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" 
                            : "bg-muted text-muted-foreground hover:bg-border"
                        }`}
                        title={isModuleCompleted ? "Mark module incomplete" : "Mark module completed"}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Nested Lessons Accordion Body */}
                    {isExpanded && (
                      <div className="bg-white dark:bg-card px-2 py-1 flex flex-col divide-y divide-border/30">
                        {mod.lessons?.length > 0 ? (
                          mod.lessons.map((l: Lesson) => {
                            const isLessonCompleted = progress?.completed_lesson_ids.includes(l.id) ?? false;
                            const isActive = activeLesson?.id === l.id;

                            return (
                              <div
                                key={l.id}
                                className={`flex items-center justify-between p-3 rounded-lg text-xs font-semibold select-none transition-all cursor-pointer ${
                                  isActive 
                                    ? "bg-lamaSkyLight/40 text-[#0038A8] border-l-4 border-[#0038A8]" 
                                    : "hover:bg-muted/50 text-foreground"
                                }`}
                                onClick={() => setActiveLesson(l)}
                              >
                                <span className="flex items-center gap-2 truncate pr-2">
                                  {l.material_type?.toLowerCase() === "video" ? (
                                    <Video className="h-4 w-4 text-blue-500 shrink-0" />
                                  ) : l.material_type?.toLowerCase() === "interactive quiz" || l.material_type?.toLowerCase() === "quiz" ? (
                                    <CheckSquare className="h-4 w-4 text-rose-500 shrink-0" />
                                  ) : (
                                    <BookOpen className="h-4 w-4 text-[#0038A8] shrink-0" />
                                  )}
                                  <span className="truncate">{l.title}</span>
                                </span>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleLesson(l.id, isLessonCompleted);
                                  }}
                                  disabled={mutating !== null}
                                  className={`p-0.5 rounded transition-all shrink-0 ${
                                    isLessonCompleted ? "text-emerald-600" : "text-muted-foreground/40 hover:text-emerald-500"
                                  }`}
                                >
                                  {isLessonCompleted ? (
                                    <CheckCircle className="h-4 w-4 fill-emerald-50" />
                                  ) : (
                                    <Circle className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-3 text-center text-xs text-muted-foreground font-medium select-none">
                            No lessons listed in this topic outline.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
