import { useEffect, useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Loader2, Search } from "lucide-react";
import { api } from "@/lib/api";
import { API } from "@/lib/endpoints";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import CustomPagination from "@/components/global/CustomPagination";
import CustomAlert from "@/components/global/CustomAlert";
import { LessonTable, LessonForm } from "@/components/lms";
import { useAuth } from "@/hooks/AuthProvider";

interface Lesson {
  id: number;
  course_id: number;
  title: string;
  description?: string;
  content?: string;
  order: number;
  created_at: string;
  updated_at?: string;
}

interface Pagination {
  page: number;
  total: number;
  limit: number;
}

const Lessons = () => {
  const { user } = useAuth();
  const isInstructor = user?.role === "instructor" || user?.role === "admin";

  // State
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<Pagination>({ page: 1, total: 0, limit: 10 });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Prevent duplicate API calls on mount
  const hasInitialized = useRef(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch lessons
  const fetchLessons = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      if (debouncedSearch) {
        params.append("search", debouncedSearch);
      }

      const { data } = await api.get(`${API.LESSONS.GET_ALL}?${params.toString()}`);

      setLessons(data.data || data || []);
      setMeta(data.meta || { page, total: 0, limit: 10 });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch lessons");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  // Initialize fetch
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      fetchLessons();
    }
  }, [page, debouncedSearch, fetchLessons]);

  // Create lesson
  const handleCreate = async (lessonData: any) => {
    try {
      await api.post(API.LESSONS.CREATE, lessonData);
      toast.success("Lesson created successfully");
      setIsFormOpen(false);
      fetchLessons();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create lesson");
    }
  };

  // Update lesson
  const handleUpdate = async (lessonData: any) => {
    if (!editingLesson) return;
    try {
      await api.put(`${API.LESSONS.UPDATE(editingLesson.id)}`, lessonData);
      toast.success("Lesson updated successfully");
      setIsFormOpen(false);
      setEditingLesson(null);
      fetchLessons();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update lesson");
    }
  };

  // Delete lesson
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(API.LESSONS.DELETE(deleteId));
      toast.success("Lesson deleted successfully");
      setIsDeleteOpen(false);
      setDeleteId(null);
      fetchLessons();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete lesson");
    }
  };

  // Open edit form
  const handleEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setIsFormOpen(true);
  };

  // Open delete dialog
  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
    setIsDeleteOpen(true);
  };

  // Close form
  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingLesson(null);
  };

  const totalPages = Math.ceil(meta.total / meta.limit);

  return (
    <div className="p-6 md:p-10 space-y-6">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Title & Description */}
        <div className="mb-8 space-y-2 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h1 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white leading-tight tracking-tight">
                Learning Lessons
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 mt-2 font-medium">Manage and organize your course content with ease</p>
            </div>
          </div>
        </div>

        {/* Stats & Create Button */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8 animate-in fade-in slide-in-from-top-2 duration-700 delay-100">
          <div className="flex gap-4 flex-wrap">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border-0 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 group">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400">{meta.total}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 font-semibold group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Total Lessons</p>
                </div>
              </CardContent>
            </Card>
          </div>
          {isInstructor && (
            <Button
              onClick={() => setIsFormOpen(true)}
              className="bg-[#72e3ad] hover:bg-[#5edd9a] dark:bg-[#006239] dark:hover:bg-[#005230] text-gray-900 dark:text-gray-100 shadow-md hover:shadow-lg transition-all duration-300 rounded-lg h-10 px-4 font-medium text-sm group hover:scale-105 active:scale-95"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              New Lesson
            </Button>
          )}
        </div>

        {/* Search Bar */}
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-400/20 dark:from-green-500/10 dark:to-emerald-500/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500 dark:text-green-400 z-10 pointer-events-none" />
              <Input
                type="text"
                placeholder="Search lessons by title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 pr-4 py-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm focus:shadow-lg focus:border-green-400 dark:focus:border-green-500 transition-all duration-300 dark:text-white dark:placeholder:text-gray-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Lessons Grid / Table */}
        {loading ? (
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border-0 shadow-md dark:border dark:border-slate-700">
            <CardContent className="pt-12 pb-12">
              <div className="flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-green-600 dark:text-green-400" />
                <p className="text-gray-600 dark:text-gray-400 font-medium">Loading lessons...</p>
              </div>
            </CardContent>
          </Card>
        ) : lessons.length > 0 ? (
          <>
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border-0 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden dark:border dark:border-slate-700 animate-in fade-in slide-in-from-bottom duration-500">
              <CardHeader className="border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-green-50 dark:from-slate-800 to-emerald-50 dark:to-slate-700 py-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white">Lesson Library</h2>
                  <div className="px-4 py-2 bg-green-100 dark:bg-green-900/50 rounded-full">
                    <span className="text-sm font-bold text-green-700 dark:text-green-300">{lessons.length} lessons</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <LessonTable
                  data={lessons}
                  onEdit={handleEdit}
                  onDelete={handleDeleteClick}
                  isInstructor={isInstructor}
                />
                {totalPages > 1 && (
                  <div className="mt-6 border-t border-gray-100 dark:border-slate-700 pt-6">
                    <CustomPagination
                      page={page}
                      setPage={setPage}
                      totalPages={totalPages}
                      loading={loading}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border-0 shadow-md dark:border dark:border-slate-700">
            <CardContent className="pt-16 pb-16">
              <div className="text-center space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No Lessons Yet</h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {isInstructor
                      ? "Create your first lesson to get started"
                      : "No lessons available at the moment"}
                  </p>
                </div>
                {isInstructor && (
                  <Button
                    onClick={() => setIsFormOpen(true)}
                    className="mt-6 bg-[#72e3ad] hover:bg-[#5edd9a] dark:bg-[#006239] dark:hover:bg-[#005230] text-gray-900 dark:text-gray-100 shadow-md hover:shadow-lg font-medium text-sm px-4 h-9 rounded-lg"
                  >
                    <Plus className="mr-1.5 h-4 w-4" />
                    Create First Lesson
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Form Dialog */}
      <LessonForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        initialData={editingLesson}
        onSuccess={editingLesson ? handleUpdate : handleCreate}
      />

      {/* Delete Alert */}
      <CustomAlert
        handleDelete={handleDelete}
        isOpen={isDeleteOpen}
        setIsOpen={setIsDeleteOpen}
        title="Delete Lesson"
        description="Are you sure you want to delete this lesson? This action cannot be undone."
      />
    </div>
  );
};

export default Lessons;
