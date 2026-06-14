"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { ListFilter, ArrowUpDown, Check } from "lucide-react";

type StudentFilterSortProps = {
  classes: { id: number; name: string }[];
  grades: { id: number; level: number }[];
};

export default function StudentFilterSort({ classes, grades }: StudentFilterSortProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (filterRef.current && !filterRef.current.contains(target)) {
        setIsFilterOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(target)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(window.location.search);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page"); // Reset page back to 1 on filter modification
    router.push(`${window.location.pathname}?${params}`);
  };

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(window.location.search);
    if (value) {
      const [sortBy, sortOrder] = value.split("-");
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
    } else {
      params.delete("sortBy");
      params.delete("sortOrder");
    }
    router.push(`${window.location.pathname}?${params}`);
    setIsSortOpen(false);
  };

  const activeClass = searchParams.get("classId") || "";
  const activeGrade = searchParams.get("gradeId") || "";
  const activeSort = searchParams.get("sortBy") || "";
  const activeOrder = searchParams.get("sortOrder") || "asc";
  const currentSortValue = activeSort ? `${activeSort}-${activeOrder}` : "";

  const sortOptions = [
    { label: "Default Order", value: "" },
    { label: "Name (A-Z)", value: "name-asc" },
    { label: "Name (Z-A)", value: "name-desc" },
    { label: "Year Level (Lowest)", value: "grade-asc" },
    { label: "Year Level (Highest)", value: "grade-desc" },
  ];

  const buttonStyles =
    "w-8 h-8 flex items-center justify-center rounded-xl bg-background border border-border/80 hover:bg-accent text-muted-foreground/80 transition-colors relative cursor-pointer";

  const hasActiveFilters = activeClass || activeGrade;

  return (
    <div className="flex items-center gap-2 select-none">
      {/* FILTER POPOVER */}
      <div className="relative" ref={filterRef}>
        <button
          className={`${buttonStyles} ${hasActiveFilters ? "border-[#0038A8]/40 bg-[#0038A8]/5 text-[#0038A8]" : ""}`}
          onClick={() => {
            setIsFilterOpen(!isFilterOpen);
            setIsSortOpen(false);
          }}
          title="Filters"
        >
          <ListFilter className="h-4 w-4" />
          {hasActiveFilters && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#0038A8] rounded-full" />
          )}
        </button>

        {isFilterOpen && (
          <div className="absolute right-0 top-10 mt-1 w-64 bg-white dark:bg-muted border border-border/80 rounded-xl shadow-lg z-50 p-3 animate-in fade-in slide-in-from-top-1 duration-200 space-y-3">
            {/* Class Selection Section */}
            <div>
              <div className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider px-2 py-0.5 mb-1 border-b border-border/40 select-none pb-1">
                Class Cohort
              </div>
              <div className="max-h-36 overflow-y-auto space-y-0.5">
                <button
                  onClick={() => handleFilterChange("classId", "")}
                  className={`w-full text-left px-2 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-between ${
                    !activeClass
                      ? "bg-[#0038A8]/5 text-[#0038A8] font-bold"
                      : "hover:bg-accent text-foreground font-medium"
                  }`}
                >
                  <span>All Classes</span>
                  {!activeClass && <Check className="h-3.5 w-3.5 text-[#0038A8]" />}
                </button>
                {classes.map((c) => {
                  const isSelected = activeClass === c.id.toString();
                  return (
                    <button
                      key={c.id}
                      onClick={() => handleFilterChange("classId", c.id.toString())}
                      className={`w-full text-left px-2 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-between ${
                        isSelected
                          ? "bg-[#0038A8]/5 text-[#0038A8] font-bold"
                          : "hover:bg-accent text-foreground font-medium"
                      }`}
                    >
                      <span>Class {c.name}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-[#0038A8]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Year Level Selection Section */}
            <div>
              <div className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider px-2 py-0.5 mb-1 border-b border-border/40 select-none pb-1">
                Year Level
              </div>
              <div className="max-h-36 overflow-y-auto space-y-0.5">
                <button
                  onClick={() => handleFilterChange("gradeId", "")}
                  className={`w-full text-left px-2 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-between ${
                    !activeGrade
                      ? "bg-[#0038A8]/5 text-[#0038A8] font-bold"
                      : "hover:bg-accent text-foreground font-medium"
                  }`}
                >
                  <span>All Year Levels</span>
                  {!activeGrade && <Check className="h-3.5 w-3.5 text-[#0038A8]" />}
                </button>
                {grades.map((g) => {
                  const isSelected = activeGrade === g.id.toString();
                  return (
                    <button
                      key={g.id}
                      onClick={() => handleFilterChange("gradeId", g.id.toString())}
                      className={`w-full text-left px-2 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-between ${
                        isSelected
                          ? "bg-[#0038A8]/5 text-[#0038A8] font-bold"
                          : "hover:bg-accent text-foreground font-medium"
                      }`}
                    >
                      <span>Year Level {g.level}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-[#0038A8]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SORT POPOVER */}
      <div className="relative" ref={sortRef}>
        <button
          className={`${buttonStyles} ${currentSortValue ? "border-[#0038A8]/40 bg-[#0038A8]/5 text-[#0038A8]" : ""}`}
          onClick={() => {
            setIsSortOpen(!isSortOpen);
            setIsFilterOpen(false);
          }}
          title="Sort Options"
        >
          <ArrowUpDown className="h-4 w-4" />
          {currentSortValue && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#0038A8] rounded-full" />
          )}
        </button>

        {isSortOpen && (
          <div className="absolute right-0 top-10 mt-1 w-52 bg-white dark:bg-muted border border-border/80 rounded-xl shadow-lg z-50 p-2 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider px-2 py-1 mb-1 border-b border-border/40 select-none">
              Sort Options
            </div>
            <div className="space-y-0.5">
              {sortOptions.map((opt) => {
                const isSelected = currentSortValue === opt.value;
                return (
                  <button
                    key={opt.label}
                    onClick={() => handleSortChange(opt.value)}
                    className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-between ${
                      isSelected
                        ? "bg-[#0038A8]/5 text-[#0038A8] font-bold"
                        : "hover:bg-accent text-foreground font-medium"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-[#0038A8]" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
