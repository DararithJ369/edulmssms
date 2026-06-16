"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Plus,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  User,
  X,
  Search,
  ChevronDown,
  Edit2,
  Copy,
  LayoutGrid,
  List,
  ChevronRight,
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";

// Types
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

const DAYS_OF_WEEK = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
const SHORT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const TIME_OPTIONS = [
  "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
];

const TIME_SLOTS = TIME_OPTIONS;

// UI Color system matching the app
const SUBJECT_COLORS = [
  { bg: "bg-[#0038A8]/10", border: "border-[#0038A8]/20", text: "text-[#0038A8]", accent: "bg-[#0038A8]", hover: "hover:bg-[#0038A8]/20" },
  { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-700", accent: "bg-emerald-500", hover: "hover:bg-emerald-500/20" },
  { bg: "bg-violet-500/10", border: "border-violet-500/20", text: "text-violet-700", accent: "bg-violet-500", hover: "hover:bg-violet-500/20" },
  { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-700", accent: "bg-amber-500", hover: "hover:bg-amber-500/20" },
  { bg: "bg-rose-500/10", border: "border-rose-500/20", text: "text-rose-700", accent: "bg-rose-500", hover: "hover:bg-rose-500/20" },
  { bg: "bg-cyan-500/10", border: "border-cyan-500/20", text: "text-cyan-700", accent: "bg-cyan-500", hover: "hover:bg-cyan-500/20" },
];

function getSubjectColor(subjectId: number) {
  return SUBJECT_COLORS[subjectId % SUBJECT_COLORS.length];
}

function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function parseTimeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function formatTimeDisplay(timeStr: string): string {
  return timeStr.slice(0, 5);
}

export default function TimetableSchedulesPage() {
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"week" | "list">("week");
  const [selectedClass, setSelectedClass] = useState<string>("");
  
  // Lookups
  const [classes, setClasses] = useState<OptionItem[]>([]);
  const [subjects, setSubjects] = useState<OptionItem[]>([]);
  const [teachers, setTeachers] = useState<OptionItem[]>([]);
  
  // Quick add state
  const [isAdding, setIsAdding] = useState(false);
  const [addingCell, setAddingCell] = useState<{ day: string; time: string } | null>(null);
  const [newSlot, setNewSlot] = useState({
    class_id: "",
    teacher_id: "",
    subject_id: "",
    room: "",
  });
  
  // Inline editing
  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<ScheduleSlot>>({});
  
  // Search/filter
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { limit: 500 };
      if (selectedClass) params.class_id = selectedClass;
      
      const { data } = await api.get("/schedule-slots", { params });
      setSlots(Array.isArray(data) ? data : data?.data ?? []);
    } catch (err) {
      console.error("Failed to load schedule slots:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedClass]);

  // Load lookups
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
        if (!selectedClass && rawClasses.length > 0) {
          setSelectedClass(String(rawClasses[0].id));
        }

        const rawSubjects = Array.isArray(sRes.data) ? sRes.data : sRes.data?.data ?? [];
        setSubjects(rawSubjects.map((s: any) => ({ id: s.id, name: s.name })));

        const rawTeachers = Array.isArray(tRes.data) ? tRes.data : tRes.data?.data ?? [];
        setTeachers(rawTeachers.map((t: any) => ({
          id: t.id,
          name: t.profile?.full_name || t.username
        })));
      } catch (err) {
        console.error("Failed to load lookups:", err);
      }
    }
    loadLookups();
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Create slot from cell click
  const handleCellClick = (day: string, time: string) => {
    if (!selectedClass) {
      toast.error("Please select a class first");
      return;
    }
    setAddingCell({ day, time });
    setIsAdding(true);
    setNewSlot({
      class_id: selectedClass,
      teacher_id: "",
      subject_id: "",
      room: "",
    });
  };

  const handleCreateSlot = async () => {
    if (!addingCell) return;
    if (!newSlot.teacher_id || !newSlot.subject_id) {
      toast.error("Please select subject and teacher");
      return;
    }

    const endHour = parseInt(addingCell.time.split(":")[0]) + 1;
    const endTime = `${endHour.toString().padStart(2, "0")}:00`;

    try {
      const payload = {
        class_id: parseInt(newSlot.class_id),
        teacher_id: newSlot.teacher_id,
        subject_id: parseInt(newSlot.subject_id),
        day_of_week: addingCell.day,
        start_time: `${addingCell.time}:00`,
        end_time: `${endTime}:00`,
        room: newSlot.room,
      };
      
      await api.post("/schedule-slots", payload);
      toast.success("Slot created!");
      setIsAdding(false);
      setAddingCell(null);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to create slot");
    }
  };

  // Delete slot
  const handleDeleteSlot = async (id: number) => {
    if (!confirm("Delete this slot?")) return;
    try {
      await api.delete(`/schedule-slots/${id}`);
      toast.success("Slot deleted");
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to delete");
    }
  };

  // Inline edit
  const startEdit = (slot: ScheduleSlot) => {
    setEditingSlot(slot.id);
    setEditForm(slot);
  };

  const saveEdit = async () => {
    if (!editingSlot) return;
    try {
      await api.put(`/schedule-slots/${editingSlot}`, {
        ...editForm,
        start_time: editForm.start_time?.includes(":00:00") 
          ? editForm.start_time 
          : `${editForm.start_time}:00`,
        end_time: editForm.end_time?.includes(":00:00") 
          ? editForm.end_time 
          : `${editForm.end_time}:00`,
      });
      toast.success("Updated!");
      setEditingSlot(null);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to update");
    }
  };

  // Duplicate slot
  const duplicateSlot = async (slot: ScheduleSlot) => {
    try {
      await api.post("/schedule-slots", {
        class_id: slot.class_id,
        teacher_id: slot.teacher_id,
        subject_id: slot.subject_id,
        day_of_week: slot.day_of_week,
        start_time: slot.start_time,
        end_time: slot.end_time,
        room: slot.room,
      });
      toast.success("Duplicated!");
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to duplicate");
    }
  };

  // Filtered slots
  const filteredSlots = useMemo(() => {
    if (!searchQuery) return slots;
    const q = searchQuery.toLowerCase();
    return slots.filter(s => 
      s.subject_name?.toLowerCase().includes(q) ||
      s.teacher_name?.toLowerCase().includes(q) ||
      s.room?.toLowerCase().includes(q)
    );
  }, [slots, searchQuery]);

  // Group slots by day for week view
  const slotsByDay = useMemo(() => {
    const grouped: Record<string, ScheduleSlot[]> = {};
    DAYS_OF_WEEK.forEach(day => grouped[day] = []);
    filteredSlots.forEach(slot => {
      if (!grouped[slot.day_of_week]) grouped[slot.day_of_week] = [];
      grouped[slot.day_of_week].push(slot);
    });
    return grouped;
  }, [filteredSlots]);

  const selectedClassName = classes.find(c => String(c.id) === selectedClass)?.name || "Select Class";

  return (
    <div className="flex-1 h-screen bg-white flex flex-col font-sans text-left overflow-hidden">
      {/* Header */}
      <header className="px-6 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Home</span>
          <span className="text-gray-300">/</span>
          <span className="text-gray-500">Admin</span>
          <span className="text-gray-300">/</span>
          <span className="font-medium text-gray-900">Timetables</span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("week")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === "week" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Week
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === "list" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              List
            </button>
          </div>
          
          <button
            onClick={() => loadData()}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Clock className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Toolbar */}
      <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-4 shrink-0">
        {/* Class selector - Notion style */}
        <div className="relative">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="appearance-none bg-transparent text-lg font-semibold text-gray-900 pr-8 pl-2 py-1 -ml-2 rounded hover:bg-gray-100 transition-colors cursor-pointer focus:outline-none"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <ChevronRight className="h-4 w-4 text-gray-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <div className="flex-1" />

        {/* Search */}
        <div className="relative">
          <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search subjects, teachers, rooms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 w-64 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        <button
          onClick={() => handleCellClick("MONDAY", "08:00")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          New Slot
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {viewMode === "week" ? (
          /* Week View - Notion Calendar Style */
          <div className="min-w-[1000px] p-6">
            {/* Days header */}
            <div className="grid grid-cols-7 gap-4 mb-4">
              {DAYS_OF_WEEK.map((day, i) => (
                <div key={day} className="text-center">
                  <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                    {SHORT_DAYS[i]}
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {slotsByDay[day].length > 0 && (
                      <span className="text-xs font-normal text-gray-400 ml-1">
                        ({slotsByDay[day].length})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Time grid */}
            <div className="grid grid-cols-7 gap-3">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day} className="space-y-2">
                  {/* Time slots */}
                  {TIME_SLOTS.map((time) => {
                    const slot = slotsByDay[day].find(s => 
                      s.start_time.startsWith(time.split(":")[0])
                    );
                    
                    if (slot) {
                      const colors = getSubjectColor(slot.subject_id);
                      const isEditing = editingSlot === slot.id;
                      
                      return (
                        <motion.div
                          key={`${day}-${time}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`relative rounded-lg border p-3 ${colors.bg} ${colors.border} ${colors.hover} transition-all group cursor-pointer`}
                          onClick={() => !isEditing && startEdit(slot)}
                        >
                          {isEditing ? (
                            <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                              <select
                                value={editForm.subject_id}
                                onChange={(e) => setEditForm({...editForm, subject_id: parseInt(e.target.value)})}
                                className="w-full text-xs p-1 rounded border border-gray-300"
                              >
                                {subjects.map(s => (
                                  <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                              </select>
                              <select
                                value={editForm.teacher_id}
                                onChange={(e) => setEditForm({...editForm, teacher_id: e.target.value})}
                                className="w-full text-xs p-1 rounded border border-gray-300"
                              >
                                {teachers.map(t => (
                                  <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                              </select>
                              <div className="flex gap-1">
                                <button
                                  onClick={saveEdit}
                                  className="flex-1 py-1 bg-blue-600 text-white text-xs rounded"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingSlot(null)}
                                  className="flex-1 py-1 bg-gray-200 text-gray-700 text-xs rounded"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-start justify-between">
                                <h4 className={`text-sm font-semibold ${colors.text} leading-tight`}>
                                  {slot.subject_name}
                                </h4>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); duplicateSlot(slot); }}
                                    className="p-1 hover:bg-white/50 rounded"
                                  >
                                    <Copy className="h-3 w-3 text-gray-600" />
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteSlot(slot.id); }}
                                    className="p-1 hover:bg-white/50 rounded"
                                  >
                                    <Trash2 className="h-3 w-3 text-red-600" />
                                  </button>
                                </div>
                              </div>
                              <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {slot.teacher_name}
                              </p>
                              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatTimeDisplay(slot.start_time)}-{formatTimeDisplay(slot.end_time)}
                                </span>
                                {slot.room && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {slot.room}
                                  </span>
                                )}
                              </div>
                            </>
                          )}
                        </motion.div>
                      );
                    }
                    
                    // Empty cell - clickable to add
                    return (
                      <button
                        key={`${day}-${time}`}
                        onClick={() => handleCellClick(day, time)}
                        className="h-20 rounded-lg border border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all flex items-center justify-center group"
                      >
                        <Plus className="h-4 w-4 text-gray-300 group-hover:text-blue-500" />
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* List View */
          <div className="p-6 max-w-4xl mx-auto">
            <div className="space-y-2">
              {filteredSlots.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No schedule slots found</p>
                  <button
                    onClick={() => handleCellClick("MONDAY", "08:00")}
                    className="mt-4 text-blue-600 hover:underline"
                  >
                    Create your first slot
                  </button>
                </div>
              ) : (
                filteredSlots.map((slot) => {
                  const colors = getSubjectColor(slot.subject_id);
                  return (
                    <motion.div
                      key={slot.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all group"
                    >
                      <div className={`w-2 h-12 rounded-full ${colors.bg.replace("bg-", "bg-").replace("100", "400")}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold text-gray-900">{slot.subject_name}</h4>
                          <span className="text-xs text-gray-500">{slot.class_name}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {slot.teacher_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {slot.day_of_week} {formatTimeDisplay(slot.start_time)}-{formatTimeDisplay(slot.end_time)}
                          </span>
                          {slot.room && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {slot.room}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => duplicateSlot(slot)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Add Modal */}
      <AnimatePresence>
        {isAdding && addingCell && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
            onClick={() => setIsAdding(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Add Slot</h3>
                  <p className="text-sm text-gray-500">
                    {addingCell.day} at {addingCell.time} • {selectedClassName}
                  </p>
                </div>
                <button
                  onClick={() => setIsAdding(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1.5 block">Subject</label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {subjects.map((s) => {
                      const colors = getSubjectColor(s.id as number);
                      const isSelected = newSlot.subject_id === String(s.id);
                      return (
                        <button
                          key={s.id}
                          onClick={() => setNewSlot({ ...newSlot, subject_id: String(s.id) })}
                          className={`px-3 py-2 rounded-lg text-left text-sm transition-all ${
                            isSelected 
                              ? `${colors.bg} ${colors.border} border ${colors.text} font-medium` 
                              : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                          }`}
                        >
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1.5 block">Teacher</label>
                  <select
                    value={newSlot.teacher_id}
                    onChange={(e) => setNewSlot({ ...newSlot, teacher_id: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="">Select teacher...</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1.5 block">Room (optional)</label>
                  <input
                    type="text"
                    value={newSlot.room}
                    onChange={(e) => setNewSlot({ ...newSlot, room: e.target.value })}
                    placeholder="e.g. Room 101"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-2 bg-gray-50/50">
                <button
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSlot}
                  className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Slot
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
