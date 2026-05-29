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

type QuizList = {
  id: number;
  title: string;
  course_id: number;
  lesson_id: number | null;
  due_date: string;
};

const QuizListPage = async ({
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
      header: "Course ID",
      accessor: "course",
    },
    {
      header: "Lesson ID",
      accessor: "lesson",
      className: "hidden md:table-cell",
    },
    {
      header: "Due Date",
      accessor: "dueDate",
      className: "hidden md:table-cell",
    },
  ];

  const renderRow = (item: QuizList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4 font-semibold">{item.title}</td>
      <td>Course #{item.course_id}</td>
      <td className="hidden md:table-cell">
        {item.lesson_id ? `Lesson #${item.lesson_id}` : "-"}
      </td>
      <td className="hidden md:table-cell">
        {new Intl.DateTimeFormat("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(item.due_date))}
      </td>
    </tr>
  );

  const { page } = searchParams;
  const p = page ? parseInt(page) : 1;

  const quizzesResponse = await serverFetch<{
    data: QuizList[];
    meta: { total: number };
  }>(`/quizzes?page=${p}&limit=${ITEM_PER_PAGE}`).catch(() => ({
    data: [],
    meta: { total: 0 },
  }));

  const data = quizzesResponse.data || [];
  const count = quizzesResponse.meta?.total ?? 0;

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Quizzes</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="Filter" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="Sort" width={14} height={14} />
            </button>
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

export default QuizListPage;
