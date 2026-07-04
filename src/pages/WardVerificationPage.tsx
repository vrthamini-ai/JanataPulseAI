import { useState, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldCheck, MapPin, CheckCircle, HelpCircle, AlertTriangle, Vote,
  MessageSquare, Camera, Sparkles, RefreshCw, User, Phone, Send, Info,
  Search, CheckCircle2, ChevronRight, Filter, Users
} from "lucide-react";
import { Issue, Verification, WardData } from "../types";
import { getIssues, submitVerification, getWardData } from "../api";

export default function WardVerificationPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [wards, setWards] = useState<WardData[]>([]);
  const [selectedWard, setSelectedWard] = useState<string>("");
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Verification Form State
  const [verifierName, setVerifierName] = useState("");
  const [verifierPhone, setVerifierPhone] = useState("");
  const [voteType, setVoteType] = useState<"Confirm Real" | "Partially True" | "Needs More Info" | "Not Seen / Dispute">("Confirm Real");
  const [comment, setComment] = useState("");
  const [hasPhoto, setHasPhoto] = useState(false);

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const allIssues = await getIssues();
      const wardData = await getWardData();
      setIssues(allIssues);
      setWards(wardData);
      
      // Do not select the first ward by default, leave as empty string for "All Wards"
      if (wardData.length > 0 && !selectedWard) {
        setSelectedWard("");
      }

      // Keep previously selected issue synced if it exists
      if (selectedIssue) {
        const updatedIssue = allIssues.find(i => i.id === selectedIssue.id);
        if (updatedIssue) setSelectedIssue(updatedIssue);
      }
    } catch (err) {
      console.error("Failed to fetch ward verifications data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch verifications from API when selected issue changes
  useEffect(() => {
    const fetchIssueVerifications = async () => {
      if (!selectedIssue) return;
      try {
        const response = await fetch(`/api/issues/${selectedIssue.id}/verifications`);
        if (response.ok) {
          const data = await response.json();
          setVerifications(data);
        }
      } catch (err) {
        console.error("Failed to load verifications:", err);
      }
    };
    fetchIssueVerifications();
  }, [selectedIssue]);

  const handleVerificationSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) return;
    if (!verifierName || !verifierPhone) {
      alert("Please provide your name and mobile number for secure citizen validation.");
      return;
    }

    setSubmitting(true);
    setSuccessMsg("");
    try {
      // Map "Not Seen / Dispute" to the server expected value "Not Seen"
      const mappedVoteType = voteType === "Not Seen / Dispute" ? "Not Seen" : voteType;
      
      const payload = {
        verifier_name: verifierName,
        verifier_phone: verifierPhone,
        verifier_ward: selectedIssue.ward,
        vote_type: mappedVoteType,
        comment,
        has_photo: hasPhoto
      };

      const updatedIssue = await submitVerification(selectedIssue.id, payload);
      
      // Update state
      setSelectedIssue(updatedIssue);
      setSuccessMsg("Voter verification submitted successfully! Score recalculated.");
      
      // Reload overall issues list to update the maps and clusters
      const freshIssues = await getIssues();
      setIssues(freshIssues);

      // Re-fetch verifications list for this issue
      const votesResponse = await fetch(`/api/issues/${selectedIssue.id}/verifications`);
      if (votesResponse.ok) {
        const freshVotes = await votesResponse.json();
        setVerifications(freshVotes);
      }

      // Reset form
      setVerifierName("");
      setVerifierPhone("");
      setComment("");
      setHasPhoto(false);

      // Dismiss success msg after 5s
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err) {
      alert("Failed to record citizen verification vote. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter issues based on ward and search query
  const filteredIssues = issues.filter(i => {
    const wardMatch = selectedWard ? i.ward === selectedWard : true;
    const searchMatch = searchQuery 
      ? i.complaint_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.translated_summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (i.location && i.location.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;
    return wardMatch && searchMatch;
  });

  const getRealityBadgeStyle = (status: string) => {
    switch (status) {
      case "Strongly Verified":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Likely Real":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Needs More Verification":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-rose-50 text-rose-700 border-rose-200";
    }
  };

  const getVoteIcon = (type: string) => {
    switch (type) {
      case "Confirm Real":
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "Partially True":
        return <Info className="w-4 h-4 text-blue-500" />;
      case "Needs More Info":
        return <HelpCircle className="w-4 h-4 text-amber-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
  };

  if (loading && issues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-700"></div>
        <p className="text-sm font-semibold text-slate-500">Syncing Civic Proof Ledger...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 font-display">
            Citizen Ward Verification Hub
          </h2>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">
            Democratic Civic Proof Engine: Empowering local residents to verify, vote, and validate community grievances
          </p>
        </div>

        <button 
          onClick={loadData}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-slate-600 font-bold text-xs shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reload Local Feed</span>
        </button>
      </div>

      {/* Intro info card */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white rounded-xl p-5 border border-emerald-900 shadow-md">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold font-display uppercase tracking-widest text-emerald-400">
              Civic Proof Engine: Combating Spambots and Fake Reports
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every complaint is assigned a <strong>Voter Reality Percentage (0-100%)</strong>. To keep priority rankings authentic, this score increases dynamically when local ward residents verify complaints, upload geo-tagged photo proofs, and cross-reference locations. It declines if disputes or spam reviews are logged.
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        
        {/* Left Side: Ward Selector & Local Pending List (Cols 1-2) */}
        <div className="lg:col-span-2 space-y-4 flex flex-col max-h-[80vh]">
          {/* Ward Select */}
          <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs space-y-3 shrink-0">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Select Your Local Ward
            </label>
            <select
              value={selectedWard}
              onChange={(e) => {
                setSelectedWard(e.target.value);
                setSelectedIssue(null);
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 focus:border-blue-500 focus:outline-hidden bg-slate-50/50 appearance-none cursor-pointer"
            >
              <option value="">All Wards (Browse Entire Constituency)</option>
              {wards.map((w) => {
                const optVal = `Ward ${w.ward_number} (${w.ward_name})`;
                return (
                  <option key={w.id} value={optVal}>
                    Ward {w.ward_number} — {w.ward_name}
                  </option>
                );
              })}
            </select>
          </div>

          {/* List of complaints in ward */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
              <span>Local Reports Pending Verification</span>
              <span className="font-mono">Reality %</span>
            </div>

            {/* Search filter within list */}
            <div className="p-3 border-b border-slate-100 shrink-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter local grievances..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-blue-500 bg-slate-50/30"
                />
              </div>
            </div>

            <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
              {filteredIssues.length === 0 ? (
                <div className="py-12 text-center text-xs font-semibold text-slate-400 px-4">
                  No pending complaints reported in this ward. Be the first to raise a development request!
                </div>
              ) : (
                filteredIssues.map((issue) => (
                  <div
                    key={issue.id}
                    onClick={() => setSelectedIssue(issue)}
                    className={`p-4 hover:bg-slate-50/50 cursor-pointer transition-all flex justify-between items-start gap-4 border-l-4 ${
                      selectedIssue?.id === issue.id
                        ? "border-emerald-600 bg-emerald-50/20"
                        : "border-transparent"
                    }`}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-extrabold text-slate-800 truncate block">
                          {issue.development_need_title || "Local Infrastructure Need"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium line-clamp-1 italic">
                        "{issue.complaint_text}"
                      </p>
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">
                        {issue.location || "Unspecified Landmark"} • {issue.category}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-extrabold text-emerald-700 font-mono">
                        {issue.reality_percentage}%
                      </span>
                      <span className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mt-0.5">
                        Reality
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Active Verification Sandbox / Details (Cols 3-5) */}
        <div className="lg:col-span-3 space-y-6">
          <AnimatePresence mode="wait">
            {selectedIssue ? (
              <motion.div
                key={selectedIssue.id}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Issue card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
                  <div className="flex justify-between items-start gap-4 border-b border-slate-100 pb-4 flex-wrap">
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono block">COMPLAINT ID: #{selectedIssue.id}</span>
                      <h3 className="text-lg font-extrabold text-slate-900 font-display mt-0.5">
                        {selectedIssue.translated_summary || selectedIssue.complaint_text.slice(0, 60) + "..."}
                      </h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{selectedIssue.ward} • Landmark: {selectedIssue.location}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 border rounded-xl p-3 bg-slate-50">
                      <div className="text-right">
                        <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wide block">Civic Proof Score</span>
                        <span className="text-[9px] text-slate-500 font-bold block">{selectedIssue.reality_status}</span>
                      </div>
                      <span className="text-2xl font-extrabold text-emerald-700 border-l border-slate-200 pl-3 font-mono">
                        {selectedIssue.reality_percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-3">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Raw Complaint Text Dialect File</span>
                      <p className="text-slate-800 font-medium italic text-xs leading-relaxed">
                        "{selectedIssue.complaint_text}"
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Impact Scale</span>
                        <strong className="text-slate-700 font-extrabold text-sm">~{selectedIssue.people_affected} Residents Affected</strong>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Evidence Requested</span>
                        <strong className="text-indigo-700 font-extrabold text-xs">{selectedIssue.evidence_needed || "Photo / Video from Ward Citizens"}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Voter Submission sandbox form */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
                  <h4 className="text-sm font-bold font-display uppercase tracking-widest text-slate-400 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                    <Vote className="w-4 h-4 text-emerald-600" />
                    <span>Cast Your Ward Resident Verification Vote</span>
                  </h4>

                  {successMsg && (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{successMsg}</span>
                    </div>
                  )}

                  <form onSubmit={handleVerificationSubmit} className="space-y-4 text-xs font-semibold">
                    <div className="grid sm:grid-cols-2 gap-4">
                      
                      {/* Name */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Verifier Full Name</label>
                        <div className="relative">
                          <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                          <input 
                            type="text"
                            required
                            placeholder="E.g., Sundar Raman"
                            value={verifierName}
                            onChange={(e) => setVerifierName(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:border-blue-500 focus:outline-hidden"
                          />
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Voter Mobile No. (For Otp Verification)</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                          <input 
                            type="tel"
                            required
                            placeholder="E.g., +91 94432 10234"
                            value={verifierPhone}
                            onChange={(e) => setVerifierPhone(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:border-blue-500 focus:outline-hidden"
                          />
                        </div>
                      </div>

                    </div>

                    {/* Vote type selectors */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Choose Verification Status</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        
                        {/* Option 1 */}
                        <button
                          type="button"
                          onClick={() => setVoteType("Confirm Real")}
                          className={`p-2.5 border rounded-xl text-[10.5px] font-bold text-center flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                            voteType === "Confirm Real"
                              ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs"
                              : "bg-slate-50/50 border-slate-200 text-slate-500 hover:bg-slate-50"
                          }`}
                        >
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          <span>Confirm Real</span>
                        </button>

                        {/* Option 2 */}
                        <button
                          type="button"
                          onClick={() => setVoteType("Partially True")}
                          className={`p-2.5 border rounded-xl text-[10.5px] font-bold text-center flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                            voteType === "Partially True"
                              ? "bg-blue-50 border-blue-500 text-blue-800 shadow-2xs"
                              : "bg-slate-50/50 border-slate-200 text-slate-500 hover:bg-slate-50"
                          }`}
                        >
                          <Info className="w-4 h-4 text-blue-500" />
                          <span>Partially True</span>
                        </button>

                        {/* Option 3 */}
                        <button
                          type="button"
                          onClick={() => setVoteType("Needs More Info")}
                          className={`p-2.5 border rounded-xl text-[10.5px] font-bold text-center flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                            voteType === "Needs More Info"
                              ? "bg-amber-50 border-amber-500 text-amber-800 shadow-2xs"
                              : "bg-slate-50/50 border-slate-200 text-slate-500 hover:bg-slate-50"
                          }`}
                        >
                          <HelpCircle className="w-4 h-4 text-amber-500" />
                          <span>Needs Info</span>
                        </button>

                        {/* Option 4 */}
                        <button
                          type="button"
                          onClick={() => setVoteType("Not Seen / Dispute")}
                          className={`p-2.5 border rounded-xl text-[10.5px] font-bold text-center flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                            voteType === "Not Seen / Dispute"
                              ? "bg-rose-50 border-rose-500 text-rose-800 shadow-2xs"
                              : "bg-slate-50/50 border-slate-200 text-slate-500 hover:bg-slate-50"
                          }`}
                        >
                          <AlertTriangle className="w-4 h-4 text-rose-500" />
                          <span>Dispute/Fake</span>
                        </button>

                      </div>
                    </div>

                    {/* Witness comments */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Witness Testimony / Resident Comment</label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Provide details about what you observed at this site. E.g., 'The pothole is deep and caused 2 bike accidents yesterday evening. Water stagnates here since Friday...'"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-blue-500"
                      />
                    </div>

                    {/* Simulated photo upload check */}
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Camera className="w-4.5 h-4.5 text-indigo-500" />
                        <div>
                          <span className="text-[10px] font-bold block text-slate-700">Attach Geo-Tagged Witness Photo Proof</span>
                          <span className="text-[9px] text-slate-400 font-medium block">Simulates camera attachment, increasing reality weight by +15%</span>
                        </div>
                      </div>
                      <input 
                        type="checkbox"
                        checked={hasPhoto}
                        onChange={(e) => setHasPhoto(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded-sm focus:ring-indigo-500 cursor-pointer"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98 transition-all disabled:opacity-60"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{submitting ? "Uploading Civic Proof..." : "Submit Resident Proof File"}</span>
                    </button>
                  </form>
                </div>

                {/* History list of verifications for this issue */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-display flex items-center gap-1.5 border-b border-slate-100 pb-3">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>Resident Verification Log ({verifications.length} Votes)</span>
                  </h4>

                  {verifications.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs font-semibold italic">
                      No citizen votes recorded yet. Submit your proof above to be the first!
                    </div>
                  ) : (
                    <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                      {verifications.map((v) => (
                        <div key={v.id} className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl space-y-2 text-xs font-semibold">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-800 flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400" />
                              {v.verifier_name} <span className="text-[10px] text-slate-400 font-medium">(Verified Citizen)</span>
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono">
                              {new Date(v.created_at).toLocaleDateString()}
                            </span>
                          </div>

                          <p className="text-slate-600 text-xs leading-relaxed font-medium bg-white p-2.5 border border-slate-100 rounded-lg shadow-3xs">
                            "{v.comment}"
                          </p>

                          <div className="flex justify-between items-center text-[10px]">
                            <div className="flex items-center gap-1 text-slate-500">
                              {getVoteIcon(v.vote_type)}
                              <span>Vote: <strong className="text-slate-700">{v.vote_type}</strong></span>
                            </div>

                            {v.has_photo && (
                              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-sm text-[9px] font-extrabold uppercase tracking-wider">
                                <Camera className="w-3 h-3" />
                                <span>Photo Attached</span>
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center border border-slate-200 border-dashed rounded-2xl bg-white text-center text-slate-400">
                <Vote className="w-12 h-12 text-slate-300 mb-3" />
                <span className="text-xs font-semibold px-4">
                  Select any pending report from the side panel to view verification comments or cast your vote.
                </span>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
