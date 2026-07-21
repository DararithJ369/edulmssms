import Link from "next/link";
import { Home, ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  /** Short label above the main title, e.g. "Faculty Staff Directory" */
  eyebrow?: string;
  /** Main page title */
  title: string;
  /** Optional subtitle / description */
  description?: string;
  /** Breadcrumb items. First item is always Home. */
  breadcrumbs?: BreadcrumbItem[];
  /** Right-side action slot */
  actions?: React.ReactNode;
}

/**
 * Unified page header component used on every list/dashboard page.
 * Provides consistent breadcrumb, eyebrow label, title, and action slot.
 */
export default function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumbs = [],
  actions,
}: PageHeaderProps) {
  return (
    <div className="space-y-4 select-none">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider"
      >
        <Link
          href="/"
          className="hover:text-foreground flex items-center gap-1 transition-colors"
        >
          <Home className="h-3 w-3" />
          <span>Home</span>
        </Link>
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="hover:text-foreground transition-colors"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="text-foreground">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      {/* Header row */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-0.5">
          {eyebrow && (
            <p className="text-xs font-semibold text-brand uppercase tracking-wider font-mono">
              {eyebrow}
            </p>
          )}
          <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight leading-tight">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>
    </div>
  );
}
