import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { serverFetch } from "@/lib/server-api";
import { ITEM_PER_PAGE } from "@/lib/settings";
import Image from "next/image";
import { cookies } from "next/headers";
import Link from "next/link";

const normalizeRole = (role: string | null | undefined) => {
  if (role === "instructor") {
    return "teacher";
  }

  return role ?? "";
};

type LessonList = {
  id: number;
  title: string;
  duration?: string | null;
  order?: number | null;
  material_type?: string | null;
};


const LessonListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const cookieStore = cookies();
  const role = normalizeRole(cookieStore.get("user_role")?.value);


  const columns = [
    {
      header: "Title",
      accessor: "title",
    },
    {
      header: "Duration",
      accessor: "duration",
      className: "hidden md:table-cell",
    },
    {
      header: "Order",
      accessor: "order",
      className: "hidden lg:table-cell",
    },
    {
      header: "Material",
      accessor: "material",
      className: "hidden lg:table-cell",
    },
    ...(role === "admin"
      ? [
          {
            header: "Actions",
            accessor: "action",
          },
        ]
      : []),
  ];

const renderRow = (item: LessonList) => (
  <tr
    key={item.id}
    className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
  >
    <td className="flex items-center gap-4 p-4 font-semibold text-[#0038A8] hover:underline cursor-pointer">
      <Link href={`/list/lessons/${item.id}`}>
        {item.title}
      </Link>
    </td>
    <td className="hidden md:table-cell">{item.duration || "-"}</td>
    <td className="hidden lg:table-cell">{item.order ?? "-"}</td>
    <td className="hidden lg:table-cell">{item.material_type || "-"}</td>
    <td>
      <div className="flex items-center gap-2">
        {role === "admin" && (
          <>
            <FormContainer table="lesson" type="update" data={item} />
            <FormContainer table="lesson" type="delete" id={item.id} />
          </>
        )}
      </div>
    </td>
  </tr>
);

  const { page } = searchParams;

  const p = page ? parseInt(page) : 1;

  const lessonsResponse = await serverFetch<{
    data: LessonList[];
    meta: { total: number };
  }>(`/lessons?page=${p}&limit=${ITEM_PER_PAGE}`);

  const data = lessonsResponse.data || [];
  const count = lessonsResponse.meta?.total ?? 0;

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Lessons</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {role === "admin" && <FormContainer table="lesson" type="create" />}
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

export default LessonListPage;
