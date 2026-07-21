type BadgeVariant =
  | "active"
  | "inactive"
  | "draft"
  | "published"
  | "scheduled"
  | "completed"
  | "pending"
  | "failed"
  | "passed"
  | "archived"
  | "present"
  | "absent"
  | "late"
  | "excused"
  | "online"
  | "enrolled"
  | "default";

interface StatusBadgeProps {
  variant: BadgeVariant;
  label?: string;
  size?: "sm" | "md";
}

const variantConfig: Record<
  BadgeVariant,
  { label: string; className: string; dot: string }
> = {
  active: {
    label: "Active",
    className: "bg-emerald-50 text-emerald-700 border-emerald-100",
    dot: "bg-emerald-500",
  },
  inactive: {
    label: "Inactive",
    className: "bg-slate-50 text-slate-500 border-slate-100",
    dot: "bg-slate-400",
  },
  draft: {
    label: "Draft",
    className: "bg-amber-50 text-amber-700 border-amber-100",
    dot: "bg-amber-400",
  },
  published: {
    label: "Published",
    className: "bg-emerald-50 text-emerald-700 border-emerald-100",
    dot: "bg-emerald-500",
  },
  scheduled: {
    label: "Scheduled",
    className: "bg-blue-50 text-blue-700 border-blue-100",
    dot: "bg-blue-500",
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-50 text-emerald-700 border-emerald-100",
    dot: "bg-emerald-500",
  },
  pending: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 border-amber-100",
    dot: "bg-amber-400",
  },
  failed: {
    label: "Failed",
    className: "bg-red-50 text-red-700 border-red-100",
    dot: "bg-red-500",
  },
  passed: {
    label: "Passed",
    className: "bg-emerald-50 text-emerald-700 border-emerald-100",
    dot: "bg-emerald-500",
  },
  archived: {
    label: "Archived",
    className: "bg-slate-50 text-slate-500 border-slate-100",
    dot: "bg-slate-400",
  },
  present: {
    label: "Present",
    className: "bg-emerald-50 text-emerald-700 border-emerald-100",
    dot: "bg-emerald-500",
  },
  absent: {
    label: "Absent",
    className: "bg-red-50 text-red-700 border-red-100",
    dot: "bg-red-500",
  },
  late: {
    label: "Late",
    className: "bg-amber-50 text-amber-700 border-amber-100",
    dot: "bg-amber-400",
  },
  excused: {
    label: "Excused",
    className: "bg-blue-50 text-blue-700 border-blue-100",
    dot: "bg-blue-400",
  },
  online: {
    label: "Online",
    className: "bg-purple-50 text-purple-700 border-purple-100",
    dot: "bg-purple-500",
  },
  enrolled: {
    label: "Enrolled",
    className: "bg-blue-50 text-brand border-blue-100",
    dot: "bg-brand",
  },
  default: {
    label: "Unknown",
    className: "bg-slate-50 text-slate-500 border-slate-100",
    dot: "bg-slate-400",
  },
};

/**
 * Unified status badge with consistent sizing, typography, and color system.
 * Replaces all inconsistent inline badge styles across the LMS.
 */
export default function StatusBadge({ variant, label, size = "sm" }: StatusBadgeProps) {
  const config = variantConfig[variant] ?? variantConfig.default;
  const displayLabel = label ?? config.label;

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
      } font-semibold rounded-full border ${config.className} select-none whitespace-nowrap`}
    >
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${config.dot}`} />
      {displayLabel}
    </span>
  );
}
