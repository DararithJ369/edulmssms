import React from "react";
import { cookies } from "next/headers";

type StreakData = {
  current_streak: number;
  longest_streak: number;
};

const StreakWidget = async () => {
  const cookieStore = cookies();
  const userId = cookieStore.get("user_id")?.value;
  const token = cookieStore.get("access_token")?.value || cookieStore.get("token")?.value || "";

  if (!userId || !token) return null;

  let streakData: StreakData | null = null;
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    const res = await fetch(`${baseUrl}/progress/streak`, {
      headers: { "Authorization": `Bearer ${token}` },
      cache: "no-store",
    });

    if (res.ok) {
      streakData = await res.json();
    }
  } catch (e) {
    console.error("Failed to fetch streak in widget:", e);
  }

  if (!streakData || streakData.current_streak <= 0) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-2xl shadow-sm hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 self-start md:self-auto select-none animate-in fade-in slide-in-from-top-2">
      <div className="relative flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 shadow-md">
        <span className="text-base text-white animate-bounce" style={{ animationDuration: "2s" }}>🔥</span>
      </div>
      <div className="flex flex-col text-left">
        <span className="text-[9px] font-extrabold text-orange-600 tracking-wider uppercase font-mono">
          Learning Streak
        </span>
        <span className="text-xs font-black text-slate-800 font-mono">
          {streakData.current_streak} {streakData.current_streak === 1 ? "Day" : "Days"}
        </span>
      </div>
      <div className="h-6 w-[1px] bg-orange-550/20 mx-1" />
      <div className="flex flex-col text-left text-[9px] text-slate-400 font-bold font-mono">
        <span>LONGEST</span>
        <span className="text-slate-600 font-mono">{streakData.longest_streak || 0} days</span>
      </div>
    </div>
  );
};

export default StreakWidget;
