import React, { useState } from "react";
import { motion } from "motion/react";
import { Lock, User, AlertTriangle, ShieldCheck, HelpCircle, RefreshCw } from "lucide-react";
import { adminLogin } from "../api";

interface AdminLoginPageProps {
  onLoginSuccess: () => void;
  onBackToLanding: () => void;
}

export default function AdminLoginPage({ onLoginSuccess, onBackToLanding }: AdminLoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const success = await adminLogin(username, password);
      if (success) {
        onLoginSuccess();
      } else {
        setErrorMsg("Failed to authenticate.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid administrative credentials. Use admin / admin123.");
    } finally {
      setLoading(false);
    }
  };

  // One-click helper for judges
  const fillDemoCredentials = () => {
    setUsername("admin");
    setPassword("admin123");
    setErrorMsg("");
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
      {/* Decorative glows */}
      <div className="absolute top-1/4 left-1/4 w-60 h-60 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-saffron-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-md p-8 relative z-10">
        
        {/* Back link */}
        <button 
          onClick={onBackToLanding}
          className="mb-6 flex items-center gap-1.5 text-slate-400 hover:text-slate-700 text-xs font-bold uppercase tracking-wider transition-colors"
        >
          &larr; Exit to menu
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-50 text-blue-700 rounded-full flex items-center justify-center mx-auto mb-3 border border-blue-100">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 font-display">
            Constituency Portal
          </h2>
          <p className="text-xs text-slate-500 font-semibold tracking-wide uppercase mt-1">
            Official MP & Triage Access
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Admin Username
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
              <input 
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin"
                className="w-full text-sm border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 bg-slate-50/50 focus:border-blue-500 focus:outline-hidden disabled:opacity-60"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Secure Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-sm border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 bg-slate-50/50 focus:border-blue-500 focus:outline-hidden disabled:opacity-60"
                required
                disabled={loading}
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-start gap-1.5 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-800/60 text-white font-bold rounded-xl tracking-wide shadow-sm hover:shadow-md transition-all text-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? (
              <RefreshCw className="w-4.5 h-4.5 animate-spin" />
            ) : (
              <ShieldCheck className="w-4.5 h-4.5" />
            )}
            <span>{loading ? "Authenticating..." : "Authorized Log In"}</span>
          </button>
        </form>

        <div className="relative flex py-3 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Hackathon Bypass
          </span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        {/* Quick Demo Assist */}
        <button
          onClick={fillDemoCredentials}
          disabled={loading}
          className="w-full py-2.5 px-4 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-800 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <HelpCircle className="w-4 h-4 text-orange-600" />
          <span>One-Click Auto Login (admin/admin123)</span>
        </button>
      </div>
    </div>
  );
}
