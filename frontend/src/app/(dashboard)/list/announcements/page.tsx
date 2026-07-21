import FormContainer from "@/components/FormContainer";
import TableRowActions from "@/components/TableRowActions";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import Link from "next/link";
import { cookies } from "next/headers";
import {
  Megaphone,
  Calendar,
  Layers,
  Plus,
  ListFilter,
  ArrowUpDown
} from "lucide-react";
import { normalizeRole } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import ListFilterSort from "@/components/ListFilterSort";

import EmptyState from "@/components/EmptyState";
import StatusBadge from "@/components/StatusBadge";

type AnnouncementList = {
  id: number;
  title: string;
  description?: string | null;
  date: Date;
  classId?: number | null;
  class?: { id: number; name: string } | null;
};

const AnnouncementListPage = async ({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) => {
  const cookieStore = cookies();
  const role = normalizeRole(cookieStore.get("user_role")?.value);
  const currentUserId = cookieStore.get("user_id")?.value || null;

  const { page, ...queryParams } = searchParams;
  const pageValue = Array.isArray(page) ? page[0] : page;

  const p = pageValue ? parseInt(pageValue) : 1;

  const classesList = await prisma.class.findMany({ select: { id: true, name: true } });

  // URL PARAMS CONDITION
  const query: any = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      const normalizedValue = Array.isArray(value) ? value[0] : value;
      if (normalizedValue !== undefined) {
        switch (key) {
          case "search":
            query.title = { contains: normalizedValue, mode: "insensitive" };
            break;
          case "classId":
            query.classId = Number(normalizedValue);
            break;
          default:
            break;
        }
      }
    }
  }

  // ROLE CONDITIONS
  const roleConditions = {
    teacher: { lessons: { some: { teacherId: currentUserId! } } },
    student: { students: { some: { id: currentUserId! } } },
    parent: { students: { some: { parentId: currentUserId! } } },
  };

  query.OR = [
    { classId: null },
    {
      class: roleConditions[role as keyof typeof roleConditions] || {},
    },
  ];

  let orderByObj: any = { date: "desc" };
  if (queryParams.sortBy) {
    const isAsc = queryParams.sortOrder !== "desc";
    if (queryParams.sortBy === "title") {
      orderByObj = { title: isAsc ? "asc" : "desc" };
    } else if (queryParams.sortBy === "date") {
      orderByObj = { date: isAsc ? "asc" : "desc" };
    }
  }

  const [data, count] = await prisma.$transaction([
    prisma.announcement.findMany({
      where: query,
      include: {
        class: true,
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: orderByObj
    }),
    prisma.announcement.count({ where: query }),
  ]);


  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen relative font-sans text-left transition-all duration-300 animate-fade-in">
      {/* PAGE HEADER */}
      <PageHeader
        eyebrow="System & Class Board"
        title="Academic Announcements"
        breadcrumbs={[{ label: "Announcements" }]}
        actions={
          role === "admin" && (
            <FormContainer table="announcement" type="create" triggerText="Add Announcement" />
          )
        }
      />

      {/* FILTER & SEARCH UTILITY */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-3 select-none">
        <div className="flex items-center gap-2 text-xs font-extrabold text-muted-foreground">
          <span className="px-2.5 py-1 bg-white dark:bg-muted border border-border/80 text-foreground rounded-lg shadow-sm">
            {count} Announcements
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
              { label: "Title (A-Z)", value: "title-asc" },
              { label: "Title (Z-A)", value: "title-desc" },
              { label: "Date (Earliest)", value: "date-asc" },
              { label: "Date (Latest)", value: "date-desc" },
            ]}
          />
        </div>
      </div>

      {/* ANNOUNCEMENTS LIST */}
      {data.length > 0 ? (
        <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.01)] space-y-3">
          {data.map((item: any) => {
            return (
              <div 
                key={item.id} 
                className="flex items-center justify-between p-4 bg-[#f4f7fb]/40 dark:bg-muted/5 border border-border/40 hover:border-[#0038A8]/35 rounded-2xl transition-all shadow-sm group"
              >
                <div className="flex items-center gap-4 max-w-[70%]">
                  <div className="flex flex-col text-left gap-0.5">
                    <span className="text-sm font-extrabold text-foreground tracking-tight leading-snug group-hover:text-[#0038A8] dark:group-hover:text-[#4f88ef] transition-colors">
                      {item.title}
                    </span>

                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap font-medium">
                      <span className="text-[#0038A8] dark:text-[#4f88ef] font-semibold font-sans">
                        Class: {item.class?.name || "All Classes"}
                      </span>
                      <span className="text-muted-foreground/40">•</span>
                      <span className="text-gray-500 font-sans">
                        {new Intl.DateTimeFormat("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        }).format(item.date)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-4">
                  <TableRowActions
                    id={item.id}
                    table="announcement"
                    editData={item}
                    role={role}
                  />
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Megaphone}
          title="No Announcements Posted"
          description="School notices and class broadcasts will appear here. Start by creating an announcement."
          action={
            role === "admin" && (
              <FormContainer table="announcement" type="create" triggerText="Add Announcement" />
            )
          }
        />
      )}

      {/* PAGINATION PANEL */}
      <div className="flex justify-center select-none shrink-0 pt-2">
        <Pagination page={p} count={count} />
      </div>
    </div>
  );
};

export default AnnouncementListPage;
