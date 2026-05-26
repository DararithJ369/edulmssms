import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { serverFetch } from "@/lib/server-api";
import { ITEM_PER_PAGE } from "@/lib/settings";
import Image from "next/image";
import { cookies } from "next/headers";

const normalizeRole = (role: string | null | undefined) => {
  if (role === "instructor") {
    return "teacher";
  }

  return role ?? "";
};

type SubjectList = {
  id: number;
  name: string;
  code?: string | null;
  credits?: number | null;
  instructor_id?: string | null;
  is_active?: boolean | null;
};

const SubjectListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const cookieStore = cookies();
  const role = normalizeRole(cookieStore.get("user_role")?.value);

  const columns = [
    {
      header: "Subject Name",
      accessor: "name",
    },
    {
      header: "Code",
      accessor: "code",
      className: "hidden lg:table-cell",
    },
    {
      header: "Credits",
      accessor: "credits",
      className: "hidden md:table-cell",
    },
    {
      header: "Instructor",
      accessor: "instructor",
      className: "hidden md:table-cell",
    },
    {
      header: "Actions",
      accessor: "action",
    },
  ];

  const renderRow = (item: SubjectList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">{item.name}</td>
      <td className="hidden lg:table-cell">{item.code || "-"}</td>
      <td className="hidden md:table-cell">{item.credits ?? "-"}</td>
      <td className="hidden md:table-cell">{item.instructor_id || "-"}</td>
      <td>
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <>
              <FormContainer table="subject" type="update" data={item} />
              <FormContainer table="subject" type="delete" id={item.id} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  const { page } = searchParams;

  const p = page ? parseInt(page) : 1;

  const subjectsResponse = await serverFetch<{
    data: SubjectList[];
    meta: { total: number };
  }>("/subjects", {
    params: { page: p, limit: ITEM_PER_PAGE },
  });

  const data = subjectsResponse.data || [];
  const count = subjectsResponse.meta?.total ?? 0;

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Subjects</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {role === "admin" && (
              <FormContainer table="subject" type="create" />
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

export default SubjectListPage;
