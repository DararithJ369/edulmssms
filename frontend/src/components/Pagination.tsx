"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { useRouter } from "next/navigation";

const Pagination = ({
  page,
  count,
  limit = ITEM_PER_PAGE,
}: {
  page: number;
  count: number;
  limit?: number;
}) => {
  const router = useRouter();
  const totalPages = Math.max(1, Math.ceil(count / limit));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const changePage = (newPage: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", newPage.toString());
    router.push(`${window.location.pathname}?${params}`);
  };

  if (totalPages <= 1) return null;

  // Show max 7 page buttons with ellipsis logic
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | "...")[] = [1];
    if (page > 3) pages.push("...");
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    ) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="flex items-center justify-between text-muted-foreground w-full select-none" role="navigation" aria-label="Pagination">
      <button
        disabled={!hasPrev}
        onClick={() => changePage(page - 1)}
        className="px-3 py-1.5 text-xs font-bold border border-border/80 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 bg-white text-slate-700 transition-colors duration-300 cursor-pointer"
      >
        Prev
      </button>

      <div className="flex items-center gap-1.5 text-xs font-bold">
        {getPageNumbers().map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="px-1 text-slate-400 select-none">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => changePage(p as number)}
              aria-current={page === p ? "page" : undefined}
              className={`px-2.5 py-1.5 rounded-lg transition-colors duration-300 cursor-pointer ${
                page === p
                  ? "bg-brand text-white shadow-sm font-black"
                  : "hover:bg-slate-100 text-slate-600 font-semibold"
              }`}
            >
              {p}
            </button>
          )
        )}
      </div>

      <button
        disabled={!hasNext}
        onClick={() => changePage(page + 1)}
        className="px-3 py-1.5 text-xs font-bold border border-border/80 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 bg-white text-slate-700 transition-colors duration-300 cursor-pointer"
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
