import React, { useState } from 'react';
import { Lock, User, Sparkles, CheckCircle2, ArrowRight, Shield } from 'lucide-react';
import { authenticateUser, HARDCODED_CREDENTIALS } from '../lib/storage';
import { UserSession } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (session: UserSession) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState(HARDCODED_CREDENTIALS.username);
  const [password, setPassword] = useState(HARDCODED_CREDENTIALS.password);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const session = authenticateUser(username, password);
      if (session) {
        onLoginSuccess(session);
      } else {
        setError('Invalid username or password. Please use the hardcoded credentials.');
        setLoading(false);
      }
    }, 200);
  };

  const handleQuickLogin = () => {
    const session = authenticateUser(HARDCODED_CREDENTIALS.username, HARDCODED_CREDENTIALS.password);
    if (session) {
      onLoginSuccess(session);
    }
  };

  const handleFillCredentials = () => {
    setUsername(HARDCODED_CREDENTIALS.username);
    setPassword(HARDCODED_CREDENTIALS.password);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-slate-200 flex flex-col justify-center items-center px-4 py-12 selection:bg-indigo-500/30 selection:text-white">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 mb-4 ring-4 ring-indigo-500/20">
            <span className="font-bold text-xl tracking-wider">ZJ</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Zaid_Journal
          </h1>
          <p className="text-sm text-slate-400 mt-1.5">
            Private sanctuary with Gemini 2.5 Flash conversational intelligence
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-[#18181b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {/* Quick Fill Credentials Banner */}
          <div className="mb-6 p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                Hardcoded Access
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                User: <span className="text-slate-200 font-semibold">{HARDCODED_CREDENTIALS.username}</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Pass: <span className="text-slate-200 font-semibold">{HARDCODED_CREDENTIALS.password}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleFillCredentials}
              className="shrink-0 px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-medium border border-indigo-500/30 transition-colors cursor-pointer"
            >
              Autofill
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Zaid_Journal"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#09090b] border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#09090b] border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Open Journal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleQuickLogin}
              className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium border border-white/5 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Instant 1-Click Demo Login</span>
            </button>
          </form>
        </div>

        {/* Footer Features */}
        <div className="mt-8 grid grid-cols-3 gap-2 text-center text-[11px] text-slate-500">
          <div className="p-2 rounded-lg bg-[#18181b]/50 border border-white/5">
            <span className="block text-slate-400 font-medium">Notion Block</span>
            <span>Slash Editor</span>
          </div>
          <div className="p-2 rounded-lg bg-[#18181b]/50 border border-white/5">
            <span className="block text-slate-400 font-medium">Heatmap</span>
            <span>Green / Red Dates</span>
          </div>
          <div className="p-2 rounded-lg bg-[#18181b]/50 border border-white/5">
            <span className="block text-slate-400 font-medium">Gemini 2.5</span>
            <span>Memory AI</span>
          </div>
        </div>
      </div>
    </div>
  );
};
