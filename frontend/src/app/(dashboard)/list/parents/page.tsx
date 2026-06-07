import FormContainer from "@/components/FormContainer";
import TableRowActions from "@/components/TableRowActions";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import { serverFetch } from "@/lib/server-api";
import { ITEM_PER_PAGE } from "@/lib/settings";
import Link from "next/link";
import { cookies } from "next/headers";
import { Globe, ListFilter, ArrowUpDown } from "lucide-react";
import { getImageUrl } from "@/lib/image-url";
import { normalizeRole } from "@/lib/auth";

// ── Default avatar helpers ────────────────────────────────────────────────────
const AVATAR_PALETTE = [
  { bg: "#E8EDF5", text: "#4A6FA5" },
  { bg: "#EAF0FB", text: "#3B5FBE" },
  { bg: "#EDF5EE", text: "#3A7D44" },
  { bg: "#F5EDF5", text: "#7D3A7D" },
  { bg: "#FDF3E7", text: "#B06820" },
  { bg: "#F0F0F5", text: "#5A5A8A" },
  { bg: "#F5EDEA", text: "#8A3A2A" },
  { bg: "#EAF5F5", text: "#2A7A7D" },
];

function getInitialsColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

function getInitials(name: string) {
  const parts = name.trim().split(/[._ -]+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}
// ─────────────────────────────────────────────────────────────────────────────

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

  const { page } = searchParams;

  const p = page ? parseInt(page) : 1;

  const response = await serverFetch<{ data: ParentList[]; meta?: { total?: number } }>(
    `/users/parents?page=${p}&limit=${ITEM_PER_PAGE}`
  );

  const data = response.data || [];
  const count = response.meta?.total ?? 0;

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen relative font-sans text-left">
      {/* MOODLE BREADCRUMB */}
      <div className="flex items-center gap-1 text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider mb-2 select-none">
        <Link href="/" className="hover:text-foreground flex items-center gap-1">
          <Globe className="h-3 w-3" />
          Home
        </Link>
        <span>/</span>
        <span className="text-foreground">Parents</span>
      </div>

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none mb-6">
        <div>
          <span className="text-xs font-extrabold text-[#0038A8] uppercase tracking-wider font-mono">
            Guardian Members Directory
          </span>
          <h1 className="text-xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-tight mt-0.5">
            All Family Guardians
          </h1>
        </div>

        {/* Administration Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {role === "admin" && (
            <FormContainer table="parent" type="create" triggerText="Add Parent" />
          )}
        </div>
      </div>

      {/* SEARCH AND FILTER UTILITY */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-3 select-none">
        <div className="flex items-center gap-2 text-xs font-extrabold text-muted-foreground">
          <span className="px-2.5 py-1 bg-white dark:bg-muted border border-border/80 text-foreground rounded-lg shadow-sm">
            {count} Total Parents
          </span>
        </div>

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

      {/* PARENTS CARD LIST */}
      {data.length > 0 ? (
        <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.01)] space-y-3">
          {data.map((item) => (
            <div
              key={item.id}
              className="relative flex items-center justify-between p-5 bg-card/65 hover:bg-card border border-border/50 hover:border-rose-500/25 rounded-3xl transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.02)] hover:-translate-y-[1px] group overflow-hidden"
            >
              {/* Left Active/Hover Indicator Bar */}
              <span className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-3xl bg-rose-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="flex items-center gap-4 max-w-[70%] z-10">
                {/* Profile Image Squircle Container */}
                {(() => {
                  const resolvedUrl = getImageUrl(item.profile_image || item.image);
                  const { bg, text } = getInitialsColor(item.username);
                  return (
                    <div
                      className="h-10 w-10 rounded-2xl shrink-0 shadow-sm transition-all duration-300 group-hover:scale-105 overflow-hidden flex items-center justify-center select-none"
                      style={resolvedUrl ? undefined : { backgroundColor: bg }}
                    >
                      {resolvedUrl ? (
                        <img
                          src={resolvedUrl}
                          alt={item.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-black tracking-wide leading-none" style={{ color: text }}>
                          {getInitials(item.username)}
                        </span>
                      )}
                    </div>
                  );
                })()}

                <div className="flex flex-col text-left gap-1">
                  <Link
                    href={`/list/parents/${item.id}`}
                    className="text-sm font-extrabold text-foreground tracking-tight leading-snug hover:text-[#0038A8] dark:hover:text-[#4f88ef] transition-colors"
                  >
                    {item.username}
                  </Link>

                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap font-medium">
                    <span>{item.email}</span>
                    <span className="text-muted-foreground/40">•</span>
                    <span className="capitalize">{item.role?.name || "parent"}</span>
                  </div>
                </div>
              </div>

              {/* Right Side Actions Dropdown */}
              <div className="flex items-center gap-4 z-10">
                <TableRowActions
                  id={item.id}
                  table="parent"
                  viewUrl={`/list/parents/${item.id}`}
                  editData={item}
                  role={role}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border/60 rounded-3xl p-12 text-center text-muted-foreground select-none">
          <div
            className="h-12 w-12 rounded-2xl mx-auto mb-3 flex items-center justify-center text-sm font-black"
            style={{ backgroundColor: "#E8EDF5", color: "#4A6FA5" }}
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
