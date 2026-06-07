import React from "react";

const Loading = () => {
  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen relative font-sans text-left transition-all duration-300 select-none animate-pulse">
      {/* BREADCRUMB SKELETON */}
      <div className="flex items-center gap-1 text-[11px] font-extrabold text-slate-350 uppercase tracking-wider mb-2 select-none">
        <div className="h-3 w-10 bg-slate-200 rounded-full" />
        <span>/</span>
        <div className="h-3 w-16 bg-slate-200 rounded-full" />
      </div>

      {/* HEADER SECTION SKELETON */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none mb-6">
        <div>
          <div className="h-3 w-32 bg-slate-250 rounded-full" />
          <div className="h-8 w-60 bg-slate-200 rounded-lg mt-2" />
        </div>

        {/* Action button skeleton */}
        <div className="h-10 w-36 bg-slate-200 rounded-xl shrink-0" />
      </div>

      {/* TABLE CONTAINER CARD */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-5">
        {/* Table Search & Filter Bar Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          {/* Mock Search Bar */}
          <div className="h-9 w-60 bg-slate-100 rounded-full" />
          
          {/* Mock Filter Buttons */}
          <div className="flex gap-2">
            <div className="h-9 w-9 bg-slate-100 rounded-xl" />
            <div className="h-9 w-9 bg-slate-100 rounded-xl" />
            <div className="h-9 w-9 bg-slate-100 rounded-xl" />
          </div>
        </div>

        {/* Shimmer Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-50">
          <table className="w-full text-left text-xs font-semibold font-sans border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                <th className="p-3.5"><div className="h-3.5 w-16 bg-slate-200 rounded-full" /></th>
                <th className="p-3.5"><div className="h-3.5 w-24 bg-slate-200 rounded-full" /></th>
                <th className="p-3.5"><div className="h-3.5 w-20 bg-slate-200 rounded-full" /></th>
                <th className="p-3.5"><div className="h-3.5 w-16 bg-slate-200 rounded-full" /></th>
                <th className="p-3.5 text-center"><div className="h-3.5 w-12 bg-slate-200 rounded-full mx-auto" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...Array(6)].map((_, rowIndex) => (
                <tr key={rowIndex} className="transition-colors">
                  <td className="p-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 shrink-0" />
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="h-3.5 w-24 bg-slate-200 rounded-full" />
                        <div className="h-2.5 w-16 bg-slate-150 rounded-full" />
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5"><div className="h-3 w-32 bg-slate-150 rounded-full" /></td>
                  <td className="p-3.5"><div className="h-3 w-16 bg-slate-150 rounded-full" /></td>
                  <td className="p-3.5"><div className="h-3 w-20 bg-slate-150 rounded-full" /></td>
                  <td className="p-3.5">
                    <div className="flex justify-center gap-1.5">
                      <div className="h-7 w-7 bg-slate-100 rounded-lg" />
                      <div className="h-7 w-7 bg-slate-100 rounded-lg" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Skeleton */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="h-7 w-28 bg-slate-100 rounded-lg" />
          <div className="flex gap-1">
            <div className="h-7 w-16 bg-slate-100 rounded-lg" />
            <div className="flex gap-0.5">
              <div className="h-7 w-7 bg-slate-200 rounded-lg" />
              <div className="h-7 w-7 bg-slate-100 rounded-lg" />
              <div className="h-7 w-7 bg-slate-100 rounded-lg" />
            </div>
            <div className="h-7 w-16 bg-slate-100 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loading;
