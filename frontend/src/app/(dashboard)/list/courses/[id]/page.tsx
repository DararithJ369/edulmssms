"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import BackButton from "@/components/BackButton";
import FormModal from "@/components/FormModal";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Layers,
  Edit,
  MessageSquare,
  Globe,
  CheckSquare,
  Users,
  User,
  BarChart2,
  FileUp,
  FileText,
  ExternalLink,
  Download,
  Pencil,
  Check,
  X,
  ClipboardList,
  Info,
  Settings,
  CheckCircle,
  AlertCircle,
  Award,
} from "lucide-react";
import { api } from "@/lib/api";
import { getImageUrl, getCourseThumbnail } from "@/lib/image-url";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ── Grade utilities ────────────────────────────────────────────────────────
function gradePillClass(grade: string | null | undefined) {
  switch ((grade || "").toUpperCase()) {
    case "A": return "bg-slate-100 text-slate-800 border-slate-300";
    case "B": return "bg-slate-100 text-slate-700 border-slate-300";
    case "C": return "bg-slate-50 text-slate-600 border-slate-200";
    case "D": return "bg-slate-50 text-slate-500 border-slate-200";
    case "E": return "bg-slate-50 text-slate-500 border-slate-200";
    case "F": return "bg-slate-50 text-slate-400 border-slate-200";
    default:  return "bg-muted text-muted-foreground border-border";
  }
}

function statusBadge(status: string) {
  switch (status) {
    case "graded":
      return "bg-slate-100 text-slate-700 border-slate-300";
    case "submitted":
      return "bg-slate-50 text-slate-600 border-slate-200";
    case "late":
      return "bg-slate-50 text-slate-500 border-slate-200";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function exportCSV(grades: any[], courseName: string) {
  const headers = ["Student", "Assessment", "Score", "Total", "Percentage", "Grade", "Status", "Feedback"];
  const rows = grades.map((g) => [
    g.student_name || "",
    g.assessment_title || "",
    g.score ?? "",
    g.total_marks ?? "",
    g.percentage != null ? `${g.percentage.toFixed(1)}%` : "",
    g.grade || "",
    g.is_passed ? "Passed" : "Failed",
    (g.feedback || "").replace(/,/g, ";"),
  ]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${courseName.replace(/\s+/g, "_")}_grades.csv`;
  a.click();
}

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const courseId = params.id as string;
  const activeModuleIdParam = searchParams.get("expandedModuleId");

  const tabParam = searchParams.get("tab") as "course" | "participants" | "grades" | "submissions" | "analytics" | null;
  const [activeTab, setActiveTab] = useState<"course" | "participants" | "grades" | "submissions" | "analytics">(
    tabParam && ["course", "participants", "grades", "submissions", "analytics"].includes(tabParam) ? tabParam : "course"
  );
  const [role, setRole] = useState<string>("");

  useEffect(() => {
    const currentTab = searchParams.get("tab") as "course" | "participants" | "grades" | "submissions" | "analytics" | null;
    if (currentTab && ["course", "participants", "grades", "submissions", "analytics"].includes(currentTab)) {
      setActiveTab(currentTab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: "course" | "participants" | "grades" | "submissions" | "analytics") => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("tab", tab);
      router.replace(`${window.location.pathname}?${params.toString()}`);
    }
  };

  // Course data
  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Computer Science");
  const [difficulty, setDifficulty] = useState("beginner");
  const [thumbnail, setThumbnail] = useState("");
  const [instructorName, setInstructorName] = useState("");
  const [courseAssignments, setCourseAssignments] = useState<any[]>([]);

  // Manual grading related data
  const [courseStudents, setCourseStudents] = useState<any[]>([]);
  const [courseExams, setCourseExams] = useState<any[]>([]);
  const [allTeachers, setAllTeachers] = useState<any[]>([]);

  // Course quizzes
  const [courseQuizzes, setCourseQuizzes] = useState<any[]>([]);
  // Selected assessment for submissions tab (e.g. "assignment_123" or "quiz_456")
  const [selectedAssessment, setSelectedAssessment] = useState<string>("");
  // Submissions list
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [expandedSubRow, setExpandedSubRow] = useState<number | null>(null);

  // Submissions Grading Canvas State
  const [gradingSubId, setGradingSubId] = useState<number | null>(null);
  const [gradeSubScore, setGradeSubScore] = useState<string>("");
  const [gradeSubFeedback, setGradeSubFeedback] = useState<string>("");
  const [savingSubGrade, setSavingSubGrade] = useState(false);
  const [gradeSubMessage, setGradeSubMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Enrollment state (student)
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [courseProgress, setCourseProgress] = useState(0);

  // Module/syllabus
  const [modules, setModules] = useState<any[]>([]);
  const [expandedSyllabus, setExpandedSyllabus] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);

  // Tab data
  const [participants, setParticipants] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [tabLoading, setTabLoading] = useState(false);

  // Inline grade edit state (teacher/admin)
  const [editingGrade, setEditingGrade] = useState<number | null>(null);
  const [editScore, setEditScore] = useState<string>("");
  const [editFeedback, setEditFeedback] = useState<string>("");
  const [savingGrade, setSavingGrade] = useState(false);

  // Grade Filter States
  const [filterModule, setFilterModule] = useState<string>("all");
  const [filterLesson, setFilterLesson] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortKey, setSortKey] = useState<string>("none");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userRole = localStorage.getItem("user_role") || "student";
      setRole(userRole === "instructor" ? "teacher" : userRole);
    }

    const fetchCourse = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/courses/${courseId}`);
        if (data) {
          setCourseName(data.course_name || "");
          setCourseCode(data.course_code || "");
          setDescription(data.description || "");
          setCategory(data.category || "Computer Science");
          setDifficulty(data.difficulty || "beginner");
          setInstructorName(data.instructor_name || "Faculty Staff");
          setThumbnail(data.thumbnail || "");
        }
        const { data: modulesData } = await api.get(`/courses/${courseId}/modules`);
        if (modulesData?.length > 0) {
          setModules(modulesData);
          const activeId = activeModuleIdParam ? parseInt(activeModuleIdParam) : modulesData[0].id;
          setExpandedSyllabus({ [activeId]: true });
        }
        // Pre-fetch assignments for "Add Grade" links
        try {
          const { data: asgn } = await api.get(`/assignments?course_id=${courseId}&limit=50`);
          setCourseAssignments(Array.isArray(asgn) ? asgn : asgn?.data ?? []);
        } catch { /* non-critical */ }
        // Pre-fetch quizzes as well
        try {
          const { data: qz } = await api.get(`/quizzes?course_id=${courseId}&limit=50`);
          setCourseQuizzes(Array.isArray(qz) ? qz : qz?.data ?? []);
        } catch { /* non-critical */ }

        // Check enrollment status for students
        try {
          const { data: enrollData } = await api.get(`/courses/${courseId}/my-enrollment`);
          setIsEnrolled(!!enrollData?.enrolled);
        } catch { /* non-critical — admin/teacher won't have student profile */ }

        // Fetch course progress
        try {
          const { data: progData } = await api.get(`/progress/course/${courseId}`);
          setCourseProgress(Math.round(progData?.progress_percentage || 0));
        } catch { /* non-critical */ }
      } catch (err) {
        console.error("Failed to load course:", err);
        setModules([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId]);

  const handleSelfEnroll = async () => {
    setEnrolling(true);
    try {
      await api.post(`/courses/${courseId}/self-enroll`);
      setIsEnrolled(true);
      router.refresh();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Failed to enroll";
      alert(msg);
    } finally {
      setEnrolling(false);
    }
  };

  // Fetch tab-specific data
  useEffect(() => {
    if (activeTab === "course") return;
    const fetchTab = async () => {
      setTabLoading(true);
      try {
        if (activeTab === "participants") {
          const { data } = await api.get(`/courses/${courseId}/students`);
          setParticipants(Array.isArray(data) ? data : data?.data ?? []);
        } else if (activeTab === "grades") {
          const { data } = await api.get(`/courses/${courseId}/grades`);
          setGrades(Array.isArray(data) ? data : data?.data ?? []);

          const userRole = typeof window !== "undefined" ? (localStorage.getItem("user_role") || "student") : "student";
          const currentIsTeacher = userRole === "instructor" || userRole === "teacher" || userRole === "admin";
          if (currentIsTeacher) {
            const [studentsRes, examsRes, teachersRes] = await Promise.all([
              api.get(`/courses/${courseId}/students`).catch(() => ({ data: [] })),
              api.get(`/exams?course_id=${courseId}&limit=100`).catch(() => ({ data: [] })),
              api.get(`/users/instructors?limit=100`).catch(() => ({ data: [] }))
            ]);
            
            const enrolled = Array.isArray(studentsRes.data) ? studentsRes.data : studentsRes.data?.data ?? [];
            setCourseStudents(enrolled);
            
            const cEx = Array.isArray(examsRes.data) ? examsRes.data : examsRes.data?.data ?? [];
            setCourseExams(cEx);
            
            const insts = Array.isArray(teachersRes.data) ? teachersRes.data : teachersRes.data?.data ?? [];
            setAllTeachers(insts);
          }
        } else if (activeTab === "analytics") {
          const { data } = await api.get(`/analytics/course/${courseId}`);
          setAnalyticsData(data);
        }
      } catch (err) {
        console.error("Failed to load tab data", err);
      } finally {
        setTabLoading(false);
      }
    };
    fetchTab();
  }, [activeTab, courseId]);

  // Auto-select first assessment when switching to submissions tab
  useEffect(() => {
    if (activeTab === "submissions" && !selectedAssessment) {
      if (courseAssignments.length > 0) {
        setSelectedAssessment(`assignment_${courseAssignments[0].id}`);
      } else if (courseQuizzes.length > 0) {
        setSelectedAssessment(`quiz_${courseQuizzes[0].id}`);
      }
    }
  }, [activeTab, courseAssignments, courseQuizzes, selectedAssessment]);

  // Load submissions for selected assignment/quiz
  useEffect(() => {
    if (!selectedAssessment) {
      setSubmissions([]);
      return;
    }
    const [type, refId] = selectedAssessment.split("_");
    if (!type || !refId) return;

    const loadSubmissionsData = async () => {
      setLoadingSubmissions(true);
      try {
        const { data } = await api.get(`/submissions/reference/${type}/${refId}`);
        setSubmissions(Array.isArray(data) ? data : data?.data ?? []);
      } catch (err) {
        console.error("Failed to load submissions for course:", err);
      } finally {
        setLoadingSubmissions(false);
      }
    };
    loadSubmissionsData();
  }, [selectedAssessment]);

  // ── Inline grading inside the Submissions tab ─────────────────────────────
  const startGradingSub = (sub: any) => {
    setGradingSubId(sub.id);
    setGradeSubScore(sub.score != null ? String(sub.score) : "");
    setGradeSubFeedback(sub.feedback ?? "");
    setGradeSubMessage(null);
    setExpandedSubRow(sub.id);
  };

  const cancelGradingSub = () => {
    setGradingSubId(null);
    setGradeSubScore("");
    setGradeSubFeedback("");
    setGradeSubMessage(null);
  };

  const submitGradingSub = async () => {
    if (!gradingSubId) return;

    const parsedScore = parseFloat(String(gradeSubScore).trim());
    if (isNaN(parsedScore)) {
      setGradeSubMessage({ type: "error", text: "Please enter a valid numeric score." });
      return;
    }

    const [type, refId] = selectedAssessment.split("_");
    let maxMarks = 100;
    if (type === "assignment") {
      const activeAsgn = courseAssignments.find(a => String(a.id) === refId);
      if (activeAsgn) maxMarks = activeAsgn.total_marks || 100;
    } else if (type === "quiz") {
      const activeQuiz = courseQuizzes.find(q => String(q.id) === refId);
      if (activeQuiz) maxMarks = activeQuiz.total_marks || 100;
    }

    if (parsedScore < 0 || parsedScore > maxMarks) {
      setGradeSubMessage({ type: "error", text: `Score boundary violation. Must be between 0 and ${maxMarks}.` });
      return;
    }

    setSavingSubGrade(true);
    setGradeSubMessage(null);

    try {
      const fd = new FormData();
      fd.append("score", String(parsedScore));
      if (gradeSubFeedback.trim() !== "") {
        fd.append("feedback", gradeSubFeedback.trim());
      }

      await api.put(`/submissions/${gradingSubId}/grade`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Update state cache instantly
      setSubmissions((prev) =>
        prev.map((sub) => {
          if (sub.id === gradingSubId) {
            return {
              ...sub,
              score: parsedScore,
              feedback: gradeSubFeedback.trim() || null,
              status: "graded",
            };
          }
          return sub;
        })
      );

      // Refresh Grades tab list silently in background
      const { data: grData } = await api.get(`/courses/${courseId}/grades`);
      setGrades(Array.isArray(grData) ? grData : grData?.data ?? []);

      setGradeSubMessage({ type: "success", text: "Grade successfully saved and synced to gradebook." });
      
      setTimeout(() => {
        cancelGradingSub();
        setExpandedSubRow(null);
      }, 1200);
    } catch (err: any) {
      const detail = err?.response?.data?.detail || "Failed to save grade.";
      setGradeSubMessage({ type: "error", text: detail });
    } finally {
      setSavingSubGrade(false);
    }
  };

  const toggleSyllabusExpand = (id: number) => {
    setExpandedSyllabus((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderActivityIcon = (type: string) => {
    switch (type) {
      case "file": return <FileText className="h-4 w-4 text-rose-500 shrink-0" />;
      case "url":  return <ExternalLink className="h-4 w-4 text-amber-600 shrink-0" />;
      default:     return <BookOpen className="h-4 w-4 text-[#0038A8] shrink-0" />;
    }
  };

  // ── Inline grading (teacher/admin only) ─────────────────────────────────
  const startEdit = (g: any) => {
    setEditingGrade(g.id);
    setEditScore(String(g.score ?? ""));
    setEditFeedback(g.feedback ?? "");
  };
  const cancelEdit = () => { setEditingGrade(null); setEditScore(""); setEditFeedback(""); };

  const saveGrade = useCallback(async (resultId: number) => {
    setSavingGrade(true);
    try {
      await api.put(`/results/${resultId}`, {
        score: parseInt(editScore),
        feedback: editFeedback || null,
      });
      // Refresh grades
      const { data } = await api.get(`/courses/${courseId}/grades`);
      setGrades(Array.isArray(data) ? data : data?.data ?? []);
      cancelEdit();
    } catch (err) {
      console.error("Grade save failed:", err);
    } finally {
      setSavingGrade(false);
    }
  }, [editScore, editFeedback, courseId]);

  const isTeacher = role === "admin" || role === "teacher";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F7F8FA]">
        <div className="h-10 w-10 border-4 border-[#0038A8] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold select-none">Loading Course Details...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen relative font-sans">

      {/* BREADCRUMB + HEADER */}
      <div className="flex flex-col gap-4 select-none text-left">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
            <Link href="/" className="hover:text-foreground flex items-center gap-1">
              <Globe className="h-3 w-3" />Home
            </Link>
            <span>/</span>
            <Link href="/list/courses" className="hover:text-foreground">My Courses</Link>
            <span>/</span>
            <span className="text-foreground font-mono">{courseCode || "CS-LMS"}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-3">
              <BackButton href="/list/courses" />
              <div>
                <span className="text-xs font-extrabold text-[#0038A8] uppercase tracking-wider font-mono">
                  {courseCode} • {category}
                </span>
                <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight leading-tight mt-0.5">
                  {courseName}
                </h1>
              </div>
            </div>
            {role === "student" && (
              isEnrolled ? (
                <span className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-700 border border-slate-300 text-xs font-black rounded-xl">
                  <CheckCircle className="w-3.5 h-3.5" /> Enrolled
                </span>
              ) : (
                <button
                  onClick={handleSelfEnroll}
                  disabled={enrolling}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-[#0038A8] hover:bg-[#002D86] text-white text-xs font-black rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {enrolling ? "Enrolling..." : "Enroll for Free"}
                </button>
              )
            )}
          </div>
        </div>

        {/* TAB BAR */}
        <div className="flex border-b border-border/60 gap-6 select-none text-xs font-extrabold text-muted-foreground pt-2">
          {(["course", "participants", "grades", ...(role === "teacher" || role === "admin" ? ["submissions" as const, "analytics" as const] : [])] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab as any)}
              className={`pb-3 border-b-2 transition-colors capitalize flex items-center gap-1.5 ${
                activeTab === tab ? "border-[#0038A8] text-foreground" : "border-transparent hover:text-foreground"
              }`}
            >
              {tab === "course" && <BookOpen className="h-3 w-3" />}
              {tab === "participants" && <Users className="h-3 w-3" />}
              {tab === "grades" && <BarChart2 className="h-3 w-3" />}
              {tab === "submissions" && <ClipboardList className="h-3 w-3" />}
              {tab === "analytics" && <BarChart2 className="h-3 w-3" />}
              <span>{tab === "course" ? "Course" : tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
            </button>
          ))}
          {isTeacher && (
            <Link
              href={`/list/courses/${courseId}/edit`}
              className="pb-3 border-b-2 border-transparent transition-colors hover:text-foreground flex items-center gap-1.5"
            >
              <Settings className="h-3 w-3" />
              <span>Settings</span>
            </Link>
          )}
          <button className="pb-3 border-b-2 border-transparent opacity-50 cursor-not-allowed flex items-center gap-1.5" disabled>
            <FileText className="h-3 w-3" />
            <span>Reports</span>
          </button>
        </div>
      </div>

      {/* ── PARTICIPANTS TAB ─────────────────────────────────────────── */}
      {activeTab === "participants" && (
        <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.01)] text-left">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[#0038A8]" />
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">Course Participants</h2>
            </div>
            <span className="px-3 py-1 bg-[#0038A8]/8 text-[#0038A8] font-black text-xs rounded-xl border border-[#0038A8]/15">
              {participants.length} Enrolled
            </span>
          </div>
          {tabLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 border-4 border-[#0038A8] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : participants.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-bold">No participants enrolled yet.</p>
              <p className="text-xs mt-1 opacity-70">Students who enroll in this course will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-[10px] uppercase tracking-wider text-muted-foreground font-black">
                    <th className="text-left py-2 px-3">Name</th>
                    <th className="text-left py-2 px-3">Student ID</th>
                    <th className="text-left py-2 px-3">Email</th>
                    <th className="text-left py-2 px-3">Enrolled</th>
                    <th className="text-left py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {participants.map((p: any) => (
                    <tr key={p.id ?? p.student_id} className="hover:bg-muted/20 transition-colors group">
                      <td className="py-3 px-3">
                        <Link href={`/list/students/${p.id}`} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                          <div className="h-7 w-7 rounded-full bg-[#0038A8]/10 text-[#0038A8] flex items-center justify-center text-[10px] font-black shrink-0">
                            {(p.full_name || p.username || "?")[0].toUpperCase()}
                          </div>
                          <span className="font-bold text-foreground text-xs hover:underline">{p.full_name || p.username || "—"}</span>
                        </Link>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground font-mono text-xs">{p.student_code || "—"}</td>
                      <td className="py-3 px-3 text-muted-foreground text-xs">{p.email || "—"}</td>
                      <td className="py-3 px-3 text-muted-foreground text-xs">{p.enrolled_date ? new Date(p.enrolled_date).toLocaleDateString() : "—"}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded border uppercase ${
                          p.is_active !== false ? "bg-slate-100 text-slate-700 border-slate-200" : "bg-slate-50 text-slate-400 border-slate-200"
                        }`}>
                          {p.is_active !== false ? "Enrolled" : "Dropped"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── GRADES TAB ───────────────────────────────────────────────── */}
      {activeTab === "grades" && (() => {
        const uniqueModules = Array.from(new Set(grades.map(g => g.module_title).filter(Boolean))) as string[];
        const uniqueLessons = Array.from(
          new Set(
            grades
              .filter(g => filterModule === "all" || g.module_title === filterModule)
              .map(g => g.lesson_title)
              .filter(Boolean)
          )
        ) as string[];
        const uniqueTypes = Array.from(new Set(grades.map(g => g.assessment_type).filter(Boolean))) as string[];

        const filteredGrades = grades.filter((g) => {
          if (filterModule !== "all" && g.module_title !== filterModule) return false;
          if (filterLesson !== "all" && g.lesson_title !== filterLesson) return false;
          if (filterType !== "all" && g.assessment_type !== filterType) return false;
          return true;
        });

        const sortedGrades = [...filteredGrades].sort((a, b) => {
          if (sortKey === "none") return 0;
          let valA: any = "";
          let valB: any = "";

          if (sortKey === "student") {
            valA = a.student_name || "";
            valB = b.student_name || "";
          } else if (sortKey === "assessment") {
            valA = a.assessment_title || "";
            valB = b.assessment_title || "";
          } else if (sortKey === "score") {
            valA = a.score ?? -1;
            valB = b.score ?? -1;
          } else if (sortKey === "percentage") {
            valA = a.percentage ?? -1;
            valB = b.percentage ?? -1;
          } else if (sortKey === "grade") {
            valA = a.grade || "";
            valB = b.grade || "";
          } else if (sortKey === "status") {
            valA = a.is_passed ? 1 : 0;
            valB = b.is_passed ? 1 : 0;
          }

          if (typeof valA === "string" && typeof valB === "string") {
            return sortOrder === "asc"
              ? valA.localeCompare(valB)
              : valB.localeCompare(valA);
          } else {
            if (valA < valB) return sortOrder === "asc" ? -1 : 1;
            if (valA > valB) return sortOrder === "asc" ? 1 : -1;
            return 0;
          }
        });

        const renderSortArrow = (key: string) => {
          if (sortKey !== key) return <span className="opacity-30 ml-1">↕</span>;
          return sortOrder === "asc" ? <span className="text-[#0038A8] ml-1">▲</span> : <span className="text-[#0038A8] ml-1">▼</span>;
        };

        const relatedGradingData = {
          students: courseStudents.map((s: any) => ({
            id: String(s.id),
            name: s.full_name || s.username || "",
            surname: "",
          })),
          exams: courseExams.map((e: any) => ({
            id: e.id,
            title: e.title,
          })),
          assignments: courseAssignments.map((a: any) => ({
            id: a.id,
            title: a.title,
          })),
          teachers: allTeachers.map((t: any) => ({
            id: String(t.id),
            name: t.username || "",
            surname: "",
          })),
        };

        return (
          <div className="space-y-4">
            {/* Header bar */}
            <div className="bg-card border border-border/60 rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.01)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-[#0038A8]" />
                  <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                    {isTeacher ? "Gradebook — All Students" : "My Grade Report"}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  {isTeacher && (
                    <FormModal
                      table="result"
                      type="create"
                      triggerText="Grade Assessment"
                      relatedData={relatedGradingData}
                    />
                  )}
                  {isTeacher && courseAssignments.length > 0 && (
                    <Link href={`/list/assignments/${courseAssignments[0]?.id}/submissions`}>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-[#8b5cf6] hover:text-[#7c3aed] border border-[#8b5cf6]/20 bg-[#8b5cf6]/5 rounded-xl transition-colors">
                        <ClipboardList className="h-3.5 w-3.5" />
                        Review Submissions
                      </button>
                    </Link>
                  )}
                  {sortedGrades.length > 0 && (
                    <button
                      onClick={() => exportCSV(sortedGrades, courseName)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-muted-foreground hover:text-foreground border border-border/60 bg-background rounded-xl transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Export CSV
                    </button>
                  )}
                </div>
              </div>

              {/* Grade legend & Filters layout */}
              <div className="flex flex-col gap-4 mt-4 pt-4 border-t border-border/40">
                <div className="flex items-center gap-2 flex-wrap">
                  {["A","B","C","D","F"].map((g) => (
                    <span key={g} className={`px-2.5 py-0.5 text-[10px] font-black rounded border ${gradePillClass(g)}`}>
                      {g} {g==="A"?"≥90%":g==="B"?"≥80%":g==="C"?"≥70%":g==="D"?"≥60%":"<60%"}
                    </span>
                  ))}
                </div>

                {/* Filter Controls Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider select-none">Filter by Module</label>
                    <select
                      value={filterModule}
                      onChange={(e) => {
                        setFilterModule(e.target.value);
                        setFilterLesson("all");
                      }}
                      className="px-3.5 py-2 bg-[#F7F8FA] border border-border/80 rounded-xl text-xs font-extrabold text-slate-700 focus:outline-none cursor-pointer"
                    >
                      <option value="all">All Modules</option>
                      {uniqueModules.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider select-none">Filter by Lesson</label>
                    <select
                      value={filterLesson}
                      onChange={(e) => setFilterLesson(e.target.value)}
                      className="px-3.5 py-2 bg-[#F7F8FA] border border-border/80 rounded-xl text-xs font-extrabold text-slate-700 focus:outline-none cursor-pointer"
                    >
                      <option value="all">All Lessons</option>
                      {uniqueLessons.map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider select-none">Filter by Type</label>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="px-3.5 py-2 bg-[#F7F8FA] border border-border/80 rounded-xl text-xs font-extrabold text-slate-700 focus:outline-none cursor-pointer capitalize"
                    >
                      <option value="all">All Types</option>
                      {uniqueTypes.map((t) => (
                        <option key={t} value={t} className="capitalize">{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Grades table */}
            <div className="bg-card border border-border/60 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.01)]">
              {tabLoading ? (
                <div className="flex justify-center py-16">
                  <div className="h-8 w-8 border-4 border-[#0038A8] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : grades.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <BarChart2 className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-bold">No grades recorded yet.</p>
                  <p className="text-xs mt-1 opacity-70">Grades will appear here once assessments are evaluated.</p>
                </div>
              ) : filteredGrades.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground bg-card p-6">
                  <BarChart2 className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-bold">No matching grades found.</p>
                  <p className="text-xs mt-1 opacity-70">Try adjusting your module, lesson, or type filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/60 bg-[#F7F8FA]/80 text-[10px] uppercase tracking-wider text-muted-foreground font-black select-none">
                        {isTeacher && (
                          <th className="text-left py-3 px-4 cursor-pointer hover:text-[#0038A8] transition-colors" onClick={() => handleSort("student")}>
                            <div className="flex items-center">
                              Student {renderSortArrow("student")}
                            </div>
                          </th>
                        )}
                        <th className="text-left py-3 px-4 cursor-pointer hover:text-[#0038A8] transition-colors" onClick={() => handleSort("assessment")}>
                          <div className="flex items-center">
                            Assessment {renderSortArrow("assessment")}
                          </div>
                        </th>
                        <th className="text-left py-3 px-4 cursor-pointer hover:text-[#0038A8] transition-colors" onClick={() => handleSort("score")}>
                          <div className="flex items-center">
                            Score {renderSortArrow("score")}
                          </div>
                        </th>
                        <th className="text-left py-3 px-4 cursor-pointer hover:text-[#0038A8] transition-colors" onClick={() => handleSort("percentage")}>
                          <div className="flex items-center">
                            % {renderSortArrow("percentage")}
                          </div>
                        </th>
                        <th className="text-left py-3 px-4 cursor-pointer hover:text-[#0038A8] transition-colors" onClick={() => handleSort("grade")}>
                          <div className="flex items-center">
                            Grade {renderSortArrow("grade")}
                          </div>
                        </th>
                        <th className="text-left py-3 px-4 cursor-pointer hover:text-[#0038A8] transition-colors" onClick={() => handleSort("status")}>
                          <div className="flex items-center">
                            Status {renderSortArrow("status")}
                          </div>
                        </th>
                        <th className="text-left py-3 px-4">Feedback</th>
                        {isTeacher && <th className="text-left py-3 px-4">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {sortedGrades.map((g: any) => (
                      <tr key={g.id} className="hover:bg-muted/20 transition-colors">
                        {isTeacher && (
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-[#0038A8]/10 text-[#0038A8] flex items-center justify-center text-[9px] font-black shrink-0">
                                {(g.student_name || "?")[0].toUpperCase()}
                              </div>
                              <span className="font-bold text-xs text-foreground">{g.student_name || "—"}</span>
                            </div>
                          </td>
                        )}
                        <td className="py-3 px-4 text-xs text-muted-foreground font-medium max-w-[200px] truncate">{g.assessment_title || "—"}</td>
                        <td className="py-3 px-4">
                          {editingGrade === g.id ? (
                            <input
                              type="number"
                              value={editScore}
                              onChange={(e) => setEditScore(e.target.value)}
                              className="w-16 px-2 py-1 text-xs font-bold border border-[#0038A8]/30 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0038A8]/20 bg-muted/30"
                              min={0}
                              max={g.total_marks ?? 100}
                            />
                          ) : (
                            <span className="font-bold text-xs">
                              {g.score ?? "—"}<span className="text-muted-foreground font-normal">/{g.total_marks ?? "—"}</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs font-mono text-muted-foreground">
                          {g.percentage != null ? `${g.percentage.toFixed(1)}%` : "—"}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 text-xs font-black rounded border ${gradePillClass(g.grade)}`}>
                            {g.grade || "—"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded border uppercase ${
                            g.is_passed ? "bg-slate-100 text-slate-700 border-slate-200" : "bg-slate-50 text-slate-400 border-slate-200"
                          }`}>
                            {g.is_passed ? "Passed" : "Failed"}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-[200px]">
                          {editingGrade === g.id ? (
                            <input
                              type="text"
                              value={editFeedback}
                              onChange={(e) => setEditFeedback(e.target.value)}
                              placeholder="Add feedback..."
                              className="w-full px-2 py-1 text-xs border border-[#0038A8]/30 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0038A8]/20 bg-muted/30"
                            />
                          ) : (
                            <span className="text-xs text-muted-foreground truncate block max-w-[180px]">{g.feedback || <em className="opacity-40">—</em>}</span>
                          )}
                        </td>
                        {isTeacher && (
                          <td className="py-3 px-4">
                            {editingGrade === g.id ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => saveGrade(g.id)}
                                  disabled={savingGrade}
                                  className="p-1.5 bg-slate-100 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="p-1.5 bg-muted text-muted-foreground border border-border rounded-lg hover:bg-muted/80 transition-colors"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => startEdit(g)}
                                className="p-1.5 text-muted-foreground hover:text-[#8b5cf6] border border-border/60 hover:border-[#8b5cf6]/40 rounded-lg transition-colors bg-background"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      );
    })()}

      {/* ── SUBMISSIONS TAB (Teacher/Admin) ───────────────────────────── */}
      {activeTab === "submissions" && (
        <div className="space-y-6">
          {/* Selector header card */}
          <div className="bg-card border border-border/60 rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.01)] text-left flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-[#0038A8]" />
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">Student Assessment Submissions</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase select-none">Select Assessment:</span>
              <select
                value={selectedAssessment}
                onChange={(e) => {
                  setSelectedAssessment(e.target.value);
                  setExpandedSubRow(null);
                  cancelGradingSub();
                }}
                className="px-3 py-2 bg-slate-50 border border-border/80 rounded-xl outline-none text-xs font-bold text-foreground focus:border-[#0038A8]/50 focus:ring-1 focus:ring-[#0038A8]/50 min-w-[200px]"
              >
                <option value="">-- Choose Assignment or Quiz --</option>
                {courseAssignments.length > 0 && (
                  <optgroup label="Assignments">
                    {courseAssignments.map((a: any) => (
                      <option key={`assignment_${a.id}`} value={`assignment_${a.id}`}>{a.title}</option>
                    ))}
                  </optgroup>
                )}
                {courseQuizzes.length > 0 && (
                  <optgroup label="Quizzes">
                    {courseQuizzes.map((q: any) => (
                      <option key={`quiz_${q.id}`} value={`quiz_${q.id}`}>{q.title}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
          </div>

          {/* Submissions table/state view */}
          {loadingSubmissions ? (
            <div className="bg-card border border-border/60 rounded-3xl p-12 text-center text-muted-foreground select-none">
              <div className="h-8 w-8 border-4 border-[#0038A8] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-bold">Loading submissions data...</p>
            </div>
          ) : !selectedAssessment ? (
            <div className="bg-card border border-border/60 rounded-3xl p-12 text-center text-muted-foreground select-none">
              <ClipboardList className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-bold">No assessment selected.</p>
              <p className="text-xs mt-1 opacity-70">Please select an assignment or quiz from the dropdown to review submissions.</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="bg-card border border-border/60 rounded-3xl p-12 text-center text-muted-foreground select-none">
              <ClipboardList className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-bold">No submissions yet.</p>
              <p className="text-xs mt-1 opacity-70">No student has submitted this assessment yet.</p>
            </div>
          ) : (
            <div className="bg-card border border-border/60 rounded-3xl overflow-hidden shadow-sm">
              {gradeSubMessage && (
                <div className={`m-5 flex items-center gap-2 p-4 rounded-2xl text-sm font-semibold border ${gradeSubMessage.type === "success" ? "bg-slate-100 border-slate-300 text-slate-800" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                  {gradeSubMessage.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />} {gradeSubMessage.text}
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/60 bg-[#F7F8FA]/80 text-[10px] uppercase tracking-wider text-muted-foreground font-black">
                      <th className="py-3.5 px-5">Student</th>
                      <th className="py-3.5 px-4">Submitted At</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Score</th>
                      <th className="py-3.5 px-4">Grade</th>
                      <th className="py-3.5 px-4">Attachment</th>
                      <th className="py-3.5 px-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 font-medium text-xs">
                    {submissions.map((sub: any) => {
                      const isExpanded = expandedSubRow === sub.id;
                      const isGrading = gradingSubId === sub.id;
                      const [type, refId] = selectedAssessment.split("_");
                      let maxMarks = 100;
                      if (type === "assignment") {
                        const activeAsgn = courseAssignments.find(a => String(a.id) === refId);
                        if (activeAsgn) maxMarks = activeAsgn.total_marks || 100;
                      } else if (type === "quiz") {
                        const activeQuiz = courseQuizzes.find(q => String(q.id) === refId);
                        if (activeQuiz) maxMarks = activeQuiz.total_marks || 100;
                      }

                      const pct = sub.score != null ? ((sub.score / maxMarks) * 100).toFixed(1) : null;
                      const gradeLetter = pct != null
                        ? parseFloat(pct) >= 90 ? "A" : parseFloat(pct) >= 80 ? "B" : parseFloat(pct) >= 70 ? "C" : parseFloat(pct) >= 60 ? "D" : "F"
                        : null;

                      return (
                        <React.Fragment key={sub.id}>
                          <tr className={`hover:bg-muted/10 transition-colors ${isExpanded ? "bg-muted/5 border-l-2 border-[#8b5cf6]" : ""}`}>
                            <td className="py-4 px-5">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-[#0038A8]/10 text-[#0038A8] flex items-center justify-center text-xs font-black shrink-0 border border-[#0038A8]/10">
                                  {(sub.student_name || sub.student_id || "?")[0].toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-bold text-xs text-foreground leading-tight">{sub.student_name || "—"}</p>
                                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{sub.student_code || `ID: ${sub.student_id.substring(0, 8)}`}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-xs text-muted-foreground font-sans">{new Date(sub.submitted_at).toLocaleString()}</td>
                            <td className="py-4 px-4">
                              <span className={`px-2 py-0.5 text-[9px] font-black rounded border tracking-wide uppercase ${statusBadge(sub.status)}`}>
                                {sub.status}
                              </span>
                            </td>
                            <td className="py-4 px-4 font-bold text-xs font-sans">
                              {sub.score != null ? (
                                <span>{sub.score} <span className="text-muted-foreground/60 font-medium">/ {maxMarks}</span></span>
                              ) : (
                                <span className="text-muted-foreground/40 font-normal">—</span>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              {gradeLetter ? (
                                <span className={`px-2 py-0.5 text-[10px] font-black rounded border ${gradePillClass(gradeLetter)}`}>{gradeLetter}</span>
                              ) : (
                                <span className="text-muted-foreground/40 text-xs">—</span>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              {sub.submission_file ? (
                                <a href={getImageUrl(sub.submission_file) || "#"} download className="inline-flex items-center gap-1 text-[10px] font-black text-[#0038A8] hover:underline">
                                  <Download className="h-3.5 w-3.5" /> Download
                                </a>
                              ) : (
                                <span className="text-muted-foreground/40 text-xs">—</span>
                              )}
                            </td>
                            <td className="py-4 px-5 text-right">
                              <div className="inline-flex items-center gap-2">
                                <button
                                  onClick={() => startGradingSub(sub)}
                                  disabled={savingSubGrade || (gradingSubId !== null && gradingSubId !== sub.id)}
                                  className="px-3 py-1 text-[10px] font-black bg-[#8b5cf6]/10 text-[#8b5cf6] border border-[#8b5cf6]/20 rounded-lg hover:bg-[#8b5cf6]/20 transition-all uppercase tracking-wider shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  {sub.status?.toLowerCase() === "graded" ? "Re-grade" : "Grade"}
                                </button>
                                <button onClick={() => setExpandedSubRow(isExpanded ? null : sub.id)} className="p-1.5 text-muted-foreground hover:text-foreground border border-border/60 rounded-lg bg-background shadow-sm">
                                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* EXPANDED VIEW IN SUBMISSIONS TAB */}
                          {isExpanded && (
                            <tr key={`${sub.id}-expanded`}>
                              <td colSpan={7} className="px-5 pb-5 bg-muted/10 border-b border-border/40">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3">
                                  <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-3 shadow-sm text-left">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1 border-b pb-1.5 border-border/40">
                                      <User className="h-3 w-3 text-[#0038A8]" /> Student Response Context
                                    </p>
                                    {sub.submission_text ? (
                                      <div className="bg-muted/20 border border-border/30 rounded-xl p-3 max-h-[220px] overflow-y-auto">
                                        <p className="text-xs text-foreground leading-relaxed font-medium whitespace-pre-wrap">{sub.submission_text}</p>
                                      </div>
                                    ) : (
                                      <p className="text-xs text-muted-foreground/60 italic p-2">No text response payload provided.</p>
                                    )}
                                  </div>

                                  {isGrading ? (
                                    <div className="bg-card border border-[#8b5cf6]/30 rounded-2xl p-5 space-y-4 shadow-sm text-left">
                                      <p className="text-[10px] font-black text-[#8b5cf6] uppercase tracking-wider flex items-center gap-1 border-b pb-1.5 border-[#8b5cf6]/10">
                                        <Award className="h-3.5 w-3.5" /> Assessment Grading Canvas
                                      </p>
                                      <div className="space-y-1">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wide">Score Obtained (Scale Max: {maxMarks})</label>
                                        <input
                                          type="number"
                                          value={gradeSubScore}
                                          onChange={(e) => setGradeSubScore(e.target.value)}
                                          min={0}
                                          max={maxMarks}
                                          className="w-full max-w-[140px] px-3 py-2 bg-muted/20 border border-border/80 focus:border-[#8b5cf6]/40 rounded-xl text-sm font-bold font-sans outline-none"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wide">Instructor Feedback & Remarks</label>
                                        <textarea
                                          rows={3}
                                          value={gradeSubFeedback}
                                          onChange={(e) => setGradeSubFeedback(e.target.value)}
                                          placeholder="Provide instructional feedback commentary..."
                                          className="w-full px-3 py-2 bg-muted/20 border border-border/80 focus:border-[#8b5cf6]/40 rounded-xl text-xs leading-relaxed font-medium outline-none"
                                        />
                                      </div>
                                      <div className="flex gap-2 pt-1 select-none">
                                        <button
                                          onClick={submitGradingSub}
                                          disabled={savingSubGrade || !gradeSubScore.trim()}
                                          className="flex items-center gap-1.5 px-4 py-2 bg-[#8b5cf6] text-white font-black text-xs rounded-xl hover:bg-[#7c3aed] transition-all disabled:opacity-50 uppercase tracking-wider shadow-sm"
                                        >
                                          <Check className="h-3.5 w-3.5" /> {savingSubGrade ? "Saving..." : "Save Evaluation"}
                                        </button>
                                        <button onClick={cancelGradingSub} className="flex items-center gap-1.5 px-3 py-2 bg-background border border-border text-muted-foreground font-bold text-xs rounded-xl hover:bg-muted transition-all">
                                          <X className="h-3.5 w-3.5" /> Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="bg-muted/20 border border-dashed border-border/60 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 text-center">
                                      <Award className="h-7 w-7 text-muted-foreground/30" />
                                      <p className="text-xs font-bold text-muted-foreground">Select the Grade action node to evaluate this student&apos;s submission.</p>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ANALYTICS TAB (Teacher/Admin) ────────────────────────────── */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          {tabLoading ? (
            <div className="text-center py-12 text-muted-foreground text-sm font-bold">Loading analytics...</div>
          ) : analyticsData ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { 
                    label: "Students Enrolled", 
                    value: analyticsData.enrolled_students, 
                    color: "text-[#0038A8]", 
                    tooltip: "Total count of unique students registered for this course." 
                  },
                  { 
                    label: "Avg Attendance", 
                    value: `${analyticsData.attendance_rate}%`, 
                    color: "text-[#0038A8]", 
                    tooltip: "Average attendance rate based on daily presence logs of all students in this course." 
                  },
                  { 
                    label: "Avg Assessment Score", 
                    value: `${analyticsData.avg_grade_percentage}%`, 
                    color: "text-amber-600", 
                    tooltip: "Average score across all graded quizzes and assignments in this course." 
                  },
                  { 
                    label: "Evaluations (Pass / Fail)", 
                    value: `${analyticsData.pass_count} / ${analyticsData.fail_count}`, 
                    color: "text-foreground", 
                    tooltip: "Total graded submissions that met the passing score vs. those that fell below it. A student can complete multiple assessments." 
                  },
                ].map(({ label, value, color, tooltip }) => (
                  <div key={label} className="bg-card border border-border/60 rounded-2xl p-4 text-center relative group flex flex-col justify-center min-h-[92px]">
                    <p className={`text-2xl font-black ${color}`}>{value}</p>
                    <div className="flex items-center justify-center gap-1 mt-1 cursor-help select-none">
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">{label}</p>
                      <Info className="h-3 w-3 text-muted-foreground/50 hover:text-muted-foreground transition-colors shrink-0" />
                    </div>
                    {/* Tooltip Popup */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-800 text-white text-[10px] p-2.5 rounded-xl shadow-xl w-48 z-50 text-center font-bold normal-case leading-normal pointer-events-none">
                      {tooltip}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Grade Distribution */}
              {(() => {
                const gradesOrder = ["A", "B", "C", "D", "E", "F"];
                const chartData = Object.entries(analyticsData.grade_distribution || {})
                  .map(([grade, count]) => ({
                    grade,
                    count: count as number,
                  }))
                  .sort((a, b) => gradesOrder.indexOf(a.grade) - gradesOrder.indexOf(b.grade));

                const colorMap: Record<string, string> = {
                  A: "#10B981",
                  B: "#0038A8",
                  C: "#F59E0B",
                  D: "#F97316",
                  F: "#EF4444",
                };

                return (
                  <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm relative group">
                    <div className="flex items-center gap-1.5 mb-4 select-none cursor-help">
                      <h3 className="text-sm font-black text-foreground uppercase tracking-wider">Assessment Grade Distribution</h3>
                      <Info className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
                      {/* Tooltip Popup */}
                      <div className="absolute bottom-full left-6 mb-2 hidden group-hover:block bg-slate-800 text-white text-[10px] p-2.5 rounded-xl shadow-xl w-64 z-50 text-left font-bold normal-case leading-normal pointer-events-none">
                        Reflects the grades of all evaluated quizzes and assignments (totaling {chartData.reduce((acc, curr) => acc + curr.count, 0)} grades), not unique student counts.
                        <div className="absolute top-full left-6 -mt-1 border-4 border-transparent border-t-slate-800" />
                      </div>
                    </div>
                    <div className="w-full h-64 text-xs font-semibold">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                          <XAxis
                            dataKey="grade"
                            axisLine={false}
                            tick={{ fill: "#64748B", fontSize: 11, fontWeight: 700 }}
                            tickLine={false}
                          />
                          <YAxis
                            axisLine={false}
                            tick={{ fill: "#64748B", fontSize: 11, fontWeight: 600 }}
                            tickLine={false}
                            allowDecimals={false}
                          />
                          <Tooltip
                            contentStyle={{ borderRadius: "12px", borderColor: "#E2E8F0", fontSize: "12px", fontWeight: "bold" }}
                            cursor={{ fill: "rgba(0, 56, 168, 0.03)" }}
                          />
                          <Bar dataKey="count" name="Students" barSize={35} radius={[6, 6, 0, 0]} label={{ position: "top", fill: "#64748B", fontSize: 10, fontWeight: 700 }}>
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={colorMap[entry.grade] || "#64748B"} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                );
              })()}

              {/* Quiz Performance */}
              {analyticsData.quiz_stats?.length > 0 && (
                <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-sm font-black text-foreground uppercase tracking-wider mb-4">Quiz Attempts & Performance</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-3 text-xs font-black text-muted-foreground uppercase">Quiz</th>
                          <th className="text-left py-2 px-3 text-xs font-black text-muted-foreground uppercase">Attempts</th>
                          <th className="text-left py-2 px-3 text-xs font-black text-muted-foreground uppercase">Avg Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analyticsData.quiz_stats.map((q: any) => (
                          <tr key={q.quiz_id} className="border-b border-border/40">
                            <td className="py-2.5 px-3 font-bold">{q.title}</td>
                            <td className="py-2.5 px-3">{q.attempts}</td>
                            <td className="py-2.5 px-3">{q.avg_percentage != null ? `${q.avg_percentage}%` : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Assignment Completion */}
              {analyticsData.assignment_stats?.length > 0 && (
                <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-sm font-black text-foreground uppercase tracking-wider mb-4">Assignment Submissions</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-3 text-xs font-black text-muted-foreground uppercase">Assignment</th>
                          <th className="text-left py-2 px-3 text-xs font-black text-muted-foreground uppercase">Submissions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analyticsData.assignment_stats.map((a: any) => (
                          <tr key={a.assignment_id} className="border-b border-border/40">
                            <td className="py-2.5 px-3 font-bold">{a.title}</td>
                            <td className="py-2.5 px-3">{a.submissions}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* At-Risk Students */}
              {analyticsData.at_risk_students?.length > 0 && (
                <div className="bg-card border border-red-200/60 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-sm font-black text-red-600 uppercase tracking-wider mb-4">At-Risk Students (Attendance &lt; 80%)</h3>
                  <div className="space-y-2">
                    {analyticsData.at_risk_students.map((s: any) => (
                      <div key={s.student_id} className="flex items-center justify-between p-3 bg-red-50/50 rounded-xl border border-red-100">
                        <span className="text-sm font-bold text-foreground">{s.student_name}</span>
                        <span className="text-xs font-black text-red-600">{s.attendance_rate}% attendance</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground text-sm">No analytics data available.</div>
          )}
        </div>
      )}

      {/* ── COURSE TAB ───────────────────────────────────────────────── */}
      {activeTab === "course" && (
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 text-left">

          {/* LEFT: Syllabus */}
          <div className="lg:col-span-7 space-y-6">

            {/* Hero cover */}
            <div className="bg-card border border-border/60 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.01)]">
              <div className="relative w-full aspect-[21/9] bg-muted border-b border-border/60 overflow-hidden">
                <img src={getCourseThumbnail(thumbnail, category, courseName)} alt={courseName} className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                <span className="absolute bottom-4 left-4 px-3 py-1 bg-white/95 backdrop-blur shadow-sm rounded-xl text-xs font-black uppercase text-[#0038A8] tracking-widest">
                  {category}
                </span>
              </div>
              <div className="p-6 space-y-3">
                <h2 className="text-lg font-black text-foreground tracking-tight select-none">Course Overview</h2>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                  {description || "No description provided for this course."}
                </p>
              </div>
            </div>

            {/* General section */}
            <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.01)] text-left space-y-4">
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider select-none">General</h2>
              <div className="flex items-center justify-between p-3.5 bg-[#f4f6fa]/60 hover:bg-[#eef2fa] border border-border/40 rounded-2xl transition-all shadow-sm">
                <div className="flex items-center gap-3.5 max-w-[80%]">
                  <div className="h-9 w-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-foreground">Announcements & Course News</span>
                    <span className="text-[10px] text-muted-foreground font-semibold">Critical course announcements and news.</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 font-bold text-[8px] rounded border uppercase">Forum</span>
              </div>
            </div>

            {/* Topic Outline */}
            <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.01)]">
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-6 select-none">Topic Outline</h2>
              {modules.length > 0 ? (
                <div className="space-y-4">
                  {modules.map((module, idx) => {
                    const isExpanded = !!expandedSyllabus[module.id];
                    return (
                      <div key={module.id} className="border border-border/80 rounded-2xl overflow-hidden shadow-sm bg-[#F7F8FA]/30">
                        <div className="flex items-center gap-3 px-4 py-3.5 bg-[#F7F8FA]/80 select-none">
                          <button onClick={() => toggleSyllabusExpand(module.id)} className="text-muted-foreground/60 hover:text-foreground shrink-0 transition-colors">
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                          <span className="text-xs font-black text-foreground truncate flex-1 text-left uppercase tracking-wide">
                            Topic {idx + 1}: {module.title}
                          </span>
                          <span className="px-2.5 py-1 bg-white border border-border/80 text-muted-foreground font-black text-[9px] rounded-lg shadow-sm">
                            {module.lessons?.length || 0} Activities
                          </span>
                        </div>
                        {isExpanded && (
                          <div className="p-5 border-t border-border/50 bg-card text-left space-y-5">
                            {module.description && (
                              <p className="text-xs text-muted-foreground leading-relaxed font-medium bg-muted/20 p-3.5 border rounded-2xl">{module.description}</p>
                            )}
                            <div className="space-y-3">
                              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Learning Activities & Resources</p>
                              <div className="space-y-2.5">
                                {module.lessons?.length > 0 ? module.lessons.map((lesson: any, lIdx: number) => (
                                  <div key={lesson.id} className="flex items-center justify-between p-3 bg-[#f8fafc]/50 border border-border/40 hover:border-border/80 rounded-2xl transition-all shadow-sm">
                                    <div className="flex items-center gap-3 max-w-[70%]">
                                      <div className="h-8 w-8 rounded-lg bg-[#0038A8]/10 dark:bg-[#0038A8]/20 flex items-center justify-center shrink-0">
                                        {renderActivityIcon(lesson.material_type || "article")}
                                      </div>
                                      <div className="flex flex-col gap-0.5">
                                        <span className="text-xs font-bold text-foreground truncate">Lecture {lIdx + 1}: {lesson.title}</span>
                                        {lesson.duration && <span className="text-[10px] text-muted-foreground font-semibold font-mono">Duration: {lesson.duration}</span>}
                                      </div>
                                    </div>
                                      <Link 
                                        href={
                                          role === "student"
                                            ? `/student/lessons/${lesson.id}?courseId=${courseId}&moduleId=${module.id}`
                                            : `/list/lessons/${lesson.id}?courseId=${courseId}&moduleId=${module.id}`
                                        }
                                      >
                                        <button 
                                          type="button" // 👈 Prevents accidental form submissions/page refreshes
                                          className="px-3 py-1.5 bg-[#0038A8]/10 hover:bg-[#0038A8]/20 border border-[#0038A8]/20 text-[#0038A8] font-bold text-[9px] rounded-lg shadow-sm transition-colors active:scale-[0.98]"
                                        >
                                          Enter Activity
                                        </button>
                                      </Link>
                                  </div>
                                )) : (
                                  <p className="text-xs text-muted-foreground italic">No learning resources in this topic.</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic text-center py-6">No syllabus topics registered.</p>
              )}
            </div>
          </div>

          {/* RIGHT: Sidebar */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-card border border-border/60 rounded-3xl p-5 text-left space-y-4">
              <div className="flex items-center gap-2 select-none pb-2 border-b">
                <CheckSquare className="h-4 w-4 text-[#0038A8]" />
                <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Course Completion</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-foreground">
                  <span>Progress</span>
                  <span className="text-[#0038A8]">{courseProgress}%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#0038A8] to-[#4f88ef] rounded-full" style={{ width: `${courseProgress}%` }} />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border/60 rounded-3xl p-5 text-left space-y-4">
              <div className="flex items-center gap-2 select-none pb-2 border-b">
                <Info className="h-4 w-4 text-[#0038A8]" />
                <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Course Admin</h3>
              </div>
              <div className="space-y-3">
                {[
                  { icon: <User className="h-4 w-4" />, label: "Instructor", value: instructorName, color: "bg-blue-50 text-[#0038A8]" },
                  { icon: <BookOpen className="h-4 w-4" />, label: "Course Code", value: courseCode, color: "bg-slate-100 text-slate-600", mono: true },
                  { icon: <Layers className="h-4 w-4" />, label: "Difficulty", value: difficulty, color: "bg-slate-100 text-slate-600", cap: true },
                ].map(({ icon, label, value, color, mono, cap }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-xl ${color} flex items-center justify-center shrink-0`}>{icon}</div>
                    <div>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase select-none">{label}</p>
                      <p className={`text-xs font-extrabold text-foreground ${mono ? "font-mono" : ""} ${cap ? "capitalize" : ""}`}>{value || "—"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick links */}
            {isTeacher && courseAssignments[0] && (
              <div className="bg-card border border-border/60 rounded-3xl p-5 text-left space-y-3">
                <div className="flex items-center gap-2 select-none pb-2 border-b">
                  <ClipboardList className="h-4 w-4 text-[#0038A8]" />
                  <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Quick Actions</h3>
                </div>
                <Link href={`/list/assignments/${courseAssignments[0].id}/submissions`}>
                  <button className="w-full text-left px-3 py-2.5 text-xs font-bold text-foreground hover:bg-muted border border-border/60 rounded-xl transition-colors flex items-center gap-2">
                    <CheckSquare className="h-3.5 w-3.5 text-[#0038A8]" />Review Submissions
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}