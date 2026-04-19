import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, Loader2, Search, BookOpen } from "lucide-react";
import { api } from "@/lib/api";
import { API } from "@/lib/endpoints";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";

interface Course {
  id: number;
  course_name: string;
  course_code: string;
  description?: string;
  category?: string;
  duration?: number;
  difficulty?: string;
  thumbnail?: string;
  instructor_name?: string;
  student_enrolled: number;
  has_modules?: boolean;
  has_quizzes?: boolean;
  certificate_offered?: boolean;
  created_at: string;
  modules?: Module[];
}

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
  completed?: boolean;
}

interface Pagination {
  page: number;
  total: number;
  limit: number;
}

const CoursesNotion = () => {
  const navigate = useNavigate();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<Pagination>({ page: 1, total: 0, limit: 10 });
  const [expandedCourse, setExpandedCourse] = useState<number | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
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
      const { data } = await api.get(`${API.COURSES.GET_ALL}?${params.toString()}`);
      setCourses(data.data || data || []);
      setMeta(data.meta || { page, total: 0, limit: 10 });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch courses");
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

  const totalPages = Math.ceil(meta.total / meta.limit);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Minimal Header */}
      <div className="border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-8 py-12">
          <div className="mb-8">
            <h1 className="notion-header">My Courses</h1>
            <p className="notion-subheader">Explore your learning journey</p>
          </div>
          <div className="notion-divider"></div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="notion-stat">
              <div className="notion-stat-value">{meta.total}</div>
              <div className="notion-stat-label">Courses</div>
            </div>
            <div className="notion-stat">
              <div className="notion-stat-value">{courses.reduce((sum, c) => sum + (c.student_enrolled || 0), 0)}</div>
              <div className="notion-stat-label">Total Students</div>
            </div>
            <div className="notion-stat">
              <div className="notion-stat-value">{page} of {totalPages}</div>
              <div className="notion-stat-label">Page</div>
            </div>
          </div>
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
            <BookOpen className="w-8 h-8 mx-auto text-gray-400 mb-3" />
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
                          <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        )}
                      </button>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{course.course_name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{course.description}</p>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-medium text-gray-900 dark:text-white">{course.student_enrolled} students</p>
                      {course.instructor_name && (
                        <p className="text-gray-500 dark:text-gray-400">{course.instructor_name}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 ml-9">
                    <Badge className="notion-badge">{course.course_code}</Badge>
                    {course.difficulty && (
                      <Badge className="notion-badge">{course.difficulty}</Badge>
                    )}
                    {course.certificate_offered && (
                      <Badge className="notion-badge">Certificate</Badge>
                    )}
                  </div>
                </div>

                {/* Course Content */}
                {expandedCourse === course.id && (
                  <div className="p-6 bg-gray-50 dark:bg-slate-800/50">
                    {course.modules && course.modules.length > 0 ? (
                      <div className="space-y-3">
                        {course.modules.map((module, idx) => (
                          <div key={module.id} className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
                            {/* Module */}
                            <div
                              className="p-4 bg-white dark:bg-slate-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-600 flex items-center justify-between border-l-4 border-gray-900 dark:border-white transition-colors"
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
                              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                {module.lessons?.length || 0} lessons
                              </span>
                            </div>

                            {/* Lessons */}
                            {expandedModules.has(module.id) && module.lessons && (
                              <div className="bg-white dark:bg-slate-700 divide-y divide-gray-200 dark:divide-slate-600">
                                {module.lessons.map((lesson) => (
                                  <div
                                    key={lesson.id}
                                    className="p-4 hover:bg-blue-50 dark:hover:bg-slate-600/50 cursor-pointer flex items-center gap-3 group transition-colors"
                                    onClick={() => navigate(`/lms/lesson/${lesson.id}`)}
                                  >
                                    <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                      {lesson.order}
                                    </span>
                                    <span className={`text-sm flex-1 ${lesson.completed ? 'text-green-600 dark:text-green-400 line-through' : 'text-gray-700 dark:text-gray-300'}`}>
                                      {lesson.title}
                                    </span>
                                    {lesson.completed && (
                                      <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                                    )}
                                  </div>
                                ))}
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
    </div>
  );
};

export default CoursesNotion;
