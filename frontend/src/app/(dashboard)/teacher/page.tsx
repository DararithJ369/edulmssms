import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import { cookies } from "next/headers";

const normalizeRole = (role: string | null | undefined) => {
  if (role === "instructor") {
    return "teacher";
  }

  return role ?? "";
};

const TeacherPage = () => {
  const userId = cookies().get("user_id")?.value || null;
  const role = normalizeRole(cookies().get("user_role")?.value);

  if (!userId) {
    return (
      <div className="p-6">
        <div className="bg-white p-6 rounded-md shadow-sm">
          <h1 className="text-xl font-semibold">Teacher dashboard</h1>
          <p className="text-gray-500 mt-2">Please sign in to view your schedule.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 flex gap-4 flex-col xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3">
        <div className="h-full bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold">Schedule</h1>
          <BigCalendarContainer type="teacherId" id={userId!} />
        </div>
      </div>
      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-8">
        <Announcements />
      </div>
    </div>
  );
};

export default TeacherPage;
