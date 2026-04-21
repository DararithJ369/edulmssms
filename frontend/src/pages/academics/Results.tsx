import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Loader2, Search, BarChart3 } from "lucide-react";
import { api } from "@/lib/api";
import { API } from "@/lib/endpoints";
import { Badge } from "@/components/ui/badge";
import CustomPagination from "@/components/global/CustomPagination";

interface Result {
  id: number;
  subject?: string;
  exam_name?: string;
  score: number;
  max_score?: number;
  percentage?: number;
  grade?: string;
  created_at: string;
}

interface Pagination {
  page: number;
  total: number;
  limit: number;
}

export default function ResultsNotionPage() {
  const [results, setResults] = useState<Result[]>([]);
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

  const fetchResults = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });
      if (debouncedSearch) params.append("search", debouncedSearch);
      const { data } = await api.get(`${API.RESULTS.GET_ALL}?${params.toString()}`);
      setResults(data.data || data || []);
      setMeta(data.meta || { page, total: 0, limit: 10 });
    } catch (error: any) {
      console.error("Error fetching results:", error);
      toast.error(error.response?.data?.message || "Failed to fetch results");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      fetchResults();
    }
  }, [page, debouncedSearch, fetchResults]);

  const getGradeColor = (grade?: string) => {
    switch (grade) {
      case "A": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "B": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "C": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "D": return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
      case "F": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const avgScore = results.length > 0 ? (results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length).toFixed(1) : 0;
  const totalPages = Math.ceil(meta.total / meta.limit);

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal Header */}
      <div className="border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-8 py-12">
          <div className="mb-8">
            <h1 className="notion-header">Results</h1>
            <p className="notion-subheader">View your exam and assessment results</p>
          </div>
          <div className="notion-divider"></div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="notion-stat">
              <div className="notion-stat-value">{meta.total}</div>
              <div className="notion-stat-label">Total Results</div>
            </div>
            <div className="notion-stat">
              <div className="notion-stat-value">{avgScore}%</div>
              <div className="notion-stat-label">Average Score</div>
            </div>
            <div className="notion-stat">
              <div className="notion-stat-value">{page} of {totalPages}</div>
              <div className="notion-stat-label">Current Page</div>
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
            placeholder="Search results..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="notion-search flex-1"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Loading results...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="w-8 h-8 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No results found</p>
          </div>
        ) : (
          <div className="notion-page overflow-hidden">
            <table className="notion-table">
              <thead>
                <tr>
                  <th>Exam/Subject</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Grade</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result) => (
                  <tr key={result.id}>
                    <td className="font-medium">{result.exam_name || result.subject || "N/A"}</td>
                    <td>{result.score}/{result.max_score || 100}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-400 to-teal-600"
                            style={{ width: `${result.percentage || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{result.percentage || 0}%</span>
                      </div>
                    </td>
                    <td>
                      <Badge className={`${getGradeColor(result.grade)} border-0 font-bold`}>
                        {result.grade || "N/A"}
                      </Badge>
                    </td>
                    <td className="text-gray-500 text-sm">
                      {new Date(result.created_at).toLocaleDateString()}
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
    </div>
  );
}
