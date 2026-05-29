import { serverFetch } from "@/lib/server-api";
import { AttendanceResponse } from "@/types";

const StudentAttendanceCard = async ({ id }: { id: string }) => {
  // Fetch student's attendance records from the backend API using their string user_id
  const attendance = await serverFetch<AttendanceResponse[]>(`/students/${id}/attendance`).catch(() => []);

  const totalDays = attendance.length;
  const presentDays = attendance.filter((day) => day.status === "present").length;
  const percentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
  const formattedPercentage = totalDays > 0 ? `${percentage.toFixed(1)}%` : "-";

  return (
    <div className="">
      <h1 className="text-xl font-semibold">{formattedPercentage}</h1>
      <span className="text-sm text-gray-400">Attendance</span>
    </div>
  );
};

export default StudentAttendanceCard;
