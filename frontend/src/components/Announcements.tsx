import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

const normalizeRole = (role: string | null | undefined) => {
  if (role === "instructor") {
    return "teacher";
  }

  return role ?? "";
};

const Announcements = async () => {
  const cookieStore = cookies();
  const role = normalizeRole(cookieStore.get("user_role")?.value);
  const userId = cookieStore.get("user_id")?.value || null;

  const roleConditions = {
    teacher: userId ? { lessons: { some: { teacherId: userId } } } : {},
    student: userId ? { students: { some: { id: userId } } } : {},
    parent: userId ? { students: { some: { parentId: userId } } } : {},
  };

  const data = await prisma.announcement.findMany({
    take: 3,
    orderBy: { date: "desc" },
    where: {
      ...(role && role !== "admin" && {
        OR: [
          { classId: null },
          { class: roleConditions[role as keyof typeof roleConditions] || {} },
        ],
      }),
    },
  });

  return (
    <div className="bg-card text-card-foreground p-4 rounded-md border border-border transition-colors duration-300">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Announcements</h1>
        <span className="text-xs text-muted-foreground">View All</span>
      </div>
      <div className="flex flex-col gap-4 mt-4">
        {data[0] && (
          <div className="bg-secondary rounded-md p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">{data[0].title}</h2>
              <span className="text-xs text-muted-foreground bg-background rounded-md px-1 py-1">
                {new Intl.DateTimeFormat("en-GB").format(data[0].date)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{data[0].description}</p>
          </div>
        )}
        {data[1] && (
          <div className="bg-secondary rounded-md p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">{data[1].title}</h2>
              <span className="text-xs text-muted-foreground bg-background rounded-md px-1 py-1">
                {new Intl.DateTimeFormat("en-GB").format(data[1].date)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{data[1].description}</p>
          </div>
        )}
        {data[2] && (
          <div className="bg-secondary rounded-md p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">{data[2].title}</h2>
              <span className="text-xs text-muted-foreground bg-background rounded-md px-1 py-1">
                {new Intl.DateTimeFormat("en-GB").format(data[2].date)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{data[2].description}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Announcements;
