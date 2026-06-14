"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { getImageUrl } from "@/lib/image-url";
import BackButton from "@/components/BackButton";
import { 
  Globe, FileText, Upload, CheckCircle, Info, Download, 
  Calendar, Award, MessageSquare, AlertCircle
} from "lucide-react";
import { toast } from "react-toastify";

type Assignment = {
  id: number;
  title: string;
  description?: string;
  due_date?: string;
  total_marks: number;
  course_id: number;
};

type Submission = {
  id: number;
  submission_file?: string;
  submission_text?: string;
  status: string; // submitted, graded, late
  score?: number;
  feedback?: string;
  submitted_at: string;
  graded_at?: string;
};

export default function AssignmentSubmissionPage({ params }: { params: { id: string } }) {
  const assignmentId = parseInt(params.id);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  
  const [submissionText, setSubmissionText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Helper to extract authentication cookie tokens
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

      // Fetch assignment metadata
      const assignRes = await api.get(`/assignments/${assignmentId}`);
      setAssignment(assignRes.data);

      // Fetch existing student submissions for this reference
      const subRes = await api.get(`/submissions/reference/assignment/${assignmentId}`);
      const subData = subRes.data || [];
      
      if (subData.length > 0) {
        const latestSub = subData[0];
        setSubmission(latestSub);
        setSubmissionText(latestSub.submission_text || "");
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [assignmentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submission && submission.status === "graded") {
      toast.error("You cannot resubmit homework that has already been graded by your instructor.");
      return;
    }

    try {
      setSubmitting(true);

      const fd = new FormData();
      fd.append("submission_type", "assignment");
      fd.append("reference_id", String(assignmentId));
      if (submissionText) {
        fd.append("submission_text", submissionText);
      }
      if (selectedFile) {
        fd.append("file", selectedFile);
      }

      const res = await api.post(`/submissions`, fd, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      setSubmission(res.data);
      toast.success("Homework submitted successfully! You can edit this submission before grading if needed.");
      setSelectedFile(null);
      setSubmitting(false);
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.detail || err.message || "An error occurred while uploading your homework.";
      toast.error(errMsg);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F7F8FA] flex-col gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0038A8]"></div>
        <p className="text-sm font-semibold text-muted-foreground">Loading homework workspace...</p>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 text-red-800 rounded-xl m-6 flex flex-col gap-3 max-w-xl mx-auto text-left">
        <AlertCircle className="h-10 w-10 text-red-600" />
        <h1 className="text-xl font-bold">Assignment Not Found</h1>
        <p className="text-sm">We could not locate the details for assignment #{assignmentId}.</p>
        <Link href="/list/assignments" className="mt-2 text-sm font-bold text-blue-600 underline">
          Back to Assignments List
        </Link>
      </div>
    );
  }

  const formattedDueDate = assignment.due_date 
    ? new Date(assignment.due_date).toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
      })
    : "No deadline specified";

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen relative font-sans text-left">
      {/* MOODLE BREADCRUMB */}
      <div className="flex items-center gap-1 text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider mb-2 select-none">
        <Link href="/" className="hover:text-foreground flex items-center gap-1">
          <Globe className="h-3 w-3" />
          Home
        </Link>
        <span>/</span>
        <Link href="/list/assignments" className="hover:text-foreground">
          Assignments
        </Link>
        <span>/</span>
        <span className="text-foreground">Submit Homework</span>
      </div>

      {/* HEADER SECTION */}
      <div className="flex items-center gap-4 select-none mb-6">
        <BackButton />
        <div>
          <span className="text-xs font-extrabold text-[#0038A8] uppercase tracking-wider font-mono">
            Assignment Submission Portal
          </span>
          <h1 className="text-xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-tight mt-0.5">
            Submit: {assignment.title}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: SUBMISSION FORM */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card text-card-foreground border border-border p-6 rounded-2xl shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-gray-900">Task Instructions</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed whitespace-pre-wrap">
                {assignment.description || "Review resources, complete the prescribed tasks, and compile your answers. Attach handbooks, source repositories, or write inline responses below."}
              </p>
            </div>

            {submission?.status === "graded" ? (
              <div className="p-4 bg-muted/40 border border-border/80 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-foreground uppercase tracking-wider">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  Syllabus Status: Homework Graded
                </div>
                <p className="text-sm text-muted-foreground">
                  This homework assignment has already been evaluated by your instructor. Modifications are locked.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Text Response Workspace */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="response" className="text-xs font-black text-foreground uppercase tracking-wider select-none">
                    Inline Response / Text Workspace
                  </label>
                  <textarea
                    id="response"
                    rows={8}
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    placeholder="Enter your essay, summary comments, or online URL links here..."
                    className="w-full p-4 border border-border focus:ring-1 focus:ring-[#0038A8] focus:border-[#0038A8] rounded-xl text-sm transition-all focus:outline-none dark:bg-muted"
                  />
                </div>

                {/* File Dropzone */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-black text-foreground uppercase tracking-wider select-none">
                    Attach Homework Files (Max 10MB)
                  </span>
                  
                  {submission?.submission_file && (
                    <div className="p-3 bg-muted/30 border border-border/60 rounded-xl flex items-center justify-between text-xs font-semibold text-foreground">
                      <span className="flex items-center gap-2 truncate pr-2">
                        <FileText className="h-4 w-4 text-rose-600" />
                        <span className="truncate">Current file: {submission.submission_file.split("_").slice(1).join("_") || "Uploaded Homework Document"}</span>
                      </span>
                      <a
                        href={getImageUrl(submission.submission_file) || "#"}
                        download
                        className="p-1.5 hover:bg-muted rounded text-muted-foreground flex items-center gap-1.5 border border-border"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Download</span>
                      </a>
                    </div>
                  )}

                  <div className="border-2 border-dashed border-border/80 hover:border-[#0038A8]/60 bg-muted/10 hover:bg-muted/30 p-6 rounded-2xl transition-all flex flex-col items-center justify-center cursor-pointer relative overflow-hidden select-none">
                    <input
                      type="file"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="h-8 w-8 text-muted-foreground/60 mb-2" />
                    <span className="text-sm font-bold text-foreground">
                      {selectedFile ? selectedFile.name : "Browse / Drop Homework File Here"}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      {selectedFile 
                        ? `${round(selectedFile.size / (1024 * 1024), 2)}MB` 
                        : "Supports PDF, DOCX, ZIP, PPTX, and Images up to 10MB"}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full md:w-auto px-4 py-2 bg-[#0038A8] text-white hover:bg-[#002D86] disabled:bg-muted disabled:text-muted-foreground font-black text-xs rounded-xl shadow-md transition-all active:scale-[0.98]"
                >
                  {submitting ? "Uploading Homework..." : (submission ? "Save Changes / Resubmit" : "Submit Homework")}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ASSIGNMENT DETAILS & EVALUATION */}
        <div className="space-y-6">
          {/* DEADLINE METRICS */}
          <div className="bg-white border border-border p-6 rounded-2xl shadow-sm text-left select-none space-y-4">
            <span className="text-[10px] font-black text-indigo-650 uppercase tracking-widest block">
              Submission Details
            </span>
            
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Due Deadline</h4>
                <p className="text-sm font-black text-gray-900 mt-0.5">{formattedDueDate}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Award className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Total Available</h4>
                <p className="text-sm font-black text-gray-900 mt-0.5">{assignment.total_marks || 100} Marks</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Grading Status</h4>
                <span className={`inline-block text-[10px] font-extrabold px-2.5 py-0.5 rounded-full mt-1 uppercase ${
                  submission?.status === "graded"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                    : submission?.status === "submitted"
                    ? "bg-blue-50 text-blue-700 border border-blue-100"
                    : "bg-amber-50 text-amber-700 border border-amber-100"
                }`}>
                  {submission?.status || "Not Submitted"}
                </span>
              </div>
            </div>
          </div>

          {/* TEACHER EVALUATION & FEEDBACK FEED */}
          {submission?.status === "graded" && (
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 p-6 rounded-2xl shadow-sm text-left select-none space-y-4">
              <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest block">
                Instructor Grading Summary
              </span>

              <div className="flex items-baseline gap-1 text-2xl font-black text-indigo-950">
                <span>Score:</span>
                <span className="text-3xl text-indigo-600">{submission.score}</span>
                <span className="text-sm font-bold text-indigo-400">/ {assignment.total_marks || 100}</span>
              </div>

              {submission.feedback && (
                <div className="space-y-1.5 border-t border-indigo-200/60 pt-3">
                  <h4 className="text-xs font-extrabold text-indigo-950 flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Teacher Remarks
                  </h4>
                  <p className="text-xs text-indigo-850 leading-relaxed font-sans whitespace-pre-wrap bg-white/60 p-3 rounded-lg border border-indigo-200/40">
                    {submission.feedback}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Math round utility
function round(value: number, precision: number) {
  const multiplier = Math.pow(10, precision || 0);
  return Math.round(value * multiplier) / multiplier;
}
