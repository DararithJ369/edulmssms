import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { serverFetch } from "@/lib/server-api";
import Image from "next/image";
import Link from "next/link";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { cookies } from "next/headers";

const normalizeRole = (role: string | null | undefined) => {
  if (role === "instructor") {
    return "teacher";
  }

  return role ?? "";
};

type TeacherList = {
  id: string;
  username: string;
  email: string;
  image?: string | null;
  role?: { name: string };
};

const TeacherListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const cookieStore = cookies();
  const role = normalizeRole(cookieStore.get("user_role")?.value);
  const columns = [
    {
      header: "Info",
      accessor: "info",
    },
    {
      header: "Email",
      accessor: "email",
      className: "hidden lg:table-cell",
    },
    {
      header: "Role",
      accessor: "role",
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

  const renderRow = (item: TeacherList) => (
    <tr
      key={item.id}
      className="border-b border-border even:bg-muted/40 text-sm hover:bg-accent transition-colors duration-300"
    >
      <td className="flex items-center gap-4 p-4">
        <Image
          src={item.image || "/noAvatar.png"}
          alt=""
          width={40}
          height={40}
          className="md:hidden xl:block w-10 h-10 rounded-full object-cover"
        />
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.username}</h3>
          <p className="text-xs text-muted-foreground">{item.email}</p>
        </div>
      </td>
      <td className="hidden lg:table-cell">{item.email}</td>
      <td className="hidden lg:table-cell capitalize">{item.role?.name || "teacher"}</td>
      <td>
        <div className="flex items-center gap-2">
          <Link href={`/list/teachers/${item.id}`}>
            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky">
              <Image src="/view.png" alt="" width={16} height={16} />
            </button>
          </Link>
          {role === "admin" && (
            // <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaPurple">
            //   <Image src="/delete.png" alt="" width={16} height={16} />
            // </button>
            <FormContainer table="teacher" type="delete" id={item.id} />
          )}
        </div>
      </td>
    </tr>
  );
  const { page } = searchParams;

  const p = page ? parseInt(page) : 1;

  const response = await serverFetch<{ data: TeacherList[]; meta?: { total?: number } }>(
    `/users/instructors?page=${p}&limit=${ITEM_PER_PAGE}`
  );

  const data = response.data || [];
  const count = response.meta?.total ?? 0;

  return (
    <div className="bg-card text-card-foreground border border-border p-4 rounded-md flex-1 m-4 mt-0 transition-colors duration-300">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Teachers</h1>
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
              <FormContainer table="teacher" type="create" />
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

export default TeacherListPage;
