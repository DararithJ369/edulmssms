import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const CustomPagination = ({
  loading,
  page,
  setPage,
  totalPages,
}: {
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
  loading: boolean;
}) => {
  return (
    <div className="flex items-center justify-between gap-4 py-6 px-6 border-t border-slate-200 dark:border-neutral-800 bg-gradient-to-r from-slate-50/50 to-transparent dark:from-neutral-900/50 dark:to-transparent">
      <div className="text-sm text-slate-600 dark:text-neutral-400">
        Page <span className="font-semibold text-slate-900 dark:text-neutral-100">{page}</span> of <span className="font-semibold text-slate-900 dark:text-neutral-100">{totalPages}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page === 1 || loading}
          className="gap-2 border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(Math.min(totalPages, page + 1))}
          disabled={page === totalPages || loading}
          className="gap-2 border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default CustomPagination;
