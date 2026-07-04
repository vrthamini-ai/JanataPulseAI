import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Award, FileSpreadsheet, Sparkles, Building2, TrendingUp, HelpCircle, 
  MapPin, User, CheckCircle2, RefreshCw, Layers, ArrowUpDown, ChevronRight,
  Info, Users, ShieldAlert, FileText, Settings, Printer, Download
} from "lucide-react";
import { Issue, WardData } from "../types";
import { getDevelopmentPlan, getWardDataByNumber, getWardData, generateBrief } from "../api";

export default function AIDevelopmentPlanPage() {
  const [plans, setPlans] = useState<Issue[]>([]);
  const [wards, setWards] = useState<WardData[]>([]);
  const [selectedWardNum, setSelectedWardNum] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedPlan, setSelectedPlan] = useState<Issue | null>(null);
  const [selectedPlanWard, setSelectedPlanWard] = useState<WardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Briefing modal
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [briefText, setBriefText] = useState<string | null>(null);
  const [briefMsgIndex, setBriefMsgIndex] = useState(0);

  const policyMsgs = [
    "Interfacing with Madurai ward planning systems...",
    "Querying the Gemini-3.5 cognitive planner...",
    "Calculating infrastructure deficit coefficients...",
    "Assembling target public impact scale...",
    "Compiling official Member of Parliament executive notice..."
  ];

  useEffect(() => {
    let timer: any;
    if (isGeneratingBrief) {
      timer = setInterval(() => {
        setBriefMsgIndex((prev) => (prev + 1) % policyMsgs.length);
      }, 2000);
    } else {
      setBriefMsgIndex(0);
    }
    return () => clearInterval(timer);
  }, [isGeneratingBrief]);

  const loadAllData = async () => {
    setLoading(true);
    setError("");
    try {
      const planData = await getDevelopmentPlan();
      const wardData = await getWardData();
      setPlans(planData);
      setWards(wardData);
      
      // Select the top plan by default if exists
      if (planData.length > 0) {
        setSelectedPlan(planData[0]);
      }
    } catch (err) {
      setError("Failed to sync planning models and ward-level census datasets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Sync ward detailed demographics when plan selection changes
  useEffect(() => {
    const syncPlanWardData = async () => {
      if (!selectedPlan) {
        setSelectedPlanWard(null);
        return;
      }
      const wardNum = selectedPlan.ward.match(/Ward\s+(\d+)/)?.[1] || "";
      if (wardNum) {
        try {
          const detail = await getWardDataByNumber(wardNum);
          setSelectedPlanWard(detail);
        } catch (_) {
          setSelectedPlanWard(null);
        }
      } else {
        setSelectedPlanWard(null);
      }
    };
    syncPlanWardData();
  }, [selectedPlan]);

  const handleGenerateBrief = async (plan: Issue) => {
    setIsGeneratingBrief(true);
    setBriefText(null);
    try {
      const res = await generateBrief(plan.id);
      setBriefText(res.brief);
    } catch (_) {
      alert("AI Brief generation failed. Fallback triggered.");
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  const filteredPlans = plans.filter((p) => {
    const wardMatch = selectedWardNum 
      ? p.ward.includes(`Ward ${selectedWardNum}`) 
      : true;
    const categoryMatch = selectedCategory 
      ? p.category === selectedCategory 
      : true;
    return wardMatch && categoryMatch;
  });

  const getPriorityLevelColor = (level: string) => {
    switch (level) {
      case "MP Priority":
        return "bg-purple-600 text-white border-purple-700 shadow-xs";
      case "High":
        return "bg-orange-500 text-white border-orange-600";
      case "Medium":
        return "bg-amber-100 text-amber-800 border-amber-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  const renderSimpleMarkdown = (markdown: string) => {
    const lines = markdown.split("\n");
    return lines.map((line, i) => {
      if (line.startsWith("# ")) {
        return <h1 key={i} className="text-sm font-extrabold text-slate-900 border-b border-slate-200 pb-1.5 mt-4 mb-2 font-display">{line.substring(2)}</h1>;
      }
      if (line.startsWith("## ")) {
        return <h2 key={i} className="text-xs font-bold text-slate-800 mt-3.5 mb-1.5 font-display">{line.substring(3)}</h2>;
      }
      if (line.startsWith("### ")) {
        return <h3 key={i} className="text-[10px] font-bold text-indigo-700 uppercase tracking-wide mt-2.5 mb-1 font-display">{line.substring(4)}</h3>;
      }
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return <li key={i} className="ml-3 list-disc text-slate-600 mt-0.5 mb-0.5 leading-relaxed text-[10.5px]">{line.substring(2)}</li>;
      }
      if (line.trim() === "") {
        return <div key={i} className="h-1"></div>;
      }
      return <p key={i} className="text-slate-600 mt-1 mb-1 leading-relaxed font-medium text-[10.5px]">{line}</p>;
    });
  };

  if (loading && plans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-700"></div>
        <p className="text-sm font-semibold text-slate-500 tracking-wide">Synthesizing Development Plan Ledger...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 font-display">
            AI Constituency Development Planner
          </h2>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">
            Democratic capital allocation engine comparing citizen requests against real-world demographics
          </p>
        </div>

        <button 
          onClick={loadAllData}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-slate-600 font-bold text-xs shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync Planning Database</span>
        </button>
      </div>

      {/* Explanatory banner: How Development Priority Score is calculated */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white rounded-xl p-5 border border-indigo-900 shadow-md">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/25 text-orange-400 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-bold font-display uppercase tracking-widest text-orange-400">
              MP Capital Works Allocator: Five-Factor Formula
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
              Constituency development schemes are objectively prioritized using a rigorous five-factor formula. This overrides noisy lobby representation with actual data-driven realities:
            </p>
            <div className="bg-slate-950/60 rounded-lg p-3 text-[11px] font-mono border border-slate-800 text-indigo-300 overflow-x-auto leading-relaxed">
              Final Score = (Issue Severity * 0.35) + (Voter Reality Verification * 0.25) + (Citizen Demand Volume * 0.20) + (Ward Infrastructure Gap * 0.15) + (Administrative Feasibility * 0.05)
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-1 text-[10px] text-slate-300">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                <span>Severity (35%)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Reality (25%)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>Demand (20%)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                <span>Infrastructure Gap (15%)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                <span>Feasibility (5%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        
        {/* Left column: Filter & Ranked Proposals List (Cols 1-2) */}
        <div className="lg:col-span-2 space-y-4 flex flex-col max-h-[85vh]">
          {/* Controls */}
          <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-3 shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              Filter Development Proposals
            </span>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={selectedWardNum}
                onChange={(e) => setSelectedWardNum(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 bg-slate-50/50 cursor-pointer focus:outline-hidden"
              >
                <option value="">All Wards</option>
                {wards.map((w) => (
                  <option key={w.id} value={w.ward_number}>Ward {w.ward_number} ({w.ward_name})</option>
                ))}
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 bg-slate-50/50 cursor-pointer focus:outline-hidden"
              >
                <option value="">All Categories</option>
                <option value="Drainage">Drainage</option>
                <option value="Drinking Water">Drinking Water</option>
                <option value="Road Damage">Road Damage</option>
                <option value="Streetlights">Streetlights</option>
                <option value="Waste Collection">Waste Collection</option>
                <option value="School Infrastructure">School Infrastructure</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Employment / Vocational Centre">Employment / Vocational Centre</option>
              </select>
            </div>
          </div>

          {/* Ranked List */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex-1 flex flex-col min-h-0">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
              <span>Ranked Development Works ({filteredPlans.length})</span>
              <span className="font-mono">Priority Index</span>
            </div>

            <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
              {filteredPlans.length === 0 ? (
                <div className="py-12 text-center text-xs font-semibold text-slate-400">
                  No proposed development schemes match.
                </div>
              ) : (
                filteredPlans.map((plan, idx) => (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan)}
                    className={`p-4 hover:bg-slate-50/50 cursor-pointer transition-all flex items-start justify-between gap-4 border-l-4 ${
                      selectedPlan?.id === plan.id
                        ? "border-blue-600 bg-blue-50/20"
                        : "border-transparent"
                    }`}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono text-slate-400">#{idx + 1}</span>
                        <span className="text-xs font-extrabold text-slate-800 truncate block max-w-[150px]">
                          {plan.development_need_title || "Infrastructure Project"}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider border ${getPriorityLevelColor(plan.final_priority_level)}`}>
                          {plan.final_priority_level}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium line-clamp-1">
                        Proposed Work: "{plan.suggested_development_work}"
                      </p>
                      <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5 uppercase">
                        <span>{plan.ward ? (plan.ward.includes(" (") ? plan.ward.split(" (")[0] : plan.ward) : "General Ward"}</span>
                        <span>•</span>
                        <span>{plan.category}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-base font-extrabold text-blue-800 font-mono">
                        {plan.final_development_priority_score}
                      </span>
                      <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        Index
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right column: Selected Proposal Evaluation Details (Cols 3-5) */}
        <div className="lg:col-span-3 space-y-6">
          <AnimatePresence mode="wait">
            {selectedPlan ? (
              <motion.div
                key={selectedPlan.id}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Proposal Primary Sheet Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
                  <div className="flex justify-between items-start gap-4 pb-4 border-b border-slate-100 flex-wrap">
                    <div>
                      <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                        <FileSpreadsheet className="w-3 h-3 text-indigo-500" />
                        <span>Constituency Capital Proposal Sheet</span>
                      </span>
                      <h3 className="text-lg font-extrabold text-slate-900 font-display mt-2">
                        {selectedPlan.development_need_title || "Proposed Infrastructure Scheme"}
                      </h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{selectedPlan.ward} ({selectedPlan.location})</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-950 text-white rounded-xl p-3 border border-slate-800">
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Plan Priority Index</span>
                        <span className="text-[9px] font-bold text-orange-400 block uppercase">Level: {selectedPlan.final_priority_level}</span>
                      </div>
                      <span className="text-3xl font-extrabold text-indigo-400 font-mono border-l border-slate-800 pl-3 ml-1">
                        {selectedPlan.final_development_priority_score}
                      </span>
                    </div>
                  </div>

                  {/* Core physical work description */}
                  <div className="grid md:grid-cols-2 gap-4 text-xs font-semibold">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recommended Long-Term Physical Work</span>
                      <p className="text-slate-800 font-bold leading-relaxed text-sm">
                        "{selectedPlan.suggested_development_work}"
                      </p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Responsible Government Agency</span>
                      <p className="text-slate-800 font-bold leading-relaxed text-sm text-indigo-700">
                        {selectedPlan.recommended_department}
                      </p>
                    </div>
                  </div>

                  {/* Formula point audit cards */}
                  <div className="space-y-3.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-display">
                      Five-Factor Evaluation Point Audit
                    </span>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                      
                      {/* Severity */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex flex-col justify-between h-20 shadow-3xs">
                        <span className="text-[8.5px] font-bold text-slate-400 uppercase block leading-tight">Severity Index (35%)</span>
                        <span className="text-lg font-extrabold text-slate-800 block font-mono">{selectedPlan.issue_priority_score}</span>
                        <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                          <div className="bg-indigo-600 h-full" style={{ width: `${selectedPlan.issue_priority_score}%` }}></div>
                        </div>
                      </div>

                      {/* Reality Proof */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex flex-col justify-between h-20 shadow-3xs">
                        <span className="text-[8.5px] font-bold text-slate-400 uppercase block leading-tight">Voter Verification (25%)</span>
                        <span className="text-lg font-extrabold text-emerald-700 block font-mono">{selectedPlan.reality_percentage}%</span>
                        <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full" style={{ width: `${selectedPlan.reality_percentage}%` }}></div>
                        </div>
                      </div>

                      {/* Citizen Demand */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex flex-col justify-between h-20 shadow-3xs">
                        <span className="text-[8.5px] font-bold text-slate-400 uppercase block leading-tight">Voter Demand (20%)</span>
                        <span className="text-lg font-extrabold text-blue-700 block font-mono">{selectedPlan.citizen_demand_score}</span>
                        <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                          <div className="bg-blue-600 h-full" style={{ width: `${selectedPlan.citizen_demand_score}%` }}></div>
                        </div>
                      </div>

                      {/* Infrastructure Gap */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex flex-col justify-between h-20 shadow-3xs">
                        <span className="text-[8.5px] font-bold text-slate-400 uppercase block leading-tight">Infrastructure Gap (15%)</span>
                        <span className="text-lg font-extrabold text-orange-600 block font-mono">{selectedPlan.infrastructure_gap_score}</span>
                        <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                          <div className="bg-orange-500 h-full" style={{ width: `${selectedPlan.infrastructure_gap_score}%` }}></div>
                        </div>
                      </div>

                      {/* Feasibility */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex flex-col justify-between h-20 shadow-3xs">
                        <span className="text-[8.5px] font-bold text-slate-400 uppercase block leading-tight">Feasibility (5%)</span>
                        <span className="text-lg font-extrabold text-slate-700 block font-mono">{selectedPlan.feasibility_score || 70}</span>
                        <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                          <div className="bg-slate-400 h-full" style={{ width: `${selectedPlan.feasibility_score || 70}%` }}></div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                {/* Reality Check Block - Comparison with actual Ward Data / Demographics */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-display flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-orange-500" />
                      <span>Constituency Reality Check: Ward Demographics Deficit</span>
                    </h4>
                    {selectedPlanWard && (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-sm bg-orange-50 border border-orange-200 text-orange-700 font-mono">
                        Ward Census {selectedPlanWard.ward_number}
                      </span>
                    )}
                  </div>

                  {selectedPlanWard ? (
                    <div className="space-y-4 text-xs font-medium text-slate-500">
                      <p className="leading-relaxed">
                        To guarantee objective funding allocations, the AI compares the citizens' proposed <strong>{selectedPlan.category}</strong> project against real ward census metrics. Check the current infrastructure gaps in **{selectedPlanWard.ward_name}**:
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        
                        {/* Demographic 1 */}
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span className="text-[9px] text-slate-400 uppercase block font-bold mb-1">Ward Population</span>
                          <strong className="text-slate-800 block text-base font-mono">{selectedPlanWard.population.toLocaleString()}</strong>
                          <span className="text-[9px] text-slate-400">Total ward residents</span>
                        </div>

                        {/* Demographic 2 */}
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span className="text-[9px] text-slate-400 uppercase block font-bold mb-1">Water Supply Deficit</span>
                          <strong className="text-red-600 block text-base font-mono">{selectedPlanWard.water_supply_gap}%</strong>
                          <span className="text-[9px] text-slate-400">Demand-supply deficit</span>
                        </div>

                        {/* Demographic 3 */}
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span className="text-[9px] text-slate-400 uppercase block font-bold mb-1">Road Quality</span>
                          <strong className={`block text-base font-mono ${selectedPlanWard.road_quality_score < 50 ? 'text-red-600' : 'text-slate-800'}`}>
                            {selectedPlanWard.road_quality_score}/100
                          </strong>
                          <span className="text-[9px] text-slate-400">Index (lower is worse)</span>
                        </div>

                        {/* Demographic 4 */}
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span className="text-[9px] text-slate-400 uppercase block font-bold mb-1">Drainage Risk</span>
                          <strong className="text-amber-600 block text-base font-mono">{selectedPlanWard.drainage_risk_score}/100</strong>
                          <span className="text-[9px] text-slate-400">Vector/flood log hazard</span>
                        </div>

                      </div>

                      {/* Secondary metrics row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/50 space-y-2">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Local School & Health Distances</span>
                          <ul className="space-y-1 text-[11px] text-slate-600 list-disc pl-4 leading-normal">
                            <li>Primary School Student Enrollment: <strong>{selectedPlanWard.school_enrollment} kids</strong></li>
                            <li>Distance to nearest high school: <strong>{selectedPlanWard.distance_to_nearest_school_km} km</strong> (Gap is high if &gt;3km)</li>
                            <li>Distance to nearest Primary Health Centre (PHC): <strong>{selectedPlanWard.distance_to_nearest_phc_km} km</strong></li>
                            <li>Youth unemployment rate estimate: <strong>{selectedPlanWard.youth_unemployment_estimate}%</strong></li>
                          </ul>
                        </div>

                        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/50 space-y-2">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Overlapping Local Projects</span>
                          <div className="space-y-2 text-[10.5px]">
                            <div>
                              <strong className="text-emerald-700 block text-[9.5px] uppercase">Existing Approved Schemes:</strong>
                              <span className="text-slate-600 truncate block font-semibold">{selectedPlanWard.existing_projects?.join(", ") || "No recorded projects in this cycle."}</span>
                            </div>
                            <div>
                              <strong className="text-indigo-700 block text-[9.5px] uppercase">Previously Proposed Council Bills:</strong>
                              <span className="text-slate-600 truncate block font-semibold">{selectedPlanWard.proposed_projects?.join(", ") || "None."}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-400 text-xs font-semibold">
                      Census database sync in progress...
                    </div>
                  )}
                </div>

                {/* AI Executive briefing toolkit */}
                <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-md space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase tracking-wider">Administrative Toolkit</span>
                        <h4 className="text-sm font-bold text-slate-100 font-display">MP Development Proposal Actionizer</h4>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-md border border-indigo-500/30 font-mono">
                      Gemini-3.5
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    Transform this raw prioritized proposal into an official government requisition order. Allocate funds from the Member of Parliament Local Area Development Scheme (MP LADS) with one click.
                  </p>

                  {!briefText && !isGeneratingBrief && (
                    <button
                      onClick={() => handleGenerateBrief(selectedPlan)}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs tracking-wide transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <Sparkles className="w-4 h-4 text-orange-400" />
                      <span>Compile Official Brief & MP LADS Allocation Form</span>
                    </button>
                  )}

                  {isGeneratingBrief && (
                    <div className="py-8 flex flex-col items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-400"></div>
                      <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest animate-pulse leading-normal">
                        {policyMsgs[briefMsgIndex]}
                      </span>
                    </div>
                  )}

                  {briefText && !isGeneratingBrief && (
                    <div className="space-y-4 pt-2">
                      <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 max-h-[350px] overflow-y-auto text-xs space-y-3.5 shadow-inner">
                        {renderSimpleMarkdown(briefText)}
                      </div>

                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(briefText);
                            alert("Briefing copied to clipboard!");
                          }}
                          className="px-4 py-2 bg-slate-800 text-slate-200 rounded-xl font-bold text-xs hover:bg-slate-700 cursor-pointer transition-colors"
                        >
                          Copy Text
                        </button>
                        <button
                          onClick={() => window.print()}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer transition-all"
                        >
                          Print Document
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </motion.div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center border border-slate-200 border-dashed rounded-2xl bg-white text-center text-slate-400">
                <FileSpreadsheet className="w-12 h-12 text-slate-300 mb-3" />
                <span className="text-xs font-semibold px-4">
                  Select any ranked project proposal from the side panel to inspect evaluation points.
                </span>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
