import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Loader2, Search, BookOpen, Users, Clock, Star, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { API } from "@/lib/endpoints";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CourseCard {
  id: number;
  course_name: string;
  course_code: string;
  description?: string;
  instructor?: string;
  students_count?: number;
  duration?: string;
  rating?: number;
  price?: number;
  is_published?: boolean;
}

interface Pagination {
  page: number;
  total: number;
  limit: number;
}

type ApiError = { response?: { data?: { message?: string } } };

export default function PublicCourses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<Pagination>({ page: 1, total: 0, limit: 12 });
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

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
        limit: "12",
        published: "true",
      });
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (selectedCategory !== "all") params.append("category", selectedCategory);

      const { data } = await api.get(`${API.COURSES.GET_ALL}?${params.toString()}`);
      setCourses(data.data || data || []);
      setMeta(data.meta || { page, total: 0, limit: 12 });
    } catch (error) {
      const message = (error as ApiError).response?.data?.message || "Failed to fetch courses";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, selectedCategory]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const totalPages = Math.ceil(meta.total / meta.limit);
  const categories = ["All Courses", "Programming", "Design", "Business", "Science"];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-900 text-white py-20">
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center space-y-4 mb-12">
            <h1 className="text-5xl font-bold">Explore Our Courses</h1>
            <p className="text-xl text-blue-100">Learn from industry experts and master new skills</p>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-2 bg-white rounded-lg overflow-hidden shadow-lg">
            <Search className="w-5 h-5 text-gray-400 ml-4" />
            <input
              type="text"
              placeholder="Search courses by name, instructor, or topic..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-4 text-gray-900 outline-none text-lg"
            />
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-none px-8 py-4 h-auto">
              Search
            </Button>
          </div>
        </div>
      </div>

      {/* Filters & Content */}
      <div className="max-w-6xl mx-auto px-8 py-12">
        {/* Category Filters */}
        <div className="mb-12">
          <div className="flex gap-3 overflow-x-auto pb-4">
            {categories.map((cat) => (
              <Button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat === "All Courses" ? "all" : cat.toLowerCase());
                  setPage(1);
                }}
                className={
                  (cat === "All Courses" && selectedCategory === "all") ||
                  cat.toLowerCase() === selectedCategory
                    ? "bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 whitespace-nowrap"
                    : "border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-full px-6 whitespace-nowrap"
                }
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-8">
          <p className="text-gray-600 dark:text-gray-400">
            Showing {(page - 1) * meta.limit + 1} to {Math.min(page * meta.limit, meta.total)} of {meta.total} courses
          </p>
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">Loading courses...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 dark:bg-slate-800 rounded-lg">
            <BookOpen className="w-16 h-16 mx-auto text-gray-300 dark:text-slate-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">No courses found</p>
            <p className="text-gray-400 dark:text-gray-500 mt-2">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="group border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden hover:shadow-lg dark:hover:shadow-xl transition-shadow duration-300 bg-white dark:bg-slate-800"
                >
                  {/* Image Placeholder */}
                  <div className="w-full h-48 bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-600 dark:to-blue-800 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BookOpen className="w-16 h-16 text-white opacity-30" />
                    </div>
                    {course.price && (
                      <div className="absolute top-3 right-3 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        ${course.price}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5 space-y-4">
                    <div>
                      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 mb-2">
                        {course.course_code}
                      </Badge>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                        {course.course_name}
                      </h3>
                    </div>

                    {course.description && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                        {course.description}
                      </p>
                    )}

                    {/* Instructor */}
                    {course.instructor && (
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <Users className="w-4 h-4" />
                        <span>Instructor: {course.instructor}</span>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-slate-700">
                      {course.students_count !== undefined && (
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{course.students_count} students</span>
                        </div>
                      )}
                      {course.duration && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{course.duration}</span>
                        </div>
                      )}
                      {course.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>{course.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>

                    {/* Button */}
                    <Button
                      onClick={() => navigate(`/courses/${course.id}`)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4 group/btn"
                    >
                      View Course
                      <ChevronRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-0.5 transition-transform" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 pt-8 border-t border-gray-200 dark:border-slate-700">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="dark:border-slate-600 dark:text-gray-300"
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
                      className={
                        page === p
                          ? "bg-blue-600 hover:bg-blue-700 text-white font-bold"
                          : "border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                      }
                    >
                      {p}
                    </Button>
                  )
                ))}
                <Button
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="dark:border-slate-600 dark:text-gray-300"
                >
                  Next →
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 py-16">
        <div className="max-w-6xl mx-auto px-8 text-center space-y-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Ready to start learning?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
            Join thousands of students already learning and advancing their careers with our courses.
          </p>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg">
            Get Started Today
          </Button>
        </div>
      </div>
    </div>
  );
}
