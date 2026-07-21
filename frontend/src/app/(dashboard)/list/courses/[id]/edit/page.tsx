"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Globe,
  Settings2,
  FileText,
  Users,
  BarChart2,
  Settings,
  Layers,
  BookOpen,
  FileUp,
  ExternalLink,
  GripVertical,
  Eye,
  EyeOff,
  User,
  DollarSign,
  Percent,
  TrendingUp,
  Image as ImageIcon,
  Link2,
  ClipboardList
} from "lucide-react";
import { api } from "@/lib/api";
import { getImageUrl, getCourseThumbnail } from "@/lib/image-url";
import { useDialog } from "@/hooks/DialogProvider";
import { toast } from "react-toastify";
import LessonForm from "@/components/forms/LessonForm"; 
import BackButton from "@/components/BackButton"; 
import { CldUploadWidget } from "next-cloudinary"; 
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type LessonItem = {
  id: number;
  title: string;
  order: number;
  duration: string;
  material_type: string;
  material_url: string | null;
  material_file: string | null;
  content: string;
  is_visible?: boolean;
};

type SyllabusItem = {
  id: number;
  week: number;
  title: string;
  lessons: LessonItem[];
  is_hidden_from_students?: boolean;
};

function SortableLessonItem({
  lesson,
  moduleId,
  handleToggleLessonVisibility,
  openEditLessonModal,
  handleDeleteLesson,
  renderActivityIcon,
}: {
  lesson: LessonItem;
  moduleId: number;
  handleToggleLessonVisibility: (lesson: LessonItem) => void;
  openEditLessonModal: (moduleId: number, lesson: LessonItem) => void;
  handleDeleteLesson: (id: number) => void;
  renderActivityIcon: (type: string) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-2.5 border rounded-xl hover:bg-slate-100/50 transition-all ${
        lesson.is_visible === false ? "opacity-50 bg-slate-50" : "bg-white"
      }`}
    >
      <div className="flex items-center gap-2.5 truncate max-w-[70%] text-left">
        <div
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="p-1 hover:bg-slate-100 rounded cursor-grab active:cursor-grabbing shrink-0 flex items-center justify-center"
        >
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground/30" />
        </div>
        {renderActivityIcon(lesson.material_type)}
        <span className={`text-xs font-bold truncate ${lesson.is_visible === false ? "line-through text-slate-400" : "text-slate-700"}`}>
          {lesson.title}
        </span>
      </div>
      <div className="flex items-center gap-1.5 select-none" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={() => handleToggleLessonVisibility(lesson)} className="p-1 text-slate-400 hover:text-slate-600">
          {lesson.is_visible !== false ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
        </button>
        <button type="button" onClick={() => openEditLessonModal(moduleId, lesson)} className="px-2 py-1 bg-white border font-bold text-[9px] rounded-lg text-slate-600 hover:bg-slate-50">Modify</button>
        <button type="button" onClick={() => handleDeleteLesson(lesson.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
      </div>
    </div>
  );
}

function SortableModuleItem({
  item,
  idx,
  isExpanded,
  toggleSyllabusExpand,
  handleToggleModuleVisibility,
  startEditSyllabus,
  handleDeleteSyllabusSection,
  setAddLessonModuleId,
  openEditLessonModal,
  handleDeleteLesson,
  handleToggleLessonVisibility,
  renderActivityIcon,
  handleLessonDragEnd,
  sensors,
}: {
  item: SyllabusItem;
  idx: number;
  isExpanded: boolean;
  toggleSyllabusExpand: (id: number) => void;
  handleToggleModuleVisibility: (item: SyllabusItem) => void;
  startEditSyllabus: (item: SyllabusItem) => void;
  handleDeleteSyllabusSection: (id: number) => void;
  setAddLessonModuleId: (id: number | null) => void;
  openEditLessonModal: (moduleId: number, lesson: LessonItem) => void;
  handleDeleteLesson: (id: number) => void;
  handleToggleLessonVisibility: (lesson: LessonItem) => void;
  renderActivityIcon: (type: string) => React.ReactNode;
  handleLessonDragEnd: (event: DragEndEvent, moduleId: number) => void;
  sensors: any;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-2xl overflow-hidden shadow-sm transition-all ${
        item.is_hidden_from_students ? "border-dashed border-slate-300 bg-slate-100/40" : "bg-slate-50/20"
      }`}
    >
      <div
        onClick={() => toggleSyllabusExpand(item.id)}
        className="flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100/80 cursor-pointer select-none transition-colors"
      >
        <div
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="p-1 hover:bg-slate-200 rounded cursor-grab active:cursor-grabbing shrink-0 flex items-center justify-center"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
        </div>
        <span className="text-muted-foreground/60 shrink-0">
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
        <span className={`text-xs font-bold flex-1 text-left ${item.is_hidden_from_students ? "line-through text-slate-400" : "text-slate-800"}`}>
          Topic {idx + 1}: {item.title}
          {item.is_hidden_from_students && (
            <span className="ml-2 text-[8px] font-black uppercase text-amber-600 bg-amber-50 border px-1.5 py-0.5 rounded">
              Hidden Draft
            </span>
          )}
        </span>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => handleToggleModuleVisibility(item)}
            className="p-1.5 border bg-white rounded-lg text-slate-500 hover:text-slate-700"
          >
            {item.is_hidden_from_students ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => startEditSyllabus(item)}
            className="px-2.5 py-1 bg-white border text-slate-800 font-bold text-[10px] rounded-lg"
          >
            Rename
          </button>
          <button
            type="button"
            onClick={() => handleDeleteSyllabusSection(item.id)}
            className="p-1 text-slate-400 hover:text-red-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 border-t bg-white space-y-3">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block border-b pb-1 text-left">
            Nested Lesson Activities
          </span>
          {item.lessons && item.lessons.length > 0 ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleLessonDragEnd(e, item.id)}>
              <SortableContext items={item.lessons.map(l => l.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {item.lessons.map((lesson) => (
                    <SortableLessonItem
                      key={lesson.id}
                      lesson={lesson}
                      moduleId={item.id}
                      handleToggleLessonVisibility={handleToggleLessonVisibility}
                      openEditLessonModal={openEditLessonModal}
                      handleDeleteLesson={handleDeleteLesson}
                      renderActivityIcon={renderActivityIcon}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <p className="text-[10px] text-slate-400 font-semibold py-2 italic select-none text-left">
              No learning activity pages registered.
            </p>
          )}
          <button
            type="button"
            onClick={() => setAddLessonModuleId(item.id)}
            className="w-full py-2 bg-[#0038A8]/5 hover:bg-[#0038A8]/10 border border-dashed border-[#0038A8]/20 text-[#0038A8] font-black text-[10px] rounded-xl flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Lesson Activity</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function CourseDetailEditorPage() {
  const dialog = useDialog();
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

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
  const [thumbnail, setThumbnail] = useState("");
  
  // Custom Syllabus State Tree
  const [syllabus, setSyllabus] = useState<SyllabusItem[]>([]);
  const [expandedSyllabus, setExpandedSyllabus] = useState<Record<number, boolean>>({});

  // Global UX States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subjectId, setSubjectId] = useState<number | "">("");
  const [subjectsList, setSubjectsList] = useState<{ id: number; name: string }[]>([]);
  const [instructorId, setInstructorId] = useState<string>("");
  const [instructorsList, setInstructorsList] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string>("student");
  
  // Modal Trackers
  const [editSyllabusId, setEditSyllabusId] = useState<number | null>(null);
  const [editSyllabusText, setEditSyllabusText] = useState("");
  const [editSyllabusOrder, setEditSyllabusOrder] = useState<number>(1);

  const [addLessonModuleId, setAddLessonModuleId] = useState<number | null>(null);
  const [editLessonId, setEditLessonId] = useState<number | null>(null);
  const [editLessonParentModuleId, setEditLessonParentModuleId] = useState<number | null>(null);
  const [selectedLessonData, setSelectedLessonData] = useState<any>(null);

  const liveTotalLessons = syllabus.reduce((acc, curr) => acc + (curr.lessons?.length || 0), 0);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleModuleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = syllabus.findIndex(m => m.id === active.id);
    const newIndex = syllabus.findIndex(m => m.id === over.id);

    const reorderedSyllabus = arrayMove(syllabus, oldIndex, newIndex);
    const updatedSyllabus = reorderedSyllabus.map((item, idx) => ({
      ...item,
      week: idx + 1
    }));
    
    setSyllabus(updatedSyllabus);

    try {
      await api.post(`/courses-management/${courseId}/modules/reorder`, {
        ids: updatedSyllabus.map(m => m.id)
      });
    } catch (err) {
      console.error("Failed to reorder modules:", err);
      fetchCourseDetails();
    }
  };

  const handleLessonDragEnd = async (event: DragEndEvent, moduleId: number) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const moduleItem = syllabus.find(m => m.id === moduleId);
    if (!moduleItem) return;

    const oldIndex = moduleItem.lessons.findIndex(l => l.id === active.id);
    const newIndex = moduleItem.lessons.findIndex(l => l.id === over.id);

    const reorderedLessons = arrayMove(moduleItem.lessons, oldIndex, newIndex);
    const updatedLessons = reorderedLessons.map((l, idx) => ({
      ...l,
      order: idx + 1
    }));

    setSyllabus(prev => prev.map(m => m.id === moduleId ? { ...m, lessons: updatedLessons } : m));

    try {
      await api.post(`/courses-management/modules/${moduleId}/lessons/reorder`, {
        ids: updatedLessons.map(l => l.id)
      });
    } catch (err) {
      console.error("Failed to reorder lessons:", err);
      fetchCourseDetails();
    }
  };

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);

      // Fetch catalog lookup lists
      try {
        const [subsRes, instRes] = await Promise.all([
          api.get("/subjects?limit=100").catch(() => ({ data: [] })),
          api.get("/users/instructors?limit=100").catch(() => ({ data: [] }))
        ]);
        const subsData = subsRes.data;
        setSubjectsList(Array.isArray(subsData) ? subsData : subsData?.data ?? []);
        const instData = instRes.data;
        setInstructorsList(Array.isArray(instData) ? instData : instData?.data ?? []);
      } catch (err) {
        console.error("Failed to load catalog lists:", err);
      }

      const { data } = await api.get(`/courses/${courseId}`);
      if (data) {
        setCourseName(data.course_name || "");
        setCourseCode(data.course_code || "");
        setDescription(data.description || "");
        setCategory(data.category || "Computer Science");
        setDifficulty(data.difficulty || "beginner");
        setPrice(data.price || 0);
        setMaxStudents(data.max_students || 40);
        setIsPublished(data.is_published ?? true);
        if (data.thumbnail) setThumbnail(data.thumbnail);
        setSubjectId(data.subject_id ?? "");
        const loadedInstructorId = data.instructor_id || "";
        if (loadedInstructorId) {
          setInstructorId(loadedInstructorId);
        } else {
          const role = typeof window !== "undefined" ? (localStorage.getItem("user_role") || "student") : "student";
          const uid = typeof window !== "undefined" ? (localStorage.getItem("user_id") || "") : "";
          if (role === "instructor" || role === "teacher") {
            setInstructorId(uid);
          } else {
            setInstructorId("");
          }
        }
      }

      const { data: modulesData } = await api.get(`/courses/${courseId}/modules`);
      if (modulesData && modulesData.length > 0) {
        setSyllabus(modulesData.map((m: any, idx: number) => ({
          id: m.id,
          week: m.order || idx + 1,
          title: m.title,
          is_hidden_from_students: m.description === "STATUS_DRAFT_HIDDEN",
          lessons: (m.lessons || []).map((l: any) => ({
            id: l.id,
            title: l.title,
            order: l.order || 1,
            duration: l.duration || "15min",
            material_type: l.material_type || "article",
            material_url: l.material_url || null,
            material_file: l.material_file || null,
            content: l.content || l.description || "",
            is_visible: l.description !== "VISIBILITY_DISABLED_STUDENT"
          }))
        })));

        const initialExpanded: Record<number, boolean> = {};
        modulesData.forEach((m: any) => { initialExpanded[m.id] = true; });
        setExpandedSyllabus(initialExpanded);
      } else {
        setSyllabus([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const role = localStorage.getItem("user_role") || "student";
      setUserRole(role);
      if (role !== "admin" && role !== "instructor" && role !== "teacher") {
        router.push(`/list/courses/${courseId}`);
        return;
      }
    }
    fetchCourseDetails();
  }, [courseId, router]);

  const handleSave = async () => {
    if (isPublished && (syllabus.length === 0 || syllabus.every(s => s.is_hidden_from_students))) {
      toast.error("A published course must have at least one published module.");
      return;
    }

    try {
      setSaving(true);
      await api.put(`/courses/${courseId}`, {
        course_name: courseName,
        course_code: courseCode,
        description: description,
        category: category,
        difficulty: difficulty,
        price: Number(price),
        max_students: Number(maxStudents),
        thumbnail: thumbnail, // 🚀 Saves the modified media thumbnail string link accurately
        is_published: isPublished,
        subject_id: subjectId ? Number(subjectId) : null,
        instructor_id: instructorId || null,
      });

      toast.success("Advanced Modifications Saved Perfectly");
      setTimeout(() => {
        router.push(`/list/courses/${courseId}`);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.detail || "Failed to save course changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleModuleVisibility = async (moduleItem: SyllabusItem) => {
    try {
      const toggledStatus = !moduleItem.is_hidden_from_students;
      await api.put(`/courses-management/modules/${moduleItem.id}`, {
        title: moduleItem.title,
        description: toggledStatus ? "STATUS_DRAFT_HIDDEN" : "",
        order: Number(moduleItem.week)
      });
      await fetchCourseDetails();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleLessonVisibility = async (lessonItem: LessonItem) => {
    try {
      const currentVisibility = lessonItem.is_visible !== false;
      await api.put(`/courses-management/lessons/${lessonItem.id}`, {
        title: lessonItem.title,
        description: currentVisibility ? "VISIBILITY_DISABLED_STUDENT" : "ACTIVE",
        content: lessonItem.content,
        duration: lessonItem.duration,
        material_type: lessonItem.material_type,
        material_url: lessonItem.material_url,
        material_file: lessonItem.material_file,
        order: Number(lessonItem.order)
      });
      await fetchCourseDetails();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSyllabusSection = async () => {
    try {
      const nextWeek = syllabus.length + 1;
      await api.post(`/courses-management/${courseId}/modules`, {
        title: `Topic Section ${nextWeek}`,
        description: "",
        order: nextWeek
      });
      await fetchCourseDetails();
    } catch (err) {
      console.error(err);
    }
  };

  const startEditSyllabus = (item: SyllabusItem) => {
    setEditSyllabusId(item.id);
    setEditSyllabusText(item.title);
    setEditSyllabusOrder(item.week);
  };

  const saveSyllabusEdit = async () => {
    if (editSyllabusId) {
      try {
        await api.put(`/courses-management/modules/${editSyllabusId}`, {
          title: editSyllabusText,
          description: "",
          order: Number(editSyllabusOrder)
        });
        await fetchCourseDetails();
      } catch (err) {
        console.error(err);
      }
      setEditSyllabusId(null);
    }
  };

  const handleDeleteSyllabusSection = async (id: number) => {
    const moduleConfirmed = await dialog.confirm({ title: "Delete Module", description: "Are you sure you want to delete this module section and its tracking history?", variant: "destructive" });
    if (!moduleConfirmed) return;
    try {
      await api.delete(`/courses-management/modules/${id}`);
      await fetchCourseDetails();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSyllabusExpand = (id: number) => {
    setExpandedSyllabus({ ...expandedSyllabus, [id]: !expandedSyllabus[id] });
  };

  const handleCloseLessonModal = () => {
    setAddLessonModuleId(null);
    setEditLessonId(null);
    setEditLessonParentModuleId(null);
    setSelectedLessonData(null);
  };

  const handleInlineLessonFormSubmit = async (values: any) => {
    try {
      const computedDuration = String(values.duration).endsWith("min") ? values.duration : `${values.duration || 15}min`;
      const lessonPayload = {
        title: values.title,
        order: Number(values.order) || 1,
        duration: computedDuration,
        material_type: values.material_type || "article",
        material_url: values.material_url || null,
        material_file: values.material_file || null,
        content: values.content || ""
      };

      if (addLessonModuleId) {
        await api.post(`/courses-management/modules/${addLessonModuleId}/lessons`, lessonPayload);
      } else if (editLessonId) {
        await api.put(`/courses-management/lessons/${editLessonId}`, lessonPayload);
      }
      await fetchCourseDetails();
    } catch (err) {
      console.error(err);
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

  const handleDeleteLesson = async (id: number) => {
    const lessonConfirmed = await dialog.confirm({ title: "Delete Lesson", description: "Are you sure you want to drop this lesson?", variant: "destructive" });
    if (!lessonConfirmed) return;
    try {
      await api.delete(`/courses-management/lessons/${id}`);
      await fetchCourseDetails();
    } catch (err) {
      console.error(err);
    }
  };

  const renderActivityIcon = (type: string) => {
    switch (type) {
      case "file": return <FileText className="h-4 w-4 text-rose-500 shrink-0" />;
      case "url": return <ExternalLink className="h-4 w-4 text-amber-600 shrink-0" />;
      default: return <BookOpen className="h-4 w-4 text-[#0038A8] shrink-0" />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F7F8FA] text-slate-600">
        <div className="h-10 w-10 border-4 border-[#0038A8] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold select-none">Syncing Advanced Syllabus Editor Workspace...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 pb-24 space-y-6 bg-[#F7F8FA] min-h-screen text-left font-sans">
      


      {/* Module Renamer */}
      {editSyllabusId !== null && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="w-[450px] p-6 bg-white border shadow-2xl rounded-2xl space-y-4 text-left">
            <h3 className="text-base font-extrabold text-slate-900">Edit Week Module Settings</h3>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Topic Title</label>
              <input type="text" value={editSyllabusText} onChange={(e) => setEditSyllabusText(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-sm font-medium focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Topic Order Position (Week)</label>
              <input type="number" value={editSyllabusOrder} onChange={(e) => setEditSyllabusOrder(parseInt(e.target.value) || 1)} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-sm font-medium focus:outline-none" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditSyllabusId(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer">Cancel</button>
              <button onClick={saveSyllabusEdit} className="px-4 py-2 bg-[#0038A8] hover:bg-[#002D86] text-white text-xs font-black rounded-xl transition-colors cursor-pointer">Update Module</button>
            </div>
          </div>
        </div>
      )}

      {/* UNIVERSAL INLINE LESSONFORM TRIGGER */}
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
                relatedData={{ 
                  inlineHandler: handleInlineLessonFormSubmit, 
                  moduleId: addLessonModuleId || editLessonParentModuleId || undefined 
                }} 
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
            <Link href={`/list/courses/${courseId}`} className="hover:text-slate-800">{courseCode || "CS-LMS"}</Link>
            <span>/</span>
            <span className="text-slate-800">Edit settings</span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
              <BackButton />
              <div>
                <span className="text-xs font-extrabold text-[#0038A8] uppercase tracking-wider font-mono">
                  Course Configuration Dashboard
                </span>
                <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                  Edit Course settings: {courseName}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#0038A8] hover:bg-[#002D86] text-white text-xs font-black rounded-xl shadow-sm transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <Link
                href={`/list/courses/${courseId}`}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                <span>✕</span>
                <span>Cancel</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="flex border-b border-slate-200 gap-6 select-none text-xs font-extrabold text-slate-400 pt-2">
          <Link href={`/list/courses/${courseId}?tab=course`} className="pb-3 hover:text-slate-800 transition-colors flex items-center gap-1.5">
            <BookOpen className="h-3 w-3" />
            <span>Course</span>
          </Link>
          <Link href={`/list/courses/${courseId}?tab=participants`} className="pb-3 hover:text-slate-800 transition-colors flex items-center gap-1.5">
            <Users className="h-3 w-3" />
            <span>Participants</span>
          </Link>
          <Link href={`/list/courses/${courseId}?tab=grades`} className="pb-3 hover:text-slate-800 transition-colors flex items-center gap-1.5">
            <BarChart2 className="h-3 w-3" />
            <span>Grades</span>
          </Link>
          <Link href={`/list/courses/${courseId}?tab=submissions`} className="pb-3 hover:text-slate-800 transition-colors flex items-center gap-1.5">
            <ClipboardList className="h-3 w-3" />
            <span>Submissions</span>
          </Link>
          <Link href={`/list/courses/${courseId}?tab=analytics`} className="pb-3 hover:text-slate-800 transition-colors flex items-center gap-1.5">
            <BarChart2 className="h-3 w-3" />
            <span>Analytics</span>
          </Link>
          <button className="pb-3 border-b-2 border-[#0038A8] text-slate-900 flex items-center gap-1.5">
            <Settings className="h-3 w-3" />
            <span>Settings</span>
          </button>
          <button className="pb-3 opacity-40 cursor-not-allowed flex items-center gap-1.5" disabled>
            <FileText className="h-3 w-3" />
            <span>Reports</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className="lg:col-span-3 space-y-6">
          
          {/* GENERAL FORM CONFIGURATIONS */}
          <div className="bg-white border rounded-3xl p-6 space-y-6 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b">
              <Settings2 className="h-4 w-4 text-[#0038A8]" />
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">General settings</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-6 items-start">
              <label className="md:col-span-2 text-xs font-bold text-slate-500 uppercase tracking-wide md:pt-3">Course full name</label>
              <div className="md:col-span-4">
                <input type="text" value={courseName} onChange={(e) => setCourseName(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-semibold focus:outline-none" />
              </div>
              <label className="md:col-span-2 text-xs font-bold text-slate-500 uppercase tracking-wide md:pt-3">Course short name / code</label>
              <div className="md:col-span-4">
                <input type="text" value={courseCode} onChange={(e) => setCourseCode(e.target.value)} className="w-full md:w-1/2 px-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-mono font-bold focus:outline-none" />
              </div>
              <label className="md:col-span-2 text-xs font-bold text-slate-500 uppercase tracking-wide md:pt-3">Category Group</label>
              <div className="md:col-span-4">
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full md:w-2/3 px-3 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold focus:outline-none">
                  <option value="Computer Science">Computer Science</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Software Engineering">Software Engineering</option>
                  <option value="Applied Mathematics & Statistics">Applied Mathematics & Statistics</option>
                </select>
              </div>
              <label className="md:col-span-2 text-xs font-bold text-slate-500 uppercase tracking-wide md:pt-3">Difficulty Level</label>
              <div className="md:col-span-4">
                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full md:w-2/3 px-3 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold focus:outline-none">
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <label className="md:col-span-2 text-xs font-bold text-slate-500 uppercase tracking-wide md:pt-3">Subject Catalog Link</label>
              <div className="md:col-span-4">
                <select value={subjectId} onChange={(e) => setSubjectId(e.target.value ? Number(e.target.value) : "")} className="w-full md:w-2/3 px-3 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold focus:outline-none">
                  <option value="">-- Select Subject (Optional) --</option>
                  {subjectsList.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>
              <label className="md:col-span-2 text-xs font-bold text-slate-500 uppercase tracking-wide md:pt-3">Instructor / Lecturer</label>
              <div className="md:col-span-4">
                <select 
                  value={instructorId} 
                  onChange={(e) => setInstructorId(e.target.value)} 
                  disabled={userRole !== "admin"}
                  className="w-full md:w-2/3 px-3 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  <option value="">-- Select Instructor --</option>
                  {instructorsList.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.profile?.full_name || inst.username}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 🚀 COURSE THUMBNAIL MANAGER BLOCK */}
          <div className="bg-white border rounded-3xl p-6 space-y-6 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b">
              <ImageIcon className="h-4 w-4 text-[#0038A8]" />
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Course Media Thumbnail</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-6 items-center">
              <label className="md:col-span-2 text-xs font-bold text-slate-500 uppercase tracking-wide">Image Preview</label>
              <div className="md:col-span-4 space-y-4">
                <CldUploadWidget 
                  options={{
                    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dlykcgjdh",
                    uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "lms_preset",
                    multiple: false,
                    sources: ["local", "url", "camera"]
                  }} 
                  onSuccess={(result: any) => { 
                    const url = result?.info?.secure_url; 
                    if (url) setThumbnail(url); 
                  }}
                >
                  {({ open }) => (
                    <div 
                      onClick={() => open()}
                      className="relative aspect-[21/9] w-full max-w-md border border-slate-200 rounded-2xl overflow-hidden shadow-inner bg-slate-50 flex items-center justify-center group cursor-pointer"
                    >
                      {thumbnail ? (
                        <img src={getImageUrl(thumbnail) || ""} alt="Thumbnail Cover Preview" className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" onError={() => setThumbnail("")} />
                      ) : (
                        <img src={getCourseThumbnail(null, category, courseName)} alt="Default Category Preview" className="absolute inset-0 h-full w-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300" />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                        <Plus className="h-6 w-6 text-white" />
                        <span className="text-[10px] font-black text-white uppercase tracking-wider">Upload Thumbnail</span>
                      </div>
                    </div>
                  )}
                </CldUploadWidget>
                <div className="flex gap-2 max-w-md">
                  <div className="relative flex-1">
                    <Link2 className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={thumbnail}
                      onChange={(e) => setThumbnail(e.target.value)}
                      onPaste={(e) => {
                        const text = e.clipboardData.getData("text");
                        if (text) {
                          e.preventDefault();
                          setThumbnail(text.trim());
                        }
                      }}
                      placeholder="Paste image URL here (e.g. https://images.unsplash.com/...)"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-xs font-mono font-medium focus:outline-none focus:border-[#0038A8] focus:ring-1 focus:ring-[#0038A8]/30 transition-colors"
                    />
                  </div>
                  <CldUploadWidget 
                    options={{
                      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dlykcgjdh",
                      uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "lms_preset",
                      multiple: false
                    }}
                    onSuccess={(result: any) => { 
                      const url = result?.info?.secure_url; 
                      if (url) setThumbnail(url); 
                    }}
                  >
                    {({ open }) => (
                      <button 
                        type="button" 
                        onClick={() => open()}
                        className="px-4 py-2 bg-[#0038A8] text-white font-black text-xs rounded-xl hover:bg-[#002D86] flex items-center gap-1.5 shrink-0"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Upload File</span>
                      </button>
                    )}
                  </CldUploadWidget>
                </div>
              </div>
            </div>
          </div>

          {/* DESCRIPTION DETAILS */}
          <div className="bg-white border rounded-3xl p-6 space-y-6 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b">
              <FileText className="h-4 w-4 text-[#0038A8]" />
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Description settings</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-6 items-start">
              <label className="md:col-span-2 text-xs font-bold text-slate-500 uppercase tracking-wide md:pt-3">Course summary</label>
              <div className="md:col-span-4">
                <div className="border rounded-2xl overflow-hidden bg-slate-50">
                  <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 border-b select-none">
                    <span className="text-[10px] text-slate-400 font-black px-2 py-1 rounded-md border bg-white flex items-center gap-1 cursor-pointer">Normal text <ChevronDown className="h-3 w-3" /></span>
                  </div>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-4 bg-transparent focus:outline-none text-xs leading-relaxed font-medium" rows={4} />
                </div>
              </div>
            </div>
          </div>

          {/* ACCORDION MAPPER */}
          <div className="bg-white border rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-[#0038A8]" />
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Course format & topic outline</h2>
              </div>
              <button type="button" onClick={handleAddSyllabusSection} className="flex items-center gap-1.5 text-xs font-bold text-[#0038A8] hover:bg-[#0038A8]/10 bg-[#0038A8]/5 px-3 py-1.5 rounded-xl border border-[#0038A8]/10 transition-colors">
                <Plus className="h-3.5 w-3.5" />
                <span>Add Topic Section</span>
              </button>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleModuleDragEnd}>
              <SortableContext items={syllabus.map(m => m.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {syllabus.map((item, idx) => {
                    const isExpanded = !!expandedSyllabus[item.id];
                    return (
                      <SortableModuleItem
                        key={item.id}
                        item={item}
                        idx={idx}
                        isExpanded={isExpanded}
                        toggleSyllabusExpand={toggleSyllabusExpand}
                        handleToggleModuleVisibility={handleToggleModuleVisibility}
                        startEditSyllabus={startEditSyllabus}
                        handleDeleteSyllabusSection={handleDeleteSyllabusSection}
                        setAddLessonModuleId={setAddLessonModuleId}
                        openEditLessonModal={openEditLessonModal}
                        handleDeleteLesson={handleDeleteLesson}
                        handleToggleLessonVisibility={handleToggleLessonVisibility}
                        renderActivityIcon={renderActivityIcon}
                        handleLessonDragEnd={handleLessonDragEnd}
                        sensors={sensors}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>

        {/* SIDEBAR METRICS */}
        <div className="space-y-6">
          <div className="bg-white border rounded-3xl p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-[#0038A8]" /> Dynamic Data Telemetry
            </h3>
            <div className="space-y-3 font-medium text-xs text-slate-600">
              <div className="flex justify-between"><span>Active Modules:</span><span className="font-bold text-slate-900 font-mono">{syllabus.length}</span></div>
              <div className="flex justify-between"><span>Tracked Lessons:</span><span className="font-bold text-slate-900 font-mono">{liveTotalLessons}</span></div>
            </div>
          </div>

          <div className="bg-white border rounded-3xl p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
              <Percent className="h-4 w-4 text-[#0038A8]" /> System Policies
            </h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Max Enrolled Students</label>
                <div className="relative"><User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" /><input type="number" value={maxStudents} onChange={(e) => setMaxStudents(parseInt(e.target.value) || 0)} className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border rounded-xl text-xs font-bold focus:outline-none" /></div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Pricing Tier ($)</label>
                <div className="relative"><DollarSign className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" /><input type="number" value={price} onChange={(e) => setPrice(parseFloat(e.target.value) || 0)} className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border rounded-xl text-xs font-bold focus:outline-none" /></div>
              </div>
              <div className="space-y-1 pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Published Status</label>
                  <span className="text-[9px] text-slate-500 font-medium">Visible to student catalog</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPublished(!isPublished)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isPublished ? "bg-[#0038A8]" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isPublished ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="border-t pt-6 flex items-center justify-end gap-3 select-none">
        <button type="button" onClick={() => router.push(`/list/courses/${courseId}`)} className="px-4 py-2 bg-white border hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl shadow-xs">Cancel</button>
        <button type="button" onClick={handleSave} disabled={saving} className="px-4 py-2 bg-[#0038A8] text-white hover:bg-[#002D86] disabled:opacity-50 font-black text-xs rounded-xl shadow-sm">
          {saving ? "Saving..." : "Save and display"}
        </button>
      </div>
    </div>
  );
}