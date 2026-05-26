"use client";

import { ITEM_PER_PAGE } from "@/lib/settings";
import { useRouter } from "next/navigation";

const Pagination = ({ page, count }: { page: number; count: number }) => {
  const router = useRouter();

  const hasPrev = ITEM_PER_PAGE * (page - 1) > 0;
  const hasNext = ITEM_PER_PAGE * (page - 1) + ITEM_PER_PAGE < count;

  const changePage = (newPage: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", newPage.toString());
    router.push(`${window.location.pathname}?${params}`);
  };
  return (
    <div className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-muted-foreground">
      <button
        disabled={!hasPrev}
        className="py-2 px-4 rounded-md bg-secondary text-secondary-foreground text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
        onClick={() => {
          changePage(page - 1);
        }}
      >
        Prev
      </button>
      <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
        {Array.from(
          { length: Math.ceil(count / ITEM_PER_PAGE) },
          (_, index) => {
            const pageIndex = index + 1;
            return (
              <button
                key={pageIndex}
                className={`px-2 rounded-sm transition-colors duration-300 ${
                  page === pageIndex ? "bg-primary text-primary-foreground" : "hover:bg-accent"
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
        className="py-2 px-4 rounded-md bg-secondary text-secondary-foreground text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
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
