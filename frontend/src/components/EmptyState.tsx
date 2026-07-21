import { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

/**
 * Unified empty state component. Used on all list pages when no data is available.
 */
export default function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  size = "md",
}: EmptyStateProps) {
  const sizeMap = {
    sm: { wrapper: "py-8", icon: "h-8 w-8", title: "text-sm", desc: "text-xs" },
    md: { wrapper: "py-12", icon: "h-10 w-10", title: "text-base", desc: "text-sm" },
    lg: { wrapper: "py-16", icon: "h-12 w-12", title: "text-lg", desc: "text-sm" },
  };

  const s = sizeMap[size];

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${s.wrapper} px-6 bg-card border border-border/60 rounded-2xl`}
    >
      <div className="h-14 w-14 rounded-2xl bg-slate-50 border border-border/60 flex items-center justify-center mb-4">
        <Icon className={`${s.icon} text-muted-foreground/40`} />
      </div>
      <h3 className={`${s.title} font-semibold text-foreground`}>{title}</h3>
      {description && (
        <p className={`${s.desc} text-muted-foreground mt-1 max-w-[320px] leading-relaxed`}>
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
