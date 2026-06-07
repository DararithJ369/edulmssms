"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useDialog } from "@/hooks/DialogProvider";
import {
  Globe,
  ArrowLeft,
  Users,
  CheckCircle2,
  AlertTriangle,
  Save,
  Clock,
  MapPin,
  Calendar,
  AlertCircle,
  FileText
} from "lucide-react";
import { api } from "@/lib/api";

type Student = {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  profile?: {
    full_name?: string;
  };
};

type Session = {
  id: number;
  title: string;
  description?: string;
  date: string;
  start_time?: string;
  end_time?: string;
  room?: string;
  subject_id: number;
  teacher_id: string;
};

type Course = {
  id: number;
  course_name: string;
  subject_id: number;
};

type AttendanceRow = {
  student_id: string;
  username: string;
  full_name: string;
  status: "present" | "absent" | "late" | "excused" | "online";
  note: string;
  existing_id?: number;
};

export default function MarkAttendancePage() {
  const params = useParams();
  const router = useRouter();
  const { alert } = useDialog();
  const classId = params.id as string;
  const sessionId = params.sessionId as string;

  const [className, setClassName] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch class details, students, and sessions
      const [classRes, studentsRes, sessionsRes, coursesRes] = await Promise.all([
        api.get(`/classes/${classId}`),
        api.get(`/classes/${classId}/students`),
        api.get(`/classes/${classId}/sessions`),
        api.get("/courses?limit=100"),
      ]);

      setClassName(classRes.data.name);

      const allSessions: Session[] = Array.isArray(sessionsRes.data)
        ? sessionsRes.data
        : sessionsRes.data?.data ?? [];
      const currentSession = allSessions.find((s) => String(s.id) === sessionId);

      if (!currentSession) {
        setMessage({ type: "error", text: "Session not found." });
        setLoading(false);
        return;
      }
      setSession(currentSession);

      // 2. Resolve Course ID based on subject
      const allCourses: Course[] = Array.isArray(coursesRes.data)
        ? coursesRes.data
        : coursesRes.data?.data ?? [];
      const matchingCourse = allCourses.find((c) => c.subject_id === currentSession.subject_id);
      setCourse(matchingCourse || null);

      // 3. Fetch existing attendance records for the session
      let existingAttendance: any[] = [];
      try {
        const attRes = await api.get(`/classes/${classId}/sessions/${sessionId}/attendance`);
        existingAttendance = Array.isArray(attRes.data) ? attRes.data : attRes.data?.data ?? [];
      } catch (err) {
        console.warn("No existing attendance found or endpoint failed.", err);
      }

      // 4. Map students to attendance rows
      const studentsList: Student[] = Array.isArray(studentsRes.data)
        ? studentsRes.data
        : studentsRes.data?.data ?? [];

      const rows: AttendanceRow[] = studentsList.map((stu) => {
        const match = existingAttendance.find((att) => String(att.student_id) === String(stu.id));
        return {
          student_id: stu.id,
          username: stu.username,
          full_name: stu.full_name || stu.profile?.full_name || stu.username,
          status: (match?.status as any) || "present",
          note: match?.note || "",
          existing_id: match?.id,
        };
      });

      setAttendance(rows);
    } catch (err) {
      console.error("Failed to load attendance marker:", err);
      setMessage({ type: "error", text: "Failed to load class or student roster." });
    } finally {
      setLoading(false);
    }
  }, [classId, sessionId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = (studentId: string, status: AttendanceRow["status"]) => {
    setAttendance((prev) =>
      prev.map((row) => (row.student_id === studentId ? { ...row, status } : row))
    );
  };

  const handleNoteChange = (studentId: string, note: string) => {
    setAttendance((prev) =>
      prev.map((row) => (row.student_id === studentId ? { ...row, note } : row))
    );
  };

  const handleSetAll = (status: AttendanceRow["status"]) => {
    setAttendance((prev) => prev.map((row) => ({ ...row, status })));
  };

  const handleSave = async () => {
    if (!session) return;
    if (!course) {
      await alert({
        title: "Course Link Missing",
        description: "No matching Course could be found for this session's Subject. Attendance records require a Course linkage.",
        okText: "OK",
        variant: "warning"
      });
      return;
    }

    setSaving(false);
    setSaving(true);
    try {
      const payload = {
        course_id: course.id,
        date: session.date,
        attendance: attendance.map((row) => ({
          student_id: row.student_id,
          status: row.status,
          note: row.note || null,
          time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        })),
      };

      await api.post(`/classes/${classId}/sessions/${sessionId}/attendance`, payload);
      setMessage({ type: "success", text: "Attendance records saved successfully!" });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.error("Failed to save attendance:", err);
      setMessage({
        type: "error",
        text: err?.response?.data?.detail || "Failed to save attendance logs.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F7F8FA]">
        <div className="h-10 w-10 border-4 border-[#0038A8] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold">Loading Attendance Sheet...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F7F8FA] gap-3 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500/80" />
        <p className="text-sm font-bold text-muted-foreground">Session or Class not found.</p>
        <button onClick={() => router.back()} className="px-4 py-2 bg-[#0038A8] text-white text-xs font-black rounded-xl">Back</button>
      </div>
    );
  }
  const total = attendance.length;
  const presentCount = attendance.filter((r) => r.status === "present").length;
  const absentCount = attendance.filter((r) => r.status === "absent").length;
  const lateCount = attendance.filter((r) => r.status === "late").length;
  const excusedCount = attendance.filter((r) => r.status === "excused").length;
  const onlineCount = attendance.filter((r) => r.status === "online").length;

  const attended = presentCount + onlineCount + lateCount;
  const attendanceRate = total > 0 ? Math.round((attended / total) * 100) : 100;

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen font-sans text-left relative">
      {/* BREADCRUMB */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wider font-bold select-none">
        <Link href="/" className="hover:text-foreground flex items-center gap-1"><Globe className="h-3 w-3" />Home</Link>
        <span>/</span>
        <Link href="/list/classes" className="hover:text-foreground">Classes</Link>
        <span>/</span>
        <Link href={`/list/classes/${classId}`} className="hover:text-foreground">{className}</Link>
        <span>/</span>
        <span className="text-foreground">Sessions</span>
        <span>/</span>
        <span className="text-foreground">Attendance</span>
      </div>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button onClick={() => router.back()} className="p-2 mt-1 bg-background border border-border hover:bg-accent rounded-xl shadow-sm transition-all">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <span className="text-xs font-extrabold text-[#0038A8] uppercase tracking-wider font-mono">Lecturer Attendance Sheet</span>
            <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight leading-tight mt-0.5">
              {session.title}
            </h1>
            <p className="text-xs font-semibold text-muted-foreground mt-0.5">Class: {className}</p>
            
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 text-sky-600" />{session.date}
              </span>
              {session.start_time && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 text-sky-600" />{String(session.start_time).substring(0, 5)} {session.end_time ? `→ ${String(session.end_time).substring(0, 5)}` : ""}
                </span>
              )}
              {session.room && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 text-sky-600" />{session.room}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-black rounded-xl bg-[#0038A8] hover:bg-[#002D86] text-white transition-colors shadow-sm disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Attendance"}
          </button>
        </div>
      </div>

      {/* Message Notifications */}
      {message && (
        <div className={`flex items-center gap-2.5 p-4 rounded-2xl text-sm font-semibold border ${
          message.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"
        }`}>
          {message.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-auto p-0.5 rounded hover:bg-black/10">Back</button>
        </div>
      )}

      {/* Warning if no matching course */}
      {!course && (
        <div className="flex items-start gap-2.5 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs font-semibold">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Missing Subject Course Association</p>
            <p className="mt-0.5 font-normal opacity-90">There is currently no Course created and linked to this session&apos;s Subject (Subject ID: {session.subject_id}). You must create a course and assign this subject to it in the Course Administrator area before saving attendance.</p>
          </div>
        </div>
      )}
      {/* STATISTICS PANEL */}
      {attendance.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 select-none">
          <div className="bg-card border border-border/60 rounded-2xl p-4 flex flex-col justify-center items-center shadow-xs">
            <span className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Attendance Rate</span>
            <span className={`text-2xl font-black mt-1 ${attendanceRate >= 90 ? "text-emerald-600" : attendanceRate >= 75 ? "text-amber-500" : "text-red-500"}`}>
              {attendanceRate}%
            </span>
          </div>
          <div className="bg-card border border-border/60 rounded-2xl p-4 flex flex-col justify-center items-center shadow-xs">
            <span className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Present</span>
            <span className="text-2xl font-black mt-1 text-emerald-600">{presentCount}</span>
          </div>
          <div className="bg-card border border-border/60 rounded-2xl p-4 flex flex-col justify-center items-center shadow-xs">
            <span className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Online</span>
            <span className="text-2xl font-black mt-1 text-sky-600">{onlineCount}</span>
          </div>
          <div className="bg-card border border-border/60 rounded-2xl p-4 flex flex-col justify-center items-center shadow-xs">
            <span className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Late</span>
            <span className="text-2xl font-black mt-1 text-amber-500">{lateCount}</span>
          </div>
          <div className="bg-card border border-border/60 rounded-2xl p-4 flex flex-col justify-center items-center shadow-xs">
            <span className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Absent</span>
            <span className="text-2xl font-black mt-1 text-red-500">{absentCount}</span>
          </div>
          <div className="bg-card border border-border/60 rounded-2xl p-4 flex flex-col justify-center items-center shadow-xs">
            <span className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Excused</span>
            <span className="text-2xl font-black mt-1 text-purple-600">{excusedCount}</span>
          </div>
        </div>
      )}

      {/* Roster Controls */}
      <div className="bg-card border border-border/60 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#0038A8]" />
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">Attendance Grid</h2>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-extrabold uppercase text-muted-foreground mr-1">Set all:</span>
            <button onClick={() => handleSetAll("present")} className="px-2.5 py-1 text-[10px] font-black rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/50">Present</button>
            <button onClick={() => handleSetAll("absent")} className="px-2.5 py-1 text-[10px] font-black rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200/50">Absent</button>
            <button onClick={() => handleSetAll("late")} className="px-2.5 py-1 text-[10px] font-black rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/50">Late</button>
            <button onClick={() => handleSetAll("online")} className="px-2.5 py-1 text-[10px] font-black rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200/50">Online</button>
          </div>
        </div>

        {attendance.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-2 opacity-20" />
            <p className="text-xs font-bold">No students enrolled in this class roster.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {attendance.map((row) => (
              <div key={row.student_id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 md:max-w-[40%]">
                  <div className="h-8 w-8 rounded-full bg-[#0038A8]/10 text-[#0038A8] flex items-center justify-center text-[11px] font-black shrink-0">
                    {row.full_name[0].toUpperCase()}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-foreground truncate">{row.full_name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono truncate">{row.student_id}</p>
                  </div>
                </div>

                {/* Status Toggles */}
                <div className="flex items-center gap-1 shrink-0 flex-wrap">
                  {(["present", "absent", "late", "excused", "online"] as const).map((status) => {
                    const active = row.status === status;
                    let style = "bg-muted/40 hover:bg-muted text-muted-foreground border-border/60";
                    if (active) {
                      if (status === "present") style = "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700";
                      if (status === "absent") style = "bg-red-600 text-white border-red-600 hover:bg-red-700";
                      if (status === "late") style = "bg-amber-500 text-white border-amber-500 hover:bg-amber-600";
                      if (status === "excused") style = "bg-purple-600 text-white border-purple-600 hover:bg-purple-700";
                      if (status === "online") style = "bg-sky-600 text-white border-sky-600 hover:bg-sky-700";
                    }
                    return (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(row.student_id, status)}
                        className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg border transition-all ${style}`}
                      >
                        {status}
                      </button>
                    );
                  })}
                </div>

                {/* Note Field */}
                <div className="flex-1 md:max-w-[30%] relative">
                  <FileText className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                  <input
                    type="text"
                    value={row.note}
                    onChange={(e) => handleNoteChange(row.student_id, e.target.value)}
                    placeholder="Add remarks (e.g. sick, left early)"
                    className="w-full pl-8 pr-3 py-1.5 bg-muted/20 border border-border/80 focus:border-[#0038A8]/30 rounded-lg text-[11px] focus:outline-none font-medium"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={() => router.back()}
          className="px-4 py-2 border border-border bg-white hover:bg-muted text-foreground text-xs font-bold rounded-xl"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !course}
          className="px-5 py-2 bg-[#0038A8] text-white hover:bg-[#002D86] text-xs font-black rounded-xl transition-all disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Sheet"}
        </button>
      </div>
    </div>
  );
}
