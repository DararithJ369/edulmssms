"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Loader2, GraduationCap } from "lucide-react";
import { api } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "react-toastify";

interface ParentLinkStudentModalProps {
  parentId: string; // The parent's User UUID string
}

export default function ParentLinkStudentModal({ parentId }: ParentLinkStudentModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [students, setStudents] = useState<any[]>([]);

  const triggerSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setStudents([]);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get(`/users/students?limit=10&search=${searchQuery}`);
      setStudents(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error("Failed to query student registry:", err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  // Automatic debounced search (400ms)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setStudents([]);
      return;
    }
    const t = setTimeout(triggerSearch, 400);
    return () => clearTimeout(t);
  }, [searchQuery, triggerSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerSearch();
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSearchQuery("");
      setStudents([]);
    }
  };

  const handleLinkStudent = async (studentProfileId: number) => {
    setSubmitting(studentProfileId);
    try {
      // POST /api/v1/parents/{user_id}/students/{student_profile_id}
      await api.post(`/parents/${parentId}/students/${studentProfileId}`);
      setOpen(false);
      setStudents([]);
      setSearchQuery("");
      
      // Forces Next.js Server Components to re-fetch parallel data streams natively
      router.refresh(); 
    } catch (err) {
      console.error("Linking relation dispatch failed:", err);
      toast.error("Could not complete linking. Student might already be attached to this guardian.");
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="px-3.5 py-1.5 bg-[#0038A8] hover:bg-[#002b80] text-white font-extrabold text-[10px] rounded-xl shadow-sm transition-all flex items-center gap-1 uppercase tracking-wider ml-auto">
          <Plus className="h-3.5 w-3.5" /> Link Student
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-3xl p-6 bg-white border border-slate-100 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-base font-black text-gray-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-[#0038A8]" />
            Link Student to Guardian
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
          <div className="relative flex-1 flex items-center gap-2 text-xs rounded-xl ring-[1.5px] ring-border bg-background px-2.5 transition-all focus-within:ring-[#0038A8]/60">
            <Search className="h-3.5 w-3.5 text-muted-foreground/75 shrink-0" />
            <input
              type="text"
              placeholder="Search by student name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2.5 bg-transparent outline-none text-foreground text-xs"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-all shadow-sm"
          >
            Find
          </button>
        </form>

        <div className="mt-4 max-h-[240px] overflow-y-auto space-y-2 pr-1 select-none">
          {loading ? (
            <div className="py-8 flex justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-[#0038A8]" />
            </div>
          ) : students.length > 0 ? (
            students.map((s: any) => {
              // 🛡️ TYPE SAFE SAFEGUARD: Force extraction of the actual sub-profile database integer ID
              const profileId = s.student_profile_id || s.student_profile?.id || (!isNaN(Number(s.id)) ? Number(s.id) : null);
              
              // Skip mapping row if the core integer target could not be parsed safely
              if (!profileId) return null;

              return (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 hover:bg-slate-50 transition-all">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{s.full_name || s.username}</p>
                    <p className="text-[10px] text-muted-foreground font-mono truncate">{s.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleLinkStudent(profileId)}
                    disabled={submitting !== null}
                    className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-all shrink-0 flex items-center gap-1"
                  >
                    {submitting === profileId ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Attach"
                    )}
                  </button>
                </div>
              );
            })
          ) : searchQuery && !loading ? (
            <p className="text-xs text-center text-muted-foreground py-6 italic">No registered students found matching criteria.</p>
          ) : (
            <p className="text-xs text-center text-muted-foreground/60 py-6 italic">Search student register to link relationship.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}