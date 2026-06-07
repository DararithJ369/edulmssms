"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Globe, Calendar, Clock, BookOpen, FileText, CheckCircle2, 
  AlertTriangle, Search, ChevronDown, ChevronUp, User, Activity, Sparkles 
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "react-toastify";

type AttendanceList = {
  id: number;
  student_id: string;
  course_id: string;
  date: string;
  status: string;
  time?: string | null;
  note?: string | null;
  student_name?: string | null;
  course_name?: string | null;
};

export default function AttendanceListPage() {
  const [role, setRole] = useState("");
  const [userId, setUserId] = useState("");
  const [data, setData] = useState<AttendanceList[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search / filters for Admin/Teacher view
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Parent view state
  const [selectedChildId, setSelectedChildId] = useState("");

  // Accordion state for courses
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedRole = localStorage.getItem("user_role") || "student";
      setRole(savedRole === "instructor" ? "teacher" : savedRole);
      setUserId(localStorage.getItem("user_id") || "");
    }
  }, []);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      if (role === "admin" || role === "teacher") {
        // Fetch paginated all records
        const res = await api.get(`/attendance?page=${currentPage}&limit=15&search=${searchQuery}`);
        setData(res.data.data || []);
        setTotalCount(res.data.meta?.total || 0);
      } else {
        // Fetch all student or child records for dashboard calculations
        const res = await api.get(`/attendance?limit=250`);
        const records = res.data.data || [];
        setData(records);

        // Pre-select first child if parent
        if (role === "parent" && records.length > 0) {
          const uniqueChildren = Array.from(new Set(records.map((r: any) => r.student_id)));
          if (uniqueChildren.length > 0) {
            setSelectedChildId(uniqueChildren[0] as string);
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load attendance logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role) {
      fetchAttendance();
    }
  }, [role, currentPage]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchAttendance();
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "present":
        return <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 font-extrabold text-[9px] rounded-lg uppercase tracking-wider select-none">Present</span>;
      case "late":
        return <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 font-extrabold text-[9px] rounded-lg uppercase tracking-wider select-none">Late</span>;
      case "absent":
        return <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 font-extrabold text-[9px] rounded-lg uppercase tracking-wider select-none">Absent</span>;
      case "excused":
        return <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 font-extrabold text-[9px] rounded-lg uppercase tracking-wider select-none">Excused</span>;
      case "online":
        return <span className="px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-100 font-extrabold text-[9px] rounded-lg uppercase tracking-wider select-none">Online</span>;
      default:
        return <span className="px-2 py-0.5 bg-slate-50 text-slate-700 border border-slate-100 font-extrabold text-[9px] rounded-lg uppercase tracking-wider select-none">{status}</span>;
    }
  };

  const toggleCourse = (courseKey: string) => {
    setExpandedCourses(prev => ({
      ...prev,
      [courseKey]: !prev[courseKey]
    }));
  };

  // --- STUDENT VIEW PROCESSING ---
  const getStudentStats = (records: AttendanceList[]) => {
    const total = records.length;
    const present = records.filter(r => r.status === "present" || r.status === "online").length;
    const late = records.filter(r => r.status === "late").length;
    const absent = records.filter(r => r.status === "absent").length;
    const excused = records.filter(r => r.status === "excused").length;

    const attended = present + late;
    const rate = total > 0 ? Math.round((attended / total) * 100) : 100;

    return { total, present, late, absent, excused, rate };
  };

  const getGroupedByCourse = (records: AttendanceList[]) => {
    const groups: Record<string, AttendanceList[]> = {};
    records.forEach(r => {
      const key = r.course_name || `Course #${r.course_id}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });
    return groups;
  };

  // --- RENDER STUDENT HUB ---
  const renderStudentView = () => {
    const stats = getStudentStats(data);
    const grouped = getGroupedByCourse(data);

    return (
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white border border-border/60 rounded-2xl p-5 text-center flex flex-col justify-center items-center shadow-xs">
            <span className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Attendance Rate</span>
            <span className={`text-3xl font-black mt-1 ${stats.rate >= 90 ? "text-emerald-600" : stats.rate >= 75 ? "text-amber-500" : "text-rose-500"}`}>
              {stats.rate}%
            </span>
          </div>
          <div className="bg-white border border-border/60 rounded-2xl p-5 text-center flex flex-col justify-center items-center shadow-xs">
            <span className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Total Classes</span>
            <span className="text-3xl font-black mt-1 text-slate-800">{stats.total}</span>
          </div>
          <div className="bg-white border border-border/60 rounded-2xl p-5 text-center flex flex-col justify-center items-center shadow-xs">
            <span className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Present / Online</span>
            <span className="text-3xl font-black mt-1 text-emerald-600">{stats.present}</span>
          </div>
          <div className="bg-white border border-border/60 rounded-2xl p-5 text-center flex flex-col justify-center items-center shadow-xs">
            <span className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Late Sessions</span>
            <span className="text-3xl font-black mt-1 text-amber-500">{stats.late}</span>
          </div>
          <div className="bg-white border border-border/60 rounded-2xl p-5 text-center flex flex-col justify-center items-center shadow-xs relative overflow-hidden">
            <span className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Absences</span>
            <span className={`text-3xl font-black mt-1 ${stats.absent >= 3 ? "text-rose-600 font-black" : "text-rose-500"}`}>{stats.absent}</span>
            {stats.absent >= 3 && (
              <span className="absolute bottom-0 inset-x-0 bg-rose-500 text-white text-[7px] py-0.5 uppercase tracking-widest font-black">Warning Triggered</span>
            )}
          </div>
        </div>

        {stats.absent >= 3 && (
          <div className="flex items-start gap-2.5 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold select-none">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600 animate-bounce" />
            <div>
              <p className="font-bold">Absence Threshold Exceeded</p>
              <p className="mt-0.5 font-normal opacity-90">You have registered {stats.absent} absences this semester. Exceeding 3 absences may negatively impact your course grading or exam eligibility. Please discuss with your instructors.</p>
            </div>
          </div>
        )}

        {/* Grouped Courses Timelines */}
        <div className="space-y-4">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5"><BookOpen className="h-4 w-4 text-[#0038A8]" />Course-wise Attendance Detail</h2>
          
          {Object.keys(grouped).length === 0 ? (
            <div className="bg-white border border-border/60 rounded-3xl p-16 text-center text-muted-foreground">
              <Calendar className="h-10 w-10 mx-auto mb-2 opacity-25" />
              <p className="text-xs font-bold">No course attendance logs found in system database.</p>
            </div>
          ) : (
            Object.entries(grouped).map(([courseName, records]) => {
              const courseStats = getStudentStats(records);
              const isExpanded = !!expandedCourses[courseName];
              return (
                <div key={courseName} className="bg-white border border-border/60 rounded-2xl overflow-hidden shadow-xs">
                  <div 
                    onClick={() => toggleCourse(courseName)}
                    className="p-5 flex items-center justify-between cursor-pointer select-none hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 text-[#0038A8] rounded-xl">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-sm font-bold text-slate-900">{courseName}</h3>
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-semibold">
                          {records.length} Sessions Logged
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-[9px] font-extrabold uppercase text-muted-foreground tracking-wider block">Course Rate</span>
                        <span className={`text-sm font-black ${courseStats.rate >= 90 ? "text-emerald-600" : courseStats.rate >= 75 ? "text-amber-500" : "text-rose-500"}`}>{courseStats.rate}%</span>
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-slate-100 pt-4 bg-slate-50/20 text-left space-y-3">
                      {records.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-white border border-border/40 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 text-xs">
                              <Calendar className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800">{item.date}</p>
                              <p className="text-[10px] text-muted-foreground font-mono mt-0.5 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {item.time || "08:00 AM"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {item.note && (
                              <span className="text-[10px] text-muted-foreground italic flex items-center gap-1 font-medium bg-slate-50 px-2 py-0.5 rounded border border-slate-200/50">
                                <FileText className="h-3 w-3" />
                                Note: {item.note}
                              </span>
                            )}
                            {getStatusBadge(item.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  // --- PARENT VIEW PROCESSING ---
  const renderParentView = () => {
    // Unique children student ids
    const uniqueChildrenIds = Array.from(new Set(data.map(r => r.student_id)));
    const selectedChildRecords = data.filter(r => r.student_id === selectedChildId);
    
    const stats = getStudentStats(selectedChildRecords);
    const grouped = getGroupedByCourse(selectedChildRecords);
    const childName = selectedChildRecords[0]?.student_name || `Student: ${selectedChildId}`;

    return (
      <div className="space-y-6">
        {/* Child Selector Dropdown */}
        <div className="flex items-center justify-between bg-white border border-border/60 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center gap-2 text-left">
            <User className="h-4 w-4 text-[#0038A8]" />
            <span className="text-xs font-extrabold uppercase text-muted-foreground tracking-wider">Select Child Profiles:</span>
          </div>

          <select
            value={selectedChildId}
            onChange={(e) => {
              setSelectedChildId(e.target.value);
              setExpandedCourses({});
            }}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-border rounded-xl outline-none text-foreground font-bold cursor-pointer"
          >
            {uniqueChildrenIds.map((cId) => {
              const name = data.find(r => r.student_id === cId)?.student_name || `Child #${cId}`;
              return <option key={cId} value={cId}>{name}</option>;
            })}
          </select>
        </div>

        {selectedChildId ? (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white border border-border/60 rounded-2xl p-5 text-center flex flex-col justify-center items-center shadow-xs">
                <span className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Attendance Rate</span>
                <span className={`text-2xl font-black mt-1 ${stats.rate >= 90 ? "text-emerald-600" : stats.rate >= 75 ? "text-amber-500" : "text-rose-500"}`}>
                  {stats.rate}%
                </span>
              </div>
              <div className="bg-white border border-border/60 rounded-2xl p-5 text-center flex flex-col justify-center items-center shadow-xs">
                <span className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Total Classes</span>
                <span className="text-2xl font-black mt-1 text-slate-800">{stats.total}</span>
              </div>
              <div className="bg-white border border-border/60 rounded-2xl p-5 text-center flex flex-col justify-center items-center shadow-xs">
                <span className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Attended Sessions</span>
                <span className="text-2xl font-black mt-1 text-emerald-600">{stats.present}</span>
              </div>
              <div className="bg-white border border-border/60 rounded-2xl p-5 text-center flex flex-col justify-center items-center shadow-xs">
                <span className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Late Sessions</span>
                <span className="text-2xl font-black mt-1 text-amber-500">{stats.late}</span>
              </div>
              <div className="bg-white border border-border/60 rounded-2xl p-5 text-center flex flex-col justify-center items-center shadow-xs relative overflow-hidden">
                <span className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Absences</span>
                <span className={`text-2xl font-black mt-1 ${stats.absent >= 3 ? "text-rose-600 font-black" : "text-rose-500"}`}>{stats.absent}</span>
                {stats.absent >= 3 && (
                  <span className="absolute bottom-0 inset-x-0 bg-rose-500 text-white text-[7px] py-0.5 uppercase tracking-widest font-black">Warning Triggered</span>
                )}
              </div>
            </div>

            {stats.absent >= 3 && (
              <div className="flex items-start gap-2.5 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold select-none">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600 animate-bounce" />
                <div>
                  <p className="font-bold">Absence Alert: {childName}</p>
                  <p className="mt-0.5 font-normal opacity-90">This student has recorded {stats.absent} absences. In line with academic policies, exceeding 3 absences in any course results in review of grade eligibility. Please contact the class supervisor if you have questions.</p>
                </div>
              </div>
            )}

            {/* Course Wise List */}
            <div className="space-y-4">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5"><Activity className="h-4 w-4 text-[#0038A8]" />{childName}&apos;s Attendance Logs</h2>
              {Object.entries(grouped).map(([courseName, records]) => {
                const courseStats = getStudentStats(records);
                const isExpanded = !!expandedCourses[courseName];
                return (
                  <div key={courseName} className="bg-white border border-border/60 rounded-2xl overflow-hidden shadow-xs">
                    <div 
                      onClick={() => toggleCourse(courseName)}
                      className="p-5 flex items-center justify-between cursor-pointer select-none hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-[#0038A8] rounded-xl">
                          <BookOpen className="h-4 w-4" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-sm font-bold text-slate-900">{courseName}</h3>
                          <p className="text-[10px] text-muted-foreground mt-0.5 font-semibold">
                            {records.length} Sessions Logged
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-[9px] font-extrabold uppercase text-muted-foreground tracking-wider block">Course Rate</span>
                          <span className={`text-sm font-black ${courseStats.rate >= 90 ? "text-emerald-600" : courseStats.rate >= 75 ? "text-amber-500" : "text-rose-500"}`}>{courseStats.rate}%</span>
                        </div>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-5 pb-5 border-t border-slate-100 pt-4 bg-slate-50/20 text-left space-y-3">
                        {records.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-3 bg-white border border-border/40 rounded-xl">
                            <div className="flex items-center gap-3">
                              <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 text-xs">
                                <Calendar className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-800">{item.date}</p>
                                <p className="text-[10px] text-muted-foreground font-mono mt-0.5 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {item.time || "08:00 AM"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {item.note && (
                                <span className="text-[10px] text-muted-foreground italic flex items-center gap-1 font-medium bg-slate-50 px-2 py-0.5 rounded border border-slate-200/50">
                                  <FileText className="h-3 w-3" />
                                  Note: {item.note}
                                </span>
                              )}
                              {getStatusBadge(item.status)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="bg-white border border-border/60 rounded-3xl p-16 text-center text-muted-foreground">
            <User className="h-10 w-10 mx-auto mb-2 opacity-25" />
            <p className="text-xs font-bold">No linked student records found under this parent profile.</p>
          </div>
        )}
      </div>
    );
  };

  // --- RENDER ADMIN / TEACHER VIEW ---
  const renderLogbookView = () => {
    return (
      <div className="space-y-6">
        {/* filter/search utility */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-3 select-none">
          <div className="flex items-center gap-2 text-xs font-extrabold text-muted-foreground">
            <span className="px-2.5 py-1 bg-white border border-border/80 text-foreground rounded-lg shadow-sm">
              {totalCount} Logbook Entries
            </span>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 md:flex-initial">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
              <input
                type="text"
                placeholder="Search by student name or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-64 pl-9 pr-4 py-2 text-xs bg-white border border-border/80 focus:border-[#0038A8]/50 rounded-xl outline-none text-foreground"
              />
            </form>
          </div>
        </div>

        {/* attendance records table */}
        {data.length > 0 ? (
          <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.01)] space-y-3 text-left">
            {data.map((item) => (
              <div 
                key={item.id} 
                className="flex items-center justify-between p-4 bg-white hover:bg-slate-50/50 border border-border/40 hover:border-violet-200 rounded-2xl transition-all shadow-xs group"
              >
                <div className="flex items-center gap-4 max-w-[70%]">
                  <div className="h-9 w-9 rounded-xl bg-violet-50 text-[#8b5cf6] flex items-center justify-center shrink-0 border border-violet-100">
                    <Calendar className="h-5 w-5" />
                  </div>

                  <div className="flex flex-col text-left gap-0.5">
                    <span className="text-sm font-extrabold text-slate-800 truncate">
                      {item.student_name || `Student ID: ${item.student_id}`}
                    </span>

                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-semibold flex-wrap">
                      <span className="flex items-center gap-1 text-[#0038A8] font-bold">
                        <BookOpen className="h-3 w-3" />
                        <span>{item.course_name || `Course #${item.course_id}`}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-sky-500" />
                        <span>Time: {item.time || "08:00 AM"}</span>
                      </span>
                      {item.note && (
                        <span className="flex items-center gap-1 text-gray-500 font-medium italic">
                          <FileText className="h-3 w-3" />
                          <span>Note: {item.note}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-slate-700 font-mono select-none">
                    {item.date}
                  </span>
                  {getStatusBadge(item.status)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border/60 rounded-3xl p-12 text-center text-muted-foreground select-none">
            <Calendar className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm font-bold">No attendance logbook entries registered in database matching query.</p>
          </div>
        )}

        {/* PAGINATION PANEL */}
        {totalCount > 15 && (
          <div className="bg-card border border-border/60 rounded-3xl p-4 shadow-sm flex justify-center items-center select-none gap-2 shrink-0">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="px-3 py-1.5 text-xs font-bold border border-border rounded-xl disabled:opacity-40 hover:bg-slate-50 bg-white"
            >
              Prev
            </button>
            <span className="text-xs font-extrabold px-3 text-muted-foreground uppercase">
              Page {currentPage} of {Math.ceil(totalCount / 15)}
            </span>
            <button 
              disabled={currentPage === Math.ceil(totalCount / 15)}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalCount / 15)))}
              className="px-3 py-1.5 text-xs font-bold border border-border rounded-xl disabled:opacity-40 hover:bg-slate-50 bg-white"
            >
              Next
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen relative font-sans text-left transition-colors duration-300">
      
      {/* BREADCRUMB */}
      <div className="flex items-center gap-1 text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider mb-2 select-none">
        <Link href="/" className="hover:text-foreground flex items-center gap-1">
          <Globe className="h-3 w-3" />
          Home
        </Link>
        <span>/</span>
        <span className="text-foreground">Attendance</span>
      </div>

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none mb-6">
        <div>
          <span className="text-xs font-extrabold text-[#0038A8] uppercase tracking-wider font-mono">
            {role === "student" ? "My Learning Progress" : role === "parent" ? "Student Learning Logs" : "Classroom Logbook Logs"}
          </span>
          <h1 className="text-xl md:text-3xl font-black text-slate-800 tracking-tight leading-tight mt-0.5">
            {role === "student" ? "My Attendance" : role === "parent" ? "Student Attendance" : "Attendance Records"}
          </h1>
        </div>

        {/* Instructor workflow routing suggestion */}
        {(role === "admin" || role === "teacher") && (
          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[#0038A8]" />
            Go to any Class Detail page to schedule sessions and mark roster sheets.
          </span>
        )}
      </div>

      {/* CONTENT PANELS BASED ON ROLE */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="h-10 w-10 border-4 border-[#0038A8] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-bold text-muted-foreground">Loading attendance logs...</p>
        </div>
      ) : role === "student" ? (
        renderStudentView()
      ) : role === "parent" ? (
        renderParentView()
      ) : (
        renderLogbookView()
      )}

    </div>
  );
}
