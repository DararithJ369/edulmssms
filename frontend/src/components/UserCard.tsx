import { serverFetch } from "@/lib/server-api";
import { Users, GraduationCap, UserCheck, UserCircle2, TrendingUp } from "lucide-react";

const typeConfig = {
  admin: {
    label: "Admins",
    icon: UserCheck,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
    eyebrow: "System Administrators",
  },
  teacher: {
    label: "Instructors",
    icon: GraduationCap,
    iconBg: "bg-blue-50",
    iconColor: "text-brand",
    eyebrow: "Faculty Members",
  },
  student: {
    label: "Students",
    icon: Users,
    iconBg: "bg-blue-50",
    iconColor: "text-brand",
    eyebrow: "Enrolled Students",
  },
  parent: {
    label: "Guardians",
    icon: UserCircle2,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
    eyebrow: "Parent Accounts",
  },
};

const UserCard = async ({
  type,
}: {
  type: "admin" | "teacher" | "student" | "parent";
}) => {
  const endpointMap: Record<typeof type, string> = {
    admin: "/users/admins",
    teacher: "/users/instructors",
    student: "/users/students",
    parent: "/users/parents",
  };

  const response = await serverFetch<{ meta?: { total?: number } }>(
    `${endpointMap[type]}?page=1&limit=1`
  ).catch(() => ({ meta: { total: 0 } }));
  const count = response?.meta?.total ?? 0;
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 flex-1 min-w-[140px] transition-all duration-200 hover:shadow-sm hover:border-border group">
      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div className={`h-9 w-9 rounded-xl ${config.iconBg} flex items-center justify-center`}>
          <Icon className={`h-4.5 w-4.5 ${config.iconColor}`} size={18} />
        </div>
        <span className="text-[10px] font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
          AY 2025/26
        </span>
      </div>

      {/* Count */}
      <p className="text-3xl font-black text-foreground tracking-tight">{count.toLocaleString()}</p>

      {/* Label row */}
      <div className="flex items-center justify-between mt-1.5">
        <p className="text-sm font-medium text-muted-foreground">{config.label}</p>
        <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
          <TrendingUp size={11} />
          <span>Active</span>
        </div>
      </div>
    </div>
  );
};

export default UserCard;
