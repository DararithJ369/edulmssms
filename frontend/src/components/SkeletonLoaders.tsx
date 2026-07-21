/**
 * Centralized skeleton loader library.
 * Import specific skeletons as needed across loading.tsx and page components.
 */

export function SkeletonBox({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-xl ${className}`} />;
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 flex-1 min-w-[130px] space-y-3">
      <div className="flex justify-between items-center">
        <div className="skeleton h-5 w-16 rounded-full" />
        <div className="skeleton h-8 w-8 rounded-xl" />
      </div>
      <div className="skeleton h-8 w-20 rounded-lg" />
      <div className="skeleton h-4 w-24 rounded-md" />
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="space-y-3">
      <div className="skeleton h-3 w-32 rounded-md" />
      <div className="skeleton h-8 w-64 rounded-lg" />
      <div className="skeleton h-4 w-48 rounded-md" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between p-4 border border-border/40 rounded-xl"
        >
          <div className="flex items-center gap-3">
            <div className="skeleton h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <div className="skeleton h-4 w-32 rounded-md" />
              <div className="skeleton h-3 w-48 rounded-md" />
            </div>
          </div>
          <div className="skeleton h-8 w-8 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

export function CourseCardSkeleton() {
  return (
    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
      <div className="skeleton aspect-video w-full" />
      <div className="p-5 space-y-3">
        <div className="skeleton h-3 w-20 rounded-md" />
        <div className="skeleton h-5 w-3/4 rounded-lg" />
        <div className="space-y-1.5">
          <div className="skeleton h-3 w-full rounded-md" />
          <div className="skeleton h-3 w-5/6 rounded-md" />
        </div>
        <div className="flex items-center justify-between pt-3">
          <div className="skeleton h-7 w-24 rounded-xl" />
          <div className="skeleton h-7 w-20 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function CardGridSkeleton({ cols = 3, cards = 6 }: { cols?: number; cards?: number }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${cols} gap-6`}>
      {Array.from({ length: cards }).map((_, i) => (
        <CourseCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function DashboardStatsSkeleton() {
  return (
    <div className="flex gap-4 flex-wrap">
      {Array.from({ length: 4 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}
