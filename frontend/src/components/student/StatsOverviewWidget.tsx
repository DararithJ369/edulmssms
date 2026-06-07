import React from "react";
import { cookies } from "next/headers";
import { CheckCircle2, Clock, BarChart2, BookOpen } from "lucide-react";

type StudentStats = {
  attendance_rate: number;
  total_attendance_records: number;
  avg_percentage: number;
  total_results: number;
  enrolled_courses: Array<{ course_id: number; course_name: string }>;
  pending_assignments: Array<{ assignment_id: number; title: string; due_date: string | null }>;
};

const StatsOverviewWidget = async () => {
  const cookieStore = cookies();
  const userId = cookieStore.get("user_id")?.value;
  const token =
    cookieStore.get("access_token")?.value ||
    cookieStore.get("token")?.value ||
    "";

  if (!userId || !token) return null;

  let stats: StudentStats | null = null;
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    const res = await fetch(`${baseUrl}/analytics/student/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (res.ok) {
      stats = await res.json();
    }
  } catch {
    // non-critical
  }

  if (!stats) return null;

  const cards = [
    {
      icon: <CheckCircle2 className="h-4 w-4" />,
      label: "Attendance",
      value: `${stats.attendance_rate}%`,
      sub: `${stats.total_attendance_records} records`,
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
    },
    {
      icon: <BarChart2 className="h-4 w-4" />,
      label: "Avg Grade",
      value: `${stats.avg_percentage}%`,
      sub: `${stats.total_results} assessments`,
      color: "text-[#0038A8] bg-blue-50 border-blue-100",
    },
    {
      icon: <BookOpen className="h-4 w-4" />,
      label: "Courses",
      value: `${stats.enrolled_courses.length}`,
      sub: "enrolled",
      color: "text-amber-600 bg-amber-50 border-amber-100",
    },
    {
      icon: <Clock className="h-4 w-4" />,
      label: "Pending",
      value: `${stats.pending_assignments.length}`,
      sub: "assignments",
      color: "text-red-500 bg-red-50 border-red-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 select-none animate-in fade-in slide-in-from-bottom-2 duration-300">
      {cards.map(({ icon, label, value, sub, color }) => (
        <div
          key={label}
          className={`flex flex-col items-center justify-center gap-1 p-4 rounded-2xl border text-center ${color}`}
        >
          {icon}
          <p className="text-xl font-black">{value}</p>
          <p className="text-[10px] font-bold opacity-75 uppercase tracking-wider">
            {label}
          </p>
          <p className="text-[9px] text-muted-foreground font-bold">{sub}</p>
        </div>
      ))}
    </div>
  );
};

export default StatsOverviewWidget;
