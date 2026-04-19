import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Loader2, Search, HelpCircle } from "lucide-react";
import { api } from "@/lib/api";
import { API } from "@/lib/endpoints";
import { Button } from "@/components/ui/button";

interface Quiz {
  id: number;
  title?: string;
  description?: string;
  total_questions?: number;
  duration?: number;
  score?: number;
  max_score?: number;
  created_at: string;
}

interface Pagination {
  page: number;
  total: number;
  limit: number;
}

export default function QuizzesNotionPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
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

  const fetchQuizzes = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });
      if (debouncedSearch) params.append("search", debouncedSearch);
      const { data } = await api.get(`${API.QUIZZES.GET_ALL}?${params.toString()}`);
      setQuizzes(data.data || data || []);
      setMeta(data.meta || { page, total: 0, limit: 10 });
    } catch (error: any) {
      console.error("Error fetching quizzes:", error);
      toast.error(error.response?.data?.message || "Failed to fetch quizzes");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      fetchQuizzes();
    }
  }, [page, debouncedSearch, fetchQuizzes]);

  const avgQuestions = quizzes.length > 0 ? (quizzes.reduce((sum, q) => sum + (q.total_questions || 0), 0) / quizzes.length).toFixed(1) : 0;
  const avgDuration = quizzes.length > 0 ? (quizzes.reduce((sum, q) => sum + (q.duration || 0), 0) / quizzes.length).toFixed(0) : 0;
  const totalPages = Math.ceil(meta.total / meta.limit);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Minimal Header */}
      <div className="border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-8 py-12">
          <div className="mb-8">
            <h1 className="notion-header">Quizzes</h1>
            <p className="notion-subheader">Test your knowledge</p>
          </div>
          <div className="notion-divider"></div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="notion-stat">
              <div className="notion-stat-value">{meta.total}</div>
              <div className="notion-stat-label">Total Quizzes</div>
            </div>
            <div className="notion-stat">
              <div className="notion-stat-value">{avgQuestions}</div>
              <div className="notion-stat-label">Avg Questions</div>
            </div>
            <div className="notion-stat">
              <div className="notion-stat-value">{avgDuration}m</div>
              <div className="notion-stat-label">Avg Duration</div>
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
            placeholder="Search quizzes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="notion-search flex-1"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Loading quizzes...</p>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="text-center py-12">
            <HelpCircle className="w-8 h-8 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No quizzes found</p>
          </div>
        ) : (
          <div className="notion-page overflow-hidden">
            <table className="notion-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Questions</th>
                  <th>Duration</th>
                  <th>Score</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {quizzes.map((quiz) => (
                  <tr key={quiz.id}>
                    <td className="font-medium">{quiz.title || "Untitled Quiz"}</td>
                    <td>{quiz.total_questions || 0} questions</td>
                    <td>{quiz.duration || 0} minutes</td>
                    <td>
                      {quiz.score !== undefined ? (
                        <span className="font-medium">{quiz.score}/{quiz.max_score || 100}</span>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="text-gray-500 text-sm">
                      {new Date(quiz.created_at).toLocaleDateString()}
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
    </div>
  );
}
