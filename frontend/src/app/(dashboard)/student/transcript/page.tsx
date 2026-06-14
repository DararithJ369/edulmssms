"use client";

import { useEffect, useState } from "react";
import { Award, BookOpen, CheckCircle2, AlertCircle, Printer, Download, ExternalLink, ShieldCheck, HelpCircle } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "react-toastify";

type CourseGpa = {
  course_id: number;
  course_name: string;
  course_code: string;
  academic_year: string;
  term: string;
  credits: number;
  percentage: number;
  grade: string;
  gpa_points: number;
};

type SemesterTranscript = {
  academic_year: string;
  term: string;
  term_gpa: number;
  term_credits: number;
  courses: CourseGpa[];
};

type TranscriptData = {
  student_id: string;
  cumulative_gpa: number;
  total_credits: number;
  passed_subjects: number;
  failed_subjects: number;
  semesters: SemesterTranscript[];
};

type CertificateItem = {
  id: number;
  certificate_id: number;
  student_id: string;
  course_id: number;
  course_name: string;
  course_code: string;
  issued_date: string;
  completion_date: string;
  credential_id: string;
  status: string;
};

type EnrolledCourseProgress = {
  course_id: number;
  course_name: string;
  description: string;
  image: string;
  progress_percentage: number;
};

export default function StudentTranscriptPage() {
  const [transcript, setTranscript] = useState<TranscriptData | null>(null);
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [coursesProgress, setCoursesProgress] = useState<EnrolledCourseProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("transcript");
  
  // Certificate Preview Modal State
  const [previewCert, setPreviewCert] = useState<CertificateItem | null>(null);
  const [studentName, setStudentName] = useState("");
  const [role, setRole] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const studentId = localStorage.getItem("user_id");
      const savedName = localStorage.getItem("user_name") || "Student";
      const savedRole = (localStorage.getItem("user_role") || "student").toLowerCase();
      
      setStudentName(savedName);
      setRole(savedRole);

      if (!studentId) return;

      // 1. Fetch transcript grouped by term
      const { data: transData } = await api.get(`/analytics/student/${studentId}/transcript`);
      if (transData) setTranscript(transData);

      // 2. Fetch claimed certificates
      const { data: certsData } = await api.get("/certificates/my-certificates");
      if (certsData) setCertificates(certsData);

      // 3. Fetch current enrolled courses progress
      const { data: progressData } = await api.get("/progress/continue-learning");
      if (progressData) setCoursesProgress(progressData);

    } catch (err) {
      console.error("Failed to load transcript data:", err);
      toast.error("Failed to load transcript details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleClaimCertificate = async (courseId: number) => {
    try {
      const res = await api.post(`/certificates/claim/${courseId}`);
      if (res.status === 200 || res.status === 201) {
        toast.success(`Certificate claimed successfully! 🎉`);
        await loadData();
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.detail || "Failed to claim certificate.";
      toast.error(errMsg);
    }
  };

  const openCertificatePreview = (cert: CertificateItem) => {
    setPreviewCert(cert);
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F4F6FA]">
        <div className="h-9 w-9 border-4 border-[#0038A8] border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-xs font-bold text-slate-400">Loading Transcript Profile...</p>
      </div>
    );
  }

  // Find courses that are 100% completed and see if certificate is already claimed
  const certifiableCourses = coursesProgress.map(c => {
    const isCompleted = c.progress_percentage >= 100;
    const claimedCert = certificates.find(cert => cert.course_id === c.course_id);
    return {
      ...c,
      isCompleted,
      claimedCert
    };
  });

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F4F6FA] min-h-screen font-sans text-left print:bg-white print:p-0">
      
      {/* Page Title */}
      <div className="print:hidden">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Academic Records</p>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-tight mt-0.5">
          Academic Transcript & Certificates
        </h1>
      </div>

      {/* Overview Cards Row */}
      {transcript && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden select-none">
          <div className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col items-center text-center shadow-xs">
            <Award className="h-5 w-5 text-[#0038A8] mb-1" />
            <p className="text-xl font-black text-slate-800">{transcript.cumulative_gpa.toFixed(2)}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cumulative GPA</p>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col items-center text-center shadow-xs">
            <BookOpen className="h-5 w-5 text-emerald-600 mb-1" />
            <p className="text-xl font-black text-slate-800">{transcript.total_credits}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Earned Credits</p>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col items-center text-center shadow-xs">
            <CheckCircle2 className="h-5 w-5 text-indigo-600 mb-1" />
            <p className="text-xl font-black text-slate-800">{transcript.passed_subjects}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Passed Courses</p>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col items-center text-center shadow-xs">
            <AlertCircle className="h-5 w-5 text-amber-600 mb-1" />
            <p className="text-xl font-black text-slate-800">{transcript.failed_subjects}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Failed Courses</p>
          </div>
        </div>
      )}

      {/* Tabs list */}
      <div className="flex border-b border-slate-200 print:hidden select-none">
        <button
          onClick={() => setActiveTab("transcript")}
          className={`pb-2.5 pt-2 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-colors mr-4 ${
            activeTab === "transcript"
              ? "border-[#0038A8] text-[#0038A8]"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Official Transcript
        </button>
        <button
          onClick={() => setActiveTab("certificates")}
          className={`pb-2.5 pt-2 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-colors ${
            activeTab === "certificates"
              ? "border-[#0038A8] text-[#0038A8]"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          My Certificates ({certificates.length})
        </button>
      </div>

      {/* Tab body */}
      <div>
        {/* TRANSCRIPT TAB */}
        {activeTab === "transcript" && (
          <div className="space-y-6">
            {!transcript || transcript.semesters.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center">
                <p className="text-slate-400 text-sm font-semibold">No graded transcript records available yet.</p>
              </div>
            ) : (
              transcript.semesters.map((sem, idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden print:border-none print:shadow-none">
                  {/* Semester Header */}
                  <div className="bg-slate-50 border-b border-slate-100 px-5 py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 select-none print:bg-white print:border-b-2 print:border-slate-800 print:px-0">
                    <div>
                      <p className="text-[9px] font-black text-[#0038A8] uppercase tracking-widest">
                        {sem.academic_year}
                      </p>
                      <h3 className="text-sm font-black text-slate-800 uppercase mt-0.5">
                        {sem.term}
                      </h3>
                    </div>
                    <div className="flex gap-4 text-xs font-bold text-slate-500 print:text-black">
                      <span>Term GPA: <strong className="text-slate-800 font-extrabold print:text-black">{sem.term_gpa.toFixed(2)}</strong></span>
                      <span>Credits: <strong className="text-slate-800 font-extrabold print:text-black">{sem.term_credits}</strong></span>
                    </div>
                  </div>

                  {/* Course Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px] print:min-w-full">
                      <thead>
                        <tr className="border-b border-slate-100 select-none bg-slate-50/30 print:bg-white print:border-b-2 print:border-slate-800">
                          <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider print:text-black print:px-1">Subject Code</th>
                          <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider print:text-black print:px-1">Subject Title</th>
                          <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center print:text-black print:px-1">Credits</th>
                          <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center print:text-black print:px-1">Avg Score</th>
                          <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center print:text-black print:px-1">Grade</th>
                          <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center print:text-black print:px-1">GPA Points</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 print:divide-slate-200">
                        {sem.courses.map((course, cIdx) => (
                          <tr key={cIdx} className="hover:bg-slate-50/30 transition-colors print:hover:bg-white">
                            <td className="px-5 py-3.5 text-xs font-bold text-slate-500 font-mono print:text-black print:px-1">{course.course_code}</td>
                            <td className="px-5 py-3.5 text-xs font-black text-slate-800 print:text-black print:px-1">{course.course_name}</td>
                            <td className="px-5 py-3.5 text-xs font-bold text-slate-600 text-center print:text-black print:px-1">{course.credits}</td>
                            <td className="px-5 py-3.5 text-xs font-bold text-slate-600 text-center print:text-black print:px-1">{course.percentage.toFixed(1)}%</td>
                            <td className="px-5 py-3.5 text-center print:px-1">
                              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                                course.grade === "A" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                course.grade.startsWith("B") ? "bg-blue-50 text-[#0038A8] border border-blue-100" :
                                course.grade.startsWith("C") ? "bg-indigo-50 text-indigo-700 border border-indigo-100" :
                                course.grade === "D" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                                "bg-rose-50 text-rose-700 border border-rose-100"
                              } print:bg-white print:text-black print:border-none print:font-extrabold print:text-xs`}>
                                {course.grade}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-xs font-black text-slate-700 text-center print:text-black print:px-1">{course.gpa_points.toFixed(1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* CERTIFICATES TAB */}
        {activeTab === "certificates" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 print:hidden">
            {certifiableCourses.length === 0 ? (
              <div className="col-span-2 bg-white p-8 rounded-2xl border border-slate-100 text-center">
                <p className="text-slate-400 text-sm font-semibold">You are not enrolled in any courses yet.</p>
              </div>
            ) : (
              certifiableCourses.map((c) => (
                <div key={c.course_id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="min-w-0 flex-1 space-y-1">
                    <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      c.isCompleted 
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                        : "bg-amber-50 text-amber-700 border border-amber-100"
                    }`}>
                      {c.isCompleted ? "Completed" : `In Progress (${c.progress_percentage.toFixed(0)}%)`}
                    </span>
                    <h3 className="text-xs font-black text-slate-800 truncate mt-1.5">{c.course_name}</h3>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      {c.isCompleted && c.claimedCert ? `Credential ID: ${c.claimedCert.credential_id}` : "Completion Certificate"}
                    </p>
                  </div>
                  
                  <div className="shrink-0 flex items-center gap-2 w-full sm:w-auto">
                    {c.isCompleted ? (
                      c.claimedCert ? (
                        <button
                          onClick={() => openCertificatePreview(c.claimedCert!)}
                          className="w-full sm:w-auto px-4 py-2 bg-[#0038A8] hover:bg-[#002D86] text-white text-xs font-black rounded-xl shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          <span>View Certificate</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleClaimCertificate(c.course_id)}
                          className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform animate-pulse"
                        >
                          Claim Certificate
                        </button>
                      )
                    ) : (
                      <button
                        disabled
                        className="w-full sm:w-auto px-4 py-2 bg-slate-100 text-slate-400 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 select-none"
                      >
                        <HelpCircle className="h-3.5 w-3.5" />
                        <span>Locked</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* PRINTABLE HTML/CSS CERTIFICATE MODAL */}
      {previewCert && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 print:relative print:bg-white print:p-0 print:z-0">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-4xl p-6 flex flex-col gap-6 relative max-h-[95vh] overflow-y-auto print:border-none print:shadow-none print:p-0 print:max-h-none print:overflow-visible">
            
            {/* Modal Controls */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 print:hidden">
              <h2 className="text-sm font-black text-slate-800">Certificate Digital Preview</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" /> Print / Export PDF
                </button>
                <button
                  onClick={() => setPreviewCert(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Premium printable certificate container */}
            <div
              id="printable-certificate-container"
              className="bg-white border-[12px] border-double border-[#0038A8] p-12 text-center flex flex-col justify-between aspect-[4/3] max-w-3xl mx-auto relative overflow-hidden select-none print:border-[16px] print:p-16 print:my-0"
              style={{ minHeight: "500px" }}
            >
              {/* Corner Accents */}
              <div className="absolute top-2 left-2 text-[#0038A8]/20 text-3xl font-serif">✥</div>
              <div className="absolute top-2 right-2 text-[#0038A8]/20 text-3xl font-serif">✥</div>
              <div className="absolute bottom-2 left-2 text-[#0038A8]/20 text-3xl font-serif">✥</div>
              <div className="absolute bottom-2 right-2 text-[#0038A8]/20 text-3xl font-serif">✥</div>

              {/* Certificate Header */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#0038A8] block">
                  EduLMS Academic Board
                </span>
                <h2 className="text-2xl font-serif font-bold text-slate-800 tracking-wide">
                  CERTIFICATE OF COMPLETION
                </h2>
                <div className="h-[2px] w-24 bg-[#0038A8] mx-auto mt-2" />
              </div>

              {/* Certificate Content */}
              <div className="my-6 space-y-4">
                <p className="text-xs font-medium text-slate-500 italic">
                  This is proudly presented to
                </p>
                <h1 className="text-3xl font-serif italic font-bold text-[#0038A8] py-1 border-b border-slate-100 max-w-md mx-auto">
                  {studentName}
                </h1>
                <p className="text-xs font-medium text-slate-500 max-w-md mx-auto leading-relaxed">
                  for successfully completing the course curriculum and exams required for
                </p>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide">
                  {previewCert.course_name} ({previewCert.course_code})
                </h3>
              </div>

              {/* Certificate Footer */}
              <div className="grid grid-cols-3 items-end gap-4 mt-4 border-t border-slate-100 pt-6">
                <div className="text-left space-y-1">
                  <span className="text-[9px] text-slate-400 block font-semibold uppercase tracking-wider">Issue Date</span>
                  <span className="text-xs font-bold text-slate-700 block">
                    {previewCert.completion_date ? new Date(previewCert.completion_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : new Date().toLocaleDateString("en-US")}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 border border-[#0038A8]/20 rounded-full flex items-center justify-center text-[10px] font-black text-[#0038A8] bg-[#0038A8]/5">
                    SEAL
                  </div>
                  <span className="text-[8px] text-slate-400 mt-1 uppercase font-bold tracking-wider">Authentic System Verification</span>
                </div>
                <div className="text-right space-y-1">
                  <span className="text-[9px] text-slate-400 block font-semibold uppercase tracking-wider">Board Registry</span>
                  <span className="text-xs font-bold text-[#0038A8] block font-serif italic">EduLMS Board</span>
                </div>
              </div>

              {/* Verification Info */}
              <div className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-6">
                Credential ID: {previewCert.credential_id} · Verify at: {typeof window !== "undefined" ? `${window.location.origin}/verify-certificate/${previewCert.credential_id}` : ""}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global CSS override for print media */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-certificate-container, #printable-certificate-container * {
            visibility: visible !important;
          }
          #printable-certificate-container {
            position: absolute !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) scale(1.15) !important;
            width: 750px !important;
            height: 560px !important;
            margin: 0 !important;
            padding: 48px !important;
            box-shadow: none !important;
            border: 12px double #0038A8 !important;
            background: white !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}
