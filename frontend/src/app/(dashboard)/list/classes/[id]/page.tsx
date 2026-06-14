"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useDialog } from "@/hooks/DialogProvider";
import BackButton from "@/components/BackButton";
import { toast } from "react-toastify";
import {
  Globe,
  ArrowLeft,
  Users,
  UserPlus,
  UserMinus,
  School,
  AlertTriangle,
  CheckCircle,
  Search,
  X,
  Calendar,
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp,
  Plus,
} from "lucide-react";
import { api } from "@/lib/api";

type ClassDetail = {
  id: number;
  name: string;
  section?: string;
  room?: string;
  capacity: number;
  supervisor_name: string;
  academic_year?: string;
};

type Student = {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  enrolled_at?: string;
  profile?: {
    full_name?: string;
    phone?: string;
  };
  student_profile?: {
    student_id?: string;
    department?: string;
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
};

type OptionItem = { id: number | string; name: string };

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;
  const { confirm, alert } = useDialog();

  const [classData, setClassData] = useState<ClassDetail | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeTab, setActiveTab] = useState<"roster" | "sessions">("roster");
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("");

  // Add student modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingStudent, setAddingStudent] = useState<string | null>(null);
  const [removingStudent, setRemovingStudent] = useState<string | null>(null);

  // Quick Session Schedule Modal
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [savingSession, setSavingSession] = useState(false);
  const [subjects, setSubjects] = useState<OptionItem[]>([]);
  const [teachers, setTeachers] = useState<OptionItem[]>([]);
  const [newSession, setNewSession] = useState({
    subject_id: "",
    teacher_id: "",
    title: "",
    description: "",
    date: "",
    start_time: "08:00",
    end_time: "10:00",
    room: "",
  });

  // Load subject/teacher lists for scheduling
  useEffect(() => {
    async function loadLookups() {
      try {
        const [subRes, teaRes] = await Promise.all([
          api.get("/subjects?limit=100"),
          api.get("/users/instructors?limit=100"),
        ]);
        const sRaw = Array.isArray(subRes.data) ? subRes.data : subRes.data?.data ?? [];
        setSubjects(sRaw.map((s: any) => ({ id: s.id, name: s.name })));
        const tRaw = Array.isArray(teaRes.data) ? teaRes.data : teaRes.data?.data ?? [];
        setTeachers(tRaw.map((t: any) => ({
          id: t.id,
          name: t.profile?.full_name || t.username
        })));
      } catch (err) {
        console.error("Failed to load session schedule options:", err);
      }
    }
    loadLookups();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const r = localStorage.getItem("user_role") || "student";
      setRole(r === "instructor" ? "teacher" : r);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, sRes] = await Promise.all([
        api.get(`/classes/${classId}`),
        api.get(`/classes/${classId}/students`),
      ]);
      setClassData(cRes.data);
      setStudents(Array.isArray(sRes.data) ? sRes.data : sRes.data?.data ?? []);
      // Load sessions
      try {
        const sessRes = await api.get(`/classes/${classId}/sessions`);
        setSessions(Array.isArray(sessRes.data) ? sessRes.data : sessRes.data?.data ?? []);
      } catch { /* sessions optional */ }
    } catch (err) {
      console.error("Failed to load class:", err);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const { data } = await api.get(`/users?search=${encodeURIComponent(searchQuery)}&role=student&limit=10`);
      setSearchResults(Array.isArray(data) ? data : data?.data ?? []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const t = setTimeout(handleSearch, 400);
    return () => clearTimeout(t);
  }, [searchQuery, handleSearch]);

  const addStudent = async (studentId: string) => {
    const capacity = classData?.capacity;
    if (capacity && students.length >= capacity) {
      toast.error(`Class is at full capacity (${capacity} students). Remove a student first.`);
      return;
    }
    setAddingStudent(studentId);
    try {
      await api.post(`/classes/${classId}/students/${studentId}`);
      await loadData();
      toast.success("Student successfully added to this class.");
      setShowAddModal(false);
      setSearchQuery("");
      setSearchResults([]);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || "Failed to add student.";
      toast.error(msg);
    } finally {
      setAddingStudent(null);
    }
  };

  const removeStudent = async (studentId: string) => {
    const isConfirmed = await confirm({
      title: "Remove Student",
      description: "Are you sure you want to remove this student from the class?",
      confirmText: "Remove",
      cancelText: "Cancel",
      variant: "destructive"
    });
    if (!isConfirmed) return;
    setRemovingStudent(studentId);
    try {
      await api.delete(`/classes/${classId}/students/${studentId}`);
      await loadData();
      toast.success("Student removed from class.");
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || "Failed to remove student.";
      toast.error(msg);
    } finally {
      setRemovingStudent(null);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSession.title || !newSession.subject_id || !newSession.teacher_id || !newSession.date) {
      await alert({
        title: "Missing Required Fields",
        description: "Please fill in all required fields (Title, Subject, Teacher, Date).",
        okText: "OK",
        variant: "warning"
      });
      return;
    }
    setSavingSession(true);
    try {
      await api.post(`/classes/${classId}/sessions`, {
        title: newSession.title,
        description: newSession.description || null,
        subject_id: parseInt(newSession.subject_id),
        teacher_id: newSession.teacher_id,
        date: newSession.date,
        start_time: newSession.start_time,
        end_time: newSession.end_time,
        room: newSession.room || null,
        status: "scheduled"
      });
      setShowCreateSession(false);
      setNewSession({
        subject_id: "",
        teacher_id: "",
        title: "",
        description: "",
        date: "",
        start_time: "08:00",
        end_time: "10:00",
        room: "",
      });
      await loadData();
    } catch (err: any) {
      console.error("Failed to create session:", err);
      await alert({
        title: "Scheduling Failed",
        description: err?.response?.data?.detail || "Failed to schedule class session.",
        okText: "OK",
        variant: "error"
      });
    } finally {
      setSavingSession(false);
    }
  };

  const capacity = classData?.capacity ?? null;
  const enrolled = students.length;
  const isAtCapacity = capacity !== null && enrolled >= capacity;
  const isAdmin = role === "admin" || role === "teacher";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F7F8FA]">
        <div className="h-10 w-10 border-4 border-[#0038A8] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold">Loading Class...</p>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F7F8FA] gap-3 text-center">
        <School className="h-12 w-12 text-muted-foreground/30" />
        <p className="text-sm font-bold text-muted-foreground">Class not found.</p>
        <Link href="/list/classes"><button className="px-4 py-2 bg-[#0038A8] text-white text-xs font-black rounded-xl">Back to Classes</button></Link>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen font-sans text-left relative">

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-[480px] bg-card border border-border/80 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-foreground">Add Student to Class</h3>
              <button onClick={() => { setShowAddModal(false); setSearchQuery(""); setSearchResults([]); }}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {isAtCapacity && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-semibold">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Class is at full capacity ({capacity} students). Remove a student first to add more.
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or student ID..."
                className="w-full pl-9 pr-4 py-2.5 bg-muted/30 border border-border/80 focus:border-[#0038A8]/40 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#0038A8]/20 font-medium"
                autoFocus
              />
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {searching && <p className="text-xs text-muted-foreground text-center py-3 animate-pulse">Searching...</p>}
              {!searching && searchResults.length === 0 && searchQuery && (
                <p className="text-xs text-muted-foreground text-center py-3">No students found for &quot;{searchQuery}&quot;.</p>
              )}
              {searchResults.map((s) => {
                const alreadyEnrolled = students.some((st) => st.id === s.id);
                return (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-muted/20 hover:bg-muted/40 border border-border/40 rounded-xl transition-all">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-full bg-[#0038A8]/10 text-[#0038A8] flex items-center justify-center text-[10px] font-black shrink-0">
                        {(s.full_name || s.username)[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">{s.full_name || s.username}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{s.id}</p>
                      </div>
                    </div>
                    {alreadyEnrolled ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">Enrolled</span>
                    ) : (
                      <button
                        onClick={() => addStudent(s.id)}
                        disabled={!!addingStudent || isAtCapacity}
                        className="px-3 py-1 text-[10px] font-black bg-[#0038A8] text-white rounded-lg hover:bg-[#002D86] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {addingStudent === s.id ? "Adding..." : "Add"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Schedule Session Modal */}
      {showCreateSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <form onSubmit={handleCreateSession} className="w-[520px] bg-card border border-border/80 rounded-3xl p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-foreground uppercase tracking-wider">Schedule Class Session</h3>
              <button type="button" onClick={() => setShowCreateSession(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-[10px] font-extrabold uppercase text-muted-foreground mb-1">Session Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Intro to Data Structures, Midterm Exam"
                  value={newSession.title}
                  onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                  className="w-full px-3 py-2 bg-muted/30 border border-border/80 focus:border-[#0038A8]/40 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#0038A8]/20 font-medium"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] font-extrabold uppercase text-muted-foreground mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief description of the lesson content..."
                  value={newSession.description}
                  onChange={(e) => setNewSession({ ...newSession, description: e.target.value })}
                  className="w-full px-3 py-2 bg-muted/30 border border-border/80 focus:border-[#0038A8]/40 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#0038A8]/20 font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase text-muted-foreground mb-1">Subject *</label>
                <select
                  required
                  value={newSession.subject_id}
                  onChange={(e) => setNewSession({ ...newSession, subject_id: e.target.value })}
                  className="w-full px-3 py-2 bg-muted/30 border border-border/80 focus:border-[#0038A8]/40 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#0038A8]/20 font-medium"
                >
                  <option value="">Select Subject</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase text-muted-foreground mb-1">Instructor *</label>
                <select
                  required
                  value={newSession.teacher_id}
                  onChange={(e) => setNewSession({ ...newSession, teacher_id: e.target.value })}
                  className="w-full px-3 py-2 bg-muted/30 border border-border/80 focus:border-[#0038A8]/40 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#0038A8]/20 font-medium"
                >
                  <option value="">Select Instructor</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase text-muted-foreground mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={newSession.date}
                  onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
                  className="w-full px-3 py-2 bg-muted/30 border border-border/80 focus:border-[#0038A8]/40 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#0038A8]/20 font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase text-muted-foreground mb-1">Room / Venue</label>
                <input
                  type="text"
                  placeholder="e.g. Room A101"
                  value={newSession.room}
                  onChange={(e) => setNewSession({ ...newSession, room: e.target.value })}
                  className="w-full px-3 py-2 bg-muted/30 border border-border/80 focus:border-[#0038A8]/40 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#0038A8]/20 font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase text-muted-foreground mb-1">Start Time *</label>
                <input
                  type="time"
                  required
                  value={newSession.start_time}
                  onChange={(e) => setNewSession({ ...newSession, start_time: e.target.value })}
                  className="w-full px-3 py-2 bg-muted/30 border border-border/80 focus:border-[#0038A8]/40 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#0038A8]/20 font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase text-muted-foreground mb-1">End Time *</label>
                <input
                  type="time"
                  required
                  value={newSession.end_time}
                  onChange={(e) => setNewSession({ ...newSession, end_time: e.target.value })}
                  className="w-full px-3 py-2 bg-muted/30 border border-border/80 focus:border-[#0038A8]/40 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#0038A8]/20 font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateSession(false)}
                className="px-4 py-2 border border-border hover:bg-muted text-foreground text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingSession}
                className="px-4 py-2 bg-[#0038A8] text-white hover:bg-[#002D86] text-xs font-black rounded-xl transition-all disabled:opacity-50"
              >
                {savingSession ? "Saving..." : "Schedule"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* BREADCRUMB */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wider font-bold select-none">
        <Link href="/" className="hover:text-foreground flex items-center gap-1"><Globe className="h-3 w-3" />Home</Link>
        <span>/</span>
        <Link href="/list/classes" className="hover:text-foreground">Classes</Link>
        <span>/</span>
        <span className="text-foreground">{classData.name}</span>
      </div>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <BackButton className="mt-1" />
          <div>
            <span className="text-xs font-extrabold text-[#0038A8] uppercase tracking-wider font-mono">Class Roster Management</span>
            <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight leading-tight mt-0.5">
              {classData.name}
            </h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {classData.academic_year && (
                <span className="text-xs font-bold text-muted-foreground">AY: {classData.academic_year}</span>
              )}
              {classData.section && (
                <span className="text-xs font-bold text-muted-foreground">Section: {classData.section}</span>
              )}
              {classData.room && (
                <span className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
                  <MapPin className="h-3 w-3" />{classData.room}
                </span>
              )}
              {classData.supervisor_name && (
                <span className="text-xs font-bold text-muted-foreground">Supervisor: {classData.supervisor_name}</span>
              )}
            </div>
          </div>
        </div>

        {/* Capacity pill */}
        <div className="flex items-center gap-2 shrink-0">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border font-black text-sm ${
            isAtCapacity ? "bg-red-50 border-red-200 text-red-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"
          }`}>
            <Users className="h-4 w-4" />
            <span>{enrolled}</span>
            {capacity && <span className="font-normal text-xs opacity-70">/ {capacity}</span>}
            <span className="text-xs font-bold">students</span>
          </div>
          {isAtCapacity && <span className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl"><AlertTriangle className="h-3.5 w-3.5" />At Capacity</span>}
        </div>
      </div>


      {/* Capacity bar */}
      {capacity && (
        <div className="bg-card border border-border/60 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <span className="text-muted-foreground">Class Capacity</span>
            <span className={isAtCapacity ? "text-red-600" : "text-[#0038A8]"}>{enrolled} / {capacity}</span>
          </div>
          <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isAtCapacity ? "bg-red-500" : "bg-gradient-to-r from-[#0038A8] to-[#4f88ef]"}`}
              style={{ width: `${Math.min((enrolled / capacity) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* TABS */}
      <div className="flex border-b border-border/60 gap-6 text-xs font-extrabold text-muted-foreground select-none">
        <button onClick={() => setActiveTab("roster")} className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === "roster" ? "border-[#0038A8] text-foreground" : "border-transparent hover:text-foreground"}`}>
          <Users className="h-3 w-3" />Roster ({enrolled})
        </button>
        <button onClick={() => setActiveTab("sessions")} className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === "sessions" ? "border-[#0038A8] text-foreground" : "border-transparent hover:text-foreground"}`}>
          <Calendar className="h-3 w-3" />Sessions ({sessions.length})
        </button>
      </div>

      {/* ROSTER TAB */}
      {activeTab === "roster" && (
        <div className="bg-card border border-border/60 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.01)]">
          <div className="flex items-center justify-between p-5 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[#0038A8]" />
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">Enrolled Students</h2>
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowAddModal(true)}
                disabled={isAtCapacity}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black rounded-xl border transition-colors ${
                  isAtCapacity
                    ? "bg-muted text-muted-foreground border-border cursor-not-allowed opacity-50"
                    : "bg-[#0038A8] text-white border-[#0038A8] hover:bg-[#002D86]"
                }`}
              >
                <UserPlus className="h-3.5 w-3.5" />
                {isAtCapacity ? "Class Full" : "Add Student"}
              </button>
            )}
          </div>

          {students.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-bold">No students enrolled yet.</p>
              {isAdmin && !isAtCapacity && (
                <button onClick={() => setShowAddModal(true)} className="mt-3 px-4 py-2 bg-[#0038A8] text-white text-xs font-black rounded-xl">
                  Add First Student
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F7F8FA]/80 text-[10px] uppercase tracking-wider text-muted-foreground font-black border-b border-border/60">
                    <th className="text-left py-3 px-4">#</th>
                    <th className="text-left py-3 px-4">Student</th>
                    <th className="text-left py-3 px-4">Student ID</th>
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-left py-3 px-4">Enrolled</th>
                    {isAdmin && <th className="text-left py-3 px-4">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {students.map((s, i) => (
                    <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 text-xs text-muted-foreground font-mono">{i + 1}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-[#0038A8]/10 text-[#0038A8] flex items-center justify-center text-[10px] font-black shrink-0">
                            {(s.full_name || s.username || "?")[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-xs text-foreground">{s.full_name || s.username}</p>
                            <p className="text-[10px] text-muted-foreground">{s.email || ""}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-muted-foreground">{s.id}</td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">{s.email || "—"}</td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {s.enrolled_at ? new Date(s.enrolled_at).toLocaleDateString() : "—"}
                      </td>
                      {isAdmin && (
                        <td className="py-3 px-4">
                          <button
                            onClick={() => removeStudent(s.id)}
                            disabled={removingStudent === s.id}
                            className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <UserMinus className="h-3 w-3" />
                            {removingStudent === s.id ? "Removing..." : "Remove"}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SESSIONS TAB */}
      {activeTab === "sessions" && (
        <div className="bg-card border border-border/60 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.01)]">
          <div className="flex items-center justify-between p-5 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#0038A8]" />
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">Class Sessions</h2>
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowCreateSession(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-black rounded-xl border bg-[#0038A8] text-white border-[#0038A8] hover:bg-[#002D86] transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Schedule Session
              </button>
            )}
          </div>
          {sessions.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Calendar className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-bold">No sessions scheduled yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {sessions.map((sess) => (
                <div key={sess.id} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-[#0038A8]/10 text-[#0038A8] flex items-center justify-center shrink-0 font-black text-xs">
                      {sess.id}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground">{sess.title || `Session ${sess.id}`}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold">
                          <Calendar className="h-3 w-3" />{sess.date}
                        </span>
                        {sess.start_time && (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold">
                            <Clock className="h-3 w-3" />{sess.start_time} {sess.end_time ? `→ ${sess.end_time}` : ""}
                          </span>
                        )}
                        {sess.room && (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold">
                            <MapPin className="h-3 w-3" />{sess.room}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {isAdmin && (
                    <Link href={`/list/classes/${classId}/sessions/${sess.id}/attendance`}>
                      <button className="px-3.5 py-1.5 bg-[#0038A8]/10 hover:bg-[#0038A8]/20 border border-[#0038A8]/20 text-[#0038A8] font-black text-[10px] rounded-lg shadow-sm transition-colors uppercase tracking-wider shrink-0">
                        Mark Attendance
                      </button>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
