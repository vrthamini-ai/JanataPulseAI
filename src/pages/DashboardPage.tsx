import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, ShieldAlert, CheckCircle, Clock, AlertCircle, 
  MapPin, Tag, BarChart3, Search, Filter, RefreshCw, Eye, ArrowUpDown,
  FileSpreadsheet, Sparkles, Copy, Printer, X
} from "lucide-react";
import { Issue, DashboardStats } from "../types";
import { getIssues, getDashboardStats, updateIssueStatus, generateBrief } from "../api";

interface DashboardPageProps {
  onViewIssue: (id: string) => void;
}

export default function DashboardPage({ onViewIssue }: DashboardPageProps) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // MP Brief generation modal states
  const [selectedBriefIssue, setSelectedBriefIssue] = useState<Issue | null>(null);
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [briefMarkdown, setBriefMarkdown] = useState<string | null>(null);
  const [briefError, setBriefError] = useState("");
  const [briefMsgIndex, setBriefMsgIndex] = useState(0);

  const policyMsgs = [
    "Consulting local policy guidelines...",
    "Querying the Gemini-3.5 cognitive planner...",
    "Drafting PWD and sanitation department legal notices...",
    "Assembling citizen aggregate density statistics...",
    "Formatting Member of Parliament official brief...",
    "Polishing draft action templates..."
  ];

  useEffect(() => {
    let timer: any;
    if (isGeneratingBrief) {
      timer = setInterval(() => {
        setBriefMsgIndex((prev) => (prev + 1) % policyMsgs.length);
      }, 2500);
    } else {
      setBriefMsgIndex(0);
    }
    return () => clearInterval(timer);
  }, [isGeneratingBrief]);

  const handleOpenBriefModal = async (issue: Issue) => {
    setSelectedBriefIssue(issue);
    setIsGeneratingBrief(true);
    setBriefMarkdown(null);
    setBriefError("");
    try {
      const response = await generateBrief(issue.id);
      setBriefMarkdown(response.brief);
    } catch (err) {
      setBriefError("The AI cognitive brief compiler failed to construct the briefing document. Please retry.");
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  const copyBriefToClipboard = () => {
    if (!briefMarkdown) return;
    navigator.clipboard.writeText(briefMarkdown);
    alert("Official MP Brief copied to clipboard successfully!");
  };

  const renderSimpleMarkdown = (markdown: string) => {
    const lines = markdown.split("\n");
    return lines.map((line, i) => {
      if (line.startsWith("# ")) {
        return <h1 key={i} className="text-base font-extrabold text-slate-900 border-b border-slate-200 pb-1.5 mt-4 mb-2 font-display">{line.substring(2)}</h1>;
      }
      if (line.startsWith("## ")) {
        return <h2 key={i} className="text-sm font-bold text-slate-800 mt-3.5 mb-1.5 font-display">{line.substring(3)}</h2>;
      }
      if (line.startsWith("### ")) {
        return <h3 key={i} className="text-xs font-bold text-indigo-700 uppercase tracking-wide mt-2.5 mb-1 font-display">{line.substring(4)}</h3>;
      }
      if (line.startsWith("- ")) {
        return <li key={i} className="ml-3 list-disc text-slate-600 mt-0.5 mb-0.5 leading-relaxed text-[11px]">{line.substring(2)}</li>;
      }
      if (line.startsWith("* ")) {
        return <li key={i} className="ml-3 list-disc text-slate-600 mt-0.5 mb-0.5 leading-relaxed text-[11px]">{line.substring(2)}</li>;
      }
      if (line.trim() === "") {
        return <div key={i} className="h-1"></div>;
      }
      return <p key={i} className="text-slate-600 mt-1 mb-1 leading-relaxed font-medium text-[11px]">{line}</p>;
    });
  };

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [wardFilter, setWardFilter] = useState("");

  // Sorting
  const [sortBy, setSortBy] = useState<"priority" | "date" | "people">("priority");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const fetchedIssues = await getIssues();
      const fetchedStats = await getDashboardStats();
      setIssues(fetchedIssues);
      setStats(fetchedStats);
    } catch (err) {
      setError("Failed to synchronize with the constituency server database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusChange = async (id: string, newStatus: Issue["status"]) => {
    try {
      await updateIssueStatus(id, newStatus);
      // Hot reload the tables and widgets
      const updatedIssues = await getIssues();
      const updatedStats = await getDashboardStats();
      setIssues(updatedIssues);
      setStats(updatedStats);
    } catch (err) {
      alert("Failed to update status on server.");
    }
  };

  const toggleSort = (field: "priority" | "date" | "people") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  // Filter & Sort Logic
  const filteredIssues = issues
    .filter((issue) => {
      const matchQuery = 
        issue.complaint_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.translated_summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (issue.citizen_name && issue.citizen_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        issue.location.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchCategory = categoryFilter ? issue.category === categoryFilter : true;
      const matchPriority = priorityFilter ? issue.priority_level === priorityFilter : true;
      const matchStatus = statusFilter ? issue.status === statusFilter : true;
      const matchWard = wardFilter ? issue.ward === wardFilter : true;

      return matchQuery && matchCategory && matchPriority && matchStatus && matchWard;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === "priority") {
        comparison = a.priority_score - b.priority_score;
      } else if (sortBy === "people") {
        comparison = a.people_affected - b.people_affected;
      } else if (sortBy === "date") {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }

      return sortOrder === "desc" ? -comparison : comparison;
    });

  // Extract unique categories and wards for dropdowns
  const uniqueCategories = Array.from(new Set(issues.map((i) => i.category)));
  const uniqueWards = Array.from(new Set(issues.map((i) => i.ward)));

  // Priority badge styling helper
  const getPriorityBadgeClass = (level: string) => {
    switch (level) {
      case "Critical":
        return "bg-red-50 text-red-700 border-red-200";
      case "High":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "Medium":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
  };

  // Status badge style helper
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Resolved":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Forwarded to Department":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "In Review":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-700"></div>
        <p className="text-sm font-semibold text-slate-500 tracking-wide">Syncing administrative records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Page Title Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 font-display">
            Constituency Command & Triage Dashboard
          </h2>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">
            Real-Time Analysis of Madurai Citizen Priorities
          </p>
        </div>
        
        <button 
          onClick={fetchData}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-slate-600 font-bold text-xs shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh DB Nodes</span>
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Complaints */}
          <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 flex flex-col justify-between h-28">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Reports</p>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-extrabold text-slate-900">{stats.total}</span>
              <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded font-bold">+12% wk</span>
            </div>
          </div>

          {/* Critical Priorities */}
          <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 flex flex-col justify-between h-28">
            <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Critical Issues</p>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-extrabold text-red-600">{stats.critical}</span>
              <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded font-bold">Awaiting Action</span>
            </div>
          </div>

          {/* High Priority */}
          <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 flex flex-col justify-between h-28">
            <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">High Priority</p>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-extrabold text-orange-600">{stats.high}</span>
              <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded font-bold">In Pipeline</span>
            </div>
          </div>

          {/* Resolved */}
          <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 flex flex-col justify-between h-28">
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Resolved Issues</p>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-extrabold text-emerald-600">{stats.resolved}</span>
              <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-bold">Completed</span>
            </div>
          </div>
        </div>
      )}

      {/* Meta stats banner */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200/60 p-4 rounded-xl text-xs flex items-center justify-between text-blue-900 font-semibold shadow-2xs">
            <span className="text-blue-700/80 uppercase font-bold tracking-wider">Most Affected Ward</span>
            <span className="flex items-center gap-1 font-extrabold bg-blue-100 px-3 py-1 rounded-md text-blue-900">
              <MapPin className="w-3.5 h-3.5" />
              {stats.mostAffectedWard ? (stats.mostAffectedWard.includes(" (") ? stats.mostAffectedWard.split(" (")[0] : stats.mostAffectedWard) : "General Ward"}
            </span>
          </div>

          <div className="bg-amber-50 border border-amber-200/60 p-4 rounded-xl text-xs flex items-center justify-between text-amber-900 font-semibold shadow-2xs">
            <span className="text-amber-700/80 uppercase font-bold tracking-wider">Top Category concern</span>
            <span className="flex items-center gap-1 font-extrabold bg-amber-100 px-3 py-1 rounded-md text-amber-900">
              <Tag className="w-3.5 h-3.5" />
              {stats.topCategory}
            </span>
          </div>

          <div className="bg-purple-50 border border-purple-200/60 p-4 rounded-xl text-xs flex items-center justify-between text-purple-900 font-semibold shadow-2xs">
            <span className="text-purple-700/80 uppercase font-bold tracking-wider">Avg Triage Severity</span>
            <span className="flex items-center gap-1 font-extrabold bg-purple-100 px-3 py-1 rounded-md text-purple-900">
              <BarChart3 className="w-3.5 h-3.5" />
              {stats.averageSeverity}/5 Severity
            </span>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-700 font-display uppercase tracking-wider border-b border-slate-100 pb-2">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Filing Queue Filters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search complaint text, location..." 
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Category */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 focus:border-blue-500 focus:outline-hidden bg-slate-50/50 appearance-none"
          >
            <option value="">All Categories</option>
            {uniqueCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Priority */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 focus:border-blue-500 focus:outline-hidden bg-slate-50/50 appearance-none"
          >
            <option value="">All Priority Levels</option>
            <option value="Critical">Critical (80+)</option>
            <option value="High">High (60-79)</option>
            <option value="Medium">Medium (40-59)</option>
            <option value="Low">Low (&lt;40)</option>
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 focus:border-blue-500 focus:outline-hidden bg-slate-50/50 appearance-none"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Review">In Review</option>
            <option value="Forwarded to Department">Forwarded to Department</option>
            <option value="Resolved">Resolved</option>
          </select>

          {/* Ward */}
          <select
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 focus:border-blue-500 focus:outline-hidden bg-slate-50/50 appearance-none"
          >
            <option value="">All Wards</option>
            {uniqueWards.map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Complaints Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Filing Records ({filteredIssues.length} matching complaints)
          </span>

          <div className="flex gap-2 text-xs font-bold text-slate-400">
            <span className="text-slate-600">Sorting:</span>
            <button 
              onClick={() => toggleSort("priority")}
              className={`hover:text-blue-700 flex items-center gap-0.5 cursor-pointer ${sortBy === "priority" ? "text-blue-700 underline" : ""}`}
            >
              Priority Score {sortBy === "priority" && (sortOrder === "desc" ? "↓" : "↑")}
            </button>
            <span>•</span>
            <button 
              onClick={() => toggleSort("people")}
              className={`hover:text-blue-700 flex items-center gap-0.5 cursor-pointer ${sortBy === "people" ? "text-blue-700 underline" : ""}`}
            >
              Impact Size {sortBy === "people" && (sortOrder === "desc" ? "↓" : "↑")}
            </button>
            <span>•</span>
            <button 
              onClick={() => toggleSort("date")}
              className={`hover:text-blue-700 flex items-center gap-0.5 cursor-pointer ${sortBy === "date" ? "text-blue-700 underline" : ""}`}
            >
              Date filed {sortBy === "date" && (sortOrder === "desc" ? "↓" : "↑")}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/20">
                <th className="py-3 px-6">Priority Score</th>
                <th className="py-3 px-4">Citizen / Grievance</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Ward / Landmark</th>
                <th className="py-3 px-4">People Affected</th>
                <th className="py-3 px-4">Administrative Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredIssues.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center font-semibold text-slate-400">
                    No matching filing records found under current filters.
                  </td>
                </tr>
              ) : (
                filteredIssues.map((issue, index) => (
                  <tr key={issue.id} className="hover:bg-slate-50/40 transition-colors">
                    {/* Priority Score Badges */}
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-2">
                        <span className={`w-8.5 h-8 rounded-lg flex items-center justify-center font-extrabold text-sm border font-mono ${
                          issue.priority_level === "Critical" 
                            ? "bg-red-500 text-white border-red-600" 
                            : issue.priority_level === "High"
                            ? "bg-orange-500 text-white border-orange-600"
                            : issue.priority_level === "Medium"
                            ? "bg-amber-100 text-amber-800 border-amber-300"
                            : "bg-emerald-100 text-emerald-800 border-emerald-300"
                        }`}>
                          {issue.priority_score}
                        </span>
                        <div>
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] uppercase border tracking-wider block text-center ${getPriorityBadgeClass(issue.priority_level)}`}>
                            {issue.priority_level}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Grievance details */}
                    <td className="py-3.5 px-4 max-w-sm">
                      <span className="font-bold text-slate-800 block truncate">
                        {issue.citizen_name || "Anonymous Citizen"}
                      </span>
                      <p className="text-slate-500 line-clamp-2 mt-0.5 font-medium leading-relaxed">
                        {issue.translated_summary}
                      </p>
                      {issue.language !== "English" && (
                        <span className="inline-block mt-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded-sm">
                          Orig: {issue.language}
                        </span>
                      )}
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 font-bold text-slate-700">
                      {issue.category}
                      <span className="block font-normal text-slate-400 text-[10px] mt-0.5">
                        {issue.sub_category}
                      </span>
                    </td>

                    {/* Ward & location */}
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {issue.ward ? (issue.ward.includes(" (") ? issue.ward.split(" (")[0] : issue.ward) : "General Ward"}
                      <span className="block font-normal text-slate-400 text-[10px] mt-0.5 truncate max-w-xs">
                        {issue.location}
                      </span>
                    </td>

                    {/* People Affected */}
                    <td className="py-3.5 px-4 font-bold text-slate-700 font-mono">
                      ~{issue.people_affected}
                      {issue.duplicate_count > 1 && (
                        <span className="block text-[10px] font-bold text-blue-600 uppercase tracking-wide mt-0.5">
                          {issue.duplicate_count} reports
                        </span>
                      )}
                    </td>

                    {/* Status selection widget */}
                    <td className="py-3.5 px-4">
                      <select
                        value={issue.status}
                        onChange={(e) => handleStatusChange(issue.id, e.target.value as Issue["status"])}
                        className={`text-[11px] font-bold border rounded-lg px-2 py-1.5 focus:outline-hidden cursor-pointer ${getStatusBadgeClass(issue.status)}`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Review">In Review</option>
                        <option value="Forwarded to Department">Forwarded to Department</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </td>

                    {/* Detail Link actions */}
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenBriefModal(issue)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-600 text-white font-bold text-[10px] uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-2xs"
                          title="Generate MP Brief"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          <span>Brief</span>
                        </button>
                        <button
                          onClick={() => onViewIssue(issue.id)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ONE-CLICK MP BRIEF MODAL */}
      <AnimatePresence>
        {selectedBriefIssue && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden max-w-2xl w-full flex flex-col max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="px-6 py-4.5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-indigo-700" />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">AI Administrative Toolkit</span>
                    <span className="text-sm font-extrabold text-slate-800">
                      MP Official Briefing Document
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedBriefIssue(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {isGeneratingBrief ? (
                  <div className="py-16 flex flex-col items-center justify-center gap-4">
                    <div className="relative flex items-center justify-center">
                      <div className="animate-ping absolute inline-flex h-12 w-12 rounded-full bg-indigo-500 opacity-20"></div>
                      <div className="rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600 animate-spin"></div>
                    </div>
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-widest animate-pulse max-w-[280px] text-center leading-relaxed">
                      {policyMsgs[briefMsgIndex]}
                    </span>
                  </div>
                ) : briefError ? (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl space-y-2 text-xs font-medium text-center">
                    <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
                    <p>{briefError}</p>
                    <button
                      onClick={() => handleOpenBriefModal(selectedBriefIssue!)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg uppercase tracking-wider text-[10px] transition-all cursor-pointer"
                    >
                      Retry Compiler
                    </button>
                  </div>
                ) : briefMarkdown ? (
                  <div className="bg-slate-50 border border-slate-200/60 p-6 rounded-2xl shadow-inner max-w-none text-xs space-y-4">
                    {renderSimpleMarkdown(briefMarkdown)}
                  </div>
                ) : null}
              </div>

              {/* Modal Footer */}
              {briefMarkdown && !isGeneratingBrief && (
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center gap-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Confidential — Official Use Only
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={copyBriefToClipboard}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 rounded-xl font-bold text-xs shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy Text</span>
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl font-bold text-xs shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
