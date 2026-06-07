"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Globe,
  Plus,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  BookOpen,
  User,
  CheckCircle,
  AlertTriangle,
  X,
  RefreshCw,
  Sliders,
} from "lucide-react";
import { api } from "@/lib/api";

type ScheduleSlot = {
  id: number;
  class_id: number;
  class_name: string;
  teacher_id: string;
  teacher_name: string;
  subject_id: number;
  subject_name: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room: string;
  is_active: boolean;
};

type OptionItem = { id: number | string; name: string };

const DAYS_OF_WEEK = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

export default function TimetableSchedulesPage() {
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Lookups
  const [classes, setClasses] = useState<OptionItem[]>([]);
  const [subjects, setSubjects] = useState<OptionItem[]>([]);
  const [teachers, setTeachers] = useState<OptionItem[]>([]);
  
  // Filter state
  const [filterClass, setFilterClass] = useState<string>("");
  const [filterTeacher, setFilterTeacher] = useState<string>("");
  const [filterRoom, setFilterRoom] = useState<string>("");

  // Create slot form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSlot, setNewSlot] = useState({
    class_id: "",
    teacher_id: "",
    subject_id: "",
    day_of_week: "MONDAY",
    start_time: "08:00",
    end_time: "10:00",
    room: "",
  });
  const [savingSlot, setSavingSlot] = useState(false);

  // Generate sessions form
  const [showGenCard, setShowGenCard] = useState(false);
  const [genParams, setGenParams] = useState({
    start_date: "",
    end_date: "",
    class_id: "",
  });
  const [generating, setGenerating] = useState(false);

  // Global messages
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showMsg = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Build query parameters
      const params: any = { limit: 100 };
      if (filterClass) params.class_id = filterClass;
      if (filterTeacher) params.teacher_id = filterTeacher;
      if (filterRoom) params.room = filterRoom;

      const { data } = await api.get("/schedule-slots", { params });
      setSlots(Array.isArray(data) ? data : data?.data ?? []);
    } catch (err) {
      console.error("Failed to load schedule slots:", err);
    } finally {
      setLoading(false);
    }
  }, [filterClass, filterTeacher, filterRoom]);

  // Load static lookups
  useEffect(() => {
    async function loadLookups() {
      try {
        const [cRes, sRes, tRes] = await Promise.all([
          api.get("/classes?limit=100"),
          api.get("/subjects?limit=100"),
          api.get("/users/instructors?limit=100"),
        ]);
        
        const rawClasses = Array.isArray(cRes.data) ? cRes.data : cRes.data?.data ?? [];
        setClasses(rawClasses.map((c: any) => ({ id: c.id, name: c.name })));

        const rawSubjects = Array.isArray(sRes.data) ? sRes.data : sRes.data?.data ?? [];
        setSubjects(rawSubjects.map((s: any) => ({ id: s.id, name: s.name })));

        const rawTeachers = Array.isArray(tRes.data) ? tRes.data : tRes.data?.data ?? [];
        setTeachers(rawTeachers.map((t: any) => ({
          id: t.id,
          name: t.profile?.full_name || t.username
        })));
      } catch (err) {
        console.error("Failed to load schedule option lookups:", err);
      }
    }
    loadLookups();
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Create slot handler
  const handleCreateSlot = async () => {
    if (!newSlot.class_id || !newSlot.teacher_id || !newSlot.subject_id || !newSlot.day_of_week || !newSlot.start_time || !newSlot.end_time) {
      showMsg("error", "Please fill in all required scheduling parameters.");
      return;
    }
    setSavingSlot(true);
    try {
      // Format start/end times with seconds to satisfy TimeType
      const formattedSlot = {
        ...newSlot,
        class_id: parseInt(newSlot.class_id),
        subject_id: parseInt(newSlot.subject_id),
        start_time: `${newSlot.start_time}:00`,
        end_time: `${newSlot.end_time}:00`,
      };
      await api.post("/schedule-slots", formattedSlot);
      setShowCreateModal(false);
      setNewSlot({
        class_id: "",
        teacher_id: "",
        subject_id: "",
        day_of_week: "MONDAY",
        start_time: "08:00",
        end_time: "10:00",
        room: "",
      });
      await loadData();
      showMsg("success", "Timetable schedule slot allocated successfully!");
    } catch (err: any) {
      showMsg("error", err?.response?.data?.detail || "Failed to create schedule slot.");
    } finally {
      setSavingSlot(false);
    }
  };

  // Delete slot handler
  const handleDeleteSlot = async (id: number) => {
    if (!confirm("Delete this weekly schedule slot? generated class occurrences will remain, but no future ones will be scheduled from it.")) return;
    try {
      await api.delete(`/schedule-slots/${id}`);
      await loadData();
      showMsg("success", "Timetable slot deleted.");
    } catch (err: any) {
      showMsg("error", err?.response?.data?.detail || "Failed to delete slot.");
    }
  };

  // Generate sessions handler
  const handleGenerateSessions = async () => {
    if (!genParams.start_date || !genParams.end_date) {
      showMsg("error", "Please choose both start and end dates.");
      return;
    }
    setGenerating(true);
    try {
      const params: any = {
        start_date: genParams.start_date,
        end_date: genParams.end_date,
      };
      if (genParams.class_id) {
        params.class_id = parseInt(genParams.class_id);
      }
      const { data } = await api.post("/schedule-slots/generate-sessions", null, { params });
      showMsg("success", data.detail || "Class sessions generated successfully!");
      setShowGenCard(false);
    } catch (err: any) {
      showMsg("error", err?.response?.data?.detail || "Failed to generate class sessions.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen font-sans text-left">
      {/* BREADCRUMB */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wider font-bold select-none">
        <Link href="/admin" className="hover:text-foreground flex items-center gap-1">
          <Globe className="h-3 w-3" />Admin
        </Link>
        <span>/</span>
        <span className="text-foreground">Schedules</span>
      </div>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold text-[#0038A8] uppercase tracking-wider font-mono">
            Timetable Planning
          </span>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight mt-0.5">
            Weekly Timetable Allocation
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Allocate weekly slots for classes, subjects, rooms, and lecturers with conflict detection.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowGenCard(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-border text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className="h-3.5 w-3.5 text-[#0038A8]" />Generate Occurrences
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#0038A8] text-white font-black text-xs rounded-xl hover:bg-[#002D86] transition-colors shadow-md shadow-blue-500/10"
          >
            <Plus className="h-3.5 w-3.5" />Allocate Weekly Slot
          </button>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div
          className={`flex items-center gap-2 p-4 rounded-2xl text-sm font-semibold border animate-fade-in ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          )}
          <span className="flex-1">{message.text}</span>
          <button onClick={() => setMessage(null)}>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Bulk Generate Sessions Card */}
      {showGenCard && (
        <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-[#0038A8] animate-spin-slow" />Generate Class Sessions from Timetable
            </h3>
            <button onClick={() => setShowGenCard(false)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Generate calendar sessions dynamically for a given period. It matches weekdays and copies slots configuration.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wide">Start Date *</label>
              <input
                type="date"
                value={genParams.start_date}
                onChange={(e) => setGenParams((p) => ({ ...p, start_date: e.target.value }))}
                className="w-full px-3 py-2 bg-muted/30 border border-border/80 focus:border-[#0038A8]/40 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#0038A8]/20 font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wide">End Date *</label>
              <input
                type="date"
                value={genParams.end_date}
                onChange={(e) => setGenParams((p) => ({ ...p, end_date: e.target.value }))}
                className="w-full px-3 py-2 bg-muted/30 border border-border/80 focus:border-[#0038A8]/40 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#0038A8]/20 font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wide">Class Filter (Optional)</label>
              <select
                value={genParams.class_id}
                onChange={(e) => setGenParams((p) => ({ ...p, class_id: e.target.value }))}
                className="w-full px-3 py-2 bg-muted/30 border border-border/80 focus:border-[#0038A8]/40 rounded-xl text-sm focus:outline-none font-medium"
              >
                <option value="">All Classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleGenerateSessions}
              disabled={generating}
              className="px-5 py-2 bg-[#0038A8] text-white font-black text-xs rounded-xl hover:bg-[#002D86] disabled:opacity-50 flex items-center gap-1.5"
            >
              {generating ? "Generating..." : "Generate Sessions"}
            </button>
            <button
              onClick={() => setShowGenCard(false)}
              className="px-5 py-2 bg-muted border border-border text-muted-foreground font-bold text-xs rounded-xl hover:bg-muted/80"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* FILTER TRAY */}
      <div className="bg-card border border-border/60 rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px] space-y-1.5">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Sliders className="h-3 w-3" />Filter Class
          </label>
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="w-full px-3 py-2 bg-muted/30 border border-border/80 focus:border-[#0038A8]/40 rounded-xl text-xs focus:outline-none font-semibold text-foreground"
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[200px] space-y-1.5">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <User className="h-3 w-3" />Filter Teacher
          </label>
          <select
            value={filterTeacher}
            onChange={(e) => setFilterTeacher(e.target.value)}
            className="w-full px-3 py-2 bg-muted/30 border border-border/80 focus:border-[#0038A8]/40 rounded-xl text-xs focus:outline-none font-semibold text-foreground"
          >
            <option value="">All Teachers</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[200px] space-y-1.5">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <MapPin className="h-3 w-3" />Filter Room
          </label>
          <input
            value={filterRoom}
            onChange={(e) => setFilterRoom(e.target.value)}
            placeholder="e.g. A101"
            className="w-full px-3 py-1.5 bg-muted/30 border border-border/80 focus:border-[#0038A8]/40 rounded-xl text-xs focus:outline-none font-semibold"
          />
        </div>
      </div>

      {/* SLOTS LIST / GRID */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 border-4 border-[#0038A8] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : slots.length === 0 ? (
        <div className="bg-card border border-border/60 rounded-3xl p-16 text-center text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-bold">No weekly schedule slots allocated yet.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-3 px-4 py-2 bg-[#0038A8] text-white text-xs font-black rounded-xl"
          >
            Create Timetable Slot
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {slots.map((slot) => (
            <div
              key={slot.id}
              className="bg-card border border-border/60 rounded-3xl p-6 flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.01)] hover:border-[#0038A8]/30 transition-all group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-[#0038A8]/10 text-[#0038A8] text-[9px] font-black rounded-lg uppercase tracking-wider">
                    {slot.day_of_week}
                  </span>
                  <button
                    onClick={() => handleDeleteSlot(slot.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive border border-border/60 hover:border-red-200 bg-background rounded-lg transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div>
                  <h3 className="text-sm font-black text-foreground flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-slate-400 shrink-0" />
                    {slot.subject_name}
                  </h3>
                  <p className="text-xs text-muted-foreground font-semibold mt-1 flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-slate-400 shrink-0" /> {slot.teacher_name}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-bold border-t border-border/40 pt-3">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {slot.room || "No Room"}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-[#0038A8] uppercase tracking-wide">
                  {slot.class_name}
                </span>
                <span className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                  Active Timetable
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ALLOCATE SLOT MODAL OVERLAY */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-[600px] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200/80 text-left font-sans select-none animate-fade-in">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h2 className="text-base font-black text-slate-900 tracking-tight">Allocate Timetable Slot</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors h-7 w-7 rounded-full hover:bg-slate-50 flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Inputs grid */}
            <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wide">Class Name *</label>
                  <select
                    value={newSlot.class_id}
                    onChange={(e) => setNewSlot((p) => ({ ...p, class_id: e.target.value }))}
                    className="w-full px-3 py-2 bg-muted/30 border border-border/80 focus:border-[#0038A8]/40 rounded-xl text-sm focus:outline-none font-medium"
                  >
                    <option value="">-- Choose Class --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wide">Subject Name *</label>
                  <select
                    value={newSlot.subject_id}
                    onChange={(e) => setNewSlot((p) => ({ ...p, subject_id: e.target.value }))}
                    className="w-full px-3 py-2 bg-muted/30 border border-border/80 focus:border-[#0038A8]/40 rounded-xl text-sm focus:outline-none font-medium"
                  >
                    <option value="">-- Choose Subject --</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wide">Assigned Lecturer *</label>
                <select
                  value={newSlot.teacher_id}
                  onChange={(e) => setNewSlot((p) => ({ ...p, teacher_id: e.target.value }))}
                  className="w-full px-3 py-2 bg-muted/30 border border-border/80 focus:border-[#0038A8]/40 rounded-xl text-sm focus:outline-none font-medium"
                >
                  <option value="">-- Choose Lecturer --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wide">Day *</label>
                  <select
                    value={newSlot.day_of_week}
                    onChange={(e) => setNewSlot((p) => ({ ...p, day_of_week: e.target.value }))}
                    className="w-full px-3 py-2 bg-muted/30 border border-border/80 focus:border-[#0038A8]/40 rounded-xl text-sm focus:outline-none font-medium"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wide">Start Time *</label>
                  <input
                    type="time"
                    value={newSlot.start_time}
                    onChange={(e) => setNewSlot((p) => ({ ...p, start_time: e.target.value }))}
                    className="w-full px-3 py-2 bg-muted/30 border border-border/80 focus:border-[#0038A8]/40 rounded-xl text-sm focus:outline-none font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wide">End Time *</label>
                  <input
                    type="time"
                    value={newSlot.end_time}
                    onChange={(e) => setNewSlot((p) => ({ ...p, end_time: e.target.value }))}
                    className="w-full px-3 py-2 bg-muted/30 border border-border/80 focus:border-[#0038A8]/40 rounded-xl text-sm focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wide">Allocated Classroom / Room</label>
                <input
                  value={newSlot.room}
                  onChange={(e) => setNewSlot((p) => ({ ...p, room: e.target.value }))}
                  placeholder="e.g. Building C, Room 304"
                  className="w-full px-3 py-2 bg-muted/30 border border-border/80 focus:border-[#0038A8]/40 rounded-xl text-sm focus:outline-none font-medium"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2.5 bg-slate-50/30 shrink-0">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 active:scale-[0.98] text-xs font-bold transition-all shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSlot}
                disabled={savingSlot}
                className="px-4 py-2 rounded-xl bg-[#0038A8] text-white hover:bg-[#002b80] active:scale-[0.98] text-xs font-bold transition-all disabled:opacity-50 shadow-sm"
              >
                {savingSlot ? "Allocating..." : "Allocate Slot"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
