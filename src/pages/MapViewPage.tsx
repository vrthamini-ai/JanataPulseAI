import { useState, useEffect } from "react";
import { MapPin, Filter, Search, ShieldAlert, Layers } from "lucide-react";
import { Issue } from "../types";
import { getIssues } from "../api";
import MapComponent from "../components/MapComponent";

interface MapViewPageProps {
  onViewIssue: (id: string) => void;
}

export default function MapViewPage({ onViewIssue }: MapViewPageProps) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadIssues = async () => {
      try {
        const data = await getIssues();
        setIssues(data);
      } catch (err) {
        setError("Failed to fetch coordinates for maps view.");
      } finally {
        setLoading(false);
      }
    };
    loadIssues();
  }, []);

  const filteredIssues = issues.filter((issue) => {
    const matchCategory = categoryFilter ? issue.category === categoryFilter : true;
    const matchPriority = priorityFilter ? issue.priority_level === priorityFilter : true;
    const matchSearch = searchQuery
      ? issue.complaint_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.translated_summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.location.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    return matchCategory && matchPriority && matchSearch;
  });

  const uniqueCategories = Array.from(new Set(issues.map((i) => i.category)));

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 font-display">
          Constituency GIS Georeference Map
        </h2>
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">
          Interactive geographical plot of reported citizen grievances in Madurai
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 h-fit">
          <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700 font-display uppercase tracking-wider pb-2 border-b border-slate-100">
            <Filter className="w-4 h-4 text-indigo-600" />
            <span>Map Coordinates Filters</span>
          </div>

          {/* Search Box */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Search Map Points
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type landmark or keywords..." 
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Category Dropdown */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Filter Category
            </label>
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
          </div>

          {/* Priority Dropdown */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Filter Priority
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 focus:border-blue-500 focus:outline-hidden bg-slate-50/50 appearance-none"
            >
              <option value="">All Priorities</option>
              <option value="Critical">Critical Only</option>
              <option value="High">High Only</option>
              <option value="Medium">Medium Only</option>
              <option value="Low">Low Only</option>
            </select>
          </div>

          {/* Legend widget */}
          <div className="pt-4 border-t border-slate-100">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Marker Index Colors
            </span>
            <div className="space-y-2 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
                <span>Critical Priority (80+)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-500 inline-block"></span>
                <span>High Priority (60-79)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block"></span>
                <span>Medium Priority (40-59)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span>
                <span>Low Priority (&lt;40)</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-900 rounded-xl text-[11px] leading-relaxed font-semibold">
            <Layers className="w-4 h-4 text-indigo-600 mb-1" />
            <span>Map shows verified GPS triangulation nodes. Click any colored node to inspect raw citizens' report files.</span>
          </div>
        </div>

        {/* Map Container (Cols 2-4) */}
        <div className="md:col-span-3">
          <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <MapComponent issues={filteredIssues} onViewIssue={onViewIssue} />
          </div>
          <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-2 px-1">
            <span>Triangulating {filteredIssues.length} of {issues.length} records</span>
            <span>Madurai Center Geofence</span>
          </div>
        </div>
      </div>
    </div>
  );
}
