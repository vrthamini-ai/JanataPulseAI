import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Building2, Layers, MapPin, LayoutDashboard, LogOut, Vote, ShieldCheck, 
  Sparkles, CheckCircle2, ChevronRight, ArrowLeft, HeartHandshake, Map,
  FileSpreadsheet, Home, Eye, Lock, Menu, X, HelpCircle, FileText
} from "lucide-react";

// Brand Logo Components
import { JanataPulseLogoStacked, JanataPulseLogoHorizontal } from "./components/JanataPulseLogo";

// Pages
import LandingPage from "./pages/LandingPage";
import CitizenSubmitPage from "./pages/CitizenSubmitPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import DashboardPage from "./pages/DashboardPage";
import PriorityBoardPage from "./pages/PriorityBoardPage";
import MapViewPage from "./pages/MapViewPage";
import IssueDetailPage from "./pages/IssueDetailPage";
import PublicTransparencyPage from "./pages/PublicTransparencyPage";
import AIDevelopmentPlanPage from "./pages/AIDevelopmentPlanPage";
import WardVerificationPage from "./pages/WardVerificationPage";
import WardDataPage from "./pages/WardDataPage";

// Types
import { Issue } from "./types";

export default function App() {
  // Intro splash animation state
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Navigation states
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return typeof window !== "undefined" && !!localStorage.getItem("admin_token");
  });
  const [role, setRole] = useState<"guest" | "citizen" | "admin" | "transparency">(() => {
    return (typeof window !== "undefined" && localStorage.getItem("admin_token")) ? "admin" : "guest";
  });
  const [currentTab, setCurrentTab] = useState<string>(() => {
    return (typeof window !== "undefined" && localStorage.getItem("admin_token")) ? "mp-dashboard" : "home";
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Success screen for citizen submission
  const [lastSubmittedIssue, setLastSubmittedIssue] = useState<Issue | null>(null);

  // Selected issue detail ID
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  // Cross-page cluster filtering state
  const [clusterFilterIds, setClusterFilterIds] = useState<string[] | null>(null);

  // Handlers
  const handleSelectRole = (selectedRole: "citizen" | "admin" | "transparency" | "verification" | "ward-data") => {
    if (selectedRole === "admin") {
      if (isAdminLoggedIn) {
        setRole("admin");
        setCurrentTab("mp-dashboard");
      } else {
        setRole("guest");
        setCurrentTab("login");
      }
    } else if (selectedRole === "transparency") {
      setRole("transparency");
      setCurrentTab("public-transparency");
    } else if (selectedRole === "verification") {
      setRole("citizen");
      setCurrentTab("verification");
    } else {
      setRole("citizen");
      setCurrentTab("home");
    }
  };

  const handleLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    setRole("admin");
    setCurrentTab("mp-dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setIsAdminLoggedIn(false);
    setRole("guest");
    setCurrentTab("home");
    setSelectedIssueId(null);
    setClusterFilterIds(null);
  };

  const handleCitizenSuccess = (savedIssue: Issue) => {
    setLastSubmittedIssue(savedIssue);
    setCurrentTab("citizen-success");
  };

  // Safe navigation handler that manages role checks
  const navigateToTab = (tab: string) => {
    setIsMobileMenuOpen(false);
    setSelectedIssueId(null);
    
    // Role check for administrative tabs
    const adminTabs = ["mp-dashboard", "development-plan", "priority-board", "hotspot-map", "ward-data"];
    if (adminTabs.includes(tab)) {
      if (!isAdminLoggedIn) {
        setCurrentTab("login");
        setRole("guest");
      } else {
        setRole("admin");
        setCurrentTab(tab);
      }
    } else if (tab === "verification") {
      setRole("citizen");
      setCurrentTab("verification");
    } else if (tab === "public-transparency") {
      setRole("transparency");
      setCurrentTab("public-transparency");
    } else if (tab === "submit-need") {
      setRole("citizen");
      setCurrentTab("submit-need");
    } else {
      setRole("guest");
      setCurrentTab(tab);
    }
  };

  // Helper to check which navigation group is active
  const getActiveGroup = () => {
    if (["home", "submit-need", "citizen-success"].includes(currentTab)) return "citizen";
    if (["verification", "public-transparency"].includes(currentTab)) return "proof";
    if (["mp-dashboard", "development-plan", "priority-board", "hotspot-map", "ward-data", "login", "issue-detail"].includes(currentTab)) return "mp";
    return "citizen";
  };

  // Get Breadcrumbs list based on active tab
  const getBreadcrumbs = () => {
    const list = [{ label: "Home", action: () => navigateToTab("home") }];
    
    if (currentTab === "submit-need") {
      list.push({ label: "Citizen Intake", action: () => {} });
      list.push({ label: "Submit Need", action: () => {} });
    } else if (currentTab === "citizen-success") {
      list.push({ label: "Citizen Intake", action: () => {} });
      list.push({ label: "Submission Success", action: () => {} });
    } else if (currentTab === "verification") {
      list.push({ label: "Democratic Proof", action: () => {} });
      list.push({ label: "Ward Verification", action: () => {} });
    } else if (currentTab === "public-transparency") {
      list.push({ label: "Democratic Proof", action: () => {} });
      list.push({ label: "Transparency Board", action: () => {} });
    } else if (currentTab === "login") {
      list.push({ label: "Constituency Intel", action: () => {} });
      list.push({ label: "Official Login", action: () => {} });
    } else if (currentTab === "mp-dashboard") {
      list.push({ label: "Constituency Intel", action: () => {} });
      list.push({ label: "MP Dashboard", action: () => {} });
    } else if (currentTab === "development-plan") {
      list.push({ label: "Constituency Intel", action: () => {} });
      list.push({ label: "AI Development Plan", action: () => {} });
    } else if (currentTab === "priority-board") {
      list.push({ label: "Constituency Intel", action: () => {} });
      list.push({ label: "Priority Board", action: () => {} });
    } else if (currentTab === "hotspot-map") {
      list.push({ label: "Constituency Intel", action: () => {} });
      list.push({ label: "Hotspot Map", action: () => {} });
    } else if (currentTab === "ward-data") {
      list.push({ label: "Constituency Intel", action: () => {} });
      list.push({ label: "Ward Demographics", action: () => {} });
    } else if (currentTab === "issue-detail") {
      list.push({ label: "Constituency Intel", action: () => navigateToTab("mp-dashboard") });
      list.push({ label: `Grievance #${selectedIssueId?.substring(0, 8)}`, action: () => {} });
    }
    
    return list;
  };

  // Rendering side navbar items
  const renderNavItems = () => {
    const navGroups = [
      {
        title: "Citizen Intake",
        items: [
          { id: "home", label: "Home / Overview", icon: Home },
          { id: "submit-need", label: "Submit Need", icon: Sparkles }
        ]
      },
      {
        title: "Democratic Proof",
        items: [
          { id: "verification", label: "Ward Verification", icon: Vote },
          { id: "public-transparency", label: "Public Transparency", icon: Eye }
        ]
      },
      {
        title: "Constituency Intel (MP)",
        items: [
          { id: "mp-dashboard", label: "MP Dashboard", icon: LayoutDashboard },
          { id: "development-plan", label: "AI Development Plan", icon: FileSpreadsheet },
          { id: "priority-board", label: "Priority Board", icon: Layers },
          { id: "hotspot-map", label: "Hotspot Map", icon: Map },
          { id: "ward-data", label: "Ward Demographics", icon: Building2 }
        ]
      }
    ];

    return (
      <div className="space-y-6">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block px-3">
              {group.title}
            </span>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = currentTab === item.id || (item.id === "mp-dashboard" && currentTab === "issue-detail");
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigateToTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      isActive
                        ? "bg-blue-800 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                    }`}
                  >
                    <Icon className={`w-4.5 h-4.5 ${isActive ? "text-orange-400" : "text-slate-500"}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen lg:overflow-hidden bg-slate-50 text-slate-800 font-sans flex flex-col selection:bg-blue-600/10 selection:text-blue-700">
      
      {/* Intro Animation Overlay */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            key="intro-splash"
            initial={{ opacity: 1 }}
            exit={{ 
              opacity: 0,
              scale: 1.05,
              transition: { duration: 0.5, ease: "easeInOut" }
            }}
            className="fixed inset-0 z-[100] bg-slate-50 flex flex-col items-center justify-center p-6 overflow-hidden select-none"
          >
            {/* Ambient gradients */}
            <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-blue-100/30 blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-teal-100/30 blur-3xl" />
            
            <div className="relative flex flex-col items-center">
              <JanataPulseLogoStacked size={200} animate={true} />
              
              {/* Progress Bar Loader */}
              <motion.div 
                className="w-48 h-1 bg-slate-200/80 rounded-full mt-8 overflow-hidden relative"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                <motion.div 
                  className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-blue-700 via-teal-500 to-emerald-500 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.8, ease: "easeInOut" }}
                />
              </motion.div>
              
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-4"
              >
                Decentralized Democratic Planning
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Decorative Tri-color Ribbon (Saffron, White, Green) */}
      <div className="w-full h-1 bg-gradient-to-r from-orange-500 via-slate-100 to-emerald-500 shrink-0 sticky top-0 z-50"></div>

      {/* STICKY TOP HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-1 z-40 px-4 md:px-8 py-3 flex justify-between items-center shadow-xs shrink-0">
        
        {/* Branding & Sidebar Toggle */}
        <div className="flex items-center gap-3">
          {/* Desktop Sidebar Toggle */}
          <button
            id="desktop-sidebar-toggle"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hidden lg:flex items-center justify-center p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-slate-600 transition-all shadow-2xs cursor-pointer focus:outline-hidden"
            title={isSidebarOpen ? "Collapse navigation menu" : "Expand navigation menu"}
          >
            {isSidebarOpen ? (
              <X className="w-4 h-4 text-slate-700 animate-pulse" />
            ) : (
              <Menu className="w-4 h-4 text-slate-700" />
            )}
          </button>

          <div 
            id="branding-container"
            className="flex items-center cursor-pointer select-none"
            onClick={() => navigateToTab("home")}
          >
            <JanataPulseLogoHorizontal iconSize={40} animate={true} />
          </div>
        </div>

        {/* INTERACTIVE LENS SWITCHER (Role select dropdown/group) */}
        <div className="hidden lg:flex items-center gap-1.5 bg-slate-100 p-1 border border-slate-200 rounded-xl text-xs font-bold">
          <button 
            onClick={() => handleSelectRole("citizen")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${getActiveGroup() === "citizen" ? "bg-white text-blue-800 shadow-2xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            Citizen Hub
          </button>
          <button 
            onClick={() => handleSelectRole("verification")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${currentTab === "verification" ? "bg-white text-orange-600 shadow-2xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            Ward Verifier
          </button>
          <button 
            onClick={() => handleSelectRole("admin")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${getActiveGroup() === "mp" ? "bg-white text-indigo-800 shadow-2xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            MP Admin Portal
          </button>
          <button 
            onClick={() => handleSelectRole("transparency")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${currentTab === "public-transparency" ? "bg-white text-emerald-700 shadow-2xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            Public Ledger
          </button>
        </div>

        {/* Right tools / Mobile toggles */}
        <div className="flex items-center gap-4">
          
          {/* Demo labels */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              <span>Demo Data Mode</span>
            </span>

            {isAdminLoggedIn && (
              <button 
                onClick={handleLogout}
                className="hidden sm:inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-xl border border-red-100 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            )}
          </div>

          {/* Mobile hamburger menu toggle */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* MOBILE COLLAPSIBLE DRAWER */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-slate-900 text-white border-b border-slate-800 px-6 py-6 overflow-hidden sticky top-14 z-30 space-y-6"
          >
            {/* Lenses for mobile */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">View Mode Lens</span>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold text-center">
                <button 
                  onClick={() => { handleSelectRole("citizen"); setIsMobileMenuOpen(false); }}
                  className={`p-2.5 rounded-xl border transition-all ${getActiveGroup() === "citizen" ? "bg-white text-blue-800 border-white" : "text-slate-300 border-slate-800 bg-slate-800/40"}`}
                >
                  Citizen Hub
                </button>
                <button 
                  onClick={() => { handleSelectRole("verification"); setIsMobileMenuOpen(false); }}
                  className={`p-2.5 rounded-xl border transition-all ${currentTab === "verification" ? "bg-white text-orange-600 border-white" : "text-slate-300 border-slate-800 bg-slate-800/40"}`}
                >
                  Ward Verifier
                </button>
                <button 
                  onClick={() => { handleSelectRole("admin"); setIsMobileMenuOpen(false); }}
                  className={`p-2.5 rounded-xl border transition-all ${getActiveGroup() === "mp" ? "bg-white text-indigo-800 border-white" : "text-slate-300 border-slate-800 bg-slate-800/40"}`}
                >
                  MP Admin
                </button>
                <button 
                  onClick={() => { handleSelectRole("transparency"); setIsMobileMenuOpen(false); }}
                  className={`p-2.5 rounded-xl border transition-all ${currentTab === "public-transparency" ? "bg-white text-emerald-700 border-white" : "text-slate-300 border-slate-800 bg-slate-800/40"}`}
                >
                  Public Ledger
                </button>
              </div>
            </div>

            {/* Mobile Nav Menu */}
            {renderNavItems()}

            {isAdminLoggedIn && (
              <button 
                onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                className="w-full py-3 bg-red-600/20 border border-red-500/30 text-red-200 font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
              >
                Sign Out Administrative Session
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* CORE TWO COLUMN LAYOUT (Persistent left sidebar on desktop) */}
      <div className="flex-grow flex flex-col lg:flex-row min-h-0 overflow-hidden">
        
        {/* DESKTOP COLLAPSIBLE SLATE SIDEBAR */}
        <aside className={`hidden lg:flex bg-slate-900 text-white space-y-6 shrink-0 flex-col border-r border-slate-800 relative select-none h-full overflow-y-auto transition-all duration-300 ease-in-out ${isSidebarOpen ? "w-64 p-6 opacity-100" : "w-0 p-0 overflow-hidden border-none opacity-0"}`}>
          {isSidebarOpen && (
            <>
              {renderNavItems()}

              {/* Infrastructure status block */}
              <div className="mt-auto bg-slate-800/40 rounded-2xl p-4 border border-slate-800/60 space-y-2 text-[10px] leading-relaxed text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-slate-200 uppercase tracking-widest font-black">AI planning system live</span>
                </div>
                <p className="font-semibold">
                  Dialect translations and physical priority algorithms operating smoothly on Madurai census files.
                </p>
              </div>
            </>
          )}
        </aside>

        {/* RIGHT CENTRAL PANEL */}
        <div className="flex-grow flex flex-col min-h-0 overflow-hidden h-full">
          
          {/* BREADCRUMB BAR & ROLE BANNER */}
          <div className="bg-slate-100 border-b border-slate-200 px-6 md:px-8 py-3 flex flex-wrap justify-between items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {getBreadcrumbs().map((bc, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-300" />}
                  <span 
                    onClick={bc.action}
                    className={bc.action !== (() => {}) ? "hover:text-slate-700 cursor-pointer" : "text-slate-500 font-extrabold"}
                  >
                    {bc.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Role Context Indicator banner */}
            <div className="flex items-center gap-1.5 text-slate-500">
              <span>ACTIVE VIEW LENS:</span>
              <span className={`px-2 py-0.5 rounded font-black ${
                getActiveGroup() === "mp" 
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200" 
                  : getActiveGroup() === "proof" 
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-blue-50 text-blue-700 border border-blue-200"
              }`}>
                {getActiveGroup() === "mp" ? "MP Administrative Office" : getActiveGroup() === "proof" ? "Democratic Verification" : "Citizen / Public Visitor"}
              </span>
            </div>
          </div>

          {/* DYNAMIC VIEW ROUTER */}
          <div className="flex-1 p-6 md:p-8 overflow-y-auto">
            <AnimatePresence mode="wait">
              
              {/* Home / Overview */}
              {currentTab === "home" && (
                <motion.div
                  key="home-page"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <LandingPage 
                    onSelectRole={handleSelectRole} 
                    onNavigateTab={navigateToTab}
                  />
                </motion.div>
              )}

              {/* Submit Need */}
              {currentTab === "submit-need" && (
                <motion.div
                  key="submit-need-page"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <CitizenSubmitPage 
                    onSuccess={handleCitizenSuccess} 
                    onBackToLanding={() => navigateToTab("home")}
                  />
                </motion.div>
              )}

              {/* Citizen Success Screen */}
              {currentTab === "citizen-success" && lastSubmittedIssue && (
                <motion.div
                  key="success-card"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="max-w-xl mx-auto py-12 text-center"
                >
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-8 space-y-6">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100 shadow-2xs">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-2xl font-extrabold text-slate-900 font-display">
                        Need Statement Filed!
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Dispatched to Madurai Constituency Registry
                      </p>
                    </div>

                    {/* AI classification score callout */}
                    <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 space-y-3 text-left text-xs">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                        <span className="font-bold text-orange-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>AI Categorization Triage</span>
                        </span>
                        <span className="text-[10px] bg-blue-600/20 border border-blue-500/30 text-blue-400 px-2 py-0.5 rounded-md font-bold font-mono">
                          Priority score: {lastSubmittedIssue.priority_score || lastSubmittedIssue.issue_priority_score}/100
                        </span>
                      </div>

                      <p className="text-slate-200 leading-relaxed font-semibold italic">
                        "{lastSubmittedIssue.translated_summary}"
                      </p>

                      <div className="grid grid-cols-2 gap-3 pt-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <div>
                          <span>Ward Area:</span>
                          <strong className="text-slate-100 block mt-0.5 font-sans normal-case">{lastSubmittedIssue.ward}</strong>
                        </div>
                        <div>
                          <span>Department Queue:</span>
                          <strong className="text-orange-400 block mt-0.5 font-sans normal-case">{lastSubmittedIssue.recommended_department}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-900 leading-normal font-semibold flex items-start gap-2 text-left">
                      <HeartHandshake className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>The constituency planning office will review this data alongside existing municipal budgets. Neighbors can verify the physical site immediately in the Ward Verification page. Thank you for voting!</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => navigateToTab("verification")}
                        className="py-3 bg-white border border-slate-200 text-slate-700 hover:border-slate-300 font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                      >
                        Verify Site Needs
                      </button>
                      <button
                        onClick={() => {
                          setLastSubmittedIssue(null);
                          navigateToTab("home");
                        }}
                        className="py-3 bg-slate-950 hover:bg-slate-900 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                      >
                        Return Home
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Login for Administrative files */}
              {currentTab === "login" && (
                <motion.div
                  key="login-page"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <AdminLoginPage 
                    onLoginSuccess={handleLoginSuccess}
                    onBackToLanding={() => navigateToTab("home")}
                  />
                </motion.div>
              )}

              {/* Ward Verification Page */}
              {currentTab === "verification" && (
                <motion.div
                  key="verification-page"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <WardVerificationPage />
                </motion.div>
              )}

              {/* Public Transparency Board */}
              {currentTab === "public-transparency" && (
                <motion.div
                  key="public-transparency-page"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <PublicTransparencyPage 
                    onBackToLanding={() => navigateToTab("home")}
                  />
                </motion.div>
              )}

              {/* MP Dashboard (DASHBOARD TABLE) */}
              {currentTab === "mp-dashboard" && (
                <motion.div
                  key="mp-dashboard-page"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <DashboardPage 
                    onViewIssue={(id) => {
                      setSelectedIssueId(id);
                      setCurrentTab("issue-detail");
                    }}
                  />
                </motion.div>
              )}

              {/* AI Development Plan ranked proposals */}
              {currentTab === "development-plan" && (
                <motion.div
                  key="development-plan-page"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <AIDevelopmentPlanPage />
                </motion.div>
              )}

              {/* Decision Priority Board */}
              {currentTab === "priority-board" && (
                <motion.div
                  key="priority-board-page"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <PriorityBoardPage 
                    onViewIssue={(id) => {
                      setSelectedIssueId(id);
                      setCurrentTab("issue-detail");
                    }}
                    onSelectClusterIssues={(ids) => {
                      setClusterFilterIds(ids);
                      setCurrentTab("mp-dashboard");
                    }}
                  />
                </motion.div>
              )}

              {/* Hotspot Map Page */}
              {currentTab === "hotspot-map" && (
                <motion.div
                  key="hotspot-map-page"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <MapViewPage 
                    onViewIssue={(id) => {
                      setSelectedIssueId(id);
                      setCurrentTab("issue-detail");
                    }}
                  />
                </motion.div>
              )}

              {/* Ward Demographics Page */}
              {currentTab === "ward-data" && (
                <motion.div
                  key="ward-data-page"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <WardDataPage />
                </motion.div>
              )}

              {/* Issue Detail Page */}
              {currentTab === "issue-detail" && selectedIssueId && (
                <motion.div
                  key="issue-detail-page"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <IssueDetailPage 
                    id={selectedIssueId}
                    onBack={() => {
                      setSelectedIssueId(null);
                      setCurrentTab("mp-dashboard");
                    }}
                    onViewIssue={(id) => setSelectedIssueId(id)}
                  />
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Public Footer */}
          <footer className="bg-white border-t border-slate-200 py-4 px-6 md:px-8 shrink-0 select-none">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-semibold text-slate-400">
              <div className="flex items-center gap-2">
                <span>&copy; {new Date().getFullYear()} JanataPulse AI.</span>
                <span className="hidden md:inline text-slate-300">|</span>
                <span className="hidden md:inline font-mono">Madurai Corp. Ward Ledger v1.1.2</span>
              </div>
              
              <div className="flex items-center gap-4 uppercase tracking-wider text-[9px] font-black">
                <span>Constituency Planning Track</span>
                <span className="text-slate-300">|</span>
                <span>Democratic Decision Technology</span>
              </div>
            </div>
          </footer>

        </div>

      </div>

    </div>
  );
}
