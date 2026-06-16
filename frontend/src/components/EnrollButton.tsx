"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Plus, CheckCircle } from "lucide-react";
import { toast } from "react-toastify";

export default function EnrollButton({ courseId }: { courseId: number }) {
  const router = useRouter();
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEnroll = async () => {
    setLoading(true);
    try {
      await api.post(`/courses/${courseId}/self-enroll`);
      setEnrolled(true);
      toast.success("Successfully enrolled!");
      router.refresh();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Failed to enroll";
      if (msg.toLowerCase().includes("already enrolled")) {
        setEnrolled(true);
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (enrolled) {
    return (
      <span className="flex items-center gap-1 px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 font-bold text-[9px] rounded-lg">
        <CheckCircle className="h-3 w-3" /> Enrolled
      </span>
    );
  }

  return (
    <button
      onClick={handleEnroll}
      disabled={loading}
      className="px-3 py-1.5 bg-[#0038A8] hover:bg-[#002D86] text-white font-bold text-[9px] rounded-lg shadow-sm transition-colors flex items-center gap-1 active:scale-[0.98] disabled:opacity-50"
    >
      <Plus className="h-3 w-3" />
      <span>{loading ? "Enrolling..." : "Enroll"}</span>
    </button>
  );
}
