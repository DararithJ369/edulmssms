import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import TableRowActions from "@/components/TableRowActions";
import { serverFetch } from "@/lib/server-api";
import { getImageUrl } from "@/lib/image-url";
import { ITEM_PER_PAGE } from "@/lib/settings";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { 
  Globe, 
  GraduationCap, 
  Layers, 
  BookOpen, 
  Users, 
  Award, 
  ChevronRight, 
  Settings2,
  ListFilter,
  ArrowUpDown,
  Plus
} from "lucide-react";
import { normalizeRole } from "@/lib/auth";

type CourseItem = {
  id: number;
  course_name: string;
  course_code: string;
  description?: string | null;
  category?: string | null;
  duration?: number | null;
  price?: number | null;
  max_students?: number | null;
  difficulty?: string | null;
  instructor_name?: string | null;
  is_published?: boolean | null;
  thumbnail?: string | null;
  student_enrolled?: number | null;
};

const CourseListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const cookieStore = cookies();
  const role = normalizeRole(cookieStore.get("user_role")?.value);

  const { page, search, category } = searchParams;
  const p = page ? parseInt(page) : 1;

  // Build query path
  const searchArg = search ? `&search=${encodeURIComponent(search)}` : "";
  const catArg = category ? `&category=${encodeURIComponent(category)}` : "";
  const queryPath = `/courses?page=${p}&limit=${ITEM_PER_PAGE}${searchArg}${catArg}`;

  // Query backend /courses
  const response = await serverFetch<{
    data: CourseItem[];
    meta: { total: number };
  }>(queryPath).catch(() => ({
    data: [],
    meta: { total: 0 },
  }));

  const data = response.data || [];
  const count = response.meta?.total || 0;

  // Active Category Options for tab-like filtering
  const categories = ["All", "Computer Science", "Business", "Economics", "Mathematics"];

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen relative font-sans text-left">
      {/* MOODLE BREADCRUMB */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wider font-bold select-none">
        <Link href="/" className="hover:text-foreground flex items-center gap-1">
          <Globe className="h-3 w-3" />
          Home
        </Link>
        <span>/</span>
        <span className="text-foreground">My Courses</span>
      </div>

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div>
          <span className="text-xs font-extrabold text-[#0038A8] uppercase tracking-wider font-mono">
            Academic Classroom Catalog
          </span>
          <h1 className="text-xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-tight mt-0.5">
            {category ? `${category} Courses` : "My Course Overview"}
          </h1>
        </div>

        {/* Administration Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {(role === "admin" || role === "teacher") && (
            <Link href={`/list/courses/create${category ? `?category=${encodeURIComponent(category)}` : ''}`}>
              <button className="px-4 py-2 bg-[#8b5cf6] text-white hover:bg-[#7c3aed] font-extrabold text-xs rounded-xl transition-all shadow-md shadow-violet-500/10 flex items-center gap-1.5 active:scale-[0.98]">
                <Plus className="h-4 w-4" />
                <span>Create New Activity</span>
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* FILTER TABS & SEARCH UTILITY */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-3 select-none">
        {/* Moodle Style Categories Filter tabs */}
        <div className="flex items-center gap-4 flex-wrap text-xs font-extrabold text-muted-foreground">
          {categories.map((cat) => {
            const isSelected = (!category && cat === "All") || (category === cat);
            const path = cat === "All" ? "/list/courses" : `/list/courses?category=${encodeURIComponent(cat)}`;
            return (
              <Link
                key={cat}
                href={path}
                className={`pb-1.5 hover:text-foreground transition-colors ${
                  isSelected ? "border-b-2 border-[#0038A8] text-foreground" : ""
                }`}
              >
                {cat}
              </Link>
            );
          })}
        </div>

        {/* Search Input bar */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <TableSearch />
          <button className="w-8 h-8 flex items-center justify-center rounded-xl bg-background border border-border/80 hover:bg-accent text-muted-foreground/80 transition-colors" title="Filters">
            <ListFilter className="h-4 w-4" />
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-xl bg-background border border-border/80 hover:bg-accent text-muted-foreground/80 transition-colors" title="Sort Options">
            <ArrowUpDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* COURSE CARDS GRID */}
      {data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((item) => (
            <div 
              key={item.id} 
              className="group bg-card border border-border/60 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.01)] hover:border-border hover:shadow-md transition-all flex flex-col h-full"
            >
              {/* Card Thumbnail Image Banner */}
              <div className="relative aspect-[16/9] w-full bg-muted border-b border-border/50 shrink-0">
                <img
                  src={getImageUrl(item.thumbnail) || "https://images.unsplash.com/photo-1610962381137-50ef93055125?auto=format&fit=crop&q=80&w=800"}
                  alt={item.course_name}
                  className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                
                {/* Specialization Category Tag */}
                <span className="absolute bottom-3 left-3 px-2.5 py-0.5 bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur shadow-sm rounded-lg text-[9px] font-black uppercase text-[#0038A8] tracking-wider">
                  {item.category || "General"}
                </span>

                {/* Enrollment Counter badge */}
                <span className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/60 backdrop-blur rounded-lg text-[8px] font-extrabold text-white flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{item.student_enrolled || 18} Enrolled</span>
                </span>
              </div>

              {/* Card Core Content */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between select-none">
                    <span className="text-[10px] font-bold text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded-md">
                      {item.course_code}
                    </span>
                    <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 capitalize">
                      {item.difficulty || "Beginner"}
                    </span>
                  </div>

                  <Link 
                    href={`/list/courses/${item.id}`}
                    className="block text-base font-extrabold text-foreground tracking-tight leading-snug hover:text-[#0038A8] dark:hover:text-[#4f88ef] transition-colors"
                  >
                    {item.course_name}
                  </Link>

                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 font-medium">
                    {item.description || "Comprehensive academic syllabus and learning resource outline."}
                  </p>
                </div>

                {/* Card Footer Details */}
                <div className="border-t border-border/40 pt-4 flex items-center justify-between select-none shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-[#0038A8] dark:text-[#4f88ef] flex items-center justify-center">
                      <GraduationCap className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-[8px] font-bold text-muted-foreground uppercase leading-none">Instructor</span>
                      <span className="text-[10px] font-extrabold text-foreground truncate max-w-[120px] mt-0.5">
                        {item.instructor_name || "Faculty Staff"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Link href={`/list/courses/${item.id}`}>
                      <button className="px-3 py-1.5 bg-[#0038A8]/10 hover:bg-[#0038A8]/20 border border-[#0038A8]/20 text-[#0038A8] font-bold text-[9px] rounded-lg shadow-sm transition-colors flex items-center gap-1 active:scale-[0.98]">
                        <span>Enter Course</span>
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </Link>
                    <TableRowActions
                      id={item.id}
                      table="course"
                      viewUrl={`/list/courses/${item.id}`}
                      role={role}
                    />
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border/60 rounded-3xl p-12 text-center text-muted-foreground select-none">
          <BookOpen className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-bold">No academic courses found matching criteria.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Please try modifying your keywords or selected catalog filter tabs.</p>
        </div>
      )}

      {/* PAGINATION PANEL */}
      <div className="bg-card border border-border/60 rounded-3xl p-4 shadow-sm flex justify-center select-none shrink-0">
        <Pagination page={p} count={count} />
      </div>
    </div>
  );
};

export default CourseListPage;
