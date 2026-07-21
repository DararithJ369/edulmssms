import React from "react";

const Loading = () => {
  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen relative font-sans text-left transition-all duration-300 select-none">
      {/* BREADCRUMB SKELETON */}
      <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        <div className="skeleton h-3 w-10" />
        <span className="text-muted-foreground/30">/</span>
        <div className="skeleton h-3 w-16" />
      </div>

      {/* HEADER SECTION SKELETON */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="space-y-2">
          <div className="skeleton h-3.5 w-36" />
          <div className="skeleton h-8 w-64" />
        </div>

        {/* Action button skeleton */}
        <div className="skeleton h-9 w-32" />
      </div>

      {/* TABLE CONTAINER CARD */}
      <div className="bg-card p-6 rounded-2xl border border-border/60 shadow-xs space-y-5">
        {/* Table Search & Filter Bar Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
          {/* Mock Search Bar */}
          <div className="skeleton h-9 w-60" />
          
          {/* Mock Filter Buttons */}
          <div className="flex gap-2">
            <div className="skeleton h-9 w-9" />
            <div className="skeleton h-9 w-9" />
          </div>
        </div>

        {/* Shimmer Table */}
        <div className="overflow-x-auto rounded-xl border border-border/40">
          <table className="w-full text-left text-xs font-semibold font-sans border-collapse">
            <thead>
              <tr className="border-b border-border/40 bg-slate-50/50">
                <th className="p-3.5"><div className="skeleton h-3.5 w-16" /></th>
                <th className="p-3.5"><div className="skeleton h-3.5 w-24" /></th>
                <th className="p-3.5"><div className="skeleton h-3.5 w-20" /></th>
                <th className="p-3.5"><div className="skeleton h-3.5 w-16" /></th>
                <th className="p-3.5 text-center"><div className="skeleton h-3.5 w-12 mx-auto" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {[...Array(6)].map((_, rowIndex) => (
                <tr key={rowIndex} className="transition-colors">
                  <td className="p-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl skeleton shrink-0" />
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="skeleton h-3.5 w-24" />
                        <div className="skeleton h-2.5 w-16" />
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5"><div className="skeleton h-3 w-32" /></td>
                  <td className="p-3.5"><div className="skeleton h-3 w-16" /></td>
                  <td className="p-3.5"><div className="skeleton h-3 w-20" /></td>
                  <td className="p-3.5">
                    <div className="flex justify-center gap-1.5">
                      <div className="skeleton h-7 w-7" />
                      <div className="skeleton h-7 w-7" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Skeleton */}
        <div className="flex items-center justify-between pt-4 border-t border-border/40">
          <div className="skeleton h-7 w-28" />
          <div className="flex gap-1.5">
            <div className="skeleton h-8 w-8" />
            <div className="flex gap-1">
              <div className="skeleton h-8 w-8" />
              <div className="skeleton h-8 w-8" />
              <div className="skeleton h-8 w-8" />
            </div>
            <div className="skeleton h-8 w-8" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loading;
