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

type Assignment = {
  id: number;
  title: string;
  description?: string;
  due_date?: string;
  total_marks: number;
  course_id: number;
};

function statusBadge(status: string) {
  switch (status) {
    case "graded":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "submitted":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "late":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export default function AssignmentSubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.id as string;

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // Grading state
  const [gradingId, setGradingId] = useState<number | null>(null);
  const [gradeScore, setGradeScore] = useState<string>("");
  const [gradeFeedback, setGradeFeedback] = useState<string>("");
  const [savingGrade, setSavingGrade] = useState(false);
  const [gradeMessage, setGradeMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [aRes, sRes] = await Promise.all([
        api.get(`/assignments/${assignmentId}`),
        api.get(`/submissions/reference/assignment/${assignmentId}`),
      ]);
      setAssignment(aRes.data);
      const raw = Array.isArray(sRes.data) ? sRes.data : sRes.data?.data ?? [];
      setSubmissions(raw);
    } catch (err) {
      console.error("Failed to load submissions:", err);
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const startGrading = (sub: Submission) => {
    setGradingId(sub.id);
    setGradeScore(sub.score != null ? String(sub.score) : "");
    setGradeFeedback(sub.feedback ?? "");
    setGradeMessage(null);
  };

  const cancelGrading = () => {
    setGradingId(null);
    setGradeScore("");
    setGradeFeedback("");
    setGradeMessage(null);
  };

  const submitGrade = async () => {
    if (!gradingId || !gradeScore.trim()) return;
    setSavingGrade(true);
    try {
      const fd = new FormData();
      fd.append("score", gradeScore);
      if (gradeFeedback) fd.append("feedback", gradeFeedback);
      await api.put(`/submissions/${gradingId}/grade`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setGradeMessage({ type: "success", text: "Grade saved and synced to gradebook." });
      await loadData();
      setTimeout(cancelGrading, 1200);
    } catch (err: any) {
      const detail = err?.response?.data?.detail || "Failed to save grade.";
      setGradeMessage({ type: "error", text: detail });
    } finally {
      setSavingGrade(false);
    }
  };

  // Stats
  const total = submissions.length;
  const graded = submissions.filter((s) => s.status === "graded").length;
  const pending = submissions.filter((s) => s.status === "submitted").length;
  const avgScore =
    graded > 0
      ? (submissions.filter((s) => s.score != null).reduce((acc, s) => acc + (s.score ?? 0), 0) / graded).toFixed(1)
      : null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F7F8FA]">
        <div className="h-10 w-10 border-4 border-[#0038A8] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold">Loading Submissions...</p>
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
        <Link href="/list/assignments" className="hover:text-foreground">Assignments</Link>
        <span>/</span>
        <span className="text-foreground">{assignment?.title || `Assignment #${assignmentId}`}</span>
        <span>/</span>
        <span className="text-foreground">Submissions</span>
      </div>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 bg-background border border-border hover:bg-accent rounded-xl shadow-sm transition-all active:scale-[0.96]"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <span className="text-xs font-extrabold text-[#0038A8] uppercase tracking-wider font-mono">
              Teacher Review Panel
            </span>
            <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight leading-tight mt-0.5">
              {assignment?.title || "Assignment Submissions"}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-semibold">
            Total marks: <span className="font-black text-foreground">{assignment?.total_marks ?? 100}</span>
          </span>
          {assignment?.due_date && (
            <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 font-bold text-xs rounded-xl">
              Due: {new Date(assignment.due_date).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Submissions", value: total, icon: <ClipboardList className="h-4 w-4" />, color: "text-[#0038A8] bg-blue-50 border-blue-100" },
          { label: "Pending Review", value: pending, icon: <Clock className="h-4 w-4" />, color: "text-amber-700 bg-amber-50 border-amber-100" },
          { label: "Graded", value: graded, icon: <CheckCircle className="h-4 w-4" />, color: "text-emerald-700 bg-emerald-50 border-emerald-100" },
          { label: "Average Score", value: avgScore ?? "—", icon: <Award className="h-4 w-4" />, color: "text-violet-700 bg-violet-50 border-violet-100" },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className={`bg-card border rounded-2xl p-4 text-left flex items-center gap-3 ${color}`}>
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>{icon}</div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider opacity-70">{label}</p>
              <p className="text-xl font-black leading-tight">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* GRADE MESSAGE */}
      {gradeMessage && (
        <div className={`flex items-center gap-2 p-4 rounded-2xl text-sm font-semibold border ${
          gradeMessage.type === "success"
            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
            : "bg-red-50 border-red-200 text-red-800"
        }`}>
          {gradeMessage.type === "success" ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          {gradeMessage.text}
        </div>
      )}

      {/* SUBMISSIONS TABLE */}
      <div className="bg-card border border-border/60 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.01)]">
        {submissions.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-bold">No submissions yet.</p>
            <p className="text-xs mt-1 opacity-70">Students who submit will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-[#F7F8FA]/80 text-[10px] uppercase tracking-wider text-muted-foreground font-black">
                  <th className="text-left py-3 px-4">Student</th>
                  <th className="text-left py-3 px-4">Submitted At</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Score</th>
                  <th className="text-left py-3 px-4">Grade</th>
                  <th className="text-left py-3 px-4">Attachment</th>
                  <th className="text-left py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {submissions.map((sub) => {
                  const isExpanded = expandedRow === sub.id;
                  const isGrading = gradingId === sub.id;
                  const maxMarks = assignment?.total_marks || 100;
                  const pct = sub.score != null
                    ? ((sub.score / maxMarks) * 100).toFixed(1)
                    : null;
                  const gradeLetter = pct != null
                    ? parseFloat(pct) >= 90 ? "A"
                    : parseFloat(pct) >= 80 ? "B"
                    : parseFloat(pct) >= 70 ? "C"
                    : parseFloat(pct) >= 60 ? "D"
                    : "F"
                    : null;

                  return (
                    <React.Fragment key={sub.id}>
                      <tr key={sub.id} className={`hover:bg-muted/20 transition-colors ${isExpanded ? "bg-muted/10" : ""}`}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="h-7 w-7 rounded-full bg-[#0038A8]/10 text-[#0038A8] flex items-center justify-center text-[10px] font-black shrink-0">
                              {(sub.student_name || sub.student_id || "?")[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-xs text-foreground">{sub.student_name || "—"}</p>
                              <p className="text-[10px] text-muted-foreground font-mono">{sub.student_code || sub.student_id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">
                          {new Date(sub.submitted_at).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded border uppercase ${statusBadge(sub.status)}`}>
                            {sub.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-xs">
                          {sub.score != null ? `${sub.score} / ${assignment?.total_marks || 100}` : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="py-3 px-4">
                          {gradeLetter ? (
                            <span className={`px-2.5 py-0.5 text-xs font-black rounded border ${
                              gradeLetter === "A" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                              gradeLetter === "B" ? "bg-blue-50 text-blue-700 border-blue-200" :
                              gradeLetter === "C" ? "bg-amber-50 text-amber-700 border-amber-200" :
                              gradeLetter === "D" ? "bg-orange-50 text-orange-700 border-orange-200" :
                              "bg-red-50 text-red-700 border-red-200"
                            }`}>{gradeLetter}</span>
                          ) : <span className="text-muted-foreground text-xs">—</span>}
                        </td>
                        <td className="py-3 px-4">
                          {sub.submission_file ? (
                            <a
                              href={getImageUrl(sub.submission_file) || "#"}
                              download
                              className="flex items-center gap-1 text-[10px] font-bold text-[#0038A8] hover:underline"
                            >
                              <Download className="h-3.5 w-3.5" />Download
                            </a>
                          ) : <span className="text-muted-foreground text-xs">—</span>}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => startGrading(sub)}
                              disabled={sub.status === "graded" && gradingId !== sub.id}
                              className="px-2.5 py-1 text-[10px] font-black bg-[#8b5cf6]/10 text-[#8b5cf6] border border-[#8b5cf6]/20 rounded-lg hover:bg-[#8b5cf6]/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              {sub.status === "graded" ? "Re-grade" : "Grade"}
                            </button>
                            <button
                              onClick={() => setExpandedRow(isExpanded ? null : sub.id)}
                              className="p-1 text-muted-foreground hover:text-foreground border border-border/60 rounded-lg bg-background"
                            >
                              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* EXPANDED: submission text + inline grading form */}
                      {isExpanded && (
                        <tr key={`${sub.id}-expanded`}>
                          <td colSpan={7} className="px-4 pb-4 bg-muted/10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                              {/* Submission content */}
                              <div className="bg-card border border-border/60 rounded-2xl p-4 space-y-2">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                  <User className="h-3 w-3" />Student Response
                                </p>
                                {sub.submission_text ? (
                                  <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap font-medium">{sub.submission_text}</p>
                                ) : (
                                  <p className="text-xs text-muted-foreground italic">No text response provided.</p>
                                )}
                                {sub.feedback && (
                                  <div className="mt-3 pt-3 border-t border-border/50">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-1">
                                      <MessageSquare className="h-3 w-3" />Teacher Feedback
                                    </p>
                                    <p className="text-xs text-foreground mt-1 leading-relaxed">{sub.feedback}</p>
                                  </div>
                                )}
                              </div>

                              {/* Grade form */}
                              {isGrading ? (
                                <div className="bg-card border border-[#8b5cf6]/20 rounded-2xl p-4 space-y-3">
                                  <p className="text-[10px] font-black text-[#8b5cf6] uppercase tracking-wider">Grade Submission</p>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wide">
                                      Score (out of {assignment?.total_marks || 100})
                                    </label>
                                    <input
                                      type="number"
                                      value={gradeScore}
                                      onChange={(e) => setGradeScore(e.target.value)}
                                      min={0}
                                      max={assignment?.total_marks || 100}
                                      className="w-full px-3 py-2 bg-muted/30 border border-border/80 focus:border-[#8b5cf6]/40 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#8b5cf6]/20 font-bold"
                                      placeholder="e.g. 85"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wide">
                                      Feedback (optional)
                                    </label>
                                    <textarea
                                      rows={3}
                                      value={gradeFeedback}
                                      onChange={(e) => setGradeFeedback(e.target.value)}
                                      placeholder="Write instructor remarks..."
                                      className="w-full px-3 py-2 bg-muted/30 border border-border/80 focus:border-[#8b5cf6]/40 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#8b5cf6]/20 leading-relaxed"
                                    />
                                  </div>
                                  <div className="flex gap-2 pt-1">
                                    <button
                                      onClick={submitGrade}
                                      disabled={savingGrade || !gradeScore}
                                      className="flex items-center gap-1.5 px-4 py-2 bg-[#8b5cf6] text-white font-bold text-xs rounded-xl hover:bg-[#7c3aed] transition-colors disabled:opacity-50"
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                      {savingGrade ? "Saving..." : "Save Grade"}
                                    </button>
                                    <button
                                      onClick={cancelGrading}
                                      className="flex items-center gap-1.5 px-4 py-2 bg-muted text-muted-foreground font-bold text-xs rounded-xl hover:bg-muted/80 border border-border transition-colors"
                                    >
                                      <X className="h-3.5 w-3.5" />Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-muted/20 border border-border/40 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 text-center">
                                  <Award className="h-8 w-8 text-muted-foreground/30" />
                                  <p className="text-xs font-bold text-muted-foreground">Click &quot;Grade&quot; to evaluate this submission</p>
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
