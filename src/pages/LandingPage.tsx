import { motion } from "motion/react";
import { 
  Vote, Sparkles, MapPin, ShieldAlert, FileText, CheckCircle2, Users, 
  Layers, Map, Landmark, ArrowRight, Activity, HelpCircle, AlertCircle
} from "lucide-react";

interface LandingPageProps {
  onSelectRole: (role: "citizen" | "admin" | "transparency" | "verification" | "ward-data") => void;
  onNavigateTab: (tab: string) => void;
}

export default function LandingPage({ onSelectRole, onNavigateTab }: LandingPageProps) {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-slate-50 overflow-hidden">
      
      {/* Decorative luxury gradient background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-orange-500/5 rounded-full blur-[150px] pointer-events-none"></div>
      
      {/* Container */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-16 space-y-24 relative z-10">
        
        {/* HERO SECTION */}
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          {/* Badge */}
          <motion.div 
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold shadow-2xs uppercase tracking-widest"
          >
            <Vote className="w-3.5 h-3.5" />
            <span>Democratic Planning Technology</span>
          </motion.div>

          {/* Title */}
          <motion.h1 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 font-display leading-tight"
          >
            Janata<span className="text-blue-800">Pulse</span> <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">AI</span>
          </motion.h1>

          {/* Tagline */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-lg md:text-xl text-slate-600 font-medium leading-relaxed max-w-3xl mx-auto"
          >
            From citizen voice to verified development priorities. An advanced AI-driven constituency planning engine transforming municipal reports into immediate Member of Parliament official brief directives.
          </motion.p>

          {/* Action CTAs Group */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            {/* CTA 1: Submit Need */}
            <button
              onClick={() => {
                onSelectRole("citizen");
                onNavigateTab("submit-need");
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-800 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg active:scale-98 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Submit Development Need</span>
            </button>

            {/* CTA 2: Verify Issues */}
            <button
              onClick={() => {
                onSelectRole("citizen"); // switch context
                onNavigateTab("verification");
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-2xs hover:shadow-xs active:scale-98 cursor-pointer"
            >
              <Vote className="w-4 h-4 text-orange-500" />
              <span>Verify Ward Issues</span>
            </button>

            {/* CTA 3: MP Dashboard */}
            <button
              onClick={() => {
                onSelectRole("admin");
                onNavigateTab("mp-dashboard");
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md active:scale-98 cursor-pointer"
            >
              <Landmark className="w-4 h-4 text-amber-400" />
              <span>View MP Dashboard</span>
            </button>
          </motion.div>
        </div>

        {/* STATS PREVIEW CARDS */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto"
        >
          {/* Stat 1 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Total Submissions</span>
            <span className="text-4xl font-black text-slate-900 font-mono mt-2">1,482</span>
            <span className="text-[9px] text-slate-400 font-medium block mt-1">Aggregated across 11 key corporate wards</span>
          </div>

          {/* Stat 2 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Verified Demands</span>
            <span className="text-4xl font-black text-emerald-600 font-mono mt-2">842</span>
            <span className="text-[9px] text-slate-400 font-medium block mt-1">Grievances validated with civic proof index &gt; 60%</span>
          </div>

          {/* Stat 3 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Wards Covered</span>
            <span className="text-4xl font-black text-blue-800 font-mono mt-2">11/11</span>
            <span className="text-[9px] text-slate-400 font-medium block mt-1">Active polling loops running across Madurai</span>
          </div>

          {/* Stat 4 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">MP Priority Works</span>
            <span className="text-4xl font-black text-orange-600 font-mono mt-2">18</span>
            <span className="text-[9px] text-slate-400 font-medium block mt-1">Critical development plans drafted & approved</span>
          </div>
        </motion.div>

        {/* HOW IT WORKS SECTION */}
        <div className="space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
              Operational Pipeline
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 font-display">
              How the Civic Proof Engine Operates
            </h2>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              A transparent feedback loop connecting local street realities directly to legislative funding
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Step 1 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-3xs space-y-4 relative">
              <span className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 text-xs font-bold flex items-center justify-center font-mono">1</span>
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">1. Citizen Submits</h4>
                <p className="text-slate-500 text-xs mt-1.5 leading-relaxed font-medium">
                  A local resident files a grievance or infrastructure need in Tamil, English, or Hindi, detailing the affected volume.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-3xs space-y-4 relative">
              <span className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold flex items-center justify-center font-mono">2</span>
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">2. AI Analyzes</h4>
                <p className="text-slate-500 text-xs mt-1.5 leading-relaxed font-medium">
                  Gemini translates dialect files, extracts exact coordinates, categorizes the grievance, and estimates priority indices.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-3xs space-y-4 relative">
              <span className="w-8 h-8 rounded-full bg-orange-50 text-orange-700 text-xs font-bold flex items-center justify-center font-mono">3</span>
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">3. Ward Verifies</h4>
                <p className="text-slate-500 text-xs mt-1.5 leading-relaxed font-medium">
                  Neighboring ward residents cast civic-proof validation votes and attach geo-tagged photos to combat spam or bots.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-3xs space-y-4 relative">
              <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center justify-center font-mono">4</span>
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">4. MP Acts</h4>
                <p className="text-slate-500 text-xs mt-1.5 leading-relaxed font-medium">
                  The Member of Parliament reviews structured, ranked capital schemes and issues officially drafted departmental briefs.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FEATURE CARDS */}
        <div className="space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-100">
              System Core Features
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 font-display font-medium">
              Technical Architecture Elements
            </h2>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
            {/* Feature 1 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-3xs space-y-3 flex flex-col justify-between">
              <div>
                <Sparkles className="w-8 h-8 text-blue-600" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 mt-3">Multilingual AI Triage</h4>
                <p className="text-slate-500 text-[11px] leading-relaxed font-medium mt-1">
                  Processes speech recordings or typing in local dialects, translating slang and dialects directly.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-3xs space-y-3 flex flex-col justify-between">
              <div>
                <Vote className="w-8 h-8 text-emerald-600" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 mt-3">Civic Proof Engine</h4>
                <p className="text-slate-500 text-[11px] leading-relaxed font-medium mt-1">
                  Dynamic voter confidence percentages calculated via real witness photo attachments and crowd confirmations.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-3xs space-y-3 flex flex-col justify-between">
              <div>
                <MapPin className="w-8 h-8 text-orange-500" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 mt-3">Ward Hotspots Map</h4>
                <p className="text-slate-500 text-[11px] leading-relaxed font-medium mt-1">
                  Georeferences duplicate filings and cluster groups to isolate systemic infrastructure deficiencies.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-3xs space-y-3 flex flex-col justify-between">
              <div>
                <Layers className="w-8 h-8 text-purple-600" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 mt-3">Priority Ranking</h4>
                <p className="text-slate-500 text-[11px] leading-relaxed font-medium mt-1">
                  Algorithmic scoring combining civic votes, population affected, and existing census infrastructure gaps.
                </p>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-3xs space-y-3 flex flex-col justify-between">
              <div>
                <FileText className="w-8 h-8 text-pink-600" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 mt-3">MP Brief Generator</h4>
                <p className="text-slate-500 text-[11px] leading-relaxed font-medium mt-1">
                  Drafts clean municipal department work-order templates containing relevant local statistics with a single click.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* DEMO READY TRUST FOOTER SECTION */}
        <div className="bg-slate-900 rounded-3xl text-white p-8 md:p-12 border border-slate-800 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            <div className="space-y-3 text-left">
              <span className="text-[10px] uppercase tracking-widest text-orange-400 font-extrabold block">Constituency Trust Blueprint</span>
              <h3 className="text-xl md:text-3xl font-black font-display tracking-tight">
                Built for People’s Priorities
              </h3>
              <p className="text-xs text-slate-400 font-semibold max-w-2xl leading-relaxed">
                JanataPulse AI applies advanced natural language models and decentralized citizen verifications to replace political bias with data-backed, equitable development prioritizations.
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-4 bg-slate-800/50 p-4 border border-slate-700/60 rounded-2xl text-xs">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <div>
                <span className="font-extrabold block text-slate-200 uppercase tracking-widest text-[9px]">Platform Status</span>
                <span className="text-slate-400 font-mono">Demo Ready (Madurai, TN)</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
