import React from "react";

const CourseLoading = () => {
  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen relative font-sans text-left transition-all duration-300 select-none animate-pulse">
      {/* BREADCRUMB SKELETON */}
      <div className="flex items-center gap-1 text-[11px] font-extrabold text-slate-350 uppercase tracking-wider mb-2">
        <div className="h-3.5 w-10 bg-slate-200 rounded-full" />
        <span>/</span>
        <div className="h-3.5 w-16 bg-slate-200 rounded-full" />
      </div>

      {/* HEADER SECTION SKELETON */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none mb-6">
        <div>
          <div className="h-3.5 w-44 bg-slate-250 rounded-full" />
          <div className="h-9 w-72 bg-slate-200 rounded-lg mt-2" />
        </div>

        {/* Action button skeleton */}
        <div className="h-10 w-36 bg-slate-200 rounded-xl shrink-0" />
      </div>

      {/* CATEGORY TABS AND SEARCH FILTERS BAR SKELETON */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        {/* Mock Tabs */}
        <div className="flex flex-wrap gap-2">
          {["All", "Computer Science", "Business", "Economics", "Mathematics"].map((tab, i) => (
            <div 
              key={i} 
              className={`h-7 w-20 rounded-lg bg-slate-200 ${i === 0 ? "opacity-100" : "opacity-60"}`}
            />
          ))}
        </div>

        {/* Mock Controls */}
        <div className="flex items-center gap-3 self-end lg:self-auto">
          {/* Mock Search */}
          <div className="h-9 w-48 bg-slate-100 rounded-full" />
          {/* Mock Filter & Sort */}
          <div className="h-9 w-9 bg-slate-100 rounded-xl" />
          <div className="h-9 w-9 bg-slate-100 rounded-xl" />
        </div>
      </div>

      {/* COURSE CARDS GRID SKELETON */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div 
            key={i}
            className="flex flex-col bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.01)] h-full"
          >
            {/* Card Image Placeholder */}
            <div className="aspect-video bg-slate-100 w-full relative">
              {/* Mock tags */}
              <div className="absolute bottom-3 left-4 h-5 w-24 bg-slate-200 rounded-full" />
              <div className="absolute bottom-3 right-4 h-5 w-16 bg-slate-200 rounded-full" />
            </div>

            {/* Card Content */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                {/* Code & Level */}
                <div className="flex items-center justify-between">
                  <div className="h-4.5 w-14 bg-slate-100 rounded-md" />
                  <div className="h-3 w-16 bg-slate-200 rounded-full" />
                </div>
                {/* Title */}
                <div className="h-5 w-5/6 bg-slate-200 rounded-md" />
                {/* Description */}
                <div className="space-y-1.5">
                  <div className="h-3 w-full bg-slate-100 rounded-full" />
                  <div className="h-3 w-4/5 bg-slate-100 rounded-full" />
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="h-6 w-6 rounded-full bg-slate-100" />
                  <div className="h-3 w-20 bg-slate-150 rounded-full" />
                </div>
                <div className="h-8 w-24 bg-slate-150 rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* PAGINATION FOOTER SKELETON */}
      <div className="flex items-center justify-center pt-8">
        <div className="flex gap-1.5">
          <div className="h-8 w-16 bg-slate-100 rounded-xl" />
          <div className="h-8 w-8 bg-slate-200 rounded-xl" />
          <div className="h-8 w-16 bg-slate-100 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

export default CourseLoading;
