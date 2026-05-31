"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Award,
  GraduationCap,
  Layers,
  Edit,
  MessageSquare,
  FileText,
  CheckSquare,
  Globe,
  Calendar,
  User,
  Folder,
  ExternalLink,
  HelpCircle,
  PlayCircle,
  FileSpreadsheet,
  CheckCircle2,
  Lock,
  Users,
  BarChart2,
} from "lucide-react";
import { api } from "@/lib/api";

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const courseId = params.id as string;
  const activeModuleIdParam = searchParams.get("expandedModuleId");

  // Tab state
  const [activeTab, setActiveTab] = useState<"course" | "participants" | "grades">("course");

  // Role State
  const [role, setRole] = useState<string>("");
  
  // Primary Course States
  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Computer Science");
  const [difficulty, setDifficulty] = useState("beginner");
  const [thumbnail, setThumbnail] = useState("https://images.unsplash.com/photo-1610962381137-50ef93055125?auto=format&fit=crop&q=80&w=800");
  const [instructorName, setInstructorName] = useState("");
  
  // Dynamic Modules State
  const [modules, setModules] = useState<any[]>([]);
  const [expandedSyllabus, setExpandedSyllabus] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);

  // Participants & Grades
  const [participants, setParticipants] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [tabLoading, setTabLoading] = useState(false);


  useEffect(() => {
    // Retrieve role from localStorage safely on client side
    if (typeof window !== "undefined") {
      const userRole = localStorage.getItem("user_role") || "student";
      setRole(userRole === "instructor" ? "teacher" : userRole);
    }

    const fetchCourseDetails = async () => {
      try {
        setLoading(true);
        // 1. Fetch Course details
        const { data } = await api.get(`/courses/${courseId}`);
        if (data) {
          setCourseName(data.course_name || "");
          setCourseCode(data.course_code || "");
          setDescription(data.description || "");
          setCategory(data.category || "Computer Science");
          setDifficulty(data.difficulty || "beginner");
          setInstructorName(data.instructor_name || "Faculty Staff");
          if (data.thumbnail) {
            setThumbnail(data.thumbnail);
          }
        }

        // 2. Fetch Course modules & nested lessons dynamically
        const { data: modulesData } = await api.get(`/courses/${courseId}/modules`);
        if (modulesData && modulesData.length > 0) {
          setModules(modulesData);
          const activeModuleId = activeModuleIdParam ? parseInt(activeModuleIdParam) : modulesData[0].id;
          setExpandedSyllabus({ [activeModuleId]: true });
        } else {
          setModules([]);
        }
      } catch (err) {
        console.error("Failed to load course details from API, using realistic fallback.");
        if (courseId === "1" || courseId.includes("205")) {
          setCourseName("Full-Stack Web Development");
          setCourseCode("CS-205");
          setDescription(
            "Comprehensive journey in building full-stack web applications. Covers semantic HTML5, modern CSS3 (Flexbox/Grid), client-side JS DOM APIs, Next.js dashboard routing, and FastAPI backend servers with SQLAlchemy ORM."
          );
          setCategory("Computer Science");
          setDifficulty("intermediate");
          setInstructorName("Dr. Sarah Chen");
          const fallbackModules = [
            {
              id: 1,
              title: "HTML5 & CSS3 Essentials",
              description: "Introduction to document layout structures, semantic tags, visual CSS rules, Flexbox, and responsive Grid styling.",
              lessons: [
                { id: 1, title: "Introduction to HTML5 Semantic Tags", duration: "45min" },
                { id: 2, title: "CSS3 Flexbox Layout Guide", duration: "60min" },
                { id: 3, title: "Responsive Designs & CSS Grid", duration: "50min" }
              ]
            },
            {
              id: 2,
              title: "Client-Side Javascript & DOM Manipulation",
              description: "Programming dynamic web features, variables, array callback functions, asynchronous fetch, and interactive browser events.",
              lessons: [
                { id: 4, title: "DOM Selection and Event Listeners", duration: "50min" }
              ]
            }
          ];
          setModules(fallbackModules);
          const activeModuleId = activeModuleIdParam ? parseInt(activeModuleIdParam) : fallbackModules[0].id;
          setExpandedSyllabus({ [activeModuleId]: true });
        } else {
          setCourseName("Introduction to Python and Web Programming");
          setCourseCode("CS-101");
          setDescription(
            "Perfect introduction to programming for beginners. Master Python's clean syntax, control flow statements, data structures (lists, dicts), function structures, and fetch APIs."
          );
          setCategory("Computer Science");
          setDifficulty("beginner");
          setInstructorName("Prof. Michael Johnson");
          const fallbackModules = [
            {
              id: 1,
              title: "Python Basics & Control Flow",
              description: "Getting started with Python interpreter, variables, basic operators, loop structures (for/while), and logic conditionals.",
              lessons: [
                { id: 10, title: "Introduction to Python Interpreter", duration: "40min" },
                { id: 11, title: "Conditional Statements & Variables", duration: "45min" }
              ]
            }
          ];
          setModules(fallbackModules);
          const activeModuleId = activeModuleIdParam ? parseInt(activeModuleIdParam) : fallbackModules[0].id;
          setExpandedSyllabus({ [activeModuleId]: true });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [courseId]);

  // Fetch participants & grades when tab is switched
  useEffect(() => {
    if (activeTab === "course") return;
    const fetchTabData = async () => {
      setTabLoading(true);
      try {
        if (activeTab === "participants") {
          const { data } = await api.get(`/courses/${courseId}/students`);
          setParticipants(Array.isArray(data) ? data : data?.data ?? []);
        } else if (activeTab === "grades") {
          const { data } = await api.get(`/courses/${courseId}/grades`);
          setGrades(Array.isArray(data) ? data : data?.data ?? []);
        }
      } catch (err) {
        console.error("Failed to load tab data", err);
      } finally {
        setTabLoading(false);
      }
    };
    fetchTabData();
  }, [activeTab, courseId]);

  const toggleSyllabusExpand = (id: number) => {
    setExpandedSyllabus({
      ...expandedSyllabus,
      [id]: !expandedSyllabus[id],
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F7F8FA] text-foreground">
        <div className="h-10 w-10 border-4 border-[#0038A8] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold select-none">Loading Course Details...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen relative font-sans">
      {/* MOODLE-STYLE BREADCRUMB & HEADER SECTION */}
      <div className="flex flex-col gap-4 select-none text-left">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
            <Link href="/" className="hover:text-foreground flex items-center gap-1">
              <Globe className="h-3 w-3" />
              Home
            </Link>
            <span>/</span>
            <Link href="/list/courses" className="hover:text-foreground">My Courses</Link>
            <span>/</span>
            <span className="text-foreground font-mono max-w-[200px] truncate block">
              {courseCode || "CS-LMS"}
            </span>
            <span>/</span>
            <span className="text-foreground truncate block">
              General
            </span>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
            <div className="space-y-0.5">
              <span className="text-xs font-extrabold text-[#0038A8] uppercase tracking-wider font-mono">
                {courseCode} • {category}
              </span>
              <h1 className="text-xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-tight max-w-[800px]">
                {courseName}
              </h1>
            </div>

            {/* Moodle Administration / Action Controls */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => router.push("/list/courses")}
                className="px-4 py-2 bg-background border border-border hover:bg-accent text-foreground font-extrabold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 active:scale-[0.98]"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back</span>
              </button>
              
              {(role === "admin" || role === "teacher") && (
                <button
                  onClick={() => router.push(`/list/courses/${courseId}/edit`)}
                  className="px-4 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-violet-500/10 flex items-center gap-1.5 active:scale-[0.98]"
                >
                  <Edit className="h-3.5 w-3.5" />
                  <span>Turn Editing On</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* MOODLE BOOST TAB-BAR NAVIGATION */}
        <div className="flex border-b border-border/60 gap-6 select-none text-xs font-extrabold text-muted-foreground pt-2">
          <button
            onClick={() => setActiveTab("course")}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === "course"
                ? "border-[#0038A8] text-foreground"
                : "border-transparent hover:text-foreground"
            }`}
          >
            Course
          </button>
          <button
            onClick={() => setActiveTab("participants")}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "participants"
                ? "border-[#0038A8] text-foreground"
                : "border-transparent hover:text-foreground"
            }`}
          >
            {/* <Users className="h-3.5 w-3.5" /> */}
            Participants
          </button>
          <button
            onClick={() => setActiveTab("grades")}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "grades"
                ? "border-[#0038A8] text-foreground"
                : "border-transparent hover:text-foreground"
            }`}
          >
            {/* <BarChart2 className="h-3.5 w-3.5" /> */}
            Grades
          </button>
          <button className="pb-3 border-b-2 border-transparent hover:text-foreground opacity-60 cursor-not-allowed">Competencies</button>
          <button className="pb-3 border-b-2 border-transparent hover:text-foreground opacity-60 cursor-not-allowed">Reports</button>
        </div>
      </div>

      {/* ── PARTICIPANTS TAB ─────────────────────────────────────────────── */}
      {activeTab === "participants" && (
        <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm">
          <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            {/* <Users className="h-4 w-4 text-[#0038A8]" /> */}
            Course Participants
          </h2>

          {tabLoading ? (
            <div className="flex justify-center py-10">
              <div className="h-8 w-8 border-4 border-[#0038A8] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : participants.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold">No participants enrolled in this course yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-[10px] uppercase tracking-wider text-muted-foreground font-black">
                    <th className="text-left py-2 px-3">Name</th>
                    <th className="text-left py-2 px-3">Username</th>
                    <th className="text-left py-2 px-3">Email</th>
                    <th className="text-left py-2 px-3">Enrolled Date</th>
                    <th className="text-left py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {participants.map((p: any) => (
                    <tr key={p.id ?? p.student_id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-3 font-bold text-foreground">
                        {p.full_name || p.name || "—"}
                      </td>
                      <td className="py-3 px-3 text-muted-foreground font-mono text-xs">
                        {p.username || "—"}
                      </td>
                      <td className="py-3 px-3 text-muted-foreground text-xs">
                        {p.email || "—"}
                      </td>
                      <td className="py-3 px-3 text-muted-foreground text-xs">
                        {p.enrolled_date || "—"}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded border uppercase ${
                          p.is_active !== false
                            ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100"
                            : "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-100"
                        }`}>
                          {p.is_active !== false ? "Enrolled" : "Dropped"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── GRADES TAB ───────────────────────────────────────────────────── */}
      {activeTab === "grades" && (
        <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm">
          <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            {/* <BarChart2 className="h-4 w-4 text-[#0038A8]" /> */}
            Course Grades
          </h2>

          {tabLoading ? (
            <div className="flex justify-center py-10">
              <div className="h-8 w-8 border-4 border-[#0038A8] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : grades.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <BarChart2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold">No grades recorded for this course yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-[10px] uppercase tracking-wider text-muted-foreground font-black">
                    <th className="text-left py-2 px-3">Student</th>
                    <th className="text-left py-2 px-3">Assessment</th>
                    <th className="text-left py-2 px-3">Score</th>
                    <th className="text-left py-2 px-3">Grade</th>
                    <th className="text-left py-2 px-3">Status</th>
                    <th className="text-left py-2 px-3">Graded By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {grades.map((g: any) => (
                    <tr key={g.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-3 font-bold text-foreground">
                        {g.student_name || "—"}
                      </td>
                      <td className="py-3 px-3 text-muted-foreground text-xs">
                        {g.assessment_title || "—"}
                      </td>
                      <td className="py-3 px-3 font-bold">
                        {g.score ?? "—"} / {g.total_marks ?? "—"}
                        {g.percentage != null && (
                          <span className="ml-1 text-[10px] text-muted-foreground">({g.percentage.toFixed(1)}%)</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 text-xs font-black rounded border border-indigo-100 dark:border-indigo-900/30">
                          {g.grade || "—"}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded border uppercase ${
                          g.is_passed
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : "bg-red-50 text-red-600 border-red-100"
                        }`}>
                          {g.is_passed ? "Passed" : "Failed"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground text-xs">
                        {g.grader_name || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MAIN LAYOUT GRID (Moodle standard two-column layout) */}
      {activeTab === "course" && <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 text-left">
        
        {/* LEFT COLUMN: CURRICULUM & SYLLABUS (7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* COURSE SYNOPSIS HERO CARD */}
          <div className="bg-card border border-border/60 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.01)]">
            <div className="relative aspect-[21/9] w-full bg-muted border-b border-border/60">
              <img
                src={thumbnail}
                alt={courseName}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
              
              <span className="absolute bottom-4 left-4 px-3 py-1 bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur shadow-sm rounded-xl text-xs font-black uppercase text-[#0038A8] tracking-widest">
                {category}
              </span>
            </div>

            <div className="p-6 space-y-4">
              <h2 className="text-lg font-black text-foreground tracking-tight select-none">Course Overview</h2>
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                {description || "No description provided for this course learning curriculum."}
              </p>
            </div>
          </div>

          {/* GENERAL MOODLE GENERAL CARD */}
          <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.01)] text-left space-y-4">
            <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider select-none">General</h2>
            <div className="space-y-2">
              {/* Forum Announcement */}
              <div className="flex items-center justify-between p-3.5 bg-[#f4f6fa]/60 dark:bg-muted/10 hover:bg-[#eef2fa] dark:hover:bg-muted/20 border border-border/40 rounded-2xl transition-all shadow-sm">
                <div className="flex items-center gap-3.5 max-w-[80%]">
                  <div className="h-9 w-9 rounded-xl bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <MessageSquare className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-foreground hover:text-[#0038A8] dark:hover:text-[#4f88ef] cursor-pointer transition-colors">
                      Announcements & Course News
                    </span>
                    <span className="text-[10px] text-muted-foreground font-semibold">
                      General announcements and critical system-wide notices.
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-bold text-[8px] rounded border border-blue-100 dark:border-blue-900/30 uppercase tracking-wider">
                    Forum
                  </span>
                  <div className="h-5 w-5 rounded-full border border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="h-3 w-3" />
                  </div>
                </div>
              </div>

              {/* Forum Q&A */}
              <div className="flex items-center justify-between p-3.5 bg-[#f4f6fa]/60 dark:bg-muted/10 hover:bg-[#eef2fa] dark:hover:bg-muted/20 border border-border/40 rounded-2xl transition-all shadow-sm">
                <div className="flex items-center gap-3.5 max-w-[80%]">
                  <div className="h-9 w-9 rounded-xl bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <MessageSquare className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-foreground hover:text-[#0038A8] dark:hover:text-[#4f88ef] cursor-pointer transition-colors">
                      Student Coffee House & Help Q&A
                    </span>
                    <span className="text-[10px] text-muted-foreground font-semibold">
                      Ask questions, post syllabus feedback, or seek group study partners.
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-bold text-[8px] rounded border border-blue-100 dark:border-blue-900/30 uppercase tracking-wider">
                    Forum
                  </span>
                  <div className="h-5 w-5 rounded-full border border-gray-300 dark:border-gray-800 flex items-center justify-center" title="To do: Post 1 reply">
                    <div className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                  </div>
                </div>
              </div>

              {/* PDF Syllabus Resource */}
              <div className="flex items-center justify-between p-3.5 bg-[#f4f6fa]/60 dark:bg-muted/10 hover:bg-[#eef2fa] dark:hover:bg-muted/20 border border-border/40 rounded-2xl transition-all shadow-sm">
                <div className="flex items-center gap-3.5 max-w-[80%]">
                  <div className="h-9 w-9 rounded-xl bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                    <FileText className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-foreground hover:text-[#0038A8] dark:hover:text-[#4f88ef] cursor-pointer transition-colors">
                      Official Course Handbook & Guidelines.pdf
                    </span>
                    <span className="text-[10px] text-muted-foreground font-semibold">
                      Course description, grading scales, assignment deadlines, and expectations.
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 font-bold text-[8px] rounded border border-red-100 dark:border-red-900/30 uppercase tracking-wider">
                    File
                  </span>
                  <div className="h-5 w-5 rounded-full border border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="h-3 w-3" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COURSE STRUCTURE & TOPIC OUTLINE (Moodle Format) */}
          <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.01)]">
            <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider mb-6 text-left select-none">Topic Outline</h2>

            {modules.length > 0 ? (
              <div className="space-y-4">
                {modules.map((module, idx) => {
                  const isExpanded = !!expandedSyllabus[module.id];
                  return (
                    <div
                      key={module.id}
                      className="border border-border/80 rounded-2xl overflow-hidden shadow-sm bg-[#F7F8FA]/30 hover:border-border transition-all"
                    >
                      {/* Topic Header block */}
                      <div className="flex items-center gap-3 px-4 py-3.5 bg-[#F7F8FA]/80 select-none">
                        <button
                          onClick={() => toggleSyllabusExpand(module.id)}
                          className="text-muted-foreground/60 hover:text-foreground shrink-0 transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="h-4.5 w-4.5" /> : <ChevronDown className="h-4.5 w-4.5" />}
                        </button>

                        <span className="text-xs font-black text-foreground truncate flex-1 text-left uppercase tracking-wide">
                          Topic {idx + 1}: {module.title}
                        </span>
                        
                        <span className="px-2.5 py-1 bg-white dark:bg-muted border border-border/80 text-muted-foreground font-black text-[9px] rounded-lg shadow-sm">
                          {module.lessons?.length || 0} Activities
                        </span>
                      </div>

                      {/* Accordion expanded content */}
                      {isExpanded && (
                        <div className="p-5 border-t border-border/50 bg-card text-left space-y-5">
                          {module.description && (
                            <div className="space-y-1 bg-muted/20 p-3.5 border border-border/30 rounded-2xl">
                              <p className="text-[9px] font-black text-[#0038A8] dark:text-[#4f88ef] uppercase tracking-wider">Topic Introduction</p>
                              <p className="text-xs text-muted-foreground leading-relaxed font-medium">{module.description}</p>
                            </div>
                          )}
                          
                          <div className="space-y-3">
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Learning Activities & Resources</p>
                            
                            <div className="space-y-2.5">
                              {module.lessons && module.lessons.length > 0 ? (
                                module.lessons.map((lesson: any, lIdx: number) => {
                                  // Mock completion check: even lectures are done, odd are to do
                                  const isDone = lesson.id % 2 === 0;
                                  return (
                                    <div key={lesson.id} className="flex items-center justify-between p-3 bg-[#f8fafc]/50 dark:bg-muted/5 border border-border/40 hover:border-border/80 rounded-2xl transition-all shadow-sm">
                                      <div className="flex items-center gap-3 max-w-[70%]">
                                        {/* Moodle Page Icon */}
                                        <div className="h-8.5 w-8.5 rounded-xl bg-sky-100 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                                          <BookOpen className="h-4.5 w-4.5" />
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                          <span className="text-xs font-bold text-foreground truncate hover:text-[#0038A8] dark:hover:text-[#4f88ef]">
                                            Lecture {lIdx + 1}: {lesson.title}
                                          </span>
                                          {lesson.duration && (
                                            <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                                              <ClockIcon className="h-3 w-3 text-[#0038A8]" />
                                              <span>{lesson.duration} lecture slide resource</span>
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center gap-3">
                                        <Link href={`/list/lessons/${lesson.id}?courseId=${courseId}&moduleId=${module.id}`}>
                                          <button className="px-3 py-1.5 bg-[#0038A8]/10 hover:bg-[#0038A8]/20 border border-[#0038A8]/20 text-[#0038A8] font-bold text-[9px] rounded-lg shadow-sm transition-colors active:scale-[0.98]">
                                            Enter Activity
                                          </button>
                                        </Link>
                                        {/* Completion Tracker circle */}
                                        {isDone ? (
                                          <div className="h-5 w-5 rounded-full border border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center" title="Done: View activity">
                                            <CheckCircle2 className="h-3 w-3" />
                                          </div>
                                        ) : (
                                          <div className="h-5 w-5 rounded-full border border-dashed border-gray-400 dark:border-gray-700 flex items-center justify-center" title="To do: View activity">
                                            <div className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <p className="text-xs text-muted-foreground italic">No learning resources registered in this topic.</p>
                              )}

                              {/* MOCK ASSIGNMENT PORTAL TO COMPLETE MOODLE VIBE */}
                              <div className="flex items-center justify-between p-3 bg-[#fbf7f0] dark:bg-[#fbf7f0]/5 border border-amber-200/50 hover:border-amber-300 dark:border-amber-900/30 rounded-2xl transition-all shadow-sm">
                                <div className="flex items-center gap-3 max-w-[70%]">
                                  {/* Moodle Assignment Icon (Orange Amber) */}
                                  <div className="h-8.5 w-8.5 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                    <FileSpreadsheet className="h-4.5 w-4.5" />
                                  </div>
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-xs font-bold text-foreground truncate hover:text-[#b45309]">
                                      Syllabus Project Assignment: Topic {idx + 1} Submit
                                    </span>
                                    <span className="text-[10px] text-amber-800 dark:text-amber-400 font-semibold">
                                      Submission portal open • Graded assessment
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Link href="/list/assignments">
                                    <button className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-700 dark:text-amber-400 font-bold text-[9px] rounded-lg shadow-sm transition-colors active:scale-[0.98]">
                                      Add Submission
                                    </button>
                                  </Link>
                                  <div className="h-5 w-5 rounded-full border border-dashed border-amber-400 flex items-center justify-center" title="To do: Submit project">
                                    <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                                  </div>
                                </div>
                              </div>

                              {/* MOCK PRACTICE QUIZ TO COMPLETE MOODLE VIBE */}
                              <div className="flex items-center justify-between p-3 bg-[#fff5f5] dark:bg-[#fff5f5]/5 border border-red-200/50 hover:border-red-300 dark:border-red-900/30 rounded-2xl transition-all shadow-sm">
                                <div className="flex items-center gap-3 max-w-[70%]">
                                  {/* Moodle Quiz Icon (Pink Red) */}
                                  <div className="h-8.5 w-8.5 rounded-xl bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                                    <CheckSquare className="h-4.5 w-4.5" />
                                  </div>
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-xs font-bold text-foreground truncate hover:text-[#b91c1c]">
                                      Review Practice Quiz: Topic {idx + 1} Essentials
                                    </span>
                                    <span className="text-[10px] text-red-800 dark:text-red-400 font-semibold">
                                      Automated scoring • 15 questions
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Link href="/list/quizzes">
                                    <button className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-700 dark:text-red-400 font-bold text-[9px] rounded-lg shadow-sm transition-colors active:scale-[0.98]">
                                      Attempt Quiz
                                    </button>
                                  </Link>
                                  <div className="h-5 w-5 rounded-full border border-dashed border-red-400 flex items-center justify-center" title="To do: Receive a grade">
                                    <div className="h-1.5 w-1.5 rounded-full bg-red-400" />
                                  </div>
                                </div>
                              </div>

                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic text-center py-6">No syllabus topics registered for this course.</p>
            )}
          </div>

        </div>

        {/* MOODLE SIDEBAR BLOCKS (3 Columns) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* COURSE COMPLETION BLOCK */}
          <div className="bg-card border border-border/60 rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.01)] text-left space-y-4">
            <div className="flex items-center gap-2 select-none pb-2 border-b border-border/60">
              <CheckSquare className="h-4 w-4 text-[#0038A8]" />
              <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Course Completion
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-foreground">
                <span>Progress</span>
                <span className="text-[#0038A8]">67%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-gradient-to-r from-[#0038A8] to-[#4f88ef] rounded-full transition-all" style={{ width: "67%" }} />
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold">
                <span>6 of 9 Activities completed</span>
                <span className="hover:underline cursor-pointer text-[#0038A8]">More details</span>
              </div>
            </div>
          </div>

          {/* UPCOMING EVENTS BLOCK */}
          <div className="bg-card border border-border/60 rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.01)] text-left space-y-4">
            <div className="flex items-center gap-2 select-none pb-2 border-b border-border/60">
              <Calendar className="h-4 w-4 text-amber-500" />
              <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Upcoming Events
              </h3>
            </div>
            <div className="space-y-3.5">
              <div className="flex gap-3">
                <div className="h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-900/30">
                  <FileSpreadsheet className="h-4.5 w-4.5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-foreground truncate hover:underline cursor-pointer">
                    Syllabus Assignment 1
                  </span>
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    Due Thursday, Jun 4, 11:59 PM
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="h-9 w-9 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 border border-red-100 dark:border-red-900/30">
                  <CheckSquare className="h-4.5 w-4.5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-foreground truncate hover:underline cursor-pointer">
                    Practice Quiz 1 Essentials
                  </span>
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    Due Saturday, Jun 6, 11:59 PM
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* LATEST ANNOUNCEMENTS BLOCK */}
          <div className="bg-card border border-border/60 rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.01)] text-left space-y-4">
            <div className="flex items-center gap-2 select-none pb-2 border-b border-border/60">
              <MessageSquare className="h-4 w-4 text-emerald-500" />
              <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Latest News
              </h3>
            </div>
            <div className="space-y-3.5">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-foreground hover:underline cursor-pointer">
                  Welcome to the Classroom!
                </span>
                <span className="text-[9px] text-muted-foreground font-semibold">
                  By {instructorName} • May 29, 9:00 AM
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-foreground hover:underline cursor-pointer">
                  Weekly syllabus updates posted
                </span>
                <span className="text-[9px] text-muted-foreground font-semibold">
                  By {instructorName} • May 28, 4:15 PM
                </span>
              </div>
            </div>
          </div>

          {/* COURSE ADMINISTRATION WIDGET */}
          <div className="bg-card border border-border/60 rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.01)] text-left space-y-4">
            <div className="flex items-center gap-2 select-none pb-2 border-b border-border/60">
              <Layers className="h-4 w-4 text-[#0038A8]" />
              <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Course Admin
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-[#0038A8] dark:text-[#4f88ef] flex items-center justify-center shrink-0">
                  <GraduationCap className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase select-none">Instructor</p>
                  <p className="text-xs font-extrabold text-foreground truncate max-w-[150px]">
                    {instructorName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <BookOpen className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase select-none">Course Code</p>
                  <p className="text-xs font-extrabold text-foreground font-mono">
                    {courseCode}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Layers className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase select-none">Difficulty</p>
                  <p className="text-xs font-extrabold text-foreground capitalize">
                    {difficulty}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>}

    </div>
  );
}

// Clock Icon Helper Component
function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
