"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Globe,
  Plus,
  Trash2,
  CalendarDays,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  BookOpen,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { api } from "@/lib/api";

type Term = {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  is_active: boolean;
};

type AcademicYear = {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  is_active: boolean;
  terms?: Term[];
};

export default function AcademicYearsPage() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedYear, setExpandedYear] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Create year form
  const [showCreateYear, setShowCreateYear] = useState(false);
  const [newYear, setNewYear] = useState({ name: "", start_date: "", end_date: "", is_current: false });
  const [savingYear, setSavingYear] = useState(false);

  // Create term form (per year)
  const [addingTermFor, setAddingTermFor] = useState<number | null>(null);
  const [newTerm, setNewTerm] = useState({ name: "", start_date: "", end_date: "", is_current: false });
  const [savingTerm, setSavingTerm] = useState(false);

  // Delete state
  const [deletingYear, setDeletingYear] = useState<number | null>(null);
  const [deletingTerm, setDeletingTerm] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/academic-years?limit=50");
      const raw: AcademicYear[] = Array.isArray(data) ? data : data?.data ?? [];
      // Load terms for each year
      const enriched = await Promise.all(
        raw.map(async (y) => {
          try {
            const { data: terms } = await api.get(`/academic-years/${y.id}/terms`);
            return { ...y, terms: Array.isArray(terms) ? terms : terms?.data ?? [] };
          } catch {
            return { ...y, terms: [] };
          }
        })
      );
      setYears(enriched);
    } catch (err) {
      console.error("Failed to load academic years:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const showMsg = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // Create year
  const createYear = async () => {
    if (!newYear.name || !newYear.start_date || !newYear.end_date) {
      showMsg("error", "Please fill in all required fields.");
      return;
    }
    setSavingYear(true);
    try {
      const fd = new FormData();
      fd.append("name", newYear.name);
      fd.append("start_date", newYear.start_date);
      fd.append("end_date", newYear.end_date);
      fd.append("is_current", String(newYear.is_current));
      fd.append("is_active", "true");
      await api.post("/academic-years", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setShowCreateYear(false);
      setNewYear({ name: "", start_date: "", end_date: "", is_current: false });
      await loadData();
      showMsg("success", "Academic year created successfully.");
    } catch (err: any) {
      showMsg("error", err?.response?.data?.detail || "Failed to create academic year.");
    } finally {
      setSavingYear(false);
    }
  };

  // Toggle is_current for a year
  const toggleYearCurrent = async (year: AcademicYear) => {
    try {
      const fd = new FormData();
      fd.append("is_current", String(!year.is_current));
      await api.put(`/academic-years/${year.id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      await loadData();
      showMsg("success", `"${year.name}" marked as ${!year.is_current ? "current" : "not current"}.`);
    } catch (err: any) {
      showMsg("error", err?.response?.data?.detail || "Failed to update year.");
    }
  };

  // Delete year
  const deleteYear = async (id: number) => {
    if (!confirm("Delete this academic year? This cannot be undone.")) return;
    setDeletingYear(id);
    try {
      await api.delete(`/academic-years/${id}`);
      await loadData();
      showMsg("success", "Academic year deleted.");
    } catch (err: any) {
      showMsg("error", err?.response?.data?.detail || "Failed to delete year. It may have dependent records.");
    } finally {
      setDeletingYear(null);
    }
  };

  // Create term
  const createTerm = async (yearId: number) => {
    if (!newTerm.name || !newTerm.start_date || !newTerm.end_date) {
      showMsg("error", "Please fill in all term fields.");
      return;
    }
    setSavingTerm(true);
    try {
      const fd = new FormData();
      fd.append("name", newTerm.name);
      fd.append("start_date", newTerm.start_date);
      fd.append("end_date", newTerm.end_date);
      fd.append("is_current", String(newTerm.is_current));
      fd.append("is_active", "true");
      await api.post(`/academic-years/${yearId}/terms`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      setAddingTermFor(null);
      setNewTerm({ name: "", start_date: "", end_date: "", is_current: false });
      await loadData();
      showMsg("success", "Term created successfully.");
    } catch (err: any) {
      showMsg("error", err?.response?.data?.detail || "Failed to create term.");
    } finally {
      setSavingTerm(false);
    }
  };

  // Toggle term is_current
  const toggleTermCurrent = async (term: Term) => {
    try {
      const fd = new FormData();
      fd.append("is_current", String(!term.is_current));
      await api.put(`/academic-years/term/${term.id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      await loadData();
      showMsg("success", `Term "${term.name}" updated.`);
    } catch (err: any) {
      showMsg("error", err?.response?.data?.detail || "Failed to update term.");
    }
  };

  // Delete term
  const deleteTerm = async (id: number) => {
    if (!confirm("Delete this term?")) return;
    setDeletingTerm(id);
    try {
      await api.delete(`/academic-years/term/${id}`);
      await loadData();
      showMsg("success", "Term deleted.");
    } catch (err: any) {
      showMsg("error", err?.response?.data?.detail || "Failed to delete term.");
    } finally {
      setDeletingTerm(null);
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen font-sans text-left">
      {/* BREADCRUMB */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wider font-bold select-none">
        <Link href="/admin" className="hover:text-foreground flex items-center gap-1"><Globe className="h-3 w-3" />Admin</Link>
        <span>/</span>
        <span className="text-foreground">Academic Years</span>
      </div>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold text-[#0038A8] uppercase tracking-wider font-mono">Administration</span>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight mt-0.5">Academic Years & Terms</h1>
          <p className="text-xs text-muted-foreground mt-1">Manage academic calendar, set the active year and term for enrollment.</p>
        </div>
        <button
          onClick={() => setShowCreateYear(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#0038A8] text-white font-black text-xs rounded-xl hover:bg-[#002D86] transition-colors shadow-md shadow-blue-500/10"
        >
          <Plus className="h-3.5 w-3.5" />New Academic Year
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`flex items-center gap-2 p-4 rounded-2xl text-sm font-semibold border ${
          message.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"
        }`}>
          {message.type === "success" ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-auto"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {/* Create Year Form */}
      {showCreateYear && (
        <div className="bg-card border border-[#0038A8]/20 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
              <Plus className="h-4 w-4 text-[#0038A8]" />Create New Academic Year
            </h3>
            <button onClick={() => setShowCreateYear(false)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wide">Year Name *</label>
              <input
                value={newYear.name}
                onChange={(e) => setNewYear((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. 2024-2025"
                className="w-full px-3 py-2 bg-muted/30 border border-border/80 focus:border-[#0038A8]/40 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#0038A8]/20 font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wide">Start Date *</label>
              <input
                type="date"
                value={newYear.start_date}
                onChange={(e) => setNewYear((p) => ({ ...p, start_date: e.target.value }))}
                className="w-full px-3 py-2 bg-muted/30 border border-border/80 focus:border-[#0038A8]/40 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#0038A8]/20 font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wide">End Date *</label>
              <input
                type="date"
                value={newYear.end_date}
                onChange={(e) => setNewYear((p) => ({ ...p, end_date: e.target.value }))}
                className="w-full px-3 py-2 bg-muted/30 border border-border/80 focus:border-[#0038A8]/40 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#0038A8]/20 font-medium"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-foreground">
              <input
                type="checkbox"
                checked={newYear.is_current}
                onChange={(e) => setNewYear((p) => ({ ...p, is_current: e.target.checked }))}
                className="rounded border-border"
              />
              Set as current academic year
            </label>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={createYear}
              disabled={savingYear}
              className="px-5 py-2 bg-[#0038A8] text-white font-black text-xs rounded-xl hover:bg-[#002D86] transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <Check className="h-3.5 w-3.5" />{savingYear ? "Creating..." : "Create Year"}
            </button>
            <button onClick={() => setShowCreateYear(false)} className="px-5 py-2 bg-muted border border-border text-muted-foreground font-bold text-xs rounded-xl hover:bg-muted/80 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Years List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 border-4 border-[#0038A8] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : years.length === 0 ? (
        <div className="bg-card border border-border/60 rounded-3xl p-12 text-center text-muted-foreground">
          <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-bold">No academic years created yet.</p>
          <button onClick={() => setShowCreateYear(true)} className="mt-3 px-4 py-2 bg-[#0038A8] text-white text-xs font-black rounded-xl">
            Create First Academic Year
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {years.map((year) => {
            const isExpanded = expandedYear === year.id;
            const terms = year.terms ?? [];

            return (
              <div key={year.id} className="bg-card border border-border/60 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.01)]">
                {/* Year header row */}
                <div className="flex items-center gap-4 px-6 py-4 border-b border-border/40 select-none">
                  <button onClick={() => setExpandedYear(isExpanded ? null : year.id)} className="text-muted-foreground hover:text-foreground transition-colors">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  <div className="h-10 w-10 rounded-2xl bg-[#0038A8]/10 text-[#0038A8] flex items-center justify-center shrink-0">
                    <CalendarDays className="h-5 w-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-black text-foreground">{year.name}</h3>
                      {year.is_current && (
                        <span className="px-2 py-0.5 bg-[#0038A8] text-white text-[9px] font-black rounded-lg uppercase tracking-wider">Current</span>
                      )}
                      <span className={`px-2 py-0.5 text-[9px] font-black rounded-lg uppercase border ${
                        year.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-muted text-muted-foreground border-border"
                      }`}>
                        {year.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                      {new Date(year.start_date).toLocaleDateString()} → {new Date(year.end_date).toLocaleDateString()}
                      &nbsp;•&nbsp;{terms.length} term{terms.length !== 1 ? "s" : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleYearCurrent(year)}
                      className={`px-3 py-1.5 text-[10px] font-black rounded-xl border transition-colors ${
                        year.is_current
                          ? "bg-[#0038A8]/10 text-[#0038A8] border-[#0038A8]/20 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                          : "bg-muted text-muted-foreground border-border hover:bg-[#0038A8]/10 hover:text-[#0038A8] hover:border-[#0038A8]/20"
                      }`}
                    >
                      {year.is_current ? "Unset Current" : "Set Current"}
                    </button>
                    <button
                      onClick={() => deleteYear(year.id)}
                      disabled={deletingYear === year.id}
                      className="p-1.5 text-muted-foreground hover:text-destructive border border-border/60 hover:border-red-200 bg-background rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Terms */}
                {isExpanded && (
                  <div className="p-4 space-y-3 bg-muted/10">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <BookOpen className="h-3 w-3" />Academic Terms
                      </p>
                      <button
                        onClick={() => setAddingTermFor(addingTermFor === year.id ? null : year.id)}
                        className="flex items-center gap-1 text-[10px] font-black text-[#8b5cf6] hover:text-[#7c3aed] bg-[#8b5cf6]/5 border border-[#8b5cf6]/15 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        <Plus className="h-3 w-3" />Add Term
                      </button>
                    </div>

                    {/* Add term form */}
                    {addingTermFor === year.id && (
                      <div className="bg-card border border-[#8b5cf6]/20 rounded-2xl p-4 space-y-3">
                        <p className="text-[10px] font-black text-[#8b5cf6] uppercase tracking-wider">New Term</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-muted-foreground uppercase">Term Name</label>
                            <input
                              value={newTerm.name}
                              onChange={(e) => setNewTerm((p) => ({ ...p, name: e.target.value }))}
                              placeholder="e.g. Semester 1"
                              className="w-full px-3 py-2 bg-muted/30 border border-border/80 focus:border-[#8b5cf6]/40 rounded-xl text-xs focus:outline-none font-medium"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-muted-foreground uppercase">Start Date</label>
                            <input
                              type="date"
                              value={newTerm.start_date}
                              onChange={(e) => setNewTerm((p) => ({ ...p, start_date: e.target.value }))}
                              className="w-full px-3 py-2 bg-muted/30 border border-border/80 focus:border-[#8b5cf6]/40 rounded-xl text-xs focus:outline-none font-medium"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-muted-foreground uppercase">End Date</label>
                            <input
                              type="date"
                              value={newTerm.end_date}
                              onChange={(e) => setNewTerm((p) => ({ ...p, end_date: e.target.value }))}
                              className="w-full px-3 py-2 bg-muted/30 border border-border/80 focus:border-[#8b5cf6]/40 rounded-xl text-xs focus:outline-none font-medium"
                            />
                          </div>
                        </div>
                        <label className="flex items-center gap-2 text-xs font-bold cursor-pointer text-foreground">
                          <input type="checkbox" checked={newTerm.is_current} onChange={(e) => setNewTerm((p) => ({ ...p, is_current: e.target.checked }))} className="rounded" />
                          Set as active term
                        </label>
                        <div className="flex gap-2">
                          <button onClick={() => createTerm(year.id)} disabled={savingTerm} className="px-4 py-1.5 bg-[#8b5cf6] text-white font-black text-xs rounded-xl hover:bg-[#7c3aed] transition-colors disabled:opacity-50 flex items-center gap-1">
                            <Check className="h-3 w-3" />{savingTerm ? "Saving..." : "Save Term"}
                          </button>
                          <button onClick={() => setAddingTermFor(null)} className="px-4 py-1.5 bg-muted border border-border font-bold text-xs rounded-xl text-muted-foreground hover:bg-muted/80 transition-colors">Cancel</button>
                        </div>
                      </div>
                    )}

                    {/* Terms list */}
                    {terms.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic text-center py-4">No terms added yet. Click &quot;Add Term&quot; to create one.</p>
                    ) : (
                      <div className="space-y-2">
                        {terms.map((term) => (
                          <div key={term.id} className="flex items-center justify-between px-4 py-3 bg-card border border-border/50 rounded-2xl hover:bg-muted/20 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="h-7 w-7 rounded-xl bg-[#8b5cf6]/10 text-[#8b5cf6] flex items-center justify-center shrink-0">
                                <BookOpen className="h-3.5 w-3.5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-xs font-black text-foreground">{term.name}</p>
                                  {term.is_current && (
                                    <span className="px-1.5 py-0.5 bg-[#8b5cf6] text-white text-[8px] font-black rounded uppercase">Active</span>
                                  )}
                                </div>
                                <p className="text-[10px] text-muted-foreground font-semibold">
                                  {new Date(term.start_date).toLocaleDateString()} → {new Date(term.end_date).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleTermCurrent(term)}
                                className={`px-2.5 py-1 text-[9px] font-black rounded-lg border transition-colors ${
                                  term.is_current
                                    ? "bg-[#8b5cf6]/10 text-[#8b5cf6] border-[#8b5cf6]/20 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                                    : "bg-muted text-muted-foreground border-border hover:bg-[#8b5cf6]/10 hover:text-[#8b5cf6] hover:border-[#8b5cf6]/20"
                                }`}
                              >
                                {term.is_current ? "Deactivate" : "Set Active"}
                              </button>
                              <button
                                onClick={() => deleteTerm(term.id)}
                                disabled={deletingTerm === term.id}
                                className="p-1 text-muted-foreground hover:text-destructive border border-border/60 hover:border-red-200 bg-background rounded-lg transition-colors disabled:opacity-50"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
