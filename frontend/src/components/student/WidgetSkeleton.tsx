import React from "react";

export const HeroSkeleton = () => (
  <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-3xl p-6 md:p-8 animate-pulse border border-slate-200/40">
    <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-full" />
    <div className="h-8 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-lg mt-4" />
    <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded-full mt-2" />
    
    <div className="mt-6 space-y-2">
      <div className="flex justify-between">
        <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-800 rounded-full" />
        <div className="h-3.5 w-10 bg-slate-200 dark:bg-slate-800 rounded-full" />
      </div>
      <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full" />
    </div>

    <div className="h-9 w-36 bg-slate-200 dark:bg-slate-800 rounded-xl mt-6" />
  </div>
);

export const CourseCardGridSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {[1, 2].map((i) => (
      <div key={i} className="p-4 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl animate-pulse space-y-3">
        <div className="h-3.5 w-16 bg-slate-100 dark:bg-slate-850 rounded-full" />
        <div className="h-5 w-5/6 bg-slate-100 dark:bg-slate-850 rounded-md" />
        <div className="h-3.5 w-full bg-slate-100 dark:bg-slate-850 rounded-full" />
        
        <div className="pt-2 space-y-2">
          <div className="flex justify-between">
            <div className="h-3 w-12 bg-slate-100 dark:bg-slate-850 rounded-full" />
            <div className="h-3 w-8 bg-slate-100 dark:bg-slate-850 rounded-full" />
          </div>
          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-850 rounded-full" />
        </div>
      </div>
    ))}
  </div>
);

export const RecommendedGridSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {[1, 2].map((i) => (
      <div key={i} className="flex gap-4 p-4 border border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl animate-pulse">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-850 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2 min-w-0">
          <div className="h-4 w-3/4 bg-slate-100 dark:bg-slate-850 rounded-md" />
          <div className="h-3 w-full bg-slate-100 dark:bg-slate-850 rounded-full" />
          <div className="h-3 w-5/6 bg-slate-100 dark:bg-slate-850 rounded-full" />
          
          <div className="flex justify-between pt-1">
            <div className="h-3 w-20 bg-slate-100 dark:bg-slate-850 rounded-full" />
            <div className="h-3 w-16 bg-slate-100 dark:bg-slate-850 rounded-full" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const RecentlyViewedSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex flex-col p-3 border border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-xl animate-pulse space-y-2">
        <div className="h-3 w-24 bg-slate-100 dark:bg-slate-850 rounded-full" />
        <div className="h-4 w-5/6 bg-slate-100 dark:bg-slate-850 rounded-md" />
        <div className="h-3 w-16 bg-slate-100 dark:bg-slate-850 rounded-full self-end mt-1" />
      </div>
    ))}
  </div>
);

export const CalendarSkeleton = () => (
  <div className="w-full bg-white p-6 rounded-3xl border border-slate-100 animate-pulse space-y-4 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
    <div className="flex justify-between items-center">
      <div className="h-6 w-32 bg-slate-100 rounded-md" />
      <div className="flex gap-2">
        <div className="h-8 w-16 bg-slate-100 rounded-xl" />
        <div className="h-8 w-16 bg-slate-100 rounded-xl" />
      </div>
    </div>
    <div className="grid grid-cols-7 gap-2 pt-4 border-t border-slate-100">
      {[...Array(7)].map((_, i) => (
        <div key={i} className="h-4 bg-slate-150 rounded-md mx-2" />
      ))}
    </div>
    <div className="grid grid-cols-7 gap-2 pt-2">
      {[...Array(28)].map((_, i) => (
        <div key={i} className="h-10 bg-slate-50/65 rounded-xl border border-slate-100/30" />
      ))}
    </div>
  </div>
);

export const UserCardSkeleton = () => (
  <div className="rounded-2xl border border-slate-100 bg-white p-4 flex-1 min-w-[130px] animate-pulse space-y-3 shadow-[0_8px_30px_rgb(0,0,0,0.01)]">
    <div className="flex justify-between items-center">
      <div className="h-4 w-12 bg-slate-100 rounded-full" />
      <div className="h-4 w-4 bg-slate-100 rounded-full" />
    </div>
    <div className="h-8 w-10 bg-slate-100 rounded-md my-4" />
    <div className="h-4 w-16 bg-slate-100 rounded-full" />
  </div>
);

export const ChartSkeleton = ({ height = "h-[450px]" }: { height?: string }) => (
  <div className={`w-full ${height} bg-white p-6 rounded-3xl border border-slate-100 animate-pulse flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.015)]`}>
    <div className="flex justify-between items-center">
      <div className="h-5 w-24 bg-slate-100 rounded-md" />
      <div className="h-5 w-5 bg-slate-100 rounded-full" />
    </div>
    <div className="flex-1 bg-slate-50/50 rounded-2xl my-4 border border-dashed border-slate-100/50 flex items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-slate-200 border-t-slate-400 animate-spin" />
    </div>
    <div className="flex justify-around pt-2">
      <div className="h-3.5 w-16 bg-slate-100 rounded-full" />
      <div className="h-3.5 w-16 bg-slate-100 rounded-full" />
    </div>
  </div>
);
