import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Building2, CheckCircle2, FileText, MapPin, Sparkles, TrendingUp, 
  HelpCircle, ShieldCheck, BarChart3, RefreshCw
} from "lucide-react";
import { DashboardStats, Issue } from "../types";
import { getDashboardStats, getIssues } from "../api";

interface PublicTransparencyPageProps {
  onBackToLanding: () => void;
}

export default function PublicTransparencyPage({ onBackToLanding }: PublicTransparencyPageProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const statsData = await getDashboardStats();
      const issuesData = await getIssues();
      setStats(statsData);
      setIssues(issuesData);
    } catch (err) {
      setError("Failed to sync transparency ledger.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute overall resolution index (Resolved / Total * 100)
  const getResolutionIndex = () => {
    if (!stats || stats.total === 0) return 0;
    return Math.round((stats.resolved / stats.total) * 100);
  };

  // Filter complaints list to only show non-confidential variables
  // Sorted by recent date
  const publicIssuesList = [...issues]
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .map((issue) => ({
      id: issue.id,
      category: issue.category,
      summary: issue.translated_summary || issue.complaint_text,
      location: issue.ward ? (issue.ward.includes(" (") ? issue.ward.split(" (")[0] : issue.ward) : "General Ward",
      status: issue.status,
      date: issue.created_at ? new Date(issue.created_at).toLocaleDateString() : "Pending",
      priority: issue.priority_level || issue.issue_priority_level || "Medium"
    }))
    .slice(0, 10); // Display 10 recent key developments

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
        <p className="text-sm font-semibold text-slate-500">Syncing public transparency ledger...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      {/* Exit Button */}
      <div className="flex justify-between items-center">
        <button 
          onClick={onBackToLanding}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm font-semibold transition-colors"
        >
          &larr; Return to main menu
        </button>
        {error && (
          <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-lg">
            {error}
          </span>
        )}
      </div>

      {/* Hero section */}
      <div className="text-center bg-gradient-to-r from-blue-700 via-indigo-800 to-indigo-950 text-white rounded-xl p-8 border border-indigo-900 shadow-md relative overflow-hidden">
        {/* Background decorative saffron / green bars (Indian tri-color theme) */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-500 via-white to-emerald-500"></div>
        
        <div className="relative z-10 space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-[10px] font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Public Accountability Portal</span>
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight font-display">
            JanataPulse AI — Constituency Ledgers
          </h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Real-time public transparency dashboard. Monitor general filing numbers, municipal resolution metrics, and local concern weights.
          </p>
        </div>
      </div>

      {/* Core Public Widgets */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Submitted */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100 shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Submitted Concerns</span>
              <span className="text-2xl font-extrabold text-slate-800 block">{stats.total} grievances</span>
            </div>
          </div>

          {/* Total Resolved */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Fully Resolved</span>
              <span className="text-2xl font-extrabold text-emerald-700 block">{stats.resolved} issues</span>
            </div>
          </div>

          {/* Overall Resolution index */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100 shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Resolution Index</span>
              <span className="text-2xl font-extrabold text-indigo-700 block">{getResolutionIndex()}% Ratio</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-5 gap-6">
        {/* Ward-wise Count & Top Concerns (Col 1-2) */}
        {stats && (
          <div className="md:col-span-2 space-y-6">
            {/* Ward wise volumes */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-xs font-bold font-display uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Ward-wise Issue Volumes</span>
              </h3>
              <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                {stats.wardIssues.map((w, idx) => (
                  <div key={idx} className="space-y-1 text-xs">
                    <div className="flex justify-between font-bold text-slate-700">
                      <span>{w.ward ? (w.ward.includes(" (") ? w.ward.split(" (")[0] : w.ward) : "General Ward"}</span>
                      <span className="text-slate-400">{w.count} reports</span>
                    </div>
                    {/* Visual meter bar */}
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-100">
                      <div 
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((w.count / stats.total) * 100 + 10, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Privacy Shield Banner */}
            <div className="bg-emerald-950 text-emerald-300 rounded-xl p-4 border border-emerald-900/60 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1 font-semibold leading-relaxed">
                <span className="text-white block uppercase tracking-wider text-[10px] font-bold">Privacy Shield Activated</span>
                <span>To comply with state data protection regulations, all public reports have voter names, mobile numbers, and exact door landmarks masked.</span>
              </div>
            </div>
          </div>
        )}

        {/* Public Development ledger (Col 3-5) */}
        <div className="md:col-span-3 bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4">
          <h3 className="text-xs font-bold font-display uppercase tracking-widest text-slate-400 flex items-center gap-1.5 border-b border-slate-100 pb-3">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <span>Active Grievances & Key Developments</span>
          </h3>

          <div className="space-y-3.5 max-h-[450px] overflow-y-auto pr-1">
            {publicIssuesList.map((issue) => (
              <div 
                key={issue.id} 
                className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/20 transition-all flex items-start justify-between gap-4 text-xs font-semibold"
              >
                <div className="space-y-1 max-w-md">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-800">{issue.category}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">• {issue.location}</span>
                  </div>
                  <p className="text-slate-500 font-medium leading-relaxed italic truncate max-w-xs md:max-w-md">
                    "{issue.summary}"
                  </p>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block font-mono">
                    Filed: {issue.date}
                  </span>
                </div>

                <div className="text-right shrink-0">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                    issue.status === "Resolved" 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                      : "bg-blue-50 text-blue-700 border-blue-200"
                  }`}>
                    {issue.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
