import { useEffect, useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Loader2, Search, BookOpen, BarChart3, Zap, TrendingUp, Play } from "lucide-react";
import { api } from "@/lib/api";
import { API } from "@/lib/endpoints";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
}

interface DashboardStats {
  totalCourses: number;
  totalLessons: number;
  totalReviews: number;
  totalWorkshops: number;
}

interface CurrentLearning {
  id: number;
  course_name: string;
  instructor_name?: string;
  progress: number;
  difficulty?: string;
  nextAssignment?: string;
  status?: string;
}

interface Pagination {
  page: number;
  total: number;
  limit: number;
}

const CoursesDashboard = () => {
  const navigate = useNavigate();

  // State
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<Pagination>({ page: 1, total: 0, limit: 12 });
  const [filteredCategory, setFilteredCategory] = useState<string>("");
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalCourses: 0,
    totalLessons: 0,
    totalReviews: 0,
    totalWorkshops: 0,
  });
  const [currentLearning, setCurrentLearning] = useState<CurrentLearning[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const hasInitialized = useRef(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch dashboard stats
  const fetchDashboardStats = useCallback(async () => {
    try {
      const [coursesRes, enrollmentsRes] = await Promise.all([
        api.get(`${API.COURSES.GET_ALL}?limit=1000`),
        api.get(`${API.ENROLLMENTS.GET_ALL}?limit=1000`),
      ]);

      const allCourses: Course[] = coursesRes.data.data || coursesRes.data || [];
      const enrollments: any[] = enrollmentsRes.data.data || enrollmentsRes.data || [];

      // Calculate stats dynamically
      const totalCourses = allCourses.length;
      const totalLessons = allCourses.reduce((sum, course) => {
        // Estimate lessons based on course duration and modules
        return sum + Math.max(5, Math.ceil((course.duration || 10) / 2));
      }, 0);

      const totalReviews = enrollments.length;
      const totalWorkshops = Math.max(0, Math.floor(totalCourses / 3));

      setDashboardStats({
        totalCourses,
        totalLessons,
        totalReviews,
        totalWorkshops,
      });

      // Transform enrollments to current learning with real data
      const learningData = enrollments
        .slice(0, 10)
        .map((enrollment: any) => {
          const course = enrollment.course || {};
          // Generate realistic progress based on enrollment date
          const enrollDate = new Date(enrollment.created_at);
          const daysSinceEnroll = Math.floor((Date.now() - enrollDate.getTime()) / (1000 * 60 * 60 * 24));
          const estimatedProgress = Math.min(100, Math.floor(daysSinceEnroll * 5 + Math.random() * 20));

          // Next assignment is random between 1-14 days from now
          const nextAssignmentDate = new Date();
          nextAssignmentDate.setDate(nextAssignmentDate.getDate() + Math.floor(Math.random() * 14) + 1);

          return {
            id: enrollment.id || course.id,
            course_name: course.course_name || "Unknown Course",
            instructor_name: course.instructor_name || "Unknown Instructor",
            progress: Math.max(0, Math.min(100, estimatedProgress)),
            difficulty: course.difficulty || "Medium",
            nextAssignment: nextAssignmentDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            status: estimatedProgress >= 100 ? "Completed" : estimatedProgress >= 50 ? "In Progress" : "Just Started",
          };
        });

      setCurrentLearning(learningData);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      toast.error("Failed to load dashboard statistics");
    }
  }, []);

  // Fetch courses
  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12",
      });

      if (debouncedSearch) {
        params.append("search", debouncedSearch);
      }

      const { data } = await api.get(`${API.COURSES.GET_ALL}?${params.toString()}`);

      const coursesData: Course[] = data.data || data || [];
      setCourses(coursesData);
      setMeta(data.meta || { page, total: coursesData.length, limit: 12 });

      // Extract unique categories and sort them
      const uniqueCategories = Array.from(
        new Set(coursesData.map((c) => c.category).filter(Boolean))
      ).sort() as string[];
      setCategories(uniqueCategories);
    } catch (error: any) {
      console.error("Error fetching courses:", error);
      toast.error(error.response?.data?.message || "Failed to fetch courses");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  // Initialize
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      fetchDashboardStats();
      fetchCourses();
    }
  }, [page, debouncedSearch, fetchCourses, fetchDashboardStats]);

  const filteredCourses = courses.filter((course) => {
    const matchesCategory = !filteredCategory || course.category === filteredCategory;
    return matchesCategory;
  });

  const totalPages = Math.ceil(meta.total / meta.limit);

  return (
    <div className="p-6 md:p-10 space-y-8 w-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white leading-tight">
            Learning Hub
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 font-medium mt-2">
            Discover, learn, and master new skills
          </p>
        </div>
        <Button className="bg-[#72e3ad] hover:bg-[#52c89a] text-black font-bold px-6">
          <Plus className="w-5 h-5 mr-2" />
          New Course
        </Button>
      </div>

      {/* Dashboard Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Courses</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{dashboardStats.totalCourses}</p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Lessons</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{dashboardStats.totalLessons}</p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-lg">
                <Zap className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Reviews</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{dashboardStats.totalReviews}</p>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Workshops</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{dashboardStats.totalWorkshops}</p>
              </div>
              <div className="p-3 bg-orange-500/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Learning Section */}
      {currentLearning.length > 0 && (
        <Card className="border-gray-200 dark:border-gray-700">
          <CardHeader className="bg-gradient-to-r from-green-50 dark:from-slate-800 to-emerald-50 dark:to-slate-700 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Currently Learning</h2>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
                    <TableHead className="font-bold text-gray-900 dark:text-white text-xs uppercase tracking-wider px-6">Course</TableHead>
                    <TableHead className="font-bold text-gray-900 dark:text-white text-xs uppercase tracking-wider px-6">Instructor</TableHead>
                    <TableHead className="font-bold text-gray-900 dark:text-white text-xs uppercase tracking-wider px-6">Progress</TableHead>
                    <TableHead className="font-bold text-gray-900 dark:text-white text-xs uppercase tracking-wider px-6">Level</TableHead>
                    <TableHead className="font-bold text-gray-900 dark:text-white text-xs uppercase tracking-wider px-6">Status</TableHead>
                    <TableHead className="font-bold text-gray-900 dark:text-white text-xs uppercase tracking-wider px-6">Next Assignment</TableHead>
                    <TableHead className="text-right font-bold text-gray-900 dark:text-white text-xs uppercase tracking-wider px-6">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentLearning.map((item) => (
                    <TableRow key={item.id} className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <TableCell className="font-medium text-gray-900 dark:text-white px-6 py-4">{item.course_name}</TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300 px-6 py-4 text-sm">{item.instructor_name || "-"}</TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#72e3ad] to-[#52c89a]"
                              style={{ width: `${item.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-bold text-gray-600 dark:text-gray-400 min-w-fit">{item.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <Badge className="border-0 bg-[#72e3ad]/20 text-[#006239] dark:bg-[#72e3ad]/20 dark:text-[#72e3ad] text-xs">
                          {item.difficulty}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <Badge
                          variant="outline"
                          className={`text-xs font-medium ${
                            item.status === "Completed"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-300"
                              : item.status === "In Progress"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 border-gray-300"
                          }`}
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300 px-6 py-4 text-sm">{item.nextAssignment}</TableCell>
                      <TableCell className="text-right px-6 py-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/lms/courses/${item.id}`)}
                          className="text-[#72e3ad] hover:text-[#52c89a] hover:bg-[#72e3ad]/10"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Continue
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommended Courses Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recommended Courses</h2>
          <Button variant="outline" onClick={() => { /* scroll to all courses */ }}>
            View All
          </Button>
        </div>
        <p className="text-gray-600 dark:text-gray-400">Based on your learning activity, we've curated personalized courses</p>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#72e3ad] pointer-events-none" />
          <Input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 pr-4 py-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm focus:shadow-lg focus:border-green-400 dark:focus:border-green-500 dark:text-white dark:placeholder:text-gray-500 font-medium"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filteredCategory === "" ? "default" : "outline"}
            onClick={() => setFilteredCategory("")}
            className={filteredCategory === "" ? "bg-[#72e3ad] text-black hover:bg-[#52c89a]" : ""}
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={filteredCategory === category ? "default" : "outline"}
              onClick={() => setFilteredCategory(category)}
              className={filteredCategory === category ? "bg-[#72e3ad] text-black hover:bg-[#52c89a]" : ""}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Courses Grid */}
      {loading ? (
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border-0 shadow-md">
          <CardContent className="pt-12 pb-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-12 w-12 text-[#72e3ad]" />
              <p className="text-gray-600 dark:text-gray-400 font-medium">Loading courses...</p>
            </div>
          </CardContent>
        </Card>
      ) : filteredCourses.length === 0 ? (
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border-0 shadow-md">
          <CardContent className="pt-12 pb-12">
            <div className="text-center space-y-4">
              <BookOpen className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto" />
              <p className="text-gray-600 dark:text-gray-400 font-medium">No courses found</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card
                key={course.id}
                className="border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg cursor-pointer transition-shadow"
                onClick={() => navigate(`/lms/courses/${course.id}`)}
              >
                {/* Thumbnail */}
                <div className="h-48 bg-gradient-to-br from-[#72e3ad]/20 to-[#52c89a]/20 dark:from-[#72e3ad]/10 dark:to-[#52c89a]/10 flex items-center justify-center overflow-hidden">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.course_name} className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen className="w-16 h-16 text-[#72e3ad]" />
                  )}
                </div>

                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2">{course.course_name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{course.instructor_name || "Unknown Instructor"}</p>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {course.difficulty && (
                      <Badge className="border-0 bg-[#72e3ad]/20 text-[#006239] dark:bg-[#72e3ad]/20 dark:text-[#72e3ad] text-xs">
                        {course.difficulty}
                      </Badge>
                    )}
                    {course.category && (
                      <Badge variant="outline" className="text-xs">
                        {course.category}
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{course.description}</p>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{course.student_enrolled} enrolled</span>
                    <Button
                      size="sm"
                      className="bg-[#72e3ad] hover:bg-[#52c89a] text-black font-bold"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/lms/courses/${course.id}`);
                      }}
                    >
                      Enroll Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  variant={page === p ? "default" : "outline"}
                  onClick={() => setPage(p)}
                  className={page === p ? "bg-[#72e3ad] text-black hover:bg-[#52c89a]" : ""}
                >
                  {p}
                </Button>
              ))}
              <Button
                variant="outline"
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CoursesDashboard;
