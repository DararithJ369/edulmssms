import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { serverFetch } from "@/lib/server-api";
import { ITEM_PER_PAGE } from "@/lib/settings";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";

const normalizeRole = (role: string | null | undefined) => {
  if (role === "instructor") {
    return "teacher";
  }
  return role ?? "";
};

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
    items: CourseItem[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>(queryPath).catch(() => ({
    items: [],
    total: 0,
    page: 1,
    page_size: 10,
    total_pages: 0,
  }));

  const data = response.items || [];
  const count = response.total || 0;

  const columns = [
    {
      header: "Course Name",
      accessor: "name",
    },
    {
      header: "Code",
      accessor: "code",
      className: "hidden lg:table-cell",
    },
    {
      header: "Category",
      accessor: "category",
      className: "hidden md:table-cell",
    },
    {
      header: "Instructor",
      accessor: "instructor",
      className: "hidden md:table-cell",
    },
    ...(role === "admin" || role === "teacher"
      ? [
          {
            header: "Actions",
            accessor: "action",
          },
        ]
      : []),
  ];

  const renderRow = (item: CourseItem) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight transition-colors duration-200"
    >
      <td className="flex items-center gap-4 p-4">
        <Image
          src={item.thumbnail || "/noAvatar.png"}
          alt=""
          width={40}
          height={40}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex flex-col">
          <Link
            href={`/list/courses/${item.id}`}
            className="font-semibold text-[#0038A8] hover:underline"
          >
            {item.course_name}
          </Link>
          <span className="text-[10px] text-muted-foreground md:hidden mt-0.5">
            {item.course_code}
          </span>
        </div>
      </td>
      <td className="hidden lg:table-cell font-mono text-xs">{item.course_code}</td>
      <td className="hidden md:table-cell">
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0038A8]/10 text-[#0038A8] uppercase tracking-wider">
          {item.category || "General"}
        </span>
      </td>
      <td className="hidden md:table-cell font-medium text-gray-700">{item.instructor_name || "-"}</td>
      {(role === "admin" || role === "teacher") && (
        <td>
          <div className="flex items-center gap-2">
            <Link href={`/list/courses/${item.id}`}>
              <button
                className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky hover:bg-lamaSky/80 transition-colors"
                title="Edit Course Details"
              >
                <Image src="/edit.png" alt="Edit" width={16} height={16} />
              </button>
            </Link>
            <button
              className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaPurple hover:bg-lamaPurple/80 transition-colors"
              title="Delete Course"
            >
              <Image src="/delete.png" alt="Delete" width={16} height={16} />
            </button>
          </div>
        </td>
      )}
    </tr>
  );

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0 transition-colors duration-300">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold text-foreground">
          {category ? `All ${category} Courses` : "All Courses"}
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow hover:bg-lamaYellow/80 transition-colors">
              <Image src="/filter.png" alt="Filter" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow hover:bg-lamaYellow/80 transition-colors">
              <Image src="/sort.png" alt="Sort" width={14} height={14} />
            </button>
            {(role === "admin" || role === "teacher") && (
              <Link href="/list/courses/1">
                <button
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow hover:bg-lamaYellow/80 transition-colors"
                  title="Create New Course"
                >
                  <Image src="/create.png" alt="Create" width={14} height={14} />
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={data} />
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default CourseListPage;
