import React, { useState } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  Calendar as CalendarIcon, 
  Moon, 
  Sun, 
  Flame, 
  LogOut, 
  User, 
  BarChart2, 
  Download, 
  ChevronDown,
  Type,
  FileText,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FontPreference, ThemeMode, UserSession } from '../types';

interface NavbarProps {
  userSession: UserSession;
  currentStreak: number;
  theme: ThemeMode;
  onToggleTheme: () => void;
  fontPreference: FontPreference;
  onChangeFont: (font: FontPreference) => void;
  onOpenCalendar: () => void;
  onOpenAI: () => void;
  onOpenStats: () => void;
  onOpenExport: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  userSession,
  currentStreak,
  theme,
  onToggleTheme,
  fontPreference,
  onChangeFont,
  onOpenCalendar,
  onOpenAI,
  onOpenStats,
  onOpenExport,
  onLogout,
}) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [fontMenuOpen, setFontMenuOpen] = useState(false);

  const handleStreakClick = () => {
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.15, x: 0.5 },
      colors: ['#6366f1', '#10b981', '#f59e0b', '#38bdf8'],
    });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#09090b]/95 backdrop-blur-md transition-colors text-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Left: Brand Identity with Indigo Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-600/30">
            <span className="font-bold text-white text-xs tracking-wider">ZJ</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-base sm:text-lg tracking-tight text-white">
              Zaid_Journal
            </span>
            <div className="hidden sm:flex items-center bg-[#18181b] rounded-full px-2.5 py-0.5 border border-white/5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
              <span className="text-[11px] font-medium text-slate-400">Online</span>
            </div>
          </div>
        </div>

        {/* Center/Right: Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Streak Counter Pill */}
          <button
            type="button"
            onClick={handleStreakClick}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 font-semibold text-xs hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            title="Click to celebrate streak!"
          >
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>{currentStreak}d Streak</span>
          </button>

          {/* Calendar Trigger */}
          <button
            type="button"
            onClick={onOpenCalendar}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#18181b] hover:bg-white/10 text-slate-300 text-xs font-medium border border-white/5 transition-colors"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" />
            <span>Calendar</span>
          </button>

          {/* Gemini AI Button with Indigo Aesthetic */}
          <button
            type="button"
            onClick={onOpenAI}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
            title="Open Gemini 2.5 Flash Journal Assistant"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
            <span className="hidden xs:inline">Gemini AI</span>
          </button>

          {/* Font Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setFontMenuOpen(!fontMenuOpen)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[#18181b] hover:bg-white/10 text-slate-300 border border-white/5 transition-colors"
              title="Typography Style"
            >
              <Type className="w-4 h-4" />
            </button>

            {fontMenuOpen && (
              <div 
                className="absolute right-0 mt-2 w-40 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl p-1.5 z-50 text-xs text-slate-200 animate-in fade-in zoom-in-95"
                onClick={() => setFontMenuOpen(false)}
              >
                <div className="px-2 py-1 text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Typography</div>
                <button
                  type="button"
                  onClick={() => onChangeFont('sans')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${fontPreference === 'sans' ? 'bg-indigo-600 text-white font-medium' : 'hover:bg-white/5 text-slate-300'}`}
                >
                  <span className="font-sans">Modern Sans</span>
                  {fontPreference === 'sans' && <span>✓</span>}
                </button>
                <button
                  type="button"
                  onClick={() => onChangeFont('serif')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${fontPreference === 'serif' ? 'bg-indigo-600 text-white font-medium' : 'hover:bg-white/5 text-slate-300'}`}
                >
                  <span className="font-serif">Editorial Serif</span>
                  {fontPreference === 'serif' && <span>✓</span>}
                </button>
                <button
                  type="button"
                  onClick={() => onChangeFont('mono')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${fontPreference === 'mono' ? 'bg-indigo-600 text-white font-medium' : 'hover:bg-white/5 text-slate-300'}`}
                >
                  <span className="font-mono">Clean Mono</span>
                  {fontPreference === 'mono' && <span>✓</span>}
                </button>
              </div>
            )}
          </div>

          {/* Dark / Light Mode Switch */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[#18181b] hover:bg-white/10 text-slate-300 border border-white/5 transition-colors"
            title={theme === 'dark' ? 'Switch Theme' : 'Dark Mode Active'}
          >
            {theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          {/* User Profile / Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-[#18181b] hover:bg-white/10 text-xs font-semibold text-slate-200 border border-white/5 transition-colors"
            >
              <span>{userSession.name}</span>
              <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                Z
              </div>
            </button>

            {userMenuOpen && (
              <div 
                className="absolute right-0 mt-2 w-56 bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl p-1.5 z-50 text-xs text-slate-200 animate-in fade-in zoom-in-95"
                onClick={() => setUserMenuOpen(false)}
              >
                <div className="p-3 border-b border-white/5">
                  <div className="font-bold text-white">{userSession.username}</div>
                  <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Authenticated (Hardcoded)
                  </div>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={onOpenStats}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Writing Stats & Insights</span>
                  </button>

                  <button
                    type="button"
                    onClick={onOpenExport}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Export & Backup Data</span>
                  </button>
                </div>

                <div className="pt-1 border-t border-white/5">
                  <button
                    type="button"
                    onClick={onLogout}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left text-rose-400 hover:bg-rose-500/10 transition-colors font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
