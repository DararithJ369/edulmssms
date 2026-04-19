import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import {
  Loader2,
  Lock,
  Check,
  Star,
  Users,
  Clock,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Share2,
  Heart,
  ArrowLeft,
} from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
}

interface Course {
  id: number;
  course_name: string;
  course_code: string;
  description?: string;
  instructor?: string;
  price?: number;
  rating?: number;
  students_count?: number;
  duration?: string;
  modules?: Module[];
  is_published?: boolean;
}

type ApiError = { response?: { data?: { message?: string } } };

export default function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  const [isSaved, setIsSaved] = useState(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/courses/${courseId}`);
        setCourse(data);
      } catch (error) {
        const message = (error as ApiError).response?.data?.message || "Failed to load course";
        toast.error(message);
        navigate("/courses");
      } finally {
        setLoading(false);
      }
    };

    if (!hasInitialized.current && courseId) {
      hasInitialized.current = true;
      fetchCourse();
    }
  }, [courseId, navigate]);

  const toggleModule = (moduleId: number) => {
    const newSet = new Set(expandedModules);
    if (newSet.has(moduleId)) {
      newSet.delete(moduleId);
    } else {
      newSet.add(moduleId);
    }
    setExpandedModules(newSet);
  };

  const handleEnroll = async () => {
    if (course?.price && course.price > 0) {
      navigate(`/checkout/${courseId}`);
      return;
    }
    try {
      await api.post("/enrollments/checkout", {
        course_id: Number(courseId),
        amount_paid: 0,
      });
      toast.success("Enrolled successfully!");
      navigate(`/lms/courses/${courseId}`);
    } catch (error) {
      const message = (error as { response?: { status?: number; data?: { message?: string } } })
        .response?.data?.message;
      if ((error as { response?: { status?: number } }).response?.status === 401) {
        navigate("/login");
        return;
      }
      toast.error(message || "Failed to enroll");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Course not found</p>
      </div>
    );
  }

  const totalLessons = course.modules?.reduce((sum, m) => sum + (m.lessons?.length || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Header with Back Button */}
      <div className="border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="max-w-6xl mx-auto px-8 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/courses")}
            className="text-gray-600 dark:text-gray-400 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Courses
          </Button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 py-12">
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4">
              <Badge className="w-fit bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                {course.course_code}
              </Badge>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                {course.course_name}
              </h1>
              {course.description && (
                <p className="text-lg text-gray-700 dark:text-gray-300">{course.description}</p>
              )}

              {/* Stats */}
              <div className="flex flex-wrap gap-6 pt-6 border-t border-gray-200 dark:border-slate-600">
                {course.rating && (
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.round(course.rating || 0)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300 dark:text-slate-600"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {course.rating.toFixed(1)}
                    </span>
                  </div>
                )}
                {course.students_count !== undefined && (
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <Users className="w-4 h-4" />
                    <span>{course.students_count} students</span>
                  </div>
                )}
                {course.duration && (
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <Clock className="w-4 h-4" />
                    <span>{course.duration}</span>
                  </div>
                )}
                {totalLessons > 0 && (
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <BookOpen className="w-4 h-4" />
                    <span>{totalLessons} lessons</span>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar CTA */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 space-y-4 sticky top-4">
                <div className="text-center">
                  {course.price && course.price > 0 ? (
                    <>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Price</p>
                      <p className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        ${course.price}
                      </p>
                    </>
                  ) : (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200 w-fit mx-auto mb-4">
                      Free Course
                    </Badge>
                  )}
                </div>

                <Button
                  onClick={handleEnroll}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold"
                >
                  {course.price && course.price > 0 ? "Enroll Now" : "Start Learning"}
                </Button>

                <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-slate-700">
                  <Button
                    variant="outline"
                    className="flex-1 dark:border-slate-600 dark:text-gray-300"
                    onClick={() => setIsSaved(!isSaved)}
                  >
                    <Heart
                      className={`w-4 h-4 mr-2 ${isSaved ? "fill-red-500 text-red-500" : ""}`}
                    />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 dark:border-slate-600 dark:text-gray-300"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>

                {course.instructor && (
                  <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Instructor</p>
                    <p className="font-medium text-gray-900 dark:text-white">{course.instructor}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-6xl mx-auto px-8 py-12">
        {/* Course Content */}
        <div className="space-y-8">
          {/* About Section */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">About This Course</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {course.description ||
                "This course provides comprehensive learning material covering all essential topics. Learn from experienced instructors and master the skills you need to succeed."}
            </p>
          </div>

          {/* Course Curriculum */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Course Curriculum</h2>

            {course.modules && course.modules.length > 0 ? (
              <div className="space-y-3">
                {course.modules.map((module, moduleIdx) => (
                  <div
                    key={module.id}
                    className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden"
                  >
                    {/* Module Header */}
                    <button
                      onClick={() => toggleModule(module.id)}
                      className="w-full p-5 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center justify-between transition-colors border-l-4 border-blue-500"
                    >
                      <div className="flex items-center gap-3 text-left flex-1">
                        {expandedModules.has(module.id) ? (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-500" />
                        )}
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            Chapter {moduleIdx + 1}: {module.title}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {module.lessons?.length || 0} lessons
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* Lessons */}
                    {expandedModules.has(module.id) && (
                      <div className="bg-gray-50 dark:bg-slate-700/50 border-t border-gray-200 dark:border-slate-700 divide-y divide-gray-200 dark:divide-slate-700">
                        {module.lessons && module.lessons.length > 0 ? (
                          module.lessons.map((lesson, lessonIdx) => (
                            <div
                              key={lesson.id}
                              className="p-4 hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors flex items-center gap-3"
                            >
                              <span className="text-gray-400 dark:text-gray-500 text-sm font-medium">
                                {lessonIdx + 1}
                              </span>
                              <BookOpen className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-700 dark:text-gray-300 flex-1">{lesson.title}</span>
                              <Lock className="w-4 h-4 text-gray-400" />
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                            No lessons yet
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 dark:bg-slate-800 rounded-lg">
                <BookOpen className="w-12 h-12 mx-auto text-gray-300 dark:text-slate-600 mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No course content available yet</p>
              </div>
            )}
          </div>

          {/* What You'll Learn */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">What You'll Learn</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "Master fundamental concepts",
                "Build real-world projects",
                "Get expert guidance",
                "Earn certificate upon completion",
                "Access lifetime materials",
                "Join our community",
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 rounded-lg p-12 text-center text-white space-y-4">
            <h3 className="text-3xl font-bold">Ready to start learning?</h3>
            <p className="text-blue-100 text-lg">
              {course.price && course.price > 0
                ? `Enroll now for $${course.price} and get lifetime access`
                : "Enroll now and start learning for free"}
            </p>
            <Button
              onClick={handleEnroll}
              className="bg-white hover:bg-gray-100 text-blue-600 font-bold px-8 py-3"
            >
              {course.price && course.price > 0 ? "Enroll Now" : "Start Learning"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
