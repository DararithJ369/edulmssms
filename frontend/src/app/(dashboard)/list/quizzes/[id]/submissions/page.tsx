"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Globe,
  ArrowLeft,
  ClipboardList,
  CheckCircle,
  Clock,
  AlertCircle,
  Check,
  X,
  Download,
  User,
  Award,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { api } from "@/lib/api";
import { getImageUrl } from "@/lib/image-url";

type Submission = {
  id: number;
  student_id: string;
  student_name?: string;
  student_code?: string;
  submission_text?: string;
  submission_file?: string;
  status: string;
  score?: number | null;
  feedback?: string | null;
  submitted_at: string;
  graded_at?: string | null;
};

type Quiz = {
  id: number;
  title: string;
  description?: string;
  total_marks: number;
  course_id: number;
};

function statusBadge(status: string) {
  switch (status?.toLowerCase()) {
    case "graded":
      return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400";
    case "submitted":
      return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400";
    case "late":
      return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-neutral-800 dark:text-neutral-400";
  }
}

export default function QuizSubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.id as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // Grading State
  const [gradingId, setGradingId] = useState<number | null>(null);
  const [gradeScore, setGradeScore] = useState<string>("");
  const [gradeFeedback, setGradeFeedback] = useState<string>("");
  const [savingGrade, setSavingGrade] = useState(false);
  const [gradeMessage, setGradeMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [qRes, sRes] = await Promise.all([
        api.get(`/quizzes/${quizId}`),
        api.get(`/submissions/reference/quiz/${quizId}`),
      ]);
      setQuiz(qRes.data);
      const raw = Array.isArray(sRes.data) ? sRes.data : sRes.data?.data ?? [];
      setSubmissions(raw);
    } catch (err) {
      console.error("Failed to load submissions:", err);
    } finally {
      setLoading(false);
    }
  }, [quizId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const startGrading = (sub: Submission) => {
    setGradingId(sub.id);
    setGradeScore(sub.score != null ? String(sub.score) : "");
    setGradeFeedback(sub.feedback ?? "");
    setGradeMessage(null);
    setExpandedRow(sub.id);
  };

  const cancelGrading = () => {
    setGradingId(null);
    setGradeScore("");
    setGradeFeedback("");
    setGradeMessage(null);
  };

  const submitGrade = async () => {
    if (!gradingId) return;

    const parsedScore = parseFloat(String(gradeScore).trim());
    if (isNaN(parsedScore)) {
      setGradeMessage({ type: "error", text: "Please enter a valid numeric score." });
      return;
    }

    const maxMarks = quiz?.total_marks || 100;
    if (parsedScore < 0 || parsedScore > maxMarks) {
      setGradeMessage({ type: "error", text: `Score boundary violation. Must be between 0 and ${maxMarks}.` });
      return;
    }

    setSavingGrade(true);
    setGradeMessage(null);

    try {
      const fd = new FormData();
      fd.append("score", String(parsedScore));
      if (gradeFeedback.trim() !== "") {
        fd.append("feedback", gradeFeedback.trim());
      }

      await api.put(`/submissions/${gradingId}/grade`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Update state optimistically
      setSubmissions((prevSubmissions) =>
        prevSubmissions.map((sub) => {
          if (sub.id === gradingId) {
            return {
              ...sub,
              score: parsedScore,
              feedback: gradeFeedback.trim() || null,
              status: "graded"
            };
          }
          return sub;
        })
      );

      setGradeMessage({ type: "success", text: "Grade successfully saved and synced to gradebook." });
      await loadData();
      
      setTimeout(() => {
        cancelGrading();
        setExpandedRow(null);
      }, 1200);
    } catch (err: any) {
      const detail = err?.response?.data?.detail || "Failed to save grade.";
      setGradeMessage({ type: "error", text: detail });
    } finally {
      setSavingGrade(false);
    }
  };

  // Metrics calculation
  const total = submissions.length;
  const graded = submissions.filter((s) => s.status?.toLowerCase() === "graded").length;
  const pending = submissions.filter((s) => s.status?.toLowerCase() === "submitted").length;
  const avgScore =
    graded > 0
      ? (submissions.filter((s) => s.score != null && s.status?.toLowerCase() === "graded").reduce((acc, s) => acc + (s.score ?? 0), 0) / graded).toFixed(1)
      : null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F7F8FA]">
        <div className="h-10 w-10 border-4 border-[#0038A8] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold">Loading Submissions Database...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen font-sans text-left">
      {/* BREADCRUMB */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wider font-bold select-none">
        <Link href="/" className="hover:text-foreground flex items-center gap-1">
          <Globe className="h-3 w-3" />Home
        </Link>
        <span>/</span>
        <Link href="/list/quizzes" className="hover:text-foreground">Quizzes</Link>
        <span>/</span>
        <span className="text-foreground max-w-[200px] truncate">{quiz?.title || `Quiz #${quizId}`}</span>
        <span>/</span>
        <span className="text-foreground">Submissions</span>
      </div>

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 bg-background border border-border/80 hover:bg-accent rounded-xl shadow-sm transition-all">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <span className="text-xs font-extrabold text-[#0038A8] uppercase tracking-wider font-mono">Teacher Review Panel</span>
            <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tight mt-0.5">{quiz?.title || "Quiz Submissions"}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-background px-4 py-2 border border-border/60 rounded-xl shadow-sm">
          <span className="text-xs text-muted-foreground font-bold">Total marks: <span className="font-black text-foreground">{quiz?.total_marks ?? 100}</span></span>
        </div>
      </div>

      {/* METRIC KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        {[
          { label: "Total Submissions", value: total, icon: <ClipboardList className="h-4 w-4" />, color: "text-[#0038A8] bg-blue-50/60 border-blue-100" },
          { label: "Pending Review", value: pending, icon: <Clock className="h-4 w-4" />, color: "text-amber-700 bg-amber-50/60 border-amber-100" },
          { label: "Graded", value: graded, icon: <CheckCircle className="h-4 w-4" />, color: "text-emerald-700 bg-emerald-50/60 border-emerald-100" },
          { label: "Average Score", value: avgScore ? `${avgScore}` : "—", icon: <Award className="h-4 w-4" />, color: "text-purple-700 bg-purple-50/60 border-purple-100" },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-card border border-border/50 rounded-2xl p-4 text-left flex items-center gap-3 shadow-sm">
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${color} border`}>{icon}</div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/80">{label}</p>
              <p className="text-xl font-black text-gray-900 mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {gradeMessage && (
        <div className={`flex items-center gap-2 p-4 rounded-2xl text-sm font-semibold border ${gradeMessage.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"}`}>
          {gradeMessage.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />} {gradeMessage.text}
        </div>
      )}

      {/* SUBMISSIONS REGISTRY TABLE */}
      <div className="bg-card border border-border/60 rounded-3xl overflow-hidden shadow-sm">
        {submissions.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-bold">No submissions yet.</p>
          </div>
        ) : (
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
              <tbody className="divide-y divide-border/40 font-medium">
                {submissions.map((sub) => {
                  const isExpanded = expandedRow === sub.id;
                  const isGrading = gradingId === sub.id;
                  const maxMarks = quiz?.total_marks || 100;
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
                        <td className="py-4 px-4"><span className={`px-2 py-0.5 text-[9px] font-black rounded border tracking-wide uppercase ${statusBadge(sub.status)}`}>{sub.status}</span></td>
                        <td className="py-4 px-4 font-bold text-xs font-sans">{sub.score != null ? <span>{sub.score} <span className="text-muted-foreground/60 font-medium">/ {maxMarks}</span></span> : <span className="text-muted-foreground/40 font-normal">—</span>}</td>
                        <td className="py-4 px-4">
                          {gradeLetter ? (
                            <span className={`px-2 py-0.5 text-[10px] font-black rounded border ${gradeLetter === "A" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : gradeLetter === "B" ? "bg-blue-50 text-blue-700 border-blue-200" : gradeLetter === "C" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-red-50 text-red-700 border-red-200"}`}>{gradeLetter}</span>
                          ) : <span className="text-muted-foreground/40 text-xs">—</span>}
                        </td>
                        <td className="py-4 px-4">
                          {sub.submission_file ? (
                            <a href={getImageUrl(sub.submission_file) || "#"} download className="inline-flex items-center gap-1 text-[10px] font-black text-[#0038A8] hover:underline">
                              <Download className="h-3.5 w-3.5" /> Download
                            </a>
                          ) : <span className="text-muted-foreground/40 text-xs">—</span>}
                        </td>
                        <td className="py-4 px-5 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => startGrading(sub)}
                              disabled={savingGrade || (gradingId !== null && gradingId !== sub.id)}
                              className="px-3 py-1 text-[10px] font-black bg-[#8b5cf6]/10 text-[#8b5cf6] border border-[#8b5cf6]/20 rounded-lg hover:bg-[#8b5cf6]/20 transition-all uppercase tracking-wider shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              {sub.status?.toLowerCase() === "graded" ? "Re-grade" : "Grade"}
                            </button>
                            <button onClick={() => setExpandedRow(isExpanded ? null : sub.id)} className="p-1.5 text-muted-foreground hover:text-foreground border border-border/60 rounded-lg bg-background shadow-sm">
                              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* EXPANDED INTERFACE FRAMEWORK */}
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
                                ) : <p className="text-xs text-muted-foreground/60 italic p-2">No text response payload provided.</p>}
                              </div>

                              {isGrading ? (
                                <div className="bg-card border border-[#8b5cf6]/30 rounded-2xl p-5 space-y-4 shadow-sm text-left">
                                  <p className="text-[10px] font-black text-[#8b5cf6] uppercase tracking-wider flex items-center gap-1 border-b pb-1.5 border-[#8b5cf6]/10">
                                    <Award className="h-3.5 w-3.5" /> Assessment Grading Canvas
                                  </p>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wide">Score Obtained (Scale Max: {maxMarks})</label>
                                    <input type="number" value={gradeScore} onChange={(e) => setGradeScore(e.target.value)} min={0} max={maxMarks} className="w-full max-w-[140px] px-3 py-2 bg-muted/20 border border-border/80 focus:border-[#8b5cf6]/40 rounded-xl text-sm font-bold font-sans outline-none" />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wide">Instructor Feedback & Remarks</label>
                                    <textarea rows={3} value={gradeFeedback} onChange={(e) => setGradeFeedback(e.target.value)} placeholder="Provide instructional feedback commentary..." className="w-full px-3 py-2 bg-muted/20 border border-border/80 focus:border-[#8b5cf6]/40 rounded-xl text-xs leading-relaxed font-medium outline-none" />
                                  </div>
                                  <div className="flex gap-2 pt-1 select-none">
                                    <button onClick={submitGrade} disabled={savingGrade || !gradeScore.trim()} className="flex items-center gap-1.5 px-4 py-2 bg-[#8b5cf6] text-white font-black text-xs rounded-xl hover:bg-[#7c3aed] transition-all disabled:opacity-50 uppercase tracking-wider shadow-sm">
                                      <Check className="h-3.5 w-3.5" /> {savingGrade ? "Saving..." : "Save Evaluation"}
                                    </button>
                                    <button onClick={cancelGrading} className="flex items-center gap-1.5 px-3 py-2 bg-background border border-border text-muted-foreground font-bold text-xs rounded-xl hover:bg-muted transition-all">
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
        )}
      </div>
    </div>
  );
}