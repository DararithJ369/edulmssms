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

type ParentList = {
  id: string;
  username: string;
  email: string;
  role?: { name: string };
};

const ParentListPage = async ({
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

  const renderRow = (item: ParentList) => (
    <tr
      key={item.id}
      className="border-b border-border even:bg-muted/40 text-sm hover:bg-accent transition-colors duration-300"
    >
      <td className="flex items-center gap-4 p-4">
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.username}</h3>
          <p className="text-xs text-muted-foreground">{item.email}</p>
        </div>
      </td>
      <td className="hidden lg:table-cell">{item.email}</td>
      <td className="hidden lg:table-cell capitalize">{item.role?.name || "parent"}</td>
      <td>
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <>
              <FormContainer table="parent" type="update" data={item} />
              <FormContainer table="parent" type="delete" id={item.id} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  const { page } = searchParams;

  const p = page ? parseInt(page) : 1;

  const response = await serverFetch<{ data: ParentList[]; meta?: { total?: number } }>(
    `/users/parents?page=${p}&limit=${ITEM_PER_PAGE}`
  );

  const data = response.data || [];
  const count = response.meta?.total ?? 0;

  return (
    <div className="bg-card text-card-foreground border border-border p-4 rounded-md flex-1 m-4 mt-0 transition-colors duration-300">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Parents</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {role === "admin" && <FormContainer table="parent" type="create" />}
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

export default ParentListPage;
