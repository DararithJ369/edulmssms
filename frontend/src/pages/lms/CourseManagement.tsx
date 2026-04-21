import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Loader2, Search, Plus, Trash2, Edit2, ChevronDown, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { API } from "@/lib/endpoints";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface Module {
  id: number;
  title: string;
  order: number;
  lessons?: Lesson[];
}

interface Lesson {
  id: number;
  title: string;
  order: number;
  content?: string;
}

interface Course {
  id: number;
  course_name: string;
  course_code: string;
  description?: string;
  modules?: Module[];
}

interface Pagination {
  page: number;
  total: number;
  limit: number;
}

type ApiError = { response?: { data?: { message?: string } } };

export default function CourseManagement() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<Pagination>({ page: 1, total: 0, limit: 10 });
  
  const [expandedCourse, setExpandedCourse] = useState<number | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  
  const [deleteType, setDeleteType] = useState<"module" | "lesson" | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonContent, setNewLessonContent] = useState("");
  
  const hasInitialized = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });
      if (debouncedSearch) params.append("search", debouncedSearch);
      const { data } = await api.get(`${API.COURSES_MANAGEMENT.GET_ALL}?${params.toString()}`);
      setCourses(data.data || data || []);
      setMeta(data.meta || { page, total: 0, limit: 10 });
    } catch (error) {
      const message = (error as ApiError).response?.data?.message || "Failed to fetch courses";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      fetchCourses();
    }
  }, [page, debouncedSearch, fetchCourses]);

  const toggleModule = (moduleId: number) => {
    const newSet = new Set(expandedModules);
    if (newSet.has(moduleId)) {
      newSet.delete(moduleId);
    } else {
      newSet.add(moduleId);
    }
    setExpandedModules(newSet);
  };

  const handleCreateModule = async (courseId: number) => {
    if (!newModuleTitle.trim()) {
      toast.error("Module title is required");
      return;
    }
    try {
      await api.post(API.COURSES_MANAGEMENT.CREATE_MODULE(courseId), {
        title: newModuleTitle,
      });
      toast.success("Module created successfully");
      setNewModuleTitle("");
      fetchCourses();
    } catch (error) {
      const message = (error as ApiError).response?.data?.message || "Failed to create module";
      toast.error(message);
    }
  };

  const handleCreateLesson = async (moduleId: number) => {
    if (!newLessonTitle.trim()) {
      toast.error("Lesson title is required");
      return;
    }
    try {
      await api.post(API.COURSES_MANAGEMENT.CREATE_LESSON(moduleId), {
        title: newLessonTitle,
        content: newLessonContent,
      });
      toast.success("Lesson created successfully");
      setNewLessonTitle("");
      setNewLessonContent("");
      fetchCourses();
    } catch (error) {
      const message = (error as ApiError).response?.data?.message || "Failed to create lesson";
      toast.error(message);
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteId || !deleteType) return;
    try {
      if (deleteType === "module") {
        await api.delete(API.COURSES_MANAGEMENT.DELETE_MODULE(deleteId));
      } else if (deleteType === "lesson") {
        await api.delete(API.COURSES_MANAGEMENT.DELETE_LESSON(deleteId));
      }
      toast.success(`${deleteType.charAt(0).toUpperCase() + deleteType.slice(1)} deleted successfully`);
      fetchCourses();
    } catch (error) {
      const message = (error as ApiError).response?.data?.message || `Failed to delete ${deleteType}`;
      toast.error(message);
    } finally {
      setIsDeleteOpen(false);
      setDeleteId(null);
      setDeleteType(null);
    }
  };

  const handleEditLesson = async () => {
    if (!editingLesson || !newLessonTitle.trim()) {
      toast.error("Lesson title is required");
      return;
    }
    try {
      await api.put(API.COURSES_MANAGEMENT.UPDATE_LESSON(editingLesson.id), {
        title: newLessonTitle,
        content: newLessonContent,
      });
      toast.success("Lesson updated successfully");
      setEditingLesson(null);
      setIsEditOpen(false);
      setNewLessonTitle("");
      setNewLessonContent("");
      fetchCourses();
    } catch (error) {
      const message = (error as ApiError).response?.data?.message || "Failed to update lesson";
      toast.error(message);
    }
  };

  const totalPages = Math.ceil(meta.total / meta.limit);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-8 py-12">
          <h1 className="notion-header">Course Management</h1>
          <p className="notion-subheader">Create and manage course modules and lessons</p>
          <div className="notion-divider"></div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-8 py-8 space-y-8">
        {/* Search */}
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="notion-search flex-1"
          />
        </div>

        {/* Courses */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Loading courses...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No courses found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {courses.map((course) => (
              <div key={course.id} className="notion-page">
                {/* Course Header */}
                <div
                  className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors border-b border-gray-200 dark:border-slate-700"
                  onClick={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <button className="p-1">
                        {expandedCourse === course.id ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </button>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{course.course_name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{course.course_code}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Course Content */}
                {expandedCourse === course.id && (
                  <div className="p-6 bg-gray-50 dark:bg-slate-800/50 space-y-4">
                    {/* Add Module */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="New module title..."
                        value={newModuleTitle}
                        onChange={(e) => setNewModuleTitle(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={() => handleCreateModule(course.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Module
                      </Button>
                    </div>

                    {/* Modules List */}
                    {course.modules && course.modules.length > 0 ? (
                      <div className="space-y-3 mt-6">
                        {course.modules.map((module, idx) => (
                          <div key={module.id} className="border border-gray-200 dark:border-slate-600 rounded-lg overflow-hidden">
                            {/* Module Header */}
                            <div
                              className="p-4 bg-white dark:bg-slate-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-600 flex items-center justify-between border-l-4 border-blue-500"
                              onClick={() => toggleModule(module.id)}
                            >
                              <div className="flex items-center gap-3 flex-1">
                                {expandedModules.has(module.id) ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  Chapter {idx + 1}: {module.title}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteType("module");
                                    setDeleteId(module.id);
                                    setIsDeleteOpen(true);
                                  }}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Lessons */}
                            {expandedModules.has(module.id) && (
                              <div className="bg-white dark:bg-slate-700 border-t border-gray-200 dark:border-slate-600">
                                {/* Add Lesson */}
                                <div className="p-4 border-b border-gray-200 dark:border-slate-600 space-y-2">
                                  <Input
                                    placeholder="New lesson title..."
                                    value={newLessonTitle}
                                    onChange={(e) => setNewLessonTitle(e.target.value)}
                                  />
                                  <textarea
                                    placeholder="Lesson content (optional)..."
                                    value={newLessonContent}
                                    onChange={(e) => setNewLessonContent(e.target.value)}
                                    className="w-full p-2 border border-gray-200 dark:border-slate-600 rounded text-sm"
                                    rows={2}
                                  />
                                  <Button
                                    onClick={() => handleCreateLesson(module.id)}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Lesson
                                  </Button>
                                </div>

                                {/* Lessons List */}
                                <div className="divide-y divide-gray-200 dark:divide-slate-600">
                                  {module.lessons && module.lessons.map((lesson) => (
                                    <div
                                      key={lesson.id}
                                      className="p-4 hover:bg-gray-50 dark:hover:bg-slate-600/50 flex items-center justify-between"
                                    >
                                      <div className="flex-1">
                                        <p className="font-medium text-gray-900 dark:text-white">{lesson.title}</p>
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            setEditingLesson(lesson);
                                            setNewLessonTitle(lesson.title);
                                            setNewLessonContent(lesson.content || "");
                                            setIsEditOpen(true);
                                          }}
                                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400"
                                        >
                                          <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            setDeleteType("lesson");
                                            setDeleteId(lesson.id);
                                            setIsDeleteOpen(true);
                                          }}
                                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">No modules yet</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 pt-8">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="notion-button"
            >
              ← Previous
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, page - 2);
              return start + i;
            }).map((p) => (
              p <= totalPages && (
                <Button
                  key={p}
                  onClick={() => setPage(p)}
                  className={page === p ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold" : "notion-button"}
                >
                  {p}
                </Button>
              )
            ))}
            <Button
              variant="outline"
              disabled={page === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="notion-button"
            >
              Next →
            </Button>
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="dark:bg-slate-800 dark:border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-white">Delete {deleteType}</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-400">
              This action cannot be undone. The {deleteType} will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel className="dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Lesson Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Edit Lesson</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Update the lesson details below
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Lesson title..."
              value={newLessonTitle}
              onChange={(e) => setNewLessonTitle(e.target.value)}
              className="dark:bg-slate-700 dark:border-slate-600"
            />
            <textarea
              placeholder="Lesson content..."
              value={newLessonContent}
              onChange={(e) => setNewLessonContent(e.target.value)}
              className="w-full p-2 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded text-sm"
              rows={4}
            />
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditOpen(false);
                  setEditingLesson(null);
                }}
                className="dark:border-slate-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditLesson}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
