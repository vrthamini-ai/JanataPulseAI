import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, ShieldAlert, CheckCircle, RefreshCw, ChevronLeft, MapPin, 
  Calendar, Phone, User, BrainCircuit, FileSpreadsheet, Building2, Clock, 
  MessageSquare, Sparkles, Send, Copy, AlertTriangle, Printer, Layers
} from "lucide-react";
import { Issue } from "../types";
import { getIssueById, updateIssueStatus, generateBrief, getIssues } from "../api";

interface IssueDetailPageProps {
  id: string;
  onBack: () => void;
  onViewIssue?: (id: string) => void;
}

export default function IssueDetailPage({ id, onBack, onViewIssue }: IssueDetailPageProps) {
  const [issue, setIssue] = useState<Issue | null>(null);
  const [siblingIssues, setSiblingIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // MP Brief generation state
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [briefMarkdown, setBriefMarkdown] = useState<string | null>(null);
  const [briefMsgIndex, setBriefMsgIndex] = useState(0);

  const policyMsgs = [
    "Consulting local policy guidelines...",
    "Querying the Gemini-3.5 cognitive planner...",
    "Drafting PWD and sanitation department legal notices...",
    "Assembling citizen aggregate density statistics...",
    "Formatting Member of Parliament official brief...",
    "Polishing draft action templates..."
  ];

  const fetchIssueDetail = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getIssueById(id);
      setIssue(data);
      
      // Fetch duplicate siblings under the same cluster
      try {
        const allIssues = await getIssues();
        const siblings = allIssues.filter(
          (i) => i.cluster_key === data.cluster_key && i.id !== data.id
        );
        setSiblingIssues(siblings);
      } catch (sibErr) {
        console.error("Failed to load sibling issues:", sibErr);
      }
    } catch (err) {
      setError("Failed to fetch detailed grievance file from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssueDetail();
  }, [id]);

  // Interval rotation for brief messages
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

  const handleStatusChange = async (newStatus: Issue["status"]) => {
    if (!issue) return;
    try {
      await updateIssueStatus(issue.id, newStatus);
      await fetchIssueDetail();
    } catch (err) {
      alert("Failed to modify official pipeline status.");
    }
  };

  const handleCreateBrief = async () => {
    if (!issue) return;
    setIsGeneratingBrief(true);
    setBriefMarkdown(null);
    try {
      const response = await generateBrief(issue.id);
      setBriefMarkdown(response.brief);
    } catch (err) {
      alert("AI report generator failed. Please retry.");
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  const copyBriefToClipboard = () => {
    if (!briefMarkdown) return;
    navigator.clipboard.writeText(briefMarkdown);
    alert("Official MP Brief copied to clipboard successfully!");
  };

  // Simple clean markdown-to-html renderer
  const renderSimpleMarkdown = (markdown: string) => {
    const lines = markdown.split("\n");
    return lines.map((line, i) => {
      // Headers
      if (line.startsWith("# ")) {
        return <h1 key={i} className="text-xl font-extrabold text-slate-900 border-b border-slate-200 pb-2 mt-6 mb-3 font-display">{line.substring(2)}</h1>;
      }
      if (line.startsWith("## ")) {
        return <h2 key={i} className="text-lg font-bold text-slate-800 mt-5 mb-2 font-display">{line.substring(3)}</h2>;
      }
      if (line.startsWith("### ")) {
        return <h3 key={i} className="text-sm font-bold text-slate-900 uppercase tracking-wide mt-4 mb-1.5 font-display text-indigo-700">{line.substring(4)}</h3>;
      }
      // Bullet points
      if (line.startsWith("- ")) {
        return <li key={i} className="list-disc ml-5 my-1 leading-relaxed text-slate-700">{line.substring(2)}</li>;
      }
      if (line.startsWith("* ")) {
        return <li key={i} className="list-disc ml-5 my-1 leading-relaxed text-slate-700">{line.substring(2)}</li>;
      }
      // Block code / messages
      if (line.startsWith("```")) {
        return null; // Ignore opening/closing backticks for simplicity
      }
      if (line.startsWith("`") && line.endsWith("`")) {
        return <code key={i} className="bg-slate-100 text-slate-800 font-mono text-xs px-2 py-1 rounded block my-2 border border-slate-200">{line.replace(/`/g, "")}</code>;
      }
      // Normal paragraphs
      if (line.trim() === "") {
        return <div key={i} className="h-2"></div>;
      }
      return <p key={i} className="my-1.5 leading-relaxed text-slate-700 text-xs font-medium">{line}</p>;
    });
  };

  if (loading && !issue) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-700"></div>
        <p className="text-sm font-semibold text-slate-500">Retrieving case record from security vault...</p>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="text-center py-24 bg-white border border-slate-200 rounded-2xl max-w-lg mx-auto">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800 font-display">Grievance File Missing</h3>
        <p className="text-xs text-slate-400 mt-1">This complaint ID may have been resolved, archived, or is non-existent.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-slate-950 text-white font-bold rounded-lg text-xs">
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Priority color mapper
  const getPriorityStyle = (level: string) => {
    switch (level) {
      case "Critical":
        return "bg-red-500 text-white border-red-600";
      case "High":
        return "bg-orange-500 text-white border-orange-600";
      case "Medium":
        return "bg-amber-100 text-amber-800 border-amber-300";
      default:
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <button 
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm font-semibold transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Complaints Registry</span>
        </button>

        {/* Quick status update */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Action Pipeline:</span>
          <select
            value={issue.status}
            onChange={(e) => handleStatusChange(e.target.value as Issue["status"])}
            className={`text-xs font-bold border rounded-xl px-3 py-2 cursor-pointer focus:outline-hidden shadow-2xs ${
              issue.status === "Resolved" 
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : issue.status === "Forwarded to Department"
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : issue.status === "In Review"
                ? "bg-purple-50 text-purple-700 border-purple-200"
                : "bg-slate-50 text-slate-600 border-slate-200"
            }`}
          >
            <option value="Pending">Pending</option>
            <option value="In Review">In Review</option>
            <option value="Forwarded to Department">Forwarded to Department</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Grievance Details (Cols 1-2) */}
        <div className="md:col-span-2 space-y-6">
          {/* Card 1: Primary File */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
            <div className="flex justify-between items-start gap-4 mb-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest font-mono">
                  FILE REFRENCENCE: #{issue.id}
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 font-display mt-0.5">
                  Citizen Grievance Sheet
                </h3>
              </div>

              {/* Priority score widget */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-right block">
                  Priority Score:
                </span>
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm border font-mono ${getPriorityStyle(issue.priority_level)}`}>
                  {issue.priority_score}
                </span>
              </div>
            </div>

            {/* Grid details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-xs text-slate-500 font-medium">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Submitted By</span>
                <span className="text-slate-800 font-bold flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {issue.citizen_name || "Anonymous Citizen"}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Contact mobile</span>
                <span className="text-slate-800 font-bold flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {issue.phone || "Not Shared (Private)"}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Date Lodged</span>
                <span className="text-slate-800 font-bold flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {new Date(issue.created_at).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Filing Language</span>
                <span className="text-slate-800 font-bold flex items-center gap-1 uppercase tracking-widest">
                  {issue.language}
                </span>
              </div>
            </div>

            {/* Side-by-Side: Raw submission vs translation */}
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                  <span>Raw Dialect Complaint</span>
                </span>
                <p className="text-slate-800 font-medium leading-relaxed italic">
                  "{issue.complaint_text}"
                </p>
              </div>

              <div className="bg-indigo-50/40 p-4 rounded-xl border border-indigo-100/60">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1.5 font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span>AI Translated & Triage Summary</span>
                </span>
                <p className="text-slate-800 font-bold leading-relaxed">
                  "{issue.translated_summary}"
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: AI Triage Telemetry */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-display flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <BrainCircuit className="w-4 h-4 text-orange-500" />
              <span>AI Governance Telemetry Analysis</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium text-slate-500">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Classified category</span>
                <span className="text-slate-800 font-bold block">{issue.category} &rarr; {issue.sub_category}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Impact density scale</span>
                <span className="text-slate-800 font-bold block">~{issue.people_affected} affected residents</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Recommended Department</span>
                <span className="text-orange-700 font-bold block">{issue.recommended_department}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Suggested Emergency Action</span>
                <span className="text-slate-800 font-bold block">{issue.suggested_action}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 col-span-1 sm:col-span-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Required Verification Evidence</span>
                <span className="text-slate-800 font-bold block">{issue.evidence_needed}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 col-span-1 sm:col-span-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">AI Priority Reason</span>
                <span className="text-slate-800 font-bold block leading-relaxed">{issue.priority_reason || "Based on citizen density affected, potential vector/health vulnerability, and urgency metrics."}</span>
              </div>
            </div>
          </div>

          {/* AI Decision Engine - Priority score calculation audit */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-display flex items-center gap-1.5">
                <BrainCircuit className="w-4 h-4 text-indigo-600" />
                <span>AI Decision Engine: Score Audit Breakdown</span>
              </h4>
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono">
                Formula Matcher v2.0
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              This score is transparently calculated using an evidence-based multi-factor prioritization model. Look under the hood of JanataPulse AI's prioritization weights:
            </p>

            <div className="space-y-3.5 pt-2 text-xs">
              {/* Severity Score Component */}
              <div className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-700">1. Severity Factor (Max 25 pts)</span>
                  <span className="font-mono text-slate-900 font-bold">
                    {issue.severity_score} × 5 = <span className="text-indigo-600">+{issue.severity_score * 5}</span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${(issue.severity_score / 5) * 100}%` }}></div>
                </div>
                <span className="text-[10px] text-slate-400 block">Assesses direct threat level to public health, property, or vital infrastructure safety.</span>
              </div>

              {/* Urgency Score Component */}
              <div className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-700">2. Urgency Factor (Max 20 pts)</span>
                  <span className="font-mono text-slate-900 font-bold">
                    {issue.urgency_score} × 4 = <span className="text-indigo-600">+{issue.urgency_score * 4}</span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${(issue.urgency_score / 5) * 100}%` }}></div>
                </div>
                <span className="text-[10px] text-slate-400 block">Determines rapid time-sensitiveness (e.g. current flooding versus future road widening).</span>
              </div>

              {/* Public Scale Component */}
              {(() => {
                const people = issue.people_affected || 1;
                let pts = 0;
                if (people >= 500) pts = 18;
                else if (people >= 200) pts = 15;
                else if (people >= 100) pts = 12;
                else if (people >= 50) pts = 9;
                else if (people >= 10) pts = 6;
                else if (people >= 2) pts = 3;

                return (
                  <div className="space-y-1">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-700">3. Public Impact Scale (Max 18 pts)</span>
                      <span className="font-mono text-slate-900 font-bold">
                        ~{people} affected = <span className="text-indigo-600">+{pts}</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${(pts / 18) * 100}%` }}></div>
                    </div>
                    <span className="text-[10px] text-slate-400 block">Tiered point scoring matching affected citizen density.</span>
                  </div>
                );
              })()}

              {/* Duplicate filings boost component */}
              {(() => {
                const dup = issue.duplicate_count || 1;
                let pts = 0;
                if (dup >= 20) pts = 12;
                else if (dup >= 10) pts = 9;
                else if (dup >= 5) pts = 6;
                else if (dup >= 2) pts = 3;

                return (
                  <div className="space-y-1">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-700">4. Duplicity Booster (Max 12 pts)</span>
                      <span className="font-mono text-slate-900 font-bold">
                        {dup} reports = <span className="text-blue-600">+{pts}</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: `${(pts / 12) * 100}%` }}></div>
                    </div>
                    <span className="text-[10px] text-slate-400 block">Consolidates repeated complaints to bolster systemic work urgency.</span>
                  </div>
                );
              })()}

              {/* Vulnerable Groups */}
              <div className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-700">5. Social Equity/Vulnerability Boost</span>
                  <span className="font-mono text-slate-900 font-bold">
                    {issue.vulnerable_groups_affected ? "Active" : "None"} = <span className="text-emerald-600">+{issue.vulnerable_groups_affected ? 8 : 0}</span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: issue.vulnerable_groups_affected ? "100%" : "0%" }}></div>
                </div>
                <span className="text-[10px] text-slate-400 block">Grants positive weights to grievances impacting kids, elderly, public hospitals, or schools.</span>
              </div>

              {/* Actionable Evidence Factor */}
              {(() => {
                const has_evidence = !!(
                  (issue as any).photo_url || 
                  (issue as any).evidence_text || 
                  (issue as any).has_photo || 
                  (issue.complaint_text && issue.complaint_text.length > 20)
                );
                const evidenceContribution = has_evidence ? 7 : 0;

                return (
                  <div className="space-y-1">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-700">6. Evidence Strength Booster</span>
                      <span className="font-mono text-slate-900 font-bold">
                        {has_evidence ? "Yes" : "No"} = <span className="text-indigo-600">+{evidenceContribution}</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${has_evidence ? 100 : 0}%` }}></div>
                    </div>
                    <span className="text-[10px] text-slate-400 block">Measures description quality, language structure, and photo attachments.</span>
                  </div>
                );
              })()}

              {/* Location Confidence Factor */}
              {(() => {
                const has_location = !!(issue.location || issue.ward);
                const locationContribution = has_location ? 5 : -10;

                return (
                  <div className="space-y-1">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-700">7. Location Confidence Factor</span>
                      <span className={`font-mono font-bold ${locationContribution >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {has_location ? "Verified" : "Missing"} = <span>{locationContribution >= 0 ? `+${locationContribution}` : locationContribution}</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${locationContribution >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: has_location ? '100%' : '50%' }}></div>
                    </div>
                    <span className="text-[10px] text-slate-400 block">Rewards explicit location data, penalizes vague complaints missing geographical ties.</span>
                  </div>
                );
              })()}

              {/* Spam Risk Penalty */}
              <div className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-700">8. Spam Risk Deduction (Penalty: -20 × risk)</span>
                  <span className="font-mono text-red-600 font-bold">
                    -{Math.round(issue.spam_or_fake_risk * 100)}% × 20 = <span>-{Math.round(issue.spam_or_fake_risk * 20)}</span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-red-500 h-full rounded-full" style={{ width: `${issue.spam_or_fake_risk * 100}%` }}></div>
                </div>
                <span className="text-[10px] text-slate-400 block">Deducts priority points if NLP model suspects fake filings, automated spambots, or identical floods.</span>
              </div>

              {/* Formula clamp warning */}
              <div className="bg-slate-950 text-indigo-300 rounded-xl p-3.5 font-mono text-[11px] leading-relaxed border border-slate-800 flex justify-between items-center mt-4 shadow-inner">
                <div>
                  <span className="block text-slate-400 text-[9px] uppercase font-bold tracking-widest mb-1">Clamping Priority Index:</span>
                  <span>Math.max(0, Math.min(100, Sum))</span>
                </div>
                <span className="text-lg font-bold text-white bg-indigo-600 px-3 py-1 rounded-lg border border-indigo-500">{issue.priority_score}%</span>
              </div>
            </div>
          </div>

          {/* Duplicate Clustering Analysis - List grouped duplicates */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-display flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Duplicate Clustering Analysis ({issue.duplicate_count} Filings Grouped)</span>
            </h4>

            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              JanataPulse automatically aggregates similar reports from the same ward into a unified cluster to help MP offices execute systemic public works instead of treating duplicates as isolated noise.
            </p>

            {siblingIssues.length === 0 ? (
              <div className="bg-slate-50 border border-slate-100 p-4.5 rounded-xl text-center space-y-1">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
                <span className="text-xs font-bold text-slate-700 block">No Duplicate Reports Found</span>
                <span className="text-[10px] text-slate-400 font-medium block">
                  This complaint stands alone. No other residents have filed overlapping grievances for this ward-category key yet.
                </span>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider block">
                  Clustered Sibling Reports ({siblingIssues.length}):
                </span>
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {siblingIssues.map((sib) => (
                    <div 
                      key={sib.id} 
                      onClick={() => onViewIssue && onViewIssue(sib.id)}
                      className="p-3 bg-slate-50 hover:bg-indigo-50/40 hover:border-indigo-200 border border-slate-200/60 rounded-xl transition-all cursor-pointer text-xs group"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-slate-700 group-hover:text-indigo-700 transition-colors">
                          {sib.citizen_name || "Anonymous Citizen"}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono">
                          {new Date(sib.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-500 line-clamp-1 italic text-[11px]">
                        "{sib.complaint_text}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: MAP & MP Brief Generator (Col 3) */}
        <div className="space-y-6">
          {/* GIS Coordinates Widget */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-display flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>GIS Pin Location</span>
            </h4>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs text-slate-600 font-mono space-y-1">
              <div className="flex justify-between">
                <span>Ward Geofence:</span>
                <strong className="text-slate-800">{issue.ward}</strong>
              </div>
              <div className="flex justify-between">
                <span>GPS Landmark:</span>
                <strong className="text-slate-800 truncate max-w-[150px]">{issue.location}</strong>
              </div>
              <div className="flex justify-between">
                <span>Latitude Node:</span>
                <strong className="text-slate-800">{issue.latitude.toFixed(5)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Longitude Node:</span>
                <strong className="text-slate-800">{issue.longitude.toFixed(5)}</strong>
              </div>
            </div>
          </div>

          {/* Report Generator Widget */}
          <div className="bg-gradient-to-br from-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-md border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-400 font-display flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
                <span>MP Brief Compiler</span>
              </h4>
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Gemini AI
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Compile an official, actionable briefing note from this complaint data suitable for Member of Parliament submission or department forwarding.
            </p>

            {!briefMarkdown && !isGeneratingBrief && (
              <button
                onClick={handleCreateBrief}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs tracking-wide shadow-xs hover:shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate MP Official Brief</span>
              </button>
            )}

            {isGeneratingBrief && (
              <div className="py-6 flex flex-col items-center justify-center gap-3">
                <div className="relative flex items-center justify-center">
                  <div className="animate-ping absolute inline-flex h-10 w-10 rounded-full bg-indigo-400 opacity-25"></div>
                  <div className="rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-400 animate-spin"></div>
                </div>
                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest animate-pulse max-w-[200px] text-center leading-normal">
                  {policyMsgs[briefMsgIndex]}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MP Brief Markdown Drawer (Full Width Bottom Panel) */}
      <AnimatePresence>
        {briefMarkdown && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-md overflow-hidden mt-6"
          >
            {/* Header toolbar */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-700" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  AI Compiled MP Briefing Document
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={copyBriefToClipboard}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 rounded-xl font-bold text-xs shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Brief Text</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl font-bold text-xs shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
              </div>
            </div>

            {/* Brief Content Pane */}
            <div className="p-8 prose prose-slate max-w-none text-xs border-b border-slate-100">
              <div className="bg-slate-50 border border-slate-200/60 p-6 rounded-2xl shadow-2xs max-w-3xl mx-auto space-y-4">
                {renderSimpleMarkdown(briefMarkdown)}
              </div>
            </div>
            
            {/* Disclaimer */}
            <div className="p-4 bg-slate-50 text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">
              Confidential — Issued for Official Member of Parliament Constituency Work only
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
