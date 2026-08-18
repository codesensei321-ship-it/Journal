import React, { useState, useEffect, useCallback } from 'react';
import { 
  getAllEntries,
  getAuthSession, 
  clearAuthSession, 
  getAppSettings, 
  saveAppSettings,
  subscribeToEntries,
  deleteEntry
} from './lib/storage';
import { 
  getTodayDateString, 
  calculateWritingStats,
  formatFriendlyDate,
  formatShortDate,
  cn
} from './lib/utils';
import { 
  JournalEntry, 
  UserSession, 
  FontPreference, 
  ThemeMode 
} from './types';
import { LoginScreen } from './components/LoginScreen';
import { Navbar } from './components/Navbar';
import { DateTimelineStrip } from './components/DateTimelineStrip';
import { NotionEditor } from './components/NotionEditor';
import { CalendarView } from './components/CalendarView';
import { AIAssistantDrawer } from './components/AIAssistantDrawer';
import { StatsModal } from './components/StatsModal';
import { ExportModal } from './components/ExportModal';
import { 
  Calendar as CalendarIcon, 
  Sparkles, 
  Search, 
  Plus, 
  FileText, 
  Trash2, 
  Cloud, 
  BookOpen, 
  Sidebar as SidebarIcon,
  ChevronRight,
  Flame,
  Clock
} from 'lucide-react';

export default function App() {
  const [session, setSession] = useState<UserSession | null>(() => getAuthSession());
  const [entries, setEntries] = useState<Record<string, JournalEntry>>(() => getAllEntries());
  const [currentDateString, setCurrentDateString] = useState<string>(() => getTodayDateString());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Settings
  const [settings, setSettings] = useState(() => getAppSettings());
  const [theme, setTheme] = useState<ThemeMode>(() => settings.theme || 'dark');
  const [fontPreference, setFontPreference] = useState<FontPreference>(() => settings.font || 'sans');

  // Modals & Panels
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState<string | undefined>(undefined);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Apply Theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    saveAppSettings({ theme });
  }, [theme]);

  // Apply Font preference
  useEffect(() => {
    saveAppSettings({ font: fontPreference });
  }, [fontPreference]);

  // Real-Time Firebase Firestore Synchronization (0 Scratch)
  useEffect(() => {
    const unsubscribe = subscribeToEntries((liveEntries) => {
      setEntries(liveEntries);
    });
    return () => unsubscribe();
  }, []);

  // Global keyboard shortcuts (Cmd+J / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        setIsAiOpen(prev => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsAiOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleLogout = () => {
    clearAuthSession();
    setSession(null);
  };

  const handleEntryUpdated = useCallback((updated: JournalEntry) => {
    setEntries(prev => ({
      ...prev,
      [updated.date]: updated
    }));
  }, []);

  const handleDeleteCurrentEntry = () => {
    if (window.confirm(`Are you sure you want to delete the entry for ${formatFriendlyDate(currentDateString)}?`)) {
      deleteEntry(currentDateString);
      setEntries(prev => {
        const next = { ...prev };
        delete next[currentDateString];
        return next;
      });
    }
  };

  const handleAskAIAboutDay = (dateStr: string) => {
    setAiPrompt(`What did I write on ${dateStr} and what were the main insights?`);
    setIsAiOpen(true);
  };

  // If not authenticated, render login
  if (!session || !session.isAuthenticated) {
    return <LoginScreen onLoginSuccess={(newSession) => setSession(newSession)} />;
  }

  const currentEntry = entries[currentDateString] || null;
  const allEntriesList: JournalEntry[] = Object.values(entries);
  const stats = calculateWritingStats(allEntriesList);
  const writtenEntriesList = allEntriesList
    .filter((e: JournalEntry) => e.title || (e.blocks && e.blocks.some(b => b.content.trim().length > 0)))
    .sort((a: JournalEntry, b: JournalEntry) => b.date.localeCompare(a.date));

  return (
    <div className="min-h-screen bg-[#09090b] text-slate-200 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-white transition-colors duration-200">
      {/* Top Global Navigation */}
      <Navbar
        userSession={session}
        currentStreak={stats.currentStreak}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        fontPreference={fontPreference}
        onChangeFont={setFontPreference}
        onOpenCalendar={() => setIsCalendarModalOpen(true)}
        onOpenAI={() => {
          setAiPrompt(undefined);
          setIsAiOpen(true);
        }}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onLogout={handleLogout}
      />

      {/* Notion Breadcrumbs & Cloud Sync Status Header */}
      <div className="w-full border-b border-white/5 bg-[#09090b] px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Toggle Sidebar"
          >
            <SidebarIcon className="w-4 h-4" />
          </button>

          <span className="text-slate-600">/</span>
          <span className="text-slate-400 hover:text-slate-200 cursor-pointer">Zaid's Workspace</span>
          <span className="text-slate-600">/</span>
          <span className="text-white font-medium flex items-center gap-1.5">
            <span>{currentEntry?.icon || '📝'}</span>
            <span>{formatShortDate(currentDateString)}</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium">
            <Cloud className="w-3 h-3" />
            <span>Firebase Live</span>
          </div>

          {currentEntry && (
            <button
              type="button"
              onClick={handleDeleteCurrentEntry}
              className="p-1 rounded hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
              title="Delete this entry from Firestore"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Workspace Layout with Notion Sidebar */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-2 sm:px-4 py-4 sm:py-6 gap-6 items-start">
        
        {/* Left Notion Sidebar (Collapsible) */}
        {sidebarOpen && (
          <aside className="w-64 shrink-0 hidden md:flex flex-col gap-4 bg-[#18181b]/70 border border-white/10 rounded-2xl p-4 shadow-xl">
            {/* Quick Actions */}
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setCurrentDateString(getTodayDateString())}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left',
                  currentDateString === getTodayDateString() 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-slate-300 hover:bg-white/5'
                )}
              >
                <span>⚡</span>
                <span>Today's Journal</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAiPrompt(undefined);
                  setIsAiOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-white/5 transition-colors text-left"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Gemini Assistant</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCalendarModalOpen(true)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-white/5 transition-colors text-left"
              >
                <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Monthly Calendar</span>
              </button>
            </div>

            {/* Entries List from Firebase (0 Scratch) */}
            <div className="pt-3 border-t border-white/5 flex-1 overflow-y-auto max-h-[380px] space-y-1">
              <div className="px-2 pb-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Firebase Entries</span>
                <span className="text-indigo-400 font-mono font-semibold">{writtenEntriesList.length}</span>
              </div>

              {writtenEntriesList.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-slate-600 leading-relaxed border border-dashed border-white/5 rounded-xl">
                  No entries written yet. Start typing to create your first Firestore document!
                </div>
              ) : (
                writtenEntriesList.map((e) => {
                  const isSelected = e.date === currentDateString;
                  return (
                    <button
                      key={e.date}
                      type="button"
                      onClick={() => setCurrentDateString(e.date)}
                      className={cn(
                        'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left group',
                        isSelected 
                          ? 'bg-indigo-600/20 text-white font-medium border border-indigo-500/30' 
                          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                      )}
                    >
                      <span>{e.icon || '📝'}</span>
                      <div className="flex-1 min-w-0 truncate">
                        <div className="truncate text-xs font-medium text-slate-200">
                          {e.title || formatFriendlyDate(e.date)}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {formatShortDate(e.date)} • {e.wordCount || 0}w
                        </div>
                      </div>
                      <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-slate-400 transition-opacity" />
                    </button>
                  );
                })
              )}
            </div>
          </aside>
        )}

        {/* Center / Primary Notion Workspace Canvas */}
        <main className="flex-1 w-full space-y-5">
          {/* Quick Date Switcher Strip */}
          <DateTimelineStrip
            currentDateString={currentDateString}
            onSelectDate={(newDate) => setCurrentDateString(newDate)}
            entries={entries}
            onOpenCalendarModal={() => setIsCalendarModalOpen(true)}
          />

          {/* Notion Style Block Editor connected directly to Firestore */}
          <NotionEditor
            key={currentDateString}
            currentDateString={currentDateString}
            entry={currentEntry}
            onEntryUpdated={handleEntryUpdated}
            fontPreference={fontPreference}
            onAskAIAboutThisDay={handleAskAIAboutDay}
          />
        </main>

        {/* Right Sidebar: Calendar Heatmap Card on Ultra-Wide */}
        <aside className="w-72 shrink-0 hidden xl:block space-y-5">
          <CalendarView
            currentDateString={currentDateString}
            onSelectDate={(dateStr) => setCurrentDateString(dateStr)}
            entries={entries}
            streakCount={stats.currentStreak}
          />
        </aside>
      </div>

      {/* Floating AI Assistant Trigger Button on Mobile */}
      <div className="fixed bottom-6 right-6 lg:hidden z-30">
        <button
          type="button"
          onClick={() => {
            setAiPrompt(undefined);
            setIsAiOpen(true);
          }}
          className="w-13 h-13 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-600/40 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
          title="Open Gemini AI Assistant"
        >
          <Sparkles className="w-6 h-6" />
        </button>
      </div>

      {/* Calendar Modal on Mobile / Tablet */}
      {isCalendarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => setIsCalendarModalOpen(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity cursor-pointer"
          />
          <div className="relative w-full max-w-md z-10 animate-in zoom-in-95">
            <CalendarView
              currentDateString={currentDateString}
              onSelectDate={(dateStr) => {
                setCurrentDateString(dateStr);
                setIsCalendarModalOpen(false);
              }}
              entries={entries}
              streakCount={stats.currentStreak}
            />
          </div>
        </div>
      )}

      {/* Gemini 2.5 Flash Conversational AI Memory Drawer */}
      <AIAssistantDrawer
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        entries={entries}
        onSelectDate={(dateStr) => setCurrentDateString(dateStr)}
        initialPrompt={aiPrompt}
      />

      {/* Stats & Insights Modal */}
      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        entries={entries}
      />

      {/* Export & Backup Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        entries={entries}
        currentEntry={currentEntry}
      />
    </div>
  );
}
