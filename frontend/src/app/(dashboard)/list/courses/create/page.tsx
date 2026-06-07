"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  CheckCircle,
  Globe,
  Settings2,
  FileText,
  Layers,
  BookOpen,
  FileUp,
  ExternalLink,
  GripVertical,
  Eye,
  EyeOff,
  Percent,
  User,
  DollarSign,
  BarChart4,
  Image as ImageIcon,
  Link2
} from "lucide-react";
import { api } from "@/lib/api";
import { getImageUrl } from "@/lib/image-url";
import LessonForm from "@/components/forms/LessonForm";
import BackButton from "@/components/BackButton";
import { toast } from "react-toastify";

type LessonItem = {
  id: number;
  title: string;
  order: number;
  duration: string;
  material_type: string;
  material_url: string | null;
  material_file: string | null;
  content: string;
  is_visible: boolean;
};

type SyllabusItem = {
  id: number;
  week: number;
  title: string;
  lessons: LessonItem[];
  is_hidden_from_students: boolean;
};

export default function CourseCreatePage() {
  const router = useRouter();

  // Core Baseline Form States
  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Computer Science");
  const [difficulty, setDifficulty] = useState("beginner");
  const [price, setPrice] = useState<number>(0);
  const [maxStudents, setMaxStudents] = useState<number>(40);
  const [isPublished, setIsPublished] = useState(true);
  
  // 🚀 THUMBNAIL STATE CONTROL
  const [thumbnail, setThumbnail] = useState("https://images.unsplash.com/photo-1610962381137-50ef93055125?auto=format&fit=crop&q=80&w=800");
  
  // Custom Syllabus Tree
  const [syllabus, setSyllabus] = useState<SyllabusItem[]>([]);
  const [expandedSyllabus, setExpandedSyllabus] = useState<Record<number, boolean>>({});

  // Global UX States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  
  // Active Modal Trackers
  const [editSyllabusId, setEditSyllabusId] = useState<number | null>(null);
  const [editSyllabusText, setEditSyllabusText] = useState("");
  const [editSyllabusOrder, setEditSyllabusOrder] = useState<number>(1);

  const [addLessonModuleId, setAddLessonModuleId] = useState<number | null>(null);
  const [editLessonId, setEditLessonId] = useState<number | null>(null);
  const [editLessonParentModuleId, setEditLessonParentModuleId] = useState<number | null>(null);
  const [selectedLessonData, setSelectedLessonData] = useState<any>(null);

  const totalLessonsCount = syllabus.reduce((acc, current) => acc + (current.lessons?.length || 0), 0);
  const calculatedEstimatedDuration = syllabus.reduce((acc, curr) => {
    return acc + curr.lessons.reduce((lAcc, lCurr) => lAcc + (parseInt(lCurr.duration) || 0), 0);
  }, 0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const role = localStorage.getItem("user_role") || "student";
      if (role !== "admin" && role !== "instructor" && role !== "teacher") {
        router.push(`/list/courses`);
        return;
      }
    }
    setLoading(false);
  }, [router]);

  const handleSave = async () => {
    if (!courseName.trim() || !courseCode.trim()) {
      toast.error("Please provide both a Course Name and a Course Code.");
      return;
    }

    try {
      setSaving(true);
      
      const compiledModules = syllabus.map((moduleItem, modIdx) => ({
        title: moduleItem.title,
        description: moduleItem.is_hidden_from_students ? "STATUS_DRAFT_HIDDEN" : "",
        order: Number(moduleItem.week) || (modIdx + 1),
        lessons: moduleItem.lessons.map((lessonItem, lesIdx) => ({
          title: lessonItem.title,
          content: lessonItem.content || "",
          description: lessonItem.is_visible ? lessonItem.content : "VISIBILITY_DISABLED_STUDENT",
          duration: lessonItem.duration,
          material_type: lessonItem.material_type || "article",
          material_url: lessonItem.material_url || null,
          material_file: lessonItem.material_file || null,
          order: Number(lessonItem.order) || (lesIdx + 1)
        }))
      }));

      const response = await api.post("/courses", {
        course_name: courseName,
        course_code: courseCode,
        description: description,
        category: category,
        difficulty: difficulty,
        price: price ? parseFloat(String(price)) : 0.0,
        is_published: isPublished,
        thumbnail: thumbnail,
        duration: syllabus.length || 1,
        max_students: Number(maxStudents) || 40,
        has_modules: compiledModules.length > 0,
        modules: compiledModules
      });

      const newCourseId = response.data?.id || response.data?.data?.id;

      setShowSuccessToast(true);
      setTimeout(() => {
        setShowSuccessToast(false);
        router.push(newCourseId ? `/list/courses/${newCourseId}` : "/list/courses");
      }, 1500);
    } catch (err) {
      console.error(err);
      toast.error("Error committing schema records down to the database layer.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddSyllabusSection = () => {
    const nextWeek = syllabus.length + 1;
    const newItem: SyllabusItem = {
      id: Date.now(), 
      week: nextWeek,
      title: `Topic Section ${nextWeek}`,
      lessons: [],
      is_hidden_from_students: false
    };
    setSyllabus([...syllabus, newItem]);
    setExpandedSyllabus({ ...expandedSyllabus, [newItem.id]: true });
  };

  const toggleTopicVisibility = (id: number) => {
    setSyllabus(syllabus.map(s => s.id === id ? { ...s, is_hidden_from_students: !s.is_hidden_from_students } : s));
  };

  const toggleLessonVisibility = (moduleId: number, lessonId: number) => {
    setSyllabus(syllabus.map(s => {
      if (s.id === moduleId) {
        return {
          ...s,
          lessons: s.lessons.map(l => l.id === lessonId ? { ...l, is_visible: !l.is_visible } : l)
        };
      }
      return s;
    }));
  };

  const toggleSyllabusExpand = (id: number) => {
    setExpandedSyllabus({ ...expandedSyllabus, [id]: !expandedSyllabus[id] });
  };

  const startEditSyllabus = (item: SyllabusItem) => {
    setEditSyllabusId(item.id);
    setEditSyllabusText(item.title);
    setEditSyllabusOrder(item.week);
  };

  const saveSyllabusEdit = () => {
    setSyllabus(syllabus.map((s) => s.id === editSyllabusId ? { ...s, title: editSyllabusText, week: editSyllabusOrder } : s));
    setEditSyllabusId(null);
  };

  const handleDeleteSyllabusSection = (id: number) => {
    setSyllabus(syllabus.filter((s) => s.id !== id));
  };

  const handleCloseLessonModal = () => {
    setAddLessonModuleId(null);
    setEditLessonId(null);
    setEditLessonParentModuleId(null);
    setSelectedLessonData(null);
  };

  const handleInlineLessonFormSubmit = (values: any) => {
    const computedDuration = String(values.duration).endsWith("min") ? values.duration : `${values.duration || 15}min`;
    
    if (addLessonModuleId) {
      setSyllabus(syllabus.map((s) => {
        if (s.id === addLessonModuleId) {
          const currentLessons = s.lessons || [];
          return {
            ...s,
            lessons: [
              ...currentLessons,
              {
                id: Date.now(),
                title: values.title,
                order: Number(values.order) || (currentLessons.length + 1),
                duration: computedDuration,
                material_type: values.material_type || "article",
                material_url: values.material_url || null,
                material_file: values.material_file || null,
                content: values.content || "",
                is_visible: true
              }
            ]
          };
        }
        return s;
      }));
    } else if (editLessonId && editLessonParentModuleId) {
      setSyllabus(syllabus.map((s) => {
        if (s.id === editLessonParentModuleId) {
          return {
            ...s,
            lessons: s.lessons.map((l) => 
              l.id === editLessonId 
                ? {
                    ...l,
                    title: values.title,
                    order: Number(values.order) || l.order,
                    duration: computedDuration,
                    material_type: values.material_type || l.material_type,
                    material_url: values.material_url || null,
                    material_file: values.material_file || null,
                    content: values.content || ""
                  }
                : l
            )
          };
        }
        return s;
      }));
    }
    handleCloseLessonModal();
  };

  const openEditLessonModal = (moduleId: number, lesson: LessonItem) => {
    setEditLessonParentModuleId(moduleId);
    setEditLessonId(lesson.id);
    setSelectedLessonData({
      title: lesson.title,
      order: lesson.order,
      duration: parseInt(lesson.duration) || 15,
      material_type: lesson.material_type,
      material_url: lesson.material_url,
      material_file: lesson.material_file,
      content: lesson.content
    }); 
  };

  const handleDeleteLesson = (moduleId: number, lessonId: number) => {
    setSyllabus(syllabus.map((s) => {
      if (s.id === moduleId) {
        return { ...s, lessons: s.lessons.filter((l) => l.id !== lessonId) };
      }
      return s;
    }));
  };

  const renderActivityIcon = (type: string) => {
    switch (type) {
      case "file": return <FileUp className="h-4 w-4 text-emerald-600 shrink-0" />;
      case "url": return <ExternalLink className="h-4 w-4 text-amber-600 shrink-0" />;
      default: return <BookOpen className="h-4 w-4 text-sky-600 shrink-0" />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F7F8FA]">
        <div className="h-10 w-10 border-4 border-[#0038A8] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-600">Configuring Workspace Framework...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 pb-24 space-y-6 bg-[#F7F8FA] min-h-screen text-left font-sans">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2.5 px-6 py-4 bg-white/90 backdrop-blur-xl border border-[#0038A8]/20 shadow-2xl rounded-2xl"
          >
            <CheckCircle className="h-5 w-5 text-[#0038A8]" />
            <span className="text-sm font-black text-slate-800">Course Created Successfully</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Syllabus Module Renamer */}
      {editSyllabusId !== null && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="w-[450px] p-6 bg-white border border-slate-200 shadow-2xl rounded-2xl space-y-4 text-left">
            <h3 className="text-base font-extrabold text-slate-900">Edit Module Settings</h3>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Topic Title</label>
              <input type="text" value={editSyllabusText} onChange={(e) => setEditSyllabusText(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-sm font-medium focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Topic Week Position</label>
              <input type="number" value={editSyllabusOrder} onChange={(e) => setEditSyllabusOrder(parseInt(e.target.value) || 1)} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-sm font-medium focus:outline-none" />
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <button onClick={() => setEditSyllabusId(null)} className="px-4 py-2 border rounded-xl hover:bg-slate-50 font-bold text-xs">Cancel</button>
              <button onClick={saveSyllabusEdit} className="px-4 py-2 bg-[#0038A8] text-white font-bold rounded-xl text-xs hover:bg-[#002D86]">Confirm Setup</button>
            </div>
          </div>
        </div>
      )}

      {/* LESSONFORM INLINE INTERCEPTOR MODAL */}
      <AnimatePresence>
        {(addLessonModuleId !== null || editLessonId !== null) && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-xs overflow-y-auto p-4"
            onClick={(e) => { if (e.target === e.currentTarget) handleCloseLessonModal(); }}
          >
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-2" onClick={(e) => e.stopPropagation()}>
              <LessonForm 
                type={editLessonId ? "update" : "create"}
                data={selectedLessonData}
                setOpen={handleCloseLessonModal}
                onCancel={handleCloseLessonModal}
                relatedData={{ inlineHandler: handleInlineLessonFormSubmit }} 
              />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* BREADCRUMBS */}
      <div className="flex flex-col gap-4 select-none">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase tracking-wider font-bold">
            <Link href="/" className="hover:text-slate-800 flex items-center gap-1"><Globe className="h-3 w-3" />Home</Link>
            <span>/</span>
            <Link href="/list/courses" className="hover:text-slate-800">My Courses</Link>
            <span>/</span>
            <span className="text-slate-800">Create Course Catalog</span>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <BackButton />
            <div>
              <span className="text-xs font-extrabold text-[#0038A8] uppercase tracking-wider font-mono">
                Administration Suite
              </span>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                Create New Activity Course Structure
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className="lg:col-span-3 space-y-6">
          
          {/* CORE ATTRIBUTES */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Settings2 className="h-4 w-4 text-[#0038A8]" />
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">General Configuration</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-6 items-start">
              <label className="md:col-span-2 text-xs font-bold text-slate-500 uppercase tracking-wide md:pt-3">Course Full Name</label>
              <div className="md:col-span-4">
                <input type="text" value={courseName} onChange={(e) => setCourseName(e.target.value)} placeholder="e.g. Introduction to Machine Learning" className="w-full px-4 py-2.5 bg-slate-50/50 border rounded-xl text-sm font-semibold focus:outline-none focus:border-[#0038A8]/40" />
              </div>
              <label className="md:col-span-2 text-xs font-bold text-slate-500 uppercase tracking-wide md:pt-3">Course Code / Short Name</label>
              <div className="md:col-span-4">
                <input type="text" value={courseCode} onChange={(e) => setCourseCode(e.target.value)} placeholder="e.g. CS-404" className="w-full md:w-1/2 px-4 py-2.5 bg-slate-50/50 border rounded-xl text-sm font-mono font-bold focus:outline-none focus:border-[#0038A8]/40" />
              </div>
              <label className="md:col-span-2 text-xs font-bold text-slate-500 uppercase tracking-wide md:pt-3">Category Group</label>
              <div className="md:col-span-4">
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full md:w-2/3 px-3 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold focus:outline-none">
                  <option value="Computer Science">Computer Science</option>
                  <option value="Business">Business</option>
                  <option value="Economics">Economics</option>
                  <option value="Mathematics">Mathematics</option>
                </select>
              </div>
            </div>
          </div>

          {/* 🚀 COURSE THUMBNAIL MANAGER BLOCK */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <ImageIcon className="h-4 w-4 text-[#0038A8]" />
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Course Media Thumbnail</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-6 items-center">
              <label className="md:col-span-2 text-xs font-bold text-slate-500 uppercase tracking-wide">Image Preview</label>
              <div className="md:col-span-4 space-y-4">
                <div className="relative aspect-[21/9] w-full max-w-md border border-slate-200 rounded-2xl overflow-hidden shadow-inner bg-slate-50 flex items-center justify-center group">
                  {thumbnail ? (
                    <img src={getImageUrl(thumbnail) || ""} alt="Thumbnail Cover Preview" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" onError={() => setThumbnail("")} />
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-slate-400 select-none">
                      <ImageIcon className="h-8 w-8 stroke-[1.5]" />
                      <span className="text-[10px] font-bold tracking-wide uppercase">No Image Loaded</span>
                    </div>
                  )}
                </div>
                <div className="relative max-w-md">
                  <Link2 className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input type="text" value={thumbnail} onChange={(e) => setThumbnail(e.target.value)} placeholder="Paste Unsplash banner asset link or Cloudinary string path..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border rounded-xl text-xs font-mono font-medium focus:outline-none" />
                </div>
              </div>
            </div>
          </div>

          {/* SUMMARY SECTION */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <FileText className="h-4 w-4 text-[#0038A8]" />
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Description and Summary</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-6 items-start">
              <label className="md:col-span-2 text-xs font-bold text-slate-500 uppercase tracking-wide md:pt-3">Course Synopsis Summary</label>
              <div className="md:col-span-4">
                <div className="border rounded-2xl overflow-hidden bg-slate-50/20">
                  <div className="flex items-center gap-1 p-2 bg-slate-50 border-b select-none">
                    <span className="text-[10px] text-slate-400 font-black px-2 py-1 rounded-md bg-white border flex items-center gap-1">Normal text <ChevronDown className="h-3 w-3" /></span>
                  </div>
                  <textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide detailed learning paths, outcomes, and contextual overview constraints..." className="w-full p-4 bg-transparent focus:outline-none text-xs leading-relaxed font-medium" />
                </div>
              </div>
            </div>
          </div>

          {/* SYLLABUS OUTLINE MATRIX */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-[#0038A8]" />
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Course Syllabus Framework Topics</h2>
              </div>
              <button type="button" onClick={handleAddSyllabusSection} className="flex items-center gap-1.5 text-xs font-bold text-[#8b5cf6] hover:bg-[#7c3aed] bg-[#8b5cf6]/5 px-3 py-1.5 rounded-xl border border-[#8b5cf6]/10 transition-colors">
                <Plus className="h-3.5 w-3.5" />
                <span>Add Syllabus Folder</span>
              </button>
            </div>

            <div className="space-y-3">
              {syllabus.map((item, idx) => {
                const isExpanded = !!expandedSyllabus[item.id];
                return (
                  <div key={item.id} className={`border rounded-2xl overflow-hidden transition-all ${item.is_hidden_from_students ? "border-dashed border-slate-300 bg-slate-100/50" : "border-slate-200 bg-slate-50/30"}`}>
                    <div onClick={() => toggleSyllabusExpand(item.id)} className="flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100/80 cursor-pointer select-none transition-colors">
                      <GripVertical className="h-4 w-4 text-slate-300 cursor-grab shrink-0" />
                      <span className="text-slate-400 shrink-0">{isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</span>
                      <span className={`text-xs font-bold truncate flex-1 ${item.is_hidden_from_students ? "text-slate-400 line-through" : "text-slate-800"}`}>
                        Topic {idx + 1}: {item.title} (Week {item.week}) 
                        {item.is_hidden_from_students && <span className="ml-2 text-[9px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Hidden Draft</span>}
                      </span>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button type="button" onClick={() => toggleTopicVisibility(item.id)} className="p-1.5 border bg-white rounded-lg text-slate-500 hover:text-slate-700">
                          {item.is_hidden_from_students ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                        <button type="button" onClick={() => startEditSyllabus(item)} className="px-2.5 py-1 bg-white hover:bg-slate-50 border text-slate-700 font-bold text-[10px] rounded-lg">Position</button>
                        <button type="button" onClick={() => handleDeleteSyllabusSection(item.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-4 border-t bg-white space-y-3">
                        {item.lessons && item.lessons.length > 0 ? (
                          <div className="space-y-2">
                            {item.lessons.map((lesson) => (
                              <div key={lesson.id} className={`flex items-center justify-between p-2.5 border rounded-xl hover:bg-slate-50/80 transition-all ${!lesson.is_visible ? "opacity-50 bg-slate-50/50" : "bg-white"}`}>
                                <div className="flex items-center gap-2.5 truncate max-w-[70%]">
                                  {renderActivityIcon(lesson.material_type)}
                                  <span className={`text-xs font-bold truncate ${!lesson.is_visible ? "line-through text-slate-400" : "text-slate-700"}`}>{lesson.title}</span>
                                </div>
                                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                  <button type="button" onClick={() => toggleLessonVisibility(item.id, lesson.id)} className="p-1 text-slate-400 hover:text-slate-600">
                                    {lesson.is_visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                                  </button>
                                  <button type="button" onClick={() => openEditLessonModal(item.id, lesson)} className="px-2 py-1 bg-white border font-bold text-[9px] rounded-lg text-slate-600 hover:bg-slate-50">Modify</button>
                                  <button type="button" onClick={() => handleDeleteLesson(item.id, lesson.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-400 font-semibold py-1.5 italic">No operational lesson activities attached inside this section yet.</p>
                        )}
                        <button type="button" onClick={() => setAddLessonModuleId(item.id)} className="w-full py-2 bg-sky-500/5 hover:bg-sky-500/10 border border-dashed border-sky-500/20 text-sky-700 font-extrabold text-[10px] rounded-xl flex items-center justify-center gap-1.5 transition-colors"><Plus className="h-3.5 w-3.5" /><span>Add Lesson Activity</span></button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* SIDEBAR METRICS */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
              <BarChart4 className="h-4 w-4 text-[#0038A8]" /> Live Metrics Summary
            </h3>
            <div className="space-y-3 font-medium text-xs text-slate-600">
              <div className="flex justify-between"><span>Topic Weeks:</span><span className="font-bold font-mono text-slate-900">{syllabus.length}</span></div>
              <div className="flex justify-between"><span>Total Lessons:</span><span className="font-bold font-mono text-slate-900">{totalLessonsCount}</span></div>
              <div className="flex justify-between"><span>Est. Runtime:</span><span className="font-bold font-mono text-slate-900">{calculatedEstimatedDuration} mins</span></div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
              <Percent className="h-4 w-4 text-[#0038A8]" /> System Policies
            </h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Max Student Capacity</label>
                <div className="relative"><User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" /><input type="number" value={maxStudents} onChange={(e) => setMaxStudents(parseInt(e.target.value) || 0)} className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border rounded-xl text-xs font-bold focus:outline-none" /></div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Pricing Tier ($)</label>
                <div className="relative"><DollarSign className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" /><input type="number" value={price} onChange={(e) => setPrice(parseFloat(e.target.value) || 0)} className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border rounded-xl text-xs font-bold focus:outline-none" /></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER ACTION BAR */}
      <div className="border-t pt-6 flex items-center justify-end gap-3 select-none">
        <button type="button" onClick={() => router.push("/list/courses")} className="px-5 py-2.5 bg-white border hover:bg-slate-50 text-slate-600 font-extrabold text-xs rounded-xl shadow-xs">Cancel</button>
        <button type="button" onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-[#0038A8] text-white hover:bg-[#002D86] disabled:opacity-50 font-extrabold text-xs rounded-xl shadow-sm">
          {saving ? "Compiling Schema..." : "Save and Display"}
        </button>
      </div>
    </div>
  );
}