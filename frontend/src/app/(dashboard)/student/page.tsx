import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import BigCalendar from "@/components/BigCalender";
import EventCalendar from "@/components/EventCalendar";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

const normalizeRole = (role: string | null | undefined) => {
  if (role === "instructor") {
    return "teacher";
  }

  return role ?? "";
};

const StudentPage = async () => {
  const cookieStore = cookies();
  const userId = cookieStore.get("user_id")?.value || null;
  const role = normalizeRole(cookieStore.get("user_role")?.value);

  if (!userId) {
    return (
      <div className="p-6">
        <div className="bg-white p-6 rounded-md shadow-sm">
          <h1 className="text-xl font-semibold">Student dashboard</h1>
          <p className="text-gray-500 mt-2">Please sign in to view your schedule.</p>
        </div>
      </div>
    );
  }

  const classItem = await prisma.class.findMany({
    where: {
      students: { some: { id: userId! } },
    },
  });

  console.log(classItem);
  return (
    <div className="p-4 flex gap-4 flex-col xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3">
        <div className="h-full bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold">Schedule</h1>
          {classItem[0] ? (
            <BigCalendarContainer type="classId" id={classItem[0].id} />
          ) : (
            <p className="text-gray-500 mt-2">No class found for this account.</p>
          )}
        </div>
      </div>
      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-8">
        <EventCalendar />
        <Announcements />
      </div>
    </div>
  );
};

export default StudentPage;
