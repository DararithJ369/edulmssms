"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ArrowRight,
  BookOpen,
  GraduationCap,
  ClipboardList,
  Users,
  School2,
  Megaphone,
  LayoutDashboard,
  Settings2,
  Layers3,
  BarChart2,
  CalendarCheck,
  BrainCircuit,
  BookMarked,
  X,
} from "lucide-react";
import { cn } from "@/lib/ui";
import { navigationConfig, hasPermission } from "@/lib/navigation";
import { api } from "@/lib/api";

type SearchResult = {
  id: string;
  label: string;
  sublabel?: string;
  href: string;
  icon: React.ElementType;
  category: "Navigation" | "Students" | "Courses" | "Teachers" | "Quick Action";
};

const categoryOrder = ["Navigation", "Students", "Courses", "Teachers", "Quick Action"];

const categoryColors: Record<string, string> = {
  Navigation:    "text-indigo-600 bg-indigo-50 border-indigo-100",
  Students:      "text-sky-600 bg-sky-50 border-sky-100",
  Courses:       "text-emerald-600 bg-emerald-50 border-emerald-100",
  Teachers:      "text-violet-600 bg-violet-50 border-violet-100",
  "Quick Action":"text-amber-600 bg-amber-50 border-amber-100",
};

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export type CommandPaletteProps = {
  isOpen: boolean;
  onClose: () => void;
  role: string;
};

export function CommandPalette({ isOpen, onClose, role }: CommandPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [apiResults, setApiResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const debouncedQuery = useDebounce(query, 250);

  // Build static navigation results from config
  const navResults: SearchResult[] = navigationConfig.flatMap((section) =>
    section.items
      .filter((item) => {
        if (item.comingSoon || !item.href) return false;
        if (section.roles && !section.roles.includes(role)) return false;
        if (item.roles && !item.roles.includes(role)) return false;
        return hasPermission(role, item.permission);
      })
      .map((item) => ({
        id: `nav-${item.href}`,
        label: item.label,
        sublabel: section.title,
        href: item.href!,
        icon: item.icon,
        category: "Navigation" as const,
      }))
  );

  // Fetch API results when query is long enough
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setApiResults([]);
      return;
    }
    setIsSearching(true);
    const q = encodeURIComponent(debouncedQuery);
    const isAdmin = role === "admin";
    const isTeacher = role === "teacher" || role === "admin";

    Promise.allSettled([
      isTeacher ? api.get(`/users?search=${q}&role=student&limit=5`) : Promise.reject(),
      api.get(`/courses?search=${q}&limit=5`),
      isAdmin ? api.get(`/users?search=${q}&role=instructor&limit=4`) : Promise.reject(),
    ])
      .then(([studRes, courseRes, teachRes]) => {
        const results: SearchResult[] = [];

        if (studRes.status === "fulfilled") {
          const students = Array.isArray(studRes.value.data)
            ? studRes.value.data
            : studRes.value.data?.data ?? [];
          students.forEach((s: any) => {
            results.push({
              id: `student-${s.id}`,
              label: s.full_name || s.username,
              sublabel: s.email || s.username,
              href: `/list/students/${s.id}`,
              icon: GraduationCap,
              category: "Students",
            });
          });
        }

        if (courseRes.status === "fulfilled") {
          const courses = Array.isArray(courseRes.value.data)
            ? courseRes.value.data
            : courseRes.value.data?.data ?? [];
          courses.forEach((c: any) => {
            results.push({
              id: `course-${c.id}`,
              label: c.course_name || c.name,
              sublabel: c.course_code,
              href: `/list/courses/${c.id}`,
              icon: BookOpen,
              category: "Courses",
            });
          });
        }

        if (teachRes.status === "fulfilled") {
          const teachers = Array.isArray(teachRes.value.data)
            ? teachRes.value.data
            : teachRes.value.data?.data ?? [];
          teachers.forEach((t: any) => {
            results.push({
              id: `teacher-${t.id}`,
              label: t.full_name || t.username,
              sublabel: t.email || "Lecturer",
              href: `/list/teachers/${t.id}`,
              icon: Users,
              category: "Teachers",
            });
          });
        }

        setApiResults(results);
      })
      .finally(() => setIsSearching(false));
  }, [debouncedQuery, role]);

  // Combine and filter results
  const allResults: SearchResult[] = (() => {
    if (!query.trim()) {
      // Default: show all nav items
      return navResults.slice(0, 8);
    }
    const q = query.toLowerCase();
    const filtered = navResults.filter(
      (r) =>
        r.label.toLowerCase().includes(q) ||
        r.sublabel?.toLowerCase().includes(q)
    );
    return [...filtered, ...apiResults];
  })();

  // Group by category
  const grouped = categoryOrder.reduce((acc, cat) => {
    const items = allResults.filter((r) => r.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const flatResults = Object.values(grouped).flat();

  // Navigation
  const navigate = useCallback(
    (result: SearchResult) => {
      router.push(result.href);
      onClose();
      setQuery("");
    },
    [router, onClose]
  );

  // Keyboard handling
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, flatResults.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (flatResults[activeIndex]) navigate(flatResults[activeIndex]);
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, flatResults, activeIndex, navigate, onClose]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Palette */}
      <div className="fixed left-1/2 top-[18%] z-[9999] w-full max-w-[580px] -translate-x-1/2 animate-in fade-in slide-in-from-top-4 duration-200">
        <div className="mx-4 rounded-2xl border border-border/80 bg-card shadow-[0_24px_80px_rgba(0,0,0,0.18)] overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/60">
            <Search className="h-4 w-4 text-muted-foreground/60 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
              placeholder="Search pages, students, courses…"
              className="flex-1 bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground/50 outline-none"
            />
            <div className="flex items-center gap-1.5">
              {isSearching && (
                <div className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/30 border-t-foreground animate-spin" />
              )}
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-accent/50 text-muted-foreground/60 hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[400px] overflow-y-auto py-2 no-scrollbar">
            {flatResults.length === 0 && query.trim() && !isSearching ? (
              <div className="py-12 text-center text-sm text-muted-foreground/60">
                No results for <span className="font-semibold text-foreground">&quot;{query}&quot;</span>
              </div>
            ) : flatResults.length === 0 && !query.trim() ? (
              <div className="px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 mb-2">
                  Quick Navigate
                </p>
              </div>
            ) : null}

            {Object.entries(grouped).map(([category, items]) => {
              const catColorClass = categoryColors[category] || "";
              return (
                <div key={category}>
                  {/* Category header */}
                  <div className="flex items-center gap-2 px-4 py-1.5">
                    <span
                      className={cn(
                        "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border",
                        catColorClass
                      )}
                    >
                      {category}
                    </span>
                  </div>

                  {/* Items */}
                  {items.map((result) => {
                    const globalIdx = flatResults.indexOf(result);
                    const isSelected = globalIdx === activeIndex;
                    const ResultIcon = result.icon;
                    return (
                      <button
                        key={result.id}
                        data-index={globalIdx}
                        onMouseEnter={() => setActiveIndex(globalIdx)}
                        onClick={() => navigate(result)}
                        className={cn(
                          "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors group",
                          isSelected ? "bg-accent/60" : "hover:bg-accent/30"
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-colors",
                            isSelected
                              ? "bg-foreground/5 border-foreground/15"
                              : "bg-muted/40 border-border/40"
                          )}
                        >
                          <ResultIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-foreground truncate">
                            {result.label}
                          </p>
                          {result.sublabel && (
                            <p className="text-[11px] text-muted-foreground truncate">
                              {result.sublabel}
                            </p>
                          )}
                        </div>
                        <ArrowRight
                          className={cn(
                            "h-3.5 w-3.5 shrink-0 transition-opacity",
                            isSelected ? "opacity-70 text-foreground" : "opacity-0"
                          )}
                        />
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-t border-border/60 bg-muted/20">
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60 font-medium">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-muted border border-border/80 text-[9px] font-mono">↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-muted border border-border/80 text-[9px] font-mono">↵</kbd>
                Open
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-muted border border-border/80 text-[9px] font-mono">Esc</kbd>
                Close
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground/40 font-mono">⌘K</span>
          </div>
        </div>
      </div>
    </>
  );
}
