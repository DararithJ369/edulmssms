"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Globe, Search, Clock, ShieldAlert, Monitor, 
  User as UserIcon, HelpCircle, ChevronRight, Activity 
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "react-toastify";

type UserBrief = {
  id: string;
  username: string;
  email: string;
};

type AuditLogItem = {
  id: number;
  user_id: string | null;
  action: string;
  message: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user: UserBrief | null;
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalLogs, setTotalLogs] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/audit-logs?page=${currentPage}&limit=15&search=${searchQuery}`);
      setLogs(res.data.data || []);
      setTotalLogs(res.data.meta?.total || 0);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load audit logs timeline.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentPage]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchLogs();
  };

  const getActionBadgeColor = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes("LOGIN") || act.includes("LOGOUT")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200/50";
    }
    if (act.includes("CREATE")) {
      return "bg-violet-50 text-violet-700 border-violet-200/50";
    }
    if (act.includes("UPDATE")) {
      return "bg-amber-50 text-amber-700 border-amber-200/50";
    }
    if (act.includes("DELETE")) {
      return "bg-rose-50 text-rose-700 border-rose-200/50";
    }
    return "bg-slate-50 text-slate-700 border-slate-200/50";
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      // Format as e.g. Jun 6, 2026 at 1:46 PM
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    } catch (e) {
      return dateStr;
    }
  };

  const getInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
  };

  const limitPerPage = 15;
  const totalPages = Math.ceil(totalLogs / limitPerPage) || 1;

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen relative font-sans text-left transition-all duration-300">
      
      {/* BREADCRUMB */}
      <div className="flex items-center gap-1 text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider mb-2 select-none">
        <Link href="/" className="hover:text-foreground flex items-center gap-1">
          <Globe className="h-3 w-3" />
          Home
        </Link>
        <span>/</span>
        <span className="text-foreground">Audit Logs</span>
      </div>

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none mb-6">
        <div>
          <span className="text-xs font-extrabold text-[#0038A8] uppercase tracking-wider font-mono">
            System Administration
          </span>
          <h1 className="text-xl md:text-3xl font-black text-gray-900 tracking-tight leading-tight mt-0.5">
            Audit logs timeline
          </h1>
        </div>
      </div>

      {/* FILTER & SEARCH PANEL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-3 select-none">
        <div className="flex items-center gap-2 text-xs font-extrabold text-muted-foreground">
          <span className="px-2.5 py-1 bg-white border border-border/80 text-foreground rounded-lg shadow-sm">
            {totalLogs} Recorded Actions
          </span>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 md:flex-initial">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
            <input
              type="text"
              placeholder="Search actions or messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64 pl-9 pr-4 py-2 text-xs bg-white border border-border/80 focus:border-[#0038A8]/50 rounded-xl outline-none text-foreground"
            />
          </form>
        </div>
      </div>

      {/* TIMELINE LIST */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="h-10 w-10 border-4 border-[#0038A8] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-bold text-muted-foreground">Loading audit log timeline...</p>
        </div>
      ) : logs.length > 0 ? (
        <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.01)] relative">
          
          {/* Vertical timeline spine */}
          <div className="absolute left-11 top-8 bottom-8 w-[1.5px] bg-slate-100 hidden md:block" />

          <div className="space-y-6">
            {logs.map((log) => (
              <div
                key={log.id}
                className="relative flex flex-col md:flex-row md:items-start gap-4 p-4 rounded-2xl hover:bg-slate-50/50 transition-colors group"
              >
                {/* Visual indicator (timeline bubble) */}
                <div className="h-10 w-10 rounded-2xl bg-white border-2 border-slate-200/80 text-slate-500 flex items-center justify-center shrink-0 z-10 shadow-xs group-hover:border-violet-500/35 transition-colors">
                  <Activity className="h-4 w-4" />
                </div>

                {/* Timeline contents */}
                <div className="flex-1 text-left space-y-2">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 border text-[9px] font-black uppercase tracking-wider rounded-lg ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                      {log.user ? (
                        <span className="text-xs font-extrabold text-foreground">
                          {log.user.username}
                        </span>
                      ) : (
                        <span className="text-xs font-extrabold text-muted-foreground italic">
                          system-operator
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono shrink-0 select-none">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{formatTimestamp(log.created_at)}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                    {log.message}
                  </p>

                  {/* Metadata: IP / User-Agent */}
                  <div className="flex items-center gap-4 flex-wrap text-[10px] text-muted-foreground pt-1 select-none">
                    {log.ip_address && (
                      <span className="px-2 py-0.5 bg-slate-100 border border-slate-200/35 rounded-md font-mono">
                        IP: {log.ip_address}
                      </span>
                    )}
                    {log.user_agent && (
                      <div className="flex items-center gap-1 max-w-xs md:max-w-md truncate" title={log.user_agent}>
                        <Monitor className="h-3 w-3 shrink-0" />
                        <span className="truncate">{log.user_agent}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      ) : (
        <div className="bg-card border border-border/60 rounded-3xl p-16 text-center text-muted-foreground">
          <ShieldAlert className="h-10 w-10 mx-auto mb-2 opacity-25" />
          <p className="text-sm font-bold">No recorded audit logs found matching constraints.</p>
        </div>
      )}

      {/* PAGINATION PANEL */}
      {totalPages > 1 && (
        <div className="bg-card border border-border/60 rounded-3xl p-4 shadow-sm flex justify-center items-center select-none gap-2 shrink-0">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            className="px-3 py-1.5 text-xs font-bold border border-border rounded-xl disabled:opacity-40 hover:bg-slate-50 bg-white"
          >
            Prev
          </button>
          <span className="text-xs font-extrabold px-3 text-muted-foreground uppercase">
            Page {currentPage} of {totalPages}
          </span>
          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            className="px-3 py-1.5 text-xs font-bold border border-border rounded-xl disabled:opacity-40 hover:bg-slate-50 bg-white"
          >
            Next
          </button>
        </div>
      )}

    </div>
  );
}
