import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Loader2, Search, FileText, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { API } from "@/lib/endpoints";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Assignment {
  id: number;
  title?: string;
  description?: string;
  due_date?: string;
  status?: "pending" | "submitted" | "graded";
  score?: number;
  max_score?: number;
  created_at: string;
}

interface Pagination {
  page: number;
  total: number;
  limit: number;
}

export default function AssignmentsNotionPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<Pagination>({ page: 1, total: 0, limit: 10 });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });
      if (debouncedSearch) params.append("search", debouncedSearch);
      const { data } = await api.get(`${API.ASSIGNMENTS.GET_ALL}?${params.toString()}`);
      setAssignments(data.data || data || []);
      setMeta(data.meta || { page, total: 0, limit: 10 });
    } catch (error: any) {
      console.error("Error fetching assignments:", error);
      toast.error(error.response?.data?.message || "Failed to fetch assignments");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      fetchAssignments();
    }
  }, [page, debouncedSearch, fetchAssignments]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(API.ASSIGNMENTS.DELETE(deleteId));
      toast.success("Assignment deleted successfully");
      fetchAssignments();
    } catch (error) {
      toast.error("Failed to delete assignment");
    } finally {
      setIsDeleteOpen(false);
      setDeleteId(null);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "submitted": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "graded": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const pendingCount = assignments.filter(a => a.status === "pending").length;
  const gradedCount = assignments.filter(a => a.status === "graded").length;
  const totalPages = Math.ceil(meta.total / meta.limit);

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal Header */}
      <div className="border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-8 py-12">
          <div className="mb-8">
            <h1 className="notion-header">Assignments</h1>
            <p className="notion-subheader">Submit and track your work</p>
          </div>
          <div className="notion-divider"></div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="notion-stat">
              <div className="notion-stat-value">{meta.total}</div>
              <div className="notion-stat-label">Total Assignments</div>
            </div>
            <div className="notion-stat">
              <div className="notion-stat-value">{pendingCount}</div>
              <div className="notion-stat-label">Pending Review</div>
            </div>
            <div className="notion-stat">
              <div className="notion-stat-value">{gradedCount}</div>
              <div className="notion-stat-label">Graded</div>
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
            placeholder="Search assignments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="notion-search flex-1"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Loading assignments...</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-8 h-8 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No assignments found</p>
          </div>
        ) : (
          <div className="notion-page overflow-hidden">
            <table className="notion-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment) => (
                  <tr key={assignment.id}>
                    <td className="font-medium">{assignment.title || "Untitled"}</td>
                    <td>
                      <Badge className={`${getStatusColor(assignment.status)} border-0 font-medium text-xs`}>
                        {assignment.status ? assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1) : "Unknown"}
                      </Badge>
                    </td>
                    <td className="text-sm">{assignment.score || "—"}/{assignment.max_score || "100"}</td>
                    <td className="text-gray-500 text-sm">
                      {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : "N/A"}
                    </td>
                    <td>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setDeleteId(assignment.id); setIsDeleteOpen(true); }}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            <AlertDialogTitle className="dark:text-white">Delete Assignment</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-400">
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel className="dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-700">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
