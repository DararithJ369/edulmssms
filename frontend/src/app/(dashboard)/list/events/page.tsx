import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import { serverFetch } from "@/lib/server-api";
import Link from "next/link";
import { cookies } from "next/headers";
import {
  Globe,
  Calendar,
  ListFilter,
  ArrowUpDown,
  CalendarDays,
} from "lucide-react";

const normalizeRole = (role: string | null | undefined) => {
  if (role === "instructor") return "teacher";
  return role ?? "";
};

type EventItem = {
  id: number;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  class_id?: number | null;
  class_name?: string | null;
};

type EventsResponse = {
  data: EventItem[];
  meta?: { total?: number; page?: number; limit?: number };
};

const EventListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const cookieStore = cookies();
  const role = normalizeRole(cookieStore.get("user_role")?.value);

  const { page, search } = searchParams;
  const p = page ? parseInt(page) : 1;
  const limit = 10;

  const params = new URLSearchParams({
    page: String(p),
    limit: String(limit),
    ...(search ? { search } : {}),
  });

  const response = await serverFetch<EventsResponse>(
    `/events?${params.toString()}`
  ).catch(() => null);

  const data: EventItem[] = response?.data ?? [];
  const count = response?.meta?.total ?? 0;

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen relative font-sans text-left">
      {/* BREADCRUMB */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wider font-bold select-none">
        <Link href="/" className="hover:text-foreground flex items-center gap-1">
          <Globe className="h-3 w-3" />
          Home
        </Link>
        <span>/</span>
        <span className="text-foreground">Events Calendar</span>
      </div>

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div>
          <span className="text-xs font-extrabold text-[#0038A8] uppercase tracking-wider font-mono">
            Social &amp; Academic Calendar
          </span>
          <h1 className="text-xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-tight mt-0.5">
            School &amp; Campus Events
          </h1>
        </div>
      </div>

      {/* FILTER & SEARCH UTILITY */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-3 select-none">
        <div className="flex items-center gap-2 text-xs font-extrabold text-muted-foreground">
          <span className="px-2.5 py-1 bg-white dark:bg-muted border border-border/80 text-foreground rounded-lg shadow-sm">
            {count} Total Events
          </span>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <TableSearch />
          <button
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-background border border-border/80 hover:bg-accent text-muted-foreground/80 transition-colors"
            title="Filters"
          >
            <ListFilter className="h-4 w-4" />
          </button>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-background border border-border/80 hover:bg-accent text-muted-foreground/80 transition-colors"
            title="Sort Options"
          >
            <ArrowUpDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* EVENTS LIST */}
      {data.length > 0 ? (
        <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.01)] space-y-3">
          {data.map((item) => {
            const start = item.start_time ? new Date(item.start_time) : null;
            const end = item.end_time ? new Date(item.end_time) : null;

            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 bg-[#fbf5fc]/40 dark:bg-muted/5 border border-border/40 hover:border-violet-300/50 dark:hover:border-violet-950/30 rounded-2xl transition-all shadow-sm group"
              >
                <div className="flex items-center gap-4 max-w-[70%]">
                  {/* Purple Event Icon */}
                  <div className="h-9 w-9 rounded-xl bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0 border border-violet-200/50">
                    <CalendarDays className="h-4 w-4" />
                  </div>

                  <div className="flex flex-col text-left gap-0.5">
                    <span className="text-sm font-extrabold text-foreground tracking-tight leading-snug group-hover:text-violet-700 dark:group-hover:text-violet-400 transition-colors">
                      {item.title}
                    </span>

                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap font-medium">
                      <span className="text-[#0038A8] dark:text-[#4f88ef] font-semibold font-sans">
                        {item.class_name ? `Class: ${item.class_name}` : "All Classes"}
                      </span>
                      {start && (
                        <>
                          <span className="text-muted-foreground/40">•</span>
                          <span className="text-violet-600 font-sans">
                            {start.toLocaleTimeString("en-GB", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {end &&
                              ` - ${end.toLocaleTimeString("en-GB", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}`}
                          </span>
                          <span className="text-muted-foreground/40">•</span>
                          <span className="text-gray-500 font-sans">
                            {new Intl.DateTimeFormat("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }).format(start)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-card border border-border/60 rounded-3xl p-12 text-center text-muted-foreground select-none">
          <CalendarDays className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-bold">No upcoming events registered.</p>
        </div>
      )}

      {/* PAGINATION PANEL */}
      <div className="bg-card border border-border/60 rounded-3xl p-4 shadow-sm flex justify-center select-none shrink-0">
        <Pagination page={p} count={count} />
      </div>
    </div>
  );
};

export default EventListPage;
