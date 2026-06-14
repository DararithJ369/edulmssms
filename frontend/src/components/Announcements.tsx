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
    <div className="bg-white text-card-foreground p-4 rounded-xl border border-border/60 shadow-xs transition-colors duration-300">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Announcements</h1>
        <span className="text-xs text-muted-foreground cursor-pointer hover:underline">View All</span>
      </div>
      
      <div className="flex flex-col gap-4 mt-4">
        {data.length > 0 ? (
          // ──✅ FIXED: Replaced brittle hardcoded indices with a clean, programmatic loop mapping
          data.map((item) => (
            <div key={item.id} className="bg-slate-50/70 rounded-xl border border-slate-100 p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-sm text-slate-800">{item.title}</h2>
                <span className="text-[10px] text-muted-foreground bg-white border border-slate-100 rounded-lg px-2 py-0.5 font-sans">
                  {new Intl.DateTimeFormat("en-GB").format(item.date)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))
        ) : (
          // ──✅ FIXED: Graceful empty state buffer fallback
          <div className="text-center py-6 border border-dashed border-border/60 rounded-xl text-xs text-muted-foreground/70">
            No active announcements found for your profile.
          </div>
        )}
      </div>
    </div>
  );
};

export default Announcements;