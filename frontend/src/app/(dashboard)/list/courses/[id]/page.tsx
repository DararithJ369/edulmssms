"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import BackButton from "@/components/BackButton";
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
} from "lucide-react";
import { api } from "@/lib/api";
import { getImageUrl } from "@/lib/image-url";

// ── Grade utilities ────────────────────────────────────────────────────────
function gradePillClass(grade: string | null | undefined) {
  switch ((grade || "").toUpperCase()) {
    case "A": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "B": return "bg-blue-50 text-blue-700 border-blue-200";
    case "C": return "bg-amber-50 text-amber-700 border-amber-200";
    case "D": return "bg-orange-50 text-orange-700 border-orange-200";
    case "E": return "bg-rose-50 text-rose-600 border-rose-200";
    case "F": return "bg-red-50 text-red-700 border-red-200";
    default:  return "bg-muted text-muted-foreground border-border";
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

  const tabParam = searchParams.get("tab") as "course" | "participants" | "grades" | "analytics" | null;
  const [activeTab, setActiveTab] = useState<"course" | "participants" | "grades" | "analytics">(
    tabParam && ["course", "participants", "grades", "analytics"].includes(tabParam) ? tabParam : "course"
  );
  const [role, setRole] = useState<string>("");

  useEffect(() => {
    const currentTab = searchParams.get("tab") as "course" | "participants" | "grades" | "analytics" | null;
    if (currentTab && ["course", "participants", "grades", "analytics"].includes(currentTab)) {
      setActiveTab(currentTab);
    }
  }, [searchParams]);

  // Course data
  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Computer Science");
  const [difficulty, setDifficulty] = useState("beginner");
  const [thumbnail, setThumbnail] = useState(
    "https://images.unsplash.com/photo-1610962381137-50ef93055125?auto=format&fit=crop&q=80&w=800"
  );
  const [instructorName, setInstructorName] = useState("");
  const [courseAssignments, setCourseAssignments] = useState<any[]>([]);

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
          if (data.thumbnail) setThumbnail(data.thumbnail);
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
        } catch (err) {
          console.warn("Failed to pre-fetch course assignments:", err);
        }
      } catch (err) {
        console.error("Failed to load course:", err);
        setModules([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId, activeModuleIdParam]);

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

  const toggleSyllabusExpand = (id: number) =>
    setExpandedSyllabus((prev) => ({ ...prev, [id]: !prev[id] }));

  const renderActivityIcon = (type: string) => {
    switch (type) {
      case "file": return <FileUp className="h-4 w-4 text-emerald-600 shrink-0" />;
      case "url":  return <ExternalLink className="h-4 w-4 text-amber-600 shrink-0" />;
      default:     return <BookOpen className="h-4 w-4 text-sky-600 shrink-0" />;
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
      const fd = new FormData();
      fd.append("score", editScore);
      if (editFeedback) fd.append("feedback", editFeedback);
      await api.put(`/results/${resultId}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
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
              <BackButton />
              <div>
                <span className="text-xs font-extrabold text-[#0038A8] uppercase tracking-wider font-mono">
                  {courseCode} • {category}
                </span>
                <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight leading-tight mt-0.5">
                  {courseName}
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* TAB BAR */}
        <div className="flex border-b border-border/60 gap-6 select-none text-xs font-extrabold text-muted-foreground pt-2">
          {(["course", "participants", "grades", ...(role === "teacher" || role === "admin" ? ["analytics" as const] : [])] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`pb-3 border-b-2 transition-colors capitalize flex items-center gap-1.5 ${
                activeTab === tab ? "border-[#0038A8] text-foreground" : "border-transparent hover:text-foreground"
              }`}
            >
              {tab === "course" && <BookOpen className="h-3 w-3" />}
              {tab === "participants" && <Users className="h-3 w-3" />}
              {tab === "grades" && <BarChart2 className="h-3 w-3" />}
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
                    <th className="text-left py-2 px-3">Username</th>
                    <th className="text-left py-2 px-3">Email</th>
                    <th className="text-left py-2 px-3">Enrolled</th>
                    <th className="text-left py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {participants.map((p: any) => (
                    <tr key={p.id ?? p.student_id} className="hover:bg-muted/20 transition-colors group">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-[#0038A8]/10 text-[#0038A8] flex items-center justify-center text-[10px] font-black shrink-0">
                            {(p.full_name || p.username || "?")[0].toUpperCase()}
                          </div>
                          <span className="font-bold text-foreground text-xs">{p.full_name || p.username || "—"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground font-mono text-xs">{p.username || "—"}</td>
                      <td className="py-3 px-3 text-muted-foreground text-xs">{p.email || "—"}</td>
                      <td className="py-3 px-3 text-muted-foreground text-xs">{p.enrolled_date ? new Date(p.enrolled_date).toLocaleDateString() : "—"}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded border uppercase ${
                          p.is_active !== false ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"
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
      {activeTab === "grades" && (
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
                {isTeacher && courseAssignments.length > 0 && (
                  <Link href={`/list/assignments/${courseAssignments[0]?.id}/submissions`}>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-[#8b5cf6] hover:text-[#7c3aed] border border-[#8b5cf6]/20 bg-[#8b5cf6]/5 rounded-xl transition-colors">
                      <ClipboardList className="h-3.5 w-3.5" />
                      Review Submissions
                    </button>
                  </Link>
                )}
                {grades.length > 0 && (
                  <button
                    onClick={() => exportCSV(grades, courseName)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-muted-foreground hover:text-foreground border border-border/60 bg-background rounded-xl transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export CSV
                  </button>
                )}
              </div>
            </div>

            {/* Grade legend */}
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              {["A","B","C","D","F"].map((g) => (
                <span key={g} className={`px-2.5 py-0.5 text-[10px] font-black rounded border ${gradePillClass(g)}`}>
                  {g} {g==="A"?"≥90%":g==="B"?"≥80%":g==="C"?"≥70%":g==="D"?"≥60%":"<60%"}
                </span>
              ))}
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
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60 bg-[#F7F8FA]/80 text-[10px] uppercase tracking-wider text-muted-foreground font-black">
                      {isTeacher && <th className="text-left py-3 px-4">Student</th>}
                      <th className="text-left py-3 px-4">Assessment</th>
                      <th className="text-left py-3 px-4">Score</th>
                      <th className="text-left py-3 px-4">%</th>
                      <th className="text-left py-3 px-4">Grade</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Feedback</th>
                      {isTeacher && <th className="text-left py-3 px-4">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {grades.map((g: any) => (
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
                            g.is_passed ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"
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
                                  className="p-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50"
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
                  { label: "Enrolled", value: analyticsData.enrolled_students, color: "text-[#0038A8]" },
                  { label: "Attendance", value: `${analyticsData.attendance_rate}%`, color: "text-emerald-600" },
                  { label: "Avg Grade", value: `${analyticsData.avg_grade_percentage}%`, color: "text-amber-600" },
                  { label: "Pass / Fail", value: `${analyticsData.pass_count} / ${analyticsData.fail_count}`, color: "text-foreground" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-card border border-border/60 rounded-2xl p-4 text-center">
                    <p className={`text-2xl font-black ${color}`}>{value}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">{label}</p>
                  </div>
                ))}
              </div>

              {/* Grade Distribution */}
              <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm">
                <h3 className="text-sm font-black text-foreground uppercase tracking-wider mb-4">Grade Distribution</h3>
                <div className="flex items-end gap-3 h-40">
                  {Object.entries(analyticsData.grade_distribution || {}).map(([grade, count]) => {
                    const total = Object.values(analyticsData.grade_distribution || {}).reduce((s: number, v: any) => s + (v as number), 0) as number;
                    const pct = total > 0 ? ((count as number) / total) * 100 : 0;
                    const colors: Record<string, string> = { A: "bg-emerald-500", B: "bg-blue-500", C: "bg-amber-500", D: "bg-orange-500", F: "bg-red-500" };
                    return (
                      <div key={grade} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-xs font-black text-muted-foreground">{count as number}</span>
                        <div className="w-full rounded-t-lg transition-all" style={{ height: `${Math.max(pct, 4)}%` }}>
                          <div className={`w-full h-full rounded-t-lg ${colors[grade] || "bg-muted"}`} />
                        </div>
                        <span className="text-xs font-black">{grade}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quiz Performance */}
              {analyticsData.quiz_stats?.length > 0 && (
                <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-sm font-black text-foreground uppercase tracking-wider mb-4">Quiz Performance</h3>
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
                  <h3 className="text-sm font-black text-foreground uppercase tracking-wider mb-4">Assignment Completion</h3>
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
              <div className="relative aspect-[21/9] w-full bg-muted border-b border-border/60">
                <img src={getImageUrl(thumbnail) || "https://images.unsplash.com/photo-1610962381137-50ef93055125?auto=format&fit=crop&q=80&w=800"} alt={courseName} className="h-full w-full object-cover" />
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
                                      <div className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                                        {renderActivityIcon(lesson.material_type || "article")}
                                      </div>
                                      <div className="flex flex-col gap-0.5">
                                        <span className="text-xs font-bold text-foreground truncate">Lecture {lIdx + 1}: {lesson.title}</span>
                                        {lesson.duration && <span className="text-[10px] text-muted-foreground font-semibold font-mono">Duration: {lesson.duration}</span>}
                                      </div>
                                    </div>
                                    <Link href={`/list/lessons/${lesson.id}?courseId=${courseId}&moduleId=${module.id}`}>
                                      <button className="px-3 py-1.5 bg-[#0038A8]/10 hover:bg-[#0038A8]/20 border border-[#0038A8]/20 text-[#0038A8] font-bold text-[9px] rounded-lg shadow-sm transition-colors active:scale-[0.98]">
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
                  <span className="text-[#0038A8]">100%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#0038A8] to-[#4f88ef] rounded-full" style={{ width: "100%" }} />
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
                  { icon: <BookOpen className="h-4 w-4" />, label: "Course Code", value: courseCode, color: "bg-emerald-50 text-emerald-600", mono: true },
                  { icon: <Layers className="h-4 w-4" />, label: "Difficulty", value: difficulty, color: "bg-amber-50 text-amber-600", cap: true },
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