import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Award, Layers, Users, MapPin, Building2, HelpCircle, 
  Wrench, CheckCircle, RefreshCw, ChevronRight, AlertTriangle
} from "lucide-react";
import { Cluster } from "../types";
import { getPriorities } from "../api";

interface PriorityBoardPageProps {
  onViewIssue: (id: string) => void;
  onSelectClusterIssues: (issueIds: string[]) => void; // Filter dashboard issues
}

export default function PriorityBoardPage({ onViewIssue, onSelectClusterIssues }: PriorityBoardPageProps) {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchClusters = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getPriorities();
      setClusters(data);
    } catch (err) {
      setError("Failed to fetch constituency development clusters.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClusters();
  }, []);

  const getPriorityColor = (score: number) => {
    if (score >= 80) return "text-red-600 border-red-200 bg-red-50";
    if (score >= 60) return "text-orange-600 border-orange-200 bg-orange-50";
    if (score >= 40) return "text-amber-600 border-amber-200 bg-amber-50";
    return "text-emerald-600 border-emerald-200 bg-emerald-50";
  };

  const getProgressBarColor = (score: number) => {
    if (score >= 80) return "bg-red-500";
    if (score >= 60) return "bg-orange-500";
    if (score >= 40) return "bg-amber-500";
    return "bg-emerald-500";
  };

  if (loading && clusters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-700"></div>
        <p className="text-sm font-semibold text-slate-500 tracking-wide">Assembling priority development board...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 font-display">
            Constituency Priority Planning Board
          </h2>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">
            Ranked Development Clusters compiled from duplicates and density metrics
          </p>
        </div>

        <button 
          onClick={fetchClusters}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-slate-600 font-bold text-xs shadow-2xs hover:shadow-xs transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync Board Metrics</span>
        </button>
      </div>

      {/* Explanatory Banner of the formula */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-md">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/25 text-orange-400 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-bold font-display uppercase tracking-widest text-orange-400">
              MP Decision-Support: The Priority Scoring Engine
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              Constituency issues are grouped into clusters automatically when they fall inside the same Category and Ward. They are ranked using an evidence-based Priority Index:
            </p>
            <div className="bg-slate-950/60 rounded-lg p-3 text-[11px] font-mono border border-slate-800 text-indigo-300 overflow-x-auto">
              Priority Score = (Severity * 30) + (Urgency * 20) + (Normalized Public Scale * 20) + ((Reports - 1) * 10) + (Vulnerability Index * 10) + (Evidence Strength * 10) - (Spam Factor * 20)
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              * Score Thresholds: <strong className="text-red-400">80+ Critical Priority</strong> | <strong className="text-orange-400">60-79 High Priority</strong> | <strong className="text-amber-400">40-59 Medium Priority</strong> | <strong className="text-emerald-400">Below 40 Low Priority</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Priority clusters listed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {clusters.map((cluster, idx) => (
          <motion.div
            key={cluster.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.05 }}
            className="bg-white rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-sm hover:border-slate-300 overflow-hidden flex flex-col justify-between"
          >
            {/* Card Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/40">
              <div className="flex items-center justify-between gap-4 mb-2">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-200/50 px-2 py-0.5 rounded-md border border-slate-200">
                  <Layers className="w-3 h-3 text-slate-500" />
                  <span>Rank #{idx + 1} Cluster</span>
                </span>
                
                {/* Score badge */}
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border shadow-2xs ${getPriorityColor(cluster.average_priority_score)}`}>
                  <span>Avg Priority Score:</span>
                  <span className="font-mono text-sm">{cluster.average_priority_score}</span>
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 font-display line-clamp-1">
                {cluster.title}
              </h3>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{cluster.location}</span>
              </p>
            </div>

            {/* Card Body */}
            <div className="p-5 space-y-4 text-xs">
              {/* Stats Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Duplicate Reports</span>
                    <span className="text-sm font-extrabold text-slate-800 block">{cluster.total_reports} filings</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Public impacted scale</span>
                    <span className="text-sm font-extrabold text-slate-800 block">~{cluster.total_people_affected} residents</span>
                  </div>
                </div>
              </div>

              {/* Progress scale */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-bold text-[10px] text-slate-400 uppercase tracking-wider">
                  <span>Urgency priority scale</span>
                  <span className="text-slate-600 font-mono font-extrabold">{cluster.average_priority_score}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
                  <div 
                    className={`h-full rounded-full ${getProgressBarColor(cluster.average_priority_score)}`} 
                    style={{ width: `${cluster.average_priority_score}%` }}
                  />
                </div>
              </div>

              {/* Authority Agency mapping */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-3">
                <Building2 className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Responsible Government Agency</span>
                  <span className="text-slate-800 font-bold block mt-0.5">{cluster.recommended_department}</span>
                </div>
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border ${
                cluster.status === "Resolved" 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : cluster.status === "Forwarded to Department"
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : cluster.status === "In Review"
                  ? "bg-purple-50 text-purple-700 border-purple-200"
                  : "bg-slate-50 text-slate-600 border-slate-200"
              }`}>
                {cluster.status === "Resolved" ? (
                  <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" />
                ) : (
                  <Wrench className="w-3 h-3 text-slate-500 shrink-0" />
                )}
                <span>Cluster: {cluster.status}</span>
              </span>

              <button
                onClick={() => onSelectClusterIssues(cluster.issues)}
                className="inline-flex items-center gap-1 py-1.5 px-3.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-lg text-xs tracking-wide active:scale-95 transition-all shadow-2xs cursor-pointer"
              >
                <span>Examine filings ({cluster.total_reports})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
