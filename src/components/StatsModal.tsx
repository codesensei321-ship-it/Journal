import React from 'react';
import { X, Flame, Award, BookOpen, Smile, TrendingUp, Calendar, CheckCircle2 } from 'lucide-react';
import { JournalEntry } from '../types';
import { calculateWritingStats, formatShortDate } from '../lib/utils';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: Record<string, JournalEntry>;
}

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose, entries }) => {
  if (!isOpen) return null;

  const entriesList: JournalEntry[] = Object.values(entries);
  const stats = calculateWritingStats(entriesList);

  // Calculate mood counts
  const moodCounts: Record<string, number> = {};
  const tagCounts: Record<string, number> = {};

  for (const e of entriesList) {
    if (e.mood) {
      moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
    }
    if (e.tags) {
      for (const t of e.tags) {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      }
    }
  }

  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-[#18181b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl z-10 animate-in zoom-in-95 duration-150 text-slate-200">
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Journaling Consistency & Stats
              </h2>
              <p className="text-xs text-slate-400">
                Zaid's personal reflection metrics
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4-stat Bento Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-4 rounded-xl bg-[#09090b] border border-white/5">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Current Streak</span>
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
            </div>
            <div className="text-2xl font-black text-white">
              {stats.currentStreak} <span className="text-xs font-normal text-slate-500">days</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#09090b] border border-white/5">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Best Streak</span>
              <Award className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white">
              {stats.maxStreak} <span className="text-xs font-normal text-slate-500">days</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#09090b] border border-white/5">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Total Entries</span>
              <BookOpen className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-white">
              {stats.totalEntries} <span className="text-xs font-normal text-slate-500">logged</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#09090b] border border-white/5">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Total Words</span>
              <CheckCircle2 className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-white">
              {stats.totalWords.toLocaleString()} <span className="text-xs font-normal text-slate-500">words</span>
            </div>
          </div>
        </div>

        {/* Top Topics / Tags */}
        <div className="mb-6">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
            Top Discussed Themes
          </div>
          <div className="flex flex-wrap gap-2">
            {topTags.length > 0 ? (
              topTags.map(([tag, count]) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 rounded-lg bg-[#09090b] border border-white/5 text-xs font-medium text-slate-300 flex items-center gap-1.5"
                >
                  <span className="text-indigo-400">#{tag}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-bold">
                    {count}
                  </span>
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500">No tags logged yet</span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
};
