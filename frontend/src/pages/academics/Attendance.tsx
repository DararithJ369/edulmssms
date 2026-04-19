import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Loader2, Search, Users } from "lucide-react";
import { api } from "@/lib/api";
import { API } from "@/lib/endpoints";
import { Badge } from "@/components/ui/badge";
import CustomPagination from "@/components/global/CustomPagination";

interface AttendanceRecord {
  id: number;
  student_id?: string;
  student_name?: string;
  class_name?: string;
  session_date?: string;
  status?: "present" | "absent" | "late" | "excused";
  marked_at: string;
}

interface Pagination {
  page: number;
  total: number;
  limit: number;
}

export default function AttendanceNotionPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<Pagination>({ page: 1, total: 0, limit: 10 });
  const hasInitialized = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });
      if (debouncedSearch) params.append("search", debouncedSearch);
      const { data } = await api.get(`${API.ATTENDANCE.GET_ALL}?${params.toString()}`);
      setRecords(data.data || data || []);
      setMeta(data.meta || { page, total: 0, limit: 10 });
    } catch (error: any) {
      console.error("Error fetching attendance:", error);
      toast.error(error.response?.data?.message || "Failed to fetch attendance records");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      fetchAttendance();
    }
  }, [page, debouncedSearch, fetchAttendance]);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "absent":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "late":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "excused":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const totalPages = Math.ceil(meta.total / meta.limit);

  return (
    <div className="max-w-6xl mx-auto px-8 py-8 space-y-8">
      {/* Search */}
      <div className="flex items-center gap-2">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search attendance..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="notion-search flex-1"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Loading attendance...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-8 h-8 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No attendance records found</p>
        </div>
      ) : (
        <div className="notion-page overflow-hidden">
          <table className="notion-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Class</th>
                <th>Status</th>
                <th>Date</th>
                <th>Recorded</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td className="font-medium">{record.student_name || record.student_id || "N/A"}</td>
                  <td>{record.class_name || "N/A"}</td>
                  <td>
                    <Badge className={`${getStatusColor(record.status)} border-0 font-medium text-xs`}>
                      {record.status ? record.status.charAt(0).toUpperCase() + record.status.slice(1) : "Unknown"}
                    </Badge>
                  </td>
                  <td className="text-gray-500 text-sm">
                    {record.session_date ? new Date(record.session_date).toLocaleDateString() : "N/A"}
                  </td>
                  <td className="text-gray-500 text-sm">
                    {new Date(record.marked_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <CustomPagination
          loading={loading}
          page={page}
          setPage={setPage}
          totalPages={totalPages}
        />
      )}
    </div>
  );
}
