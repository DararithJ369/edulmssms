import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import CustomPagination from "@/components/global/CustomPagination";

interface Enrollment {
  id: number;
  student_profile_id: number;
  course_id: number;
  academic_year_id: number;
  term_id?: number | null;
  grade_level_id?: number | null;
  is_active: boolean;
  enrolled_date?: string | null;
}

interface Pagination {
  page: number;
  total: number;
  limit: number;
}

type ApiError = { response?: { data?: { message?: string } } };

export default function Enrollments() {
  const [data, setData] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<Pagination>({ page: 1, total: 0, limit: 10 });

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        setLoading(true);
        const { data: response } = await api.get(`/enrollments?page=${page}&limit=10`);
        setData(response.data || []);
        setMeta(response.meta || { page, total: 0, limit: 10 });
      } catch (error) {
        const message = (error as ApiError).response?.data?.message || "Failed to load enrollments";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollments();
  }, [page]);

  const totalPages = Math.ceil(meta.total / meta.limit);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-8 py-12">
          <h1 className="notion-header">Enrollments</h1>
          <p className="notion-subheader">Track student enrollments across courses</p>
          <div className="notion-divider"></div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Loading enrollments...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No enrollments found</p>
          </div>
        ) : (
          <div className="notion-card overflow-hidden">
            <div className="notion-table">
              <table className="w-full">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Course</th>
                    <th>Academic Year</th>
                    <th>Term</th>
                    <th>Status</th>
                    <th>Enrolled Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row) => (
                    <tr key={row.id}>
                      <td>#{row.student_profile_id}</td>
                      <td>#{row.course_id}</td>
                      <td>#{row.academic_year_id}</td>
                      <td>{row.term_id ? `#${row.term_id}` : "—"}</td>
                      <td>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            row.is_active
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                              : "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-300"
                          }`}
                        >
                          {row.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>{row.enrolled_date || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {totalPages > 1 && (
          <CustomPagination
            loading={loading}
            page={page}
            setPage={setPage}
            totalPages={totalPages}
          />
        )}
      </div>
    </div>
  );
}
