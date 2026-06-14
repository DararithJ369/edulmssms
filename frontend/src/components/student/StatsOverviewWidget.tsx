import React from "react";
import { cookies } from "next/headers";
import { CheckCircle2, BookOpen, Award, AlertCircle } from "lucide-react";

type StudentStats = {
  attendance_rate: number;
  total_attendance_records: number;
  avg_percentage: number;
  total_results: number;
  enrolled_courses: Array<{ course_id: number; course_name: string }>;
  pending_assignments: Array<{ assignment_id: number; title: string; due_date: string | null }>;
  gpa?: number;
  total_credits?: number;
  passed_subjects?: number;
  failed_subjects?: number;
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
      icon: <Award className="h-4 w-4" />,
      label: "Current GPA",
      value: stats.gpa !== undefined ? `${stats.gpa.toFixed(2)}` : "0.00",
      sub: "Academic GPA",
      color: "text-[#0038A8] bg-blue-50 border-blue-100",
    },
    {
      icon: <BookOpen className="h-4 w-4" />,
      label: "Total Credits",
      value: stats.total_credits !== undefined ? `${stats.total_credits}` : "0",
      sub: "Earned Credits",
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
    },
    {
      icon: <CheckCircle2 className="h-4 w-4" />,
      label: "Passed Subjects",
      value: stats.passed_subjects !== undefined ? `${stats.passed_subjects}` : "0",
      sub: "Courses Passed",
      color: "text-indigo-600 bg-indigo-50 border-indigo-100",
    },
    {
      icon: <AlertCircle className="h-4 w-4" />,
      label: "Failed Subjects",
      value: stats.failed_subjects !== undefined ? `${stats.failed_subjects}` : "0",
      sub: "Courses Failed",
      color: "text-amber-600 bg-amber-50 border-amber-100",
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
