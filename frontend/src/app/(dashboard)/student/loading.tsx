export default function StudentDashboardLoading() {
  return (
    <div className="flex-1 min-h-screen bg-[#F4F6FA] font-sans text-left">
      <div className="p-6 space-y-6">
        {/* Header: Title + Streak */}
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-3 w-28 bg-slate-200/70 rounded-full animate-pulse" />
            <div className="h-7 w-36 bg-slate-200/70 rounded-lg animate-pulse" />
          </div>
          <div className="h-12 w-40 bg-white border border-slate-100 rounded-2xl animate-pulse" />
        </div>

        {/* Stats Row — 4 cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-[72px] bg-white border border-slate-100 rounded-2xl animate-pulse flex flex-col items-center justify-center gap-2 p-4">
              <div className="h-6 w-12 bg-slate-100 rounded-md" />
              <div className="h-3 w-20 bg-slate-100 rounded-full" />
            </div>
          ))}
        </div>

        {/* Main 3-column grid (no hero — it loads fast or is empty) */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          {/* Left 2 cols */}
          <div className="xl:col-span-2 space-y-6">
            {/* Calendar skeleton */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 animate-pulse space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-16 bg-slate-100 rounded-xl" />
                  <div className="h-8 w-20 bg-slate-100 rounded-xl" />
                  <div className="h-5 w-28 bg-slate-100 rounded-md" />
                </div>
                <div className="flex gap-1">
                  <div className="h-8 w-24 bg-slate-100 rounded-lg" />
                  <div className="h-8 w-14 bg-slate-100 rounded-lg" />
                </div>
              </div>
              {/* Day headers */}
              <div className="grid grid-cols-5 gap-2 pt-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className="h-3 w-8 bg-slate-100 rounded-full" />
                    <div className="h-7 w-7 bg-slate-100 rounded-full" />
                  </div>
                ))}
              </div>
              {/* Time rows */}
              <div className="space-y-1">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <div className="h-3 w-10 bg-slate-50 rounded-full shrink-0" />
                    <div className="h-10 flex-1 bg-slate-50/60 rounded-lg border border-slate-100/40" />
                  </div>
                ))}
              </div>
            </div>

            {/* Continue Learning skeleton */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 animate-pulse space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-5 w-36 bg-slate-100 rounded-md" />
                <div className="h-4 w-20 bg-slate-100 rounded-full" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="p-4 border border-slate-100 rounded-xl space-y-3">
                    <div className="h-3 w-20 bg-slate-100 rounded-full" />
                    <div className="h-4 w-3/4 bg-slate-100 rounded-md" />
                    <div className="h-2 w-full bg-slate-100 rounded-full mt-2" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right col */}
          <div className="space-y-6">
            {/* Mini calendar */}
            <div className="bg-white border border-slate-100 rounded-2xl p-4 animate-pulse space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-5 w-24 bg-slate-100 rounded-md" />
                <div className="flex gap-1">
                  <div className="h-5 w-5 bg-slate-100 rounded" />
                  <div className="h-5 w-5 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="h-3 bg-slate-100 rounded-full" />
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {[...Array(35)].map((_, i) => (
                  <div key={i} className="h-7 bg-slate-50 rounded-md" />
                ))}
              </div>
            </div>

            {/* Announcements */}
            <div className="bg-white border border-slate-100 rounded-2xl p-4 animate-pulse space-y-3">
              <div className="h-5 w-28 bg-slate-100 rounded-md" />
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2 py-3 border-t border-slate-50">
                  <div className="h-4 w-3/4 bg-slate-100 rounded-md" />
                  <div className="h-3 w-full bg-slate-50 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
