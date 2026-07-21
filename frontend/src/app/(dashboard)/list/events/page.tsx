import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import { serverFetch } from "@/lib/server-api";
import Link from "next/link";
import { cookies } from "next/headers";
import { CalendarDays } from "lucide-react";
import { normalizeRole } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import ListFilterSort from "@/components/ListFilterSort";
import prisma from "@/lib/prisma";



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

  const { page, search, classId, sortBy, sortOrder } = searchParams;
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

  const rawData: EventItem[] = response?.data ?? [];

  const classesList = await prisma.class.findMany({
    select: { id: true, name: true },
  });

  let filteredData = rawData;
  if (classId) {
    filteredData = filteredData.filter((item) => String(item.class_id) === classId);
  }
  if (sortBy) {
    const isAsc = sortOrder !== "desc";
    filteredData = [...filteredData].sort((a, b) => {
      if (sortBy === "title") {
        return isAsc ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
      }
      if (sortBy === "start_time") {
        const da = new Date(a.start_time).getTime();
        const db = new Date(b.start_time).getTime();
        return isAsc ? da - db : db - da;
      }
      return 0;
    });
  }

  const count = filteredData.length;

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen relative font-sans text-left">
      {/* PAGE HEADER */}
      <PageHeader
        eyebrow="Social & Academic Calendar"
        title="School & Campus Events"
        breadcrumbs={[{ label: "Events" }]}
      />

      {/* FILTER & SEARCH UTILITY */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-3 select-none">
        <div className="flex items-center gap-2 text-xs font-extrabold text-muted-foreground">
          <span className="px-2.5 py-1 bg-white dark:bg-muted border border-border/80 text-foreground rounded-lg shadow-sm">
            {count} Total Events
          </span>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <TableSearch />
          <ListFilterSort
            filters={[
              {
                key: "classId",
                label: "Class",
                allLabel: "All Classes",
                options: classesList.map((c) => ({ id: c.id, label: c.name })),
              },
            ]}
            sortOptions={[
              { label: "Default Order", value: "" },
              { label: "Event Title (A-Z)", value: "title-asc" },
              { label: "Event Title (Z-A)", value: "title-desc" },
              { label: "Start Date (Earliest)", value: "start_time-asc" },
              { label: "Start Date (Latest)", value: "start_time-desc" },
            ]}
          />
        </div>
      </div>

      {/* EVENTS LIST */}
      {filteredData.length > 0 ? (
        <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.01)] space-y-3">
          {filteredData.map((item) => {
            const start = item.start_time ? new Date(item.start_time) : null;
            const end = item.end_time ? new Date(item.end_time) : null;

            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 bg-[#fbf5fc]/40 dark:bg-muted/5 border border-border/40 hover:border-violet-300/50 dark:hover:border-violet-950/30 rounded-2xl transition-all shadow-sm group"
              >
                <div className="flex items-center gap-4 max-w-[70%]">
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
