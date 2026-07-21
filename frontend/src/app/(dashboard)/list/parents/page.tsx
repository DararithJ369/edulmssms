export const dynamic = "force-dynamic";

import FormContainer from "@/components/FormContainer";
import TableRowActions from "@/components/TableRowActions";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import { serverFetch } from "@/lib/server-api";
import { ITEM_PER_PAGE } from "@/lib/settings";
import Link from "next/link";
import { cookies } from "next/headers";
import { normalizeRole } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import ListFilterSort from "@/components/ListFilterSort";
import Avatar from "@/components/Avatar";



type ParentList = {
  id: string;
  username: string;
  email: string;
  image?: string | null;
  profile_image?: string | null;
  role?: { name: string };
};

const ParentListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const cookieStore = cookies();
  const role = normalizeRole(cookieStore.get("user_role")?.value);

  const { page, relationship, sortBy, sortOrder } = searchParams;

  const p = page ? parseInt(page) : 1;

  const relParam = relationship ? `&relationship=${encodeURIComponent(relationship)}` : "";
  const sortByParam = sortBy ? `&sort_by=${sortBy}` : "";
  const sortOrderParam = sortOrder ? `&sort_order=${sortOrder}` : "";
  const response = await serverFetch<{ data: ParentList[]; meta?: { total?: number } }>(
    `/users/parents?page=${p}&limit=${ITEM_PER_PAGE}${relParam}${sortByParam}${sortOrderParam}`
  );

  const data = response.data || [];
  const count = response.meta?.total ?? 0;

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen relative font-sans text-left">
      {/* PAGE HEADER */}
      <PageHeader
        eyebrow="Guardian Members Directory"
        title="All Family Guardians"
        breadcrumbs={[{ label: "Parents" }]}
        actions={
          role === "admin" && (
            <FormContainer table="parent" type="create" triggerText="Add Parent" />
          )
        }
      />


      {/* SEARCH AND FILTER UTILITY */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-3 select-none">
        <div className="flex items-center gap-2 text-xs font-extrabold text-muted-foreground">
          <span className="px-2.5 py-1 bg-white dark:bg-muted border border-border/80 text-foreground rounded-lg shadow-sm">
            {count} Total Parents
          </span>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <TableSearch />
          <ListFilterSort
            filters={[
              {
                key: "relationship",
                label: "Relationship",
                allLabel: "All Relationships",
                options: [
                  { id: "FATHER", label: "Father" },
                  { id: "MOTHER", label: "Mother" },
                  { id: "GUARDIAN", label: "Guardian" },
                ],
              },
            ]}
            sortOptions={[
              { label: "Default Order", value: "" },
              { label: "Name (A-Z)", value: "username-asc" },
              { label: "Name (Z-A)", value: "username-desc" },
            ]}
          />

        </div>
      </div>

      {/* PARENTS TABLE */}
      {data.length > 0 ? (
        <div className="bg-white border border-border/60 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.01)] overflow-hidden w-full">
          <div className="w-full overflow-x-auto">
            <div className="min-w-[800px] flex flex-col">
              {/* TABLE HEADER */}
              <div className="flex items-center h-12 px-6 bg-slate-50/50 border-b border-border/60 text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider select-none">
                <div className="flex-1 min-w-[200px]">Name</div>
                <div className="w-56 shrink-0">Children</div>
                <div className="flex-1 min-w-[180px]">Email</div>
                <div className="w-24 shrink-0 text-right">Edit</div>
              </div>

              {/* TABLE ROWS */}
              <div className="divide-y divide-border/60">
                {data.map((item) => {
                  const hash = item.username.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
                  const mockChildren = ["1 Student Enrolled", "2 Students Enrolled", "3 Students Enrolled"][hash % 3];

                  return (
                    <div 
                      key={item.id} 
                      className="flex items-center h-16 px-6 hover:bg-slate-50/15 transition-all duration-200"
                    >
                      {/* Name (Avatar + Username) */}
                      <div className="flex-1 min-w-[200px] flex items-center gap-3">
                        <Avatar username={item.username} image={item.profile_image || item.image} />
                        <Link
                          href={`/list/parents/${item.id}`}
                          className="text-sm font-extrabold text-foreground tracking-tight truncate hover:text-brand transition-colors"
                        >
                          {item.username}
                        </Link>
                      </div>

                      {/* Children */}
                      <div className="w-56 shrink-0 text-left">
                        <span className="px-2.5 py-1 border border-slate-200 bg-slate-50 text-slate-700 text-xs font-bold rounded-lg">
                          {mockChildren}
                        </span>
                      </div>

                      {/* Email */}
                      <div className="flex-1 min-w-[180px] text-left truncate text-xs font-medium text-slate-500">
                        {item.email}
                      </div>

                      {/* Actions */}
                      <div className="w-24 shrink-0 flex items-center justify-end">
                        <TableRowActions
                          id={item.id}
                          table="parent"
                          viewUrl={`/list/parents/${item.id}`}
                          editData={item}
                          role={role}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border/60 rounded-3xl p-12 text-center text-muted-foreground select-none">
          <div
            className="h-12 w-12 rounded-full mx-auto mb-3 flex items-center justify-center text-sm font-black bg-[#161c2e] text-white"
          >
            PA
          </div>
          <p className="text-sm font-bold">No parents registered in database.</p>
        </div>
      )}

      {/* PAGINATION PANEL */}
      <div className="bg-card border border-border/60 rounded-3xl p-4 shadow-sm flex justify-center select-none shrink-0">
        <Pagination page={p} count={count} />
      </div>
    </div>
  );
};

export default ParentListPage;
