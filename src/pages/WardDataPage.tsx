import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Building2, Users, GraduationCap, Heart, Droplet, Navigation, MapPin, 
  Search, ShieldAlert, CheckCircle2, FileText, ArrowUpRight, TrendingUp, RefreshCw
} from "lucide-react";
import { WardData } from "../types";
import { getWardData } from "../api";

export default function WardDataPage() {
  const [wards, setWards] = useState<WardData[]>([]);
  const [selectedWard, setSelectedWard] = useState<WardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getWardData();
      setWards(data);
      if (data.length > 0) {
        setSelectedWard(data[0]);
      }
    } catch (err) {
      setError("Failed to sync ward demographic indices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredWards = wards.filter((w) => 
    w.ward_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.ward_number.includes(searchQuery)
  );

  const getRoadQualityColor = (score: number) => {
    if (score < 40) return "text-rose-600 bg-rose-50 border-rose-100";
    if (score < 70) return "text-amber-600 bg-amber-50 border-amber-100";
    return "text-emerald-600 bg-emerald-50 border-emerald-100";
  };

  const getDrainageRiskColor = (score: number) => {
    if (score > 70) return "text-rose-600 bg-rose-50 border-rose-100";
    if (score > 40) return "text-amber-600 bg-amber-50 border-amber-100";
    return "text-emerald-600 bg-emerald-50 border-emerald-100";
  };

  if (loading && wards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-700"></div>
        <p className="text-sm font-semibold text-slate-500">Retrieving Ward Datasets...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 font-display tracking-tight">
            Ward Demographic & Infrastructure Registry
          </h2>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">
            Real-world municipal statistics mapping population density, educational enrollment, and structural deficits
          </p>
        </div>

        <button 
          onClick={loadData}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-slate-600 font-bold text-xs shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync Census Databases</span>
        </button>
      </div>

      {/* Quick stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Managed Wards</span>
          <span className="text-2xl font-extrabold text-slate-800 font-mono mt-1 block">{wards.length}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Aggregate Population</span>
          <span className="text-2xl font-extrabold text-slate-800 font-mono mt-1 block">
            {wards.reduce((sum, w) => sum + w.population, 0).toLocaleString()}
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Average Water Supply Deficit</span>
          <span className="text-2xl font-extrabold text-rose-600 font-mono mt-1 block">
            {(wards.reduce((sum, w) => sum + w.water_supply_gap, 0) / (wards.length || 1)).toFixed(1)}%
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avg Road Quality score</span>
          <span className="text-2xl font-extrabold text-emerald-600 font-mono mt-1 block">
            {(wards.reduce((sum, w) => sum + w.road_quality_score, 0) / (wards.length || 1)).toFixed(1)}/100
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left list of Wards (Cols 1-2) */}
        <div className="lg:col-span-2 space-y-4 flex flex-col max-h-[75vh]">
          {/* Search bar */}
          <div className="relative shrink-0">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search ward name or number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-blue-500 bg-white shadow-2xs"
            />
          </div>

          {/* Ward List */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
              Select Ward to Analyze Deficits
            </div>

            <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
              {filteredWards.map((w) => (
                <div
                  key={w.id}
                  onClick={() => setSelectedWard(w)}
                  className={`p-4 hover:bg-slate-50/50 cursor-pointer transition-all flex items-center justify-between border-l-4 ${
                    selectedWard?.id === w.id
                      ? "border-blue-600 bg-blue-50/20"
                      : "border-transparent"
                  }`}
                >
                  <div className="space-y-1">
                    <h4 className="text-xs font-extrabold text-slate-800">
                      Ward {w.ward_number} — {w.ward_name}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Population: {w.population.toLocaleString()}
                    </p>
                  </div>
                  <ArrowUpRight className={`w-4 h-4 transition-transform ${selectedWard?.id === w.id ? "text-blue-600 scale-110" : "text-slate-300"}`} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Details Panel (Cols 3-5) */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {selectedWard ? (
              <motion.div
                key={selectedWard.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6"
              >
                {/* Title & Info */}
                <div className="border-b border-slate-100 pb-4 flex justify-between items-start flex-wrap gap-4">
                  <div>
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                      <MapPin className="w-3 h-3 text-blue-500" />
                      <span>Madurai Corporation Ward Ledger</span>
                    </span>
                    <h3 className="text-lg font-extrabold text-slate-900 font-display mt-2">
                      Ward {selectedWard.ward_number}: {selectedWard.ward_name}
                    </h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wide mt-1">
                      Geo-coordinates: {selectedWard.latitude.toFixed(4)}° N, {selectedWard.longitude.toFixed(4)}° E
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-right">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Demographic Class</span>
                    <span className="text-sm font-extrabold text-slate-800">High Density</span>
                  </div>
                </div>

                {/* Grid of Key indicators */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Demographic metrics */}
                  <div className="bg-slate-50/60 p-3.5 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1.5">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span className="text-[9.5px] font-bold uppercase tracking-wider">Total Residents</span>
                    </div>
                    <strong className="text-base font-extrabold text-slate-800 font-mono">{selectedWard.population.toLocaleString()}</strong>
                  </div>

                  <div className="bg-slate-50/60 p-3.5 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1.5">
                      <GraduationCap className="w-4 h-4 text-purple-600" />
                      <span className="text-[9.5px] font-bold uppercase tracking-wider">School Enrolled</span>
                    </div>
                    <strong className="text-base font-extrabold text-slate-800 font-mono">{selectedWard.school_enrollment.toLocaleString()}</strong>
                  </div>

                  <div className="bg-slate-50/60 p-3.5 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1.5">
                      <Heart className="w-4 h-4 text-rose-500" />
                      <span className="text-[9.5px] font-bold uppercase tracking-wider">PHC Distance</span>
                    </div>
                    <strong className="text-base font-extrabold text-slate-800 font-mono">{selectedWard.distance_to_nearest_phc_km} km</strong>
                  </div>

                  <div className="bg-slate-50/60 p-3.5 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1.5">
                      <TrendingUp className="w-4 h-4 text-orange-500" />
                      <span className="text-[9.5px] font-bold uppercase tracking-wider">Unemployment</span>
                    </div>
                    <strong className="text-base font-extrabold text-slate-800 font-mono">{selectedWard.youth_unemployment_estimate}%</strong>
                  </div>
                </div>

                {/* Infrastructure Deficits progress bars */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-display">
                    Critical Infrastructure Risk & Deficits
                  </h4>

                  <div className="grid md:grid-cols-3 gap-4">
                    {/* Water Deficit */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Droplet className="w-4 h-4 text-blue-500" />
                          <span>Water Deficit Gap</span>
                        </span>
                        <span className="text-rose-600 font-mono">{selectedWard.water_supply_gap}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-rose-500 h-full" style={{ width: `${selectedWard.water_supply_gap}%` }}></div>
                      </div>
                      <span className="text-[9px] text-slate-400 font-medium block">Percentage of supply gap compared to target</span>
                    </div>

                    {/* Road Quality */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Navigation className="w-4 h-4 text-emerald-500" />
                          <span>Road Quality Index</span>
                        </span>
                        <span className="font-mono">{selectedWard.road_quality_score}/100</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full" style={{ width: `${selectedWard.road_quality_score}%` }}></div>
                      </div>
                      <span className="text-[9px] text-slate-400 font-medium block">Aggregate structural health index of major links</span>
                    </div>

                    {/* Drainage Risk */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-500 flex items-center gap-1">
                          <ShieldAlert className="w-4 h-4 text-orange-500" />
                          <span>Drainage Flood Risk</span>
                        </span>
                        <span className="font-mono text-orange-600">{selectedWard.drainage_risk_score}/100</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-orange-500 h-full" style={{ width: `${selectedWard.drainage_risk_score}%` }}></div>
                      </div>
                      <span className="text-[9px] text-slate-400 font-medium block">Vector-borne hazard and flooding log index</span>
                    </div>
                  </div>
                </div>

                {/* Existing Projects and Proposed projects lists */}
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Existing */}
                  <div className="bg-emerald-50/20 border border-emerald-100 p-4 rounded-xl space-y-3">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Existing Municipal Schemes ({selectedWard.existing_projects?.length || 0})</span>
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-600 font-medium list-disc pl-4 leading-normal">
                      {selectedWard.existing_projects?.map((p, idx) => (
                        <li key={idx}>{p}</li>
                      )) || <li>No active completed schemes listed in current ledger.</li>}
                    </ul>
                  </div>

                  {/* Proposed */}
                  <div className="bg-blue-50/20 border border-blue-100 p-4 rounded-xl space-y-3">
                    <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>Proposed Council Bills ({selectedWard.proposed_projects?.length || 0})</span>
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-600 font-medium list-disc pl-4 leading-normal">
                      {selectedWard.proposed_projects?.map((p, idx) => (
                        <li key={idx}>{p}</li>
                      )) || <li>No pending proposals submitted for municipal review.</li>}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center border border-slate-200 border-dashed rounded-2xl bg-white text-center text-slate-400">
                <Building2 className="w-12 h-12 text-slate-300 mb-3" />
                <span className="text-xs font-semibold px-4">
                  Select a ward card on the left list to review detailed demographic deficits and physical work histories.
                </span>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
