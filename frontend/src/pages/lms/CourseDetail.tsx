import { useEffect, useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Loader2, ArrowLeft, BookOpen } from "lucide-react";
import { api } from "@/lib/api";
import { API } from "@/lib/endpoints";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useNavigate, useParams } from "react-router";
import { useAuth } from "@/hooks/AuthProvider";
import { Badge } from "@/components/ui/badge";
import CustomPagination from "@/components/global/CustomPagination";
import CustomAlert from "@/components/global/CustomAlert";
import { LessonTable, LessonForm } from "@/components/lms";

interface Course {
  id: number;
  course_name: string;
  course_code: string;
  description?: string;
  category?: string;
  duration?: number;
  difficulty?: string;
  instructor_name?: string;
  student_enrolled: number;
  has_modules?: boolean;
  has_quizzes?: boolean;
  certificate_offered?: boolean;
  certificate_title?: string;
  certificate_description?: string;
}

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

const CourseDetail = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const isInstructor = user?.role === "instructor" || user?.role === "admin";

  // Course State
  const [course, setCourse] = useState<Course | null>(null);
  const [courseLoading, setCourseLoading] = useState(true);

  // Lessons State
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<Pagination>({ page: 1, total: 0, limit: 10 });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Prevent duplicate API calls
  const hasInitialized = useRef(false);

  // Fetch course
  const fetchCourse = useCallback(async () => {
    if (!courseId) return;
    try {
      setCourseLoading(true);
      const { data } = await api.get(`${API.COURSES.GET_BY_ID(parseInt(courseId))}`);
      setCourse(data.data || data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch course");
    } finally {
      setCourseLoading(false);
    }
  }, [courseId]);

  // Fetch lessons
  const fetchLessons = useCallback(async () => {
    if (!courseId) return;
    try {
      setLessonsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      const { data } = await api.get(`${API.COURSES.GET_LESSONS(parseInt(courseId))}?${params.toString()}`);

      setLessons(data.data || data || []);
      setMeta(data.meta || { page, total: 0, limit: 10 });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch lessons");
    } finally {
      setLessonsLoading(false);
    }
  }, [courseId, page]);

  // Initialize
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      fetchCourse();
    }
  }, [fetchCourse]);

  // Fetch lessons when page changes
  useEffect(() => {
    fetchLessons();
  }, [page, fetchLessons]);

  // Handle lesson create
  const handleCreate = async (lessonData: any) => {
    try {
      await api.post(`${API.LESSONS.CREATE}`, { ...lessonData, course_id: parseInt(courseId!) });
      toast.success("Lesson created successfully");
      setIsFormOpen(false);
      fetchLessons();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create lesson");
    }
  };

  // Handle lesson update
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

  // Handle lesson delete
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

  const handleEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
    setIsDeleteOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingLesson(null);
  };

  const totalPages = Math.ceil(meta.total / meta.limit);

  if (courseLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-12 h-12 text-[#72e3ad] animate-spin mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading course...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <Button
            variant="outline"
            onClick={() => navigate("/lms/courses")}
            className="mb-8"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Courses
          </Button>
          <div className="text-center py-16">
            <p className="text-lg text-gray-600 dark:text-gray-400">Course not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900 px-6 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Back Button */}
        <Button
          variant="outline"
          onClick={() => navigate("/lms/courses")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Courses
        </Button>

        {/* Course Header */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-sm font-semibold text-[#72e3ad] uppercase tracking-wider">{course.course_code}</p>
                <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                  {course.course_name}
                </h1>
              </div>
              {course.description && (
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl">{course.description}</p>
              )}
              <div className="flex flex-wrap gap-2 pt-2">
                {course.difficulty && (
                  <Badge className="border-0 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                    {course.difficulty}
                  </Badge>
                )}
                {course.has_modules && (
                  <Badge className="border-0 bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                    📚 Has Modules
                  </Badge>
                )}
                {course.has_quizzes && (
                  <Badge className="border-0 bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300">
                    📝 Has Quizzes
                  </Badge>
                )}
                {course.certificate_offered && (
                  <Badge className="border-0 bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                    🏆 Certificate
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Course Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur border-0 shadow-md">
              <CardContent className="pt-6">
                <p className="text-2xl font-bold text-[#72e3ad]">{course.student_enrolled}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Enrolled Students</p>
              </CardContent>
            </Card>
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur border-0 shadow-md">
              <CardContent className="pt-6">
                <p className="text-2xl font-bold text-blue-500">{meta.total}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Lessons</p>
              </CardContent>
            </Card>
            {course.duration && (
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur border-0 shadow-md">
                <CardContent className="pt-6">
                  <p className="text-2xl font-bold text-purple-500">{course.duration}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Weeks</p>
                </CardContent>
              </Card>
            )}
            {course.instructor_name && (
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur border-0 shadow-md">
                <CardContent className="pt-6">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{course.instructor_name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Instructor</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Lessons Section */}
        <div className="space-y-6 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Course Lessons</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Manage lessons and content for this course</p>
            </div>
            {isInstructor && (
              <Button
                onClick={() => setIsFormOpen(true)}
                className="bg-[#72e3ad] hover:bg-[#5edd9a] dark:bg-[#006239] dark:hover:bg-[#005230] text-gray-900 dark:text-gray-100 h-10 px-4 font-medium text-sm"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Add Lesson
              </Button>
            )}
          </div>

          {lessonsLoading ? (
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border-0 shadow-md">
              <CardContent className="pt-12 pb-12">
                <div className="flex flex-col items-center justify-center gap-4">
                  <Loader2 className="h-12 w-12 animate-spin text-[#72e3ad]" />
                  <p className="text-gray-600 dark:text-gray-400 font-medium">Loading lessons...</p>
                </div>
              </CardContent>
            </Card>
          ) : lessons.length > 0 ? (
            <>
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border-0 shadow-lg overflow-hidden">
                <CardHeader className="border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-green-50 dark:from-slate-800 to-emerald-50 dark:to-slate-700 py-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Lesson Library</h3>
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
                        loading={lessonsLoading}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border-0 shadow-md">
              <CardContent className="pt-16 pb-16">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center mx-auto">
                    <BookOpen className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No Lessons Yet</h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      {isInstructor ? "Create your first lesson to get started" : "No lessons available for this course"}
                    </p>
                  </div>
                  {isInstructor && (
                    <Button
                      onClick={() => setIsFormOpen(true)}
                      className="mt-6 bg-[#72e3ad] hover:bg-[#5edd9a] dark:bg-[#006239] dark:hover:bg-[#005230] text-gray-900 dark:text-gray-100 font-medium text-sm px-4 h-9 rounded-lg"
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
      </div>

      {/* Lesson Form Dialog */}
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

export default CourseDetail;
