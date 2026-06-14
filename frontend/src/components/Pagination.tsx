"use client";

import { ITEM_PER_PAGE } from "@/lib/settings";
import { useRouter } from "next/navigation";

const Pagination = ({ page, count, limit = ITEM_PER_PAGE }: { page: number; count: number; limit?: number }) => {
  const router = useRouter();

  const hasPrev = limit * (page - 1) > 0;
  const hasNext = limit * (page - 1) + limit < count;

  const changePage = (newPage: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", newPage.toString());
    router.push(`${window.location.pathname}?${params}`);
  };
  return (
    <div className="p-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-muted-foreground w-full">
      <button
        disabled={!hasPrev}
        className="px-3 py-1.5 text-xs font-bold border border-border rounded-xl disabled:opacity-40 hover:bg-slate-50 bg-white text-slate-700 transition-colors duration-300 cursor-pointer"
        onClick={() => {
          changePage(page - 1);
        }}
      >
        Prev
      </button>
      <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs font-bold">
        {Array.from(
          { length: Math.ceil(count / limit) },
          (_, index) => {
            const pageIndex = index + 1;
            return (
              <button
                key={pageIndex}
                className={`px-2.5 py-1.5 rounded-lg transition-colors duration-300 cursor-pointer ${
                  page === pageIndex ? "bg-[#0038A8] text-white" : "hover:bg-slate-100 text-slate-600"
                }`}
                onClick={() => {
                  changePage(pageIndex);
                }}
              >
                {pageIndex}
              </button>
            );
          }
        )}
      </div>
      <button
        className="px-3 py-1.5 text-xs font-bold border border-border rounded-xl disabled:opacity-40 hover:bg-slate-50 bg-white text-slate-700 transition-colors duration-300 cursor-pointer"
        disabled={!hasNext}
        onClick={() => {
          changePage(page + 1);
        }}
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
