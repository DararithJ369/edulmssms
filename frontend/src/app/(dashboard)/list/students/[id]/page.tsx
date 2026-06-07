export const dynamic = "force-dynamic"; // 💡 Prevents static snapshot rendering traps

import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import Performance from "@/components/Performance";
import StudentAttendanceCard from "@/components/StudentAttendanceCard";
import StudentEditModal from "@/components/StudentEditModal";
import BackButton from "@/components/BackButton";
import { serverFetch } from "@/lib/server-api";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { StudentProfileResponse, UserResponse, ClassResponse } from "@/types";
import {
  Globe, GraduationCap, Calendar, Mail, Phone, ShieldAlert,
  MapPin, Flag, BookOpen, Users, AlertCircle, Hash, Building2,
  ChevronRight, CheckCircle2,
} from "lucide-react";
import { getImageUrl } from "@/lib/image-url";
import { normalizeRole } from "@/lib/auth";

// ── Initials avatar helpers ──────────────────────────────────────────────────
const AVATAR_PALETTE = [
  { bg: "#E8EDF5", text: "#4A6FA5" },
  { bg: "#EAF0FB", text: "#3B5FBE" },
  { bg: "#EDF5EE", text: "#3A7D44" },
  { bg: "#F5EDF5", text: "#7D3A7D" },
  { bg: "#FDF3E7", text: "#B06820" },
  { bg: "#F0F0F5", text: "#5A5A8A" },
  { bg: "#F5EDEA", text: "#8A3A2A" },
  { bg: "#EAF5F5", text: "#2A7A7D" },
];
function getInitialsColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}
function getInitials(name: string) {
  const parts = name.trim().split(/[._ -]+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}
// ─────────────────────────────────────────────────────────────────────────────


const getOrdinal = (n: number | string | null | undefined) => {
  if (n === null || n === undefined) return "-";
  const num = parseInt(String(n));
  if (isNaN(num)) return String(n);
  const s = ["th", "st", "nd", "rd"];
  const v = num % 100;
  return num + (s[(v - 20) % 10] || s[v] || s[0]);
};

const fmtDate = (v?: string | null) => {
  if (!v) return "-";
  try { return new Intl.DateTimeFormat("en-GB").format(new Date(v)); }
  catch { return v; }
};

const MetaRow = ({
  icon, label, value,
}: {
  icon: React.ReactNode;
  label?: string;
  value?: string | null;
}) => (
  <div className="flex items-start gap-2 select-none">
    <span className="mt-0.5 shrink-0 text-sky-500">{icon}</span>
    <span className="text-[11px] font-semibold text-slate-600 break-words min-w-0">
      {label && <span className="font-extrabold text-slate-400">{label}: </span>}
      {value || "-"}
    </span>
  </div>
);

interface PageProps {
  params: {
    id: string;
  };
}

const SingleStudentPage = async ({ params: { id } }: PageProps) => {
  // 1. 🛡️ SERVER-SIDE UUID FORMAT GUARD
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  
  if (!isUuid) {
    return notFound(); 
  }

  // 🔐 Step 2: Resolve tokens from context cookies safely
  const cookieStore = cookies();
  const role = normalizeRole(cookieStore.get("user_role")?.value);
  const exactToken = cookieStore.get("access_token")?.value || cookieStore.get("token")?.value || "";

  let profileError: any = null;
  let userError: any = null;

  // 🔐 Step 3: Server fetch headers encapsulation object
  const fetchOptions = { 
    token: exactToken 
  };

  // 🔐 Step 4: Dispatch data dispatches concurrently
  const [student, user, overview, attendanceData] = await Promise.all([
    serverFetch<StudentProfileResponse>(
      `/students/${id}/profile`,
      fetchOptions
    ).catch((err) => {
      if (err?.message === "NEXT_REDIRECT" || err?.digest?.includes("NEXT_REDIRECT")) {
        profileError = err;
      } else {
        profileError = err instanceof Error ? err.message : String(err);
      }
      return null;
    }),
    
    serverFetch<UserResponse>(
      `/users/${id}`,
      fetchOptions
    ).catch((err) => {
      if (err?.message === "NEXT_REDIRECT" || err?.digest?.includes("NEXT_REDIRECT")) {
        userError = err;
      } else {
        userError = err instanceof Error ? err.message : String(err);
      }
      return null;
    }),
    
    serverFetch<any>(
      `/students/${id}/overview`,
      fetchOptions
    ).catch(() => null),

    serverFetch<any[]>(
      `/students/${id}/attendance`,
      fetchOptions
    ).catch(() => []),
  ]);

  const attList = Array.isArray(attendanceData) ? attendanceData : (attendanceData as any)?.data ?? [];
  const totalAtt = attList.length;
  const presentCount = attList.filter((r: any) => r.status === "present").length;
  const onlineCount = attList.filter((r: any) => r.status === "online").length;
  const lateCount = attList.filter((r: any) => r.status === "late").length;
  const excusedCount = attList.filter((r: any) => r.status === "excused").length;
  const absentCount = attList.filter((r: any) => r.status === "absent").length;

  const attendanceRate = totalAtt > 0 
    ? Math.round(((presentCount + onlineCount + lateCount) / totalAtt) * 100) 
    : 100;

  // Handle standard route session middleware overrides
  if (profileError && (profileError.message === "NEXT_REDIRECT" || profileError.digest?.includes("NEXT_REDIRECT"))) {
    throw profileError;
  }
  if (userError && (userError.message === "NEXT_REDIRECT" || userError.digest?.includes("NEXT_REDIRECT"))) {
    throw userError;
  }

  if (!student || !user) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 text-red-800 rounded-md m-6 flex flex-col gap-2">
        <h1 className="text-xl font-semibold">Unable to View Student Profile</h1>
        <p className="text-sm">We encountered an issue fetching data from the backend API for ID: <code>{id}</code></p>
        <div className="mt-2 text-xs font-mono bg-white p-3 border border-red-100 rounded">
          <p><strong>Student Profile:</strong> {student ? "LOADED" : (profileError || "Unknown Error")}</p>
          <p className="mt-1"><strong>User Account:</strong> {user ? "LOADED" : (userError || "Unknown Error")}</p>
        </div>
        <Link href="/list/students" className="mt-4 inline-block text-sm text-blue-600 underline font-semibold">
          Back to Students List
        </Link>
      </div>
    );
  }

  // 🛡️ TYPE SAFE DEFENSIVE EXTRACTORS
  const sp = student.student_profile || (student as any).student_profile;
  const classId = student.class_id || sp?.class_id || null;
  const targetUserId = student.user_id || user.id;

  // Conditional dynamic background network dispatches
  const classData = classId ? await serverFetch<ClassResponse>(`/classes/${classId}`, fetchOptions).catch(() => null) : null;
  const sessions = classId ? await serverFetch<any[]>(`/classes/${classId}/sessions`, fetchOptions).catch(() => []) : [];
  const lessonsCount = sessions.length;

  const parents: any[] = overview?.parents ?? [];
  const courses: any[] = overview?.courses ?? [];

  const editData = {
    userId: user.id,
    username: user.username,
    email: user.email,
    full_name: student.full_name || "",
    phone: student.phone || "",
    address: student.address || "",
    bio: student.bio || "",
    date_of_birth: student.date_of_birth || "",
    gender: student.gender || "",
    nationality: student.nationality || "",
    pfp: student.pfp || "",
    blood_type: student.blood_type || "",
    medical_conditions: student.medical_conditions || "",
    emergency_contact_name: student.emergency_contact_name || "",
    emergency_contact_phone: student.emergency_contact_phone || "",
    emergency_contact_relationship: student.emergency_contact_relationship || "",
    student_id: sp?.student_id || "",
    department: sp?.department || "",
    enrolment_date: sp?.enrolment_date ? String(sp.enrolment_date) : "",
    previous_school: sp?.previous_school || "",
    scholarship_status: sp?.scholarship_status || "",
    special_needs: sp?.special_needs || "",
  };

  const displayName = student.full_name || user.username;
  const photoUrl = getImageUrl(student.pfp || user.image);
  const { bg, text: textColor } = getInitialsColor(displayName);

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen relative font-sans text-left">

      {/* BREADCRUMB */}
      <div className="flex items-center gap-1 text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider mb-2 select-none">
        <Link href="/" className="hover:text-foreground flex items-center gap-1">
          <Globe className="h-3 w-3" />Home
        </Link>
        <span>/</span>
        <Link href="/list/students" className="hover:text-foreground">Users</Link>
        <span>/</span>
        <Link href="/list/students" className="hover:text-foreground">Students</Link>
        <span>/</span>
        <span className="text-foreground">Profile</span>
      </div>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none mb-6">
        <div className="flex items-start gap-3">
          <BackButton className="mt-1" />
          <div>
            <span className="text-xs font-extrabold text-[#0038A8] uppercase tracking-wider font-mono">
              Student Profile Details
            </span>
            <div className="flex items-center gap-3 mt-0.5">
              <h1 className="text-xl md:text-3xl font-black text-gray-900 tracking-tight leading-tight">
                {displayName}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border select-none ${
                user.is_active
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-red-50 text-red-600 border-red-200"
              }`}>
                {user.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-6 flex-col xl:flex-row">

        {/* ── LEFT COLUMN (2/3) ── */}
        <div className="w-full xl:w-2/3 flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row gap-6">

            {/* SKY BLUE PROFILE CARD */}
            <div className="bg-[#E6F6FD] border border-sky-100 p-6 rounded-3xl flex-1 flex flex-col sm:flex-row gap-6 shadow-sm relative overflow-hidden">
              <span className="absolute left-0 top-0 bottom-0 w-[4px] bg-sky-400" />
              <div className="w-full sm:w-1/3 flex justify-center sm:justify-start items-start pt-1">
                <div
                  className="h-28 w-28 sm:h-32 sm:w-32 rounded-full overflow-hidden border border-sky-100 flex items-center justify-center shrink-0 shadow-sm"
                  style={photoUrl ? { background: "white" } : { backgroundColor: bg }}
                >
                  {photoUrl ? (
                    <img src={photoUrl} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-black tracking-wide select-none" style={{ color: textColor }}>
                      {getInitials(displayName)}
                    </span>
                  )}
                </div>
              </div>

              <div className="w-full sm:w-2/3 flex flex-col justify-between gap-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-800 leading-tight">
                      {displayName}
                    </h1>
                    <div className="flex items-center gap-2 flex-wrap mt-1.5">
                      {/* 🛠️ FIXED: Text alignment color parameters synchronized from text-rose to text-sky */}
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-sky-500/10 text-sky-700 border border-sky-200 flex items-center gap-1 select-none">
                        <GraduationCap className="h-3 w-3" />Student
                      </span>
                      {sp?.student_id && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-1 select-none">
                          <Hash className="h-2.5 w-2.5" />{sp.student_id}
                        </span>
                      )}
                    </div>
                  </div>
                  {role === "admin" && (
                    <StudentEditModal data={editData} />
                  )}
                </div>

                <p className="text-xs text-slate-600 italic leading-relaxed">
                  {student.bio || "No biography available."}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-4 border-t border-sky-100 pt-3">
                  <MetaRow icon={<span className="h-4 w-4 rounded bg-sky-50 border border-sky-200 flex items-center justify-center text-red-500 text-[9px] font-black">B</span>} value={`Blood: ${student.blood_type || "-"}`} />
                  <MetaRow icon={<Calendar className="h-3.5 w-3.5" />} value={fmtDate(student.date_of_birth)} />
                  <MetaRow icon={<Mail className="h-3.5 w-3.5" />} value={user.email} />
                  <MetaRow icon={<Phone className="h-3.5 w-3.5" />} value={student.phone} />
                  {student.address && (
                    <MetaRow icon={<MapPin className="h-3.5 w-3.5" />} value={student.address} />
                  )}
                  {student.nationality && (
                    <MetaRow icon={<Flag className="h-3.5 w-3.5" />} value={student.nationality} />
                  )}
                  {sp?.department && (
                    <MetaRow icon={<Building2 className="h-3.5 w-3.5" />} label="Dept" value={sp.department} />
                  )}
                  {sp?.enrolment_date && (
                    <MetaRow icon={<BookOpen className="h-3.5 w-3.5" />} label="Enrolled" value={fmtDate(String(sp.enrolment_date))} />
                  )}
                </div>
              </div>
            </div>

            {/* METRIC SMALL CARDS */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 select-none">
              <div className="bg-white border border-slate-100 hover:border-emerald-500/25 p-5 rounded-3xl flex items-center gap-4 shadow-sm hover:shadow-md hover:-translate-y-[0.5px] transition-all duration-300 group">
                <div className="h-11 w-11 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-sm">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <Suspense fallback={<span className="text-xs text-muted-foreground">Loading…</span>}>
                  <StudentAttendanceCard id={targetUserId} />
                </Suspense>
              </div>

              <div className="bg-white border border-slate-100 hover:border-indigo-500/25 p-5 rounded-3xl flex items-center gap-4 shadow-sm hover:shadow-md hover:-translate-y-[0.5px] transition-all duration-300 group">
                <div className="h-11 w-11 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-sm">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-slate-800 leading-tight">
                    {sp?.grade_level_name || (classData?.name ? getOrdinal(classData.name.charAt(0)) : "-")}
                  </h1>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mt-0.5">Grade Level</span>
                </div>
              </div>

              <div className="bg-white border border-slate-100 hover:border-sky-500/25 p-5 rounded-3xl flex items-center gap-4 shadow-sm hover:shadow-md hover:-translate-y-[0.5px] transition-all duration-300 group">
                <div className="h-11 w-11 rounded-2xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-sm">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-slate-800 leading-tight">{lessonsCount}</h1>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mt-0.5">Assigned Lessons</span>
                </div>
              </div>

              <div className="bg-white border border-slate-100 hover:border-violet-500/25 p-5 rounded-3xl flex items-center gap-4 shadow-sm hover:shadow-md hover:-translate-y-[0.5px] transition-all duration-300 group">
                <div className="h-11 w-11 rounded-2xl bg-violet-50 border border-violet-100 text-violet-600 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-sm">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-slate-800 leading-tight">
                    {classData?.name ? `Class ${classData.name}` : "-"}
                  </h1>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mt-0.5">Syllabus Class</span>
                </div>
              </div>
            </div>
          </div>

          {/* ENROLLED COURSES */}
          <div className="bg-white border border-border/60 rounded-3xl p-6 shadow-sm text-left">
            <h3 className="text-base font-bold text-gray-900 mb-4 select-none flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[#0038A8]" />
              Enrolled Courses
              <span className="ml-auto text-[10px] font-black text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {courses.length}
              </span>
            </h3>
            {courses.length > 0 ? (
              <div className="space-y-2">
                {courses.map((c: any) => (
                  <Link key={c.enrollment_id} href={`/list/courses/${c.course_id}`}>
                    <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border/50 hover:border-[#0038A8]/30 hover:bg-[#0038A8]/5 transition-all group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-xl bg-[#0038A8]/10 text-[#0038A8] flex items-center justify-center shrink-0">
                          <BookOpen className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">{c.course_name}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {c.course_code && <span className="font-mono mr-2">{c.course_code}</span>}
                            {c.instructor_name && <span>· {c.instructor_name}</span>}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-[#0038A8] transition-colors shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground/50 select-none">
                <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-semibold">Not enrolled in any courses yet.</p>
              </div>
            )}
          </div>

          {/* ATTENDANCE HISTORY LOGS */}
          <div className="bg-white border border-border/60 rounded-3xl p-6 shadow-sm text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 select-none">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Attendance History Logs
              </h3>
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
                  Rate: {attendanceRate}%
                </span>
                <span className="px-2.5 py-1 bg-slate-50 text-slate-600 rounded-lg border border-slate-200">
                  Total: {totalAtt} records
                </span>
              </div>
            </div>

            {/* Stat breakdown pills */}
            <div className="grid grid-cols-5 gap-2 text-center mb-4 select-none">
              <div className="bg-emerald-50/55 border border-emerald-100/50 p-2 rounded-xl">
                <p className="text-sm font-black text-emerald-700">{presentCount}</p>
                <p className="text-[8px] font-extrabold text-slate-500 uppercase tracking-wider">Present</p>
              </div>
              <div className="bg-sky-50/55 border border-sky-100/50 p-2 rounded-xl">
                <p className="text-sm font-black text-sky-700">{onlineCount}</p>
                <p className="text-[8px] font-extrabold text-slate-500 uppercase tracking-wider">Online</p>
              </div>
              <div className="bg-amber-50/55 border border-amber-100/50 p-2 rounded-xl">
                <p className="text-sm font-black text-amber-700">{lateCount}</p>
                <p className="text-[8px] font-extrabold text-slate-500 uppercase tracking-wider">Late</p>
              </div>
              <div className="bg-purple-50/55 border border-purple-100/50 p-2 rounded-xl">
                <p className="text-sm font-black text-purple-700">{excusedCount}</p>
                <p className="text-[8px] font-extrabold text-slate-500 uppercase tracking-wider">Excused</p>
              </div>
              <div className="bg-red-50/55 border border-red-100/50 p-2 rounded-xl">
                <p className="text-sm font-black text-red-700">{absentCount}</p>
                <p className="text-[8px] font-extrabold text-slate-500 uppercase tracking-wider">Absent</p>
              </div>
            </div>

            {attList.length > 0 ? (
              <div className="overflow-x-auto max-h-[300px] overflow-y-auto border border-border/50 rounded-2xl divide-y divide-border/40">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 text-[9px] font-black uppercase text-slate-500 tracking-wider sticky top-0 border-b border-border/50">
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Course / Subject</th>
                      <th className="py-2 px-3 text-center">Status</th>
                      <th className="py-2 px-3">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 text-xs">
                    {attList.map((row: any) => {
                      let statusStyle = "bg-slate-100 text-slate-700 border-slate-200/55";
                      if (row.status === "present") statusStyle = "bg-emerald-50 text-emerald-700 border-emerald-100";
                      if (row.status === "absent") statusStyle = "bg-red-50 text-red-700 border-red-100";
                      if (row.status === "late") statusStyle = "bg-amber-50 text-amber-700 border-amber-100";
                      if (row.status === "excused") statusStyle = "bg-purple-50 text-purple-700 border-purple-100";
                      if (row.status === "online") statusStyle = "bg-sky-50 text-sky-700 border-sky-100";

                      return (
                        <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-slate-700 whitespace-nowrap">
                            {row.date ? new Date(row.date).toLocaleDateString() : "—"}
                            {row.time && <span className="text-[10px] text-muted-foreground block font-normal">{row.time}</span>}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-800">{row.course_name || "—"}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded border ${statusStyle}`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 text-[11px] font-medium max-w-[200px] truncate" title={row.note || ""}>
                            {row.note || "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 select-none">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-30 text-slate-300" />
                <p className="text-xs font-semibold">No attendance log records found for this student.</p>
              </div>
            )}
          </div>

          {/* SCHEDULE */}
          <div className="bg-white border border-border/60 rounded-3xl p-6 shadow-sm text-left">
            <h3 className="text-base font-bold text-gray-900 mb-4 select-none">Student&apos;s Schedule</h3>
            <div className="h-[750px] relative overflow-hidden rounded-2xl border border-border/50">
              {targetUserId ? (
                <BigCalendarContainer type="studentId" id={targetUserId} />
              ) : (
                <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center h-full select-none">
                  <ShieldAlert className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm font-bold">No student ID resolved — schedule unavailable.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN (1/3) ── */}
        <div className="w-full xl:w-1/3 flex flex-col gap-6 select-none">
          <div className="bg-white border border-border/60 p-6 rounded-3xl shadow-sm text-left">
            <h3 className="text-base font-bold text-gray-900 mb-4 select-none">Shortcut Links</h3>
            <div className="flex gap-3 flex-wrap text-xs text-gray-500">
              {classId && (
                <>
                  <Link className="px-3.5 py-2 bg-sky-50 hover:bg-sky-100 border border-sky-100 text-sky-700 font-extrabold text-[10px] rounded-xl shadow-sm transition-all active:scale-[0.98] uppercase tracking-wider" href={`/list/lessons?classId=${classId}`}>Lessons</Link>
                  <Link className="px-3.5 py-2 bg-violet-50 hover:bg-violet-100 border border-violet-100 text-violet-700 font-extrabold text-[10px] rounded-xl shadow-sm transition-all active:scale-[0.98] uppercase tracking-wider" href={`/list/teachers?classId=${classId}`}>Teachers</Link>
                  <Link className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-700 font-extrabold text-[10px] rounded-xl shadow-sm transition-all active:scale-[0.98] uppercase tracking-wider" href={`/list/exams?classId=${classId}`}>Exams</Link>
                  <Link className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-100 text-amber-700 font-extrabold text-[10px] rounded-xl shadow-sm transition-all active:scale-[0.98] uppercase tracking-wider" href={`/list/assignments?classId=${classId}`}>Assignments</Link>
                  <Link className="px-3.5 py-2 bg-red-50 hover:bg-red-100 border border-red-100 text-red-700 font-extrabold text-[10px] rounded-xl shadow-sm transition-all active:scale-[0.98] uppercase tracking-wider" href={`/list/quizzes?classId=${classId}`}>Quizzes</Link>
                </>
              )}
              <Link className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-700 font-extrabold text-[10px] rounded-xl shadow-sm transition-all active:scale-[0.98] uppercase tracking-wider" href={`/list/results?studentId=${targetUserId}`}>Gradebook Results</Link>
            </div>
          </div>

          {/* PARENTS / GUARDIANS */}
          <div className="bg-white border border-border/60 p-6 rounded-3xl shadow-sm text-left">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-[#0038A8]" />
              Parents / Guardians
            </h3>
            {parents.length > 0 ? (
              <div className="space-y-3">
                {parents.map((par: any) => (
                  <div key={par.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-slate-800">{par.full_name || "Unknown"}</span>
                      {par.relationship && (
                        <span className="px-2 py-0.5 bg-sky-50 text-sky-700 text-[9px] font-black rounded-full border border-sky-100 uppercase tracking-wider shrink-0">
                          {par.relationship}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-1">
                      {par.phone && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                          <Phone className="h-3 w-3 text-sky-400 shrink-0" />{par.phone}
                        </div>
                      )}
                      {par.emergency_phone && par.emergency_phone !== par.phone && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                          <AlertCircle className="h-3 w-3 text-red-400 shrink-0" />
                          Emergency: {par.emergency_phone}
                        </div>
                      )}
                      {par.email && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                          <Mail className="h-3 w-3 text-sky-400 shrink-0" />{par.email}
                        </div>
                      )}
                      {par.occupation && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                          <Building2 className="h-3 w-3 text-sky-400 shrink-0" />{par.occupation}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-muted-foreground/50">
                <Users className="h-7 w-7 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-semibold">No parent / guardian linked yet.</p>
              </div>
            )}
          </div>

          {/* EMERGENCY CONTACT */}
          {(student.emergency_contact_name || student.emergency_contact_phone) && (
            <div className="bg-red-50 border border-red-100 p-5 rounded-3xl shadow-sm text-left">
              <h3 className="text-sm font-extrabold text-red-700 mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />Emergency Contact
              </h3>
              <div className="space-y-1.5">
                {student.emergency_contact_name && (
                  <p className="text-xs font-bold text-slate-700">{student.emergency_contact_name}</p>
                )}
                {student.emergency_contact_relationship && (
                  <p className="text-[11px] text-slate-500">{student.emergency_contact_relationship}</p>
                )}
                {student.emergency_contact_phone && (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-semibold">
                    <Phone className="h-3 w-3 text-red-400" />{student.emergency_contact_phone}
                  </div>
                )}
              </div>
            </div>
          )}

          <Performance />
          <Announcements />
        </div>
      </div>
    </div>
  );
};

export default SingleStudentPage;