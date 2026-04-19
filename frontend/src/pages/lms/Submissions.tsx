import { useEffect, useState } from "react";
import { Loader2, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { API } from "@/lib/endpoints";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Submission {
  id: number;
  submission_type: string;
  reference_id: number;
  student_id: string;
  status?: string | null;
  score?: number | null;
  feedback?: string | null;
  submitted_at: string;
}

interface Pagination {
  page: number;
  total: number;
  limit: number;
}

type ApiError = { response?: { data?: { message?: string } } };

export default function Submissions() {
  const [items, setItems] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<Pagination>({ page: 1, total: 0, limit: 10 });

  const [editing, setEditing] = useState<Submission | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`${API.SUBMISSIONS.GET_ALL}?page=${page}&limit=10`);
      setItems(data.data || []);
      setMeta(data.meta || { page, total: 0, limit: 10 });
    } catch (error) {
      const message = (error as ApiError).response?.data?.message || "Failed to load submissions";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [page]);

  const handleUpdate = async () => {
    if (!editing) return;
    try {
      const formData = new FormData();
      if (editing.status) formData.append("status", editing.status);
      if (editing.score !== undefined && editing.score !== null) {
        formData.append("score", String(editing.score));
      }
      if (editing.feedback) formData.append("feedback", editing.feedback);

      await api.put(API.SUBMISSIONS.UPDATE(editing.id), formData);
      toast.success("Submission updated");
      setIsEditOpen(false);
      setEditing(null);
      fetchSubmissions();
    } catch (error) {
      const message = (error as ApiError).response?.data?.message || "Failed to update submission";
      toast.error(message);
    }
  };

  const totalPages = Math.ceil(meta.total / meta.limit);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-8 py-12">
          <h1 className="notion-header">Submissions</h1>
          <p className="notion-subheader">Review student submissions</p>
          <div className="notion-divider"></div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Loading submissions...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No submissions found</p>
          </div>
        ) : (
          <div className="notion-card overflow-hidden">
            <div className="notion-table">
              <table className="w-full">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Reference</th>
                    <th>Student</th>
                    <th>Status</th>
                    <th>Score</th>
                    <th>Submitted</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => (
                    <tr key={row.id}>
                      <td className="capitalize">{row.submission_type}</td>
                      <td>#{row.reference_id}</td>
                      <td>{row.student_id}</td>
                      <td>{row.status || "—"}</td>
                      <td>{row.score ?? "—"}</td>
                      <td>{new Date(row.submitted_at).toLocaleDateString()}</td>
                      <td className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditing({ ...row });
                            setIsEditOpen(true);
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 pt-8">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="notion-button"
            >
              ← Previous
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, page - 2);
              return start + i;
            }).map((p) =>
              p <= totalPages ? (
                <Button
                  key={p}
                  onClick={() => setPage(p)}
                  className={
                    page === p
                      ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold"
                      : "notion-button"
                  }
                >
                  {p}
                </Button>
              ) : null
            )}
            <Button
              variant="outline"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="notion-button"
            >
              Next →
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Update Submission</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Set status, score, and feedback
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <Input
                placeholder="Status (submitted/graded/late)"
                value={editing.status || ""}
                onChange={(e) => setEditing({ ...editing, status: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Score"
                value={editing.score ?? 0}
                onChange={(e) => setEditing({ ...editing, score: Number(e.target.value) })}
              />
              <Input
                placeholder="Feedback"
                value={editing.feedback || ""}
                onChange={(e) => setEditing({ ...editing, feedback: e.target.value })}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdate} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Save
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
